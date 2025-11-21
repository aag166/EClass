const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");

// Crear alumno
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Faltan campos" });

    const hashed = bcrypt.hashSync(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "alumno",
      },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(newUser);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002")
      return res.status(400).json({ error: "Email ya existe" });
    res.status(500).json({ error: "Error creando usuario" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            taughtCourses: true,
            taughtClasses: true,
          },
        },
        taughtCourses: {
          select: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const studentsCount = user.taughtCourses.reduce(
      (acc, course) => acc + (course._count?.students || 0),
      0
    );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      stats: {
        courses: user._count?.taughtCourses || 0,
        classes: user._count?.taughtClasses || 0,
        students: studentsCount,
      },
    });
  } catch (err) {
    console.error("Error obteniendo perfil:", err);
    res.status(500).json({ error: "Error obteniendo perfil del usuario" });
  }
});

const buildStudentPayload = (body) => {
  const fields = [
    "name",
    "email",
    "nivel",
    "comportamiento",
    "intereses",
    "birthYear",
    "observaciones",
  ];

  const data = {};

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] =
        field === "birthYear" && body[field] !== null && body[field] !== ""
          ? parseInt(body[field], 10)
          : body[field] === "" ? null : body[field];
    }
  });

  return data;
};

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        nivel: true,
        comportamiento: true,
        intereses: true,
        birthYear: true,
        observaciones: true,
      },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Determinar curso al que pertenece el alumno: buscar las clases y sus enlaces a cursos (ClassCourse)
    const classLinks = await prisma.classStudent.findMany({
      where: { studentId: userId },
      include: {
        class: {
          include: {
            classCourses: { include: { course: { select: { id: true, title: true, professorId: true } } } },
          },
        },
      },
    });

    const coursesSet = new Map();
    classLinks.forEach((cl) => {
      const cls = cl.class;
      if (!cls || !Array.isArray(cls.classCourses)) return;
      cls.classCourses.forEach((cc) => {
        if (cc && cc.course) coursesSet.set(cc.course.id, cc.course);
      });
    });

    const courses = Array.from(coursesSet.values());
    const isSelf = req.user.userId === user.id;
    const canViewStudent = isSelf || (user.role === "alumno" && courses.some(c => c.professorId === req.user.userId));

    if (!canViewStudent) {
      return res.status(403).json({ error: "No tienes autorización para ver este usuario" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      nivel: user.nivel,
      comportamiento: user.comportamiento,
      intereses: user.intereses,
      birthYear: user.birthYear,
      observaciones: user.observaciones,
      courses: courses.map(c => ({ id: c.id, title: c.title })),
    });
  } catch (err) {
    console.error("Error obteniendo alumno:", err);
    res.status(500).json({ error: "Error obteniendo alumno" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Determinar si el profesor tiene permiso: comprobar si alguna de las clases
    // del alumno pertenece a un curso del profesor
    if (user.role !== "alumno") {
      return res.status(403).json({ error: "No tienes autorización para editar este usuario" });
    }

    const classLinks = await prisma.classStudent.findMany({
      where: { studentId: userId },
      include: {
        class: {
          include: {
            classCourses: { include: { course: { select: { professorId: true } } } },
          },
        },
      },
    });
    const hasAccess = classLinks.some((cl) =>
      Array.isArray(cl.class?.classCourses) && cl.class.classCourses.some((cc) => cc.course?.professorId === req.user.userId)
    );
    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes autorización para editar este usuario" });
    }

    const data = buildStudentPayload(req.body);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        nivel: true,
        comportamiento: true,
        intereses: true,
        birthYear: true,
        observaciones: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Error actualizando alumno:", err);
    res.status(500).json({ error: "Error actualizando alumno" });
  }
});

// Obtener todos los alumnos de los cursos del profesor logueado
router.get("/students/all", authMiddleware, async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { courseId } = req.query;

    // Obtener cursos del profesor
    const courses = await prisma.course.findMany({
      where: { professorId },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return res.json([]);
    }
    // Si se pide un courseId específico, limitar a ese curso (comprobar que pertenece al profesor)
    let targetCourseIds = courseIds;
    if (courseId) {
      const num = parseInt(courseId, 10);
      if (!courseIds.includes(num)) return res.status(403).json({ error: "Curso no autorizado" });
      targetCourseIds = [num];
    }

    // Obtener todas las clases vinculadas a esos cursos a través de ClassCourse
    const classLinks = await prisma.classCourse.findMany({ where: { courseId: { in: targetCourseIds } }, select: { classId: true } });
    const classIds = classLinks.map((c) => c.classId);
    if (classIds.length === 0) return res.json([]);

    // Obtener alumnos que estén en esas clases
    const classStudents = await prisma.classStudent.findMany({ where: { classId: { in: classIds } }, include: { student: true } });
    const studentsMap = new Map();
    classStudents.forEach(cs => {
      const s = cs.student;
      if (s && s.id != null) studentsMap.set(s.id, s);
    });

    res.json(Array.from(studentsMap.values()));
  } catch (err) {
    console.error("Error obteniendo alumnos:", err);
    res.status(500).json({ error: "Error obteniendo alumnos" });
  }
});

// Obtener todos los alumnos de la base de datos 
router.get("/students/all-global", authMiddleware, async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "alumno" },
      select: {
        id: true,
        name: true,
        email: true,
        nivel: true,
        comportamiento: true,
        intereses: true,
        birthYear: true,
        observaciones: true,
        // Nota: no devolvemos course/courseId aquí porque ahora la pertenencia
        // a curso se infiere desde Class->ClassCourse
      },
      orderBy: { name: "asc" },
    });

    res.json(students);
  } catch (err) {
    console.error("Error obteniendo todos los alumnos:", err);
    res.status(500).json({ error: "Error obteniendo alumnos" });
  }
});

// Obtener todos los profesores
router.get("/professors/all", authMiddleware, async (req, res) => {
  try {
    const professors = await prisma.user.findMany({
      where: { role: "profesor" },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(professors);
  } catch (err) {
    console.error("Error obteniendo profesores:", err);
    res.status(500).json({ error: "Error obteniendo profesores" });
  }
});

module.exports = router;
