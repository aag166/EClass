const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// Listar todos los cursos de la base de datos (sin filtrar por profesor)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, description: true, professorId: true },
      orderBy: { title: "asc" },
    });
    res.json(courses);
  } catch (err) {
    console.error("Error listando todos los cursos:", err);
    res.status(500).json({ error: "Error listando cursos" });
  }
});

// Crear un curso (profesor logueado)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, studentIds } = req.body;
    const professorId = req.user.userId;

    if (!title) return res.status(400).json({ error: "El título del curso es requerido" });

    // Crear curso simple; la asignación de alumnos se gestiona vinculándolos a clases
    const newCourse = await prisma.course.create({ data: { title, description, professorId } });
    res.json({ course: newCourse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando curso" });
  }
});

// Listar cursos del profesor logueado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { professorId: req.user.userId },
      include: {
        modules: true,
        // Obtener las relaciones intermedias para acceder a las clases
        classCourses: {
          include: {
            class: {
              include: {
                students: { include: { student: true } },
                professor: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    // Normalizar para que `classes` sea un array de objetos Class (con students expandidos)
    const mapped = courses.map((c) => ({
      ...c,
      classes: (c.classCourses || []).map((cc) => {
        const cl = cc.class || null;
        return cl
          ? {
              ...cl,
              students: Array.isArray(cl.students)
                ? cl.students.map((it) => (it && it.student ? it.student : it)).filter(Boolean)
                : [],
            }
          : null;
      }).filter(Boolean),
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando cursos" });
  }
});

// Obtener un curso con sus clases y alumnos
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const professorId = req.user.userId;

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        professorId: professorId, // Asegurar que el profesor es dueño del curso
      },
      include: {
        // Obtener las relaciones intermedias para acceder a las clases
        classCourses: {
          include: {
            class: {
              include: {
                students: { include: { student: { select: { id: true, name: true, email: true, nivel: true, comportamiento: true, intereses: true, birthYear: true, observaciones: true } } } },
                professor: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        modules: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // Normalizar las clases: extraerlas desde classCourses y expandir students
    const normalized = (course.classCourses || []).map((cc) => {
      const cl = cc.class || null;
      if (!cl) return null;
      const students = Array.isArray(cl.students)
        ? cl.students.map((it) => (it && it.student ? it.student : it)).filter(Boolean)
        : [];
      return { ...cl, students };
    }).filter(Boolean);

    // Ordenar las clases por nombre
    normalized.sort((a, b) => {
      if (!a || !b) return 0;
      const na = (a.name || "").toString().toLowerCase();
      const nb = (b.name || "").toString().toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

    // Construir listado único de alumnos para todo el curso
    const studentsMap = new Map();
    normalized.forEach((cl) => {
      (cl.students || []).forEach((s) => {
        if (s && s.id != null) studentsMap.set(s.id, s);
      });
    });

    const courseStudents = Array.from(studentsMap.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const result = { ...course, classes: normalized, students: courseStudents };

    res.json(result);
  } catch (err) {
    console.error("Error obteniendo curso:", err);
    res.status(500).json({ error: "Error obteniendo curso" });
  }
});

/*
  Gestión de alumnos dentro de un curso
  - POST /api/courses/:id/students  -> añadir alumno existente o crear y asignar
  - GET  /api/courses/:id/students  -> listar alumnos del curso
  - DELETE /api/courses/:id/students/:studentId -> quitar alumno del curso (set courseId null)
*/

// Añadir estudiante existente al curso (o crear nuevo si se pasa create: true)
router.post("/:id/students", authMiddleware, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const professorId = req.user.userId;

    // comprobar que el profesor es dueño del curso
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });
    if (course.professorId !== professorId) {
      return res.status(403).json({ error: "No autorizado para modificar este curso" });
    }

    const { userId, name, email, password, classId } = req.body;

    if (userId) {
      // Para asignar un alumno existente al curso debemos vincularlo a una clase dentro del curso.
      if (!classId) return res.status(400).json({ error: "Se requiere classId para asignar un alumno a una clase del curso." });
      // Verificar que la clase pertenece al curso (existencia en ClassCourse)
      const clsLink = await prisma.classCourse.findFirst({ where: { classId: parseInt(classId), courseId } });
      if (!clsLink) return res.status(400).json({ error: "La clase no pertenece a este curso." });

      const createdLink = await prisma.classStudent.create({ data: { classId: parseInt(classId), studentId: parseInt(userId) } });
      return res.json(createdLink);
    } else {
      // crear nuevo alumno y asignarlo a la clase indicada
      if (!email || !name || !password || !classId) {
        return res.status(400).json({ error: "Falta name, email, password o classId para crear y asignar alumno a una clase" });
      }
      const bcrypt = require("bcryptjs");
      const hashed = bcrypt.hashSync(password, 10);

      const newStudent = await prisma.user.create({ data: { name, email, password: hashed, role: "alumno" } });
      await prisma.classStudent.create({ data: { classId: parseInt(classId), studentId: newStudent.id } });
      return res.json(newStudent);
    }
  } catch (err) {
    console.error(err);
    // posible unique constraint en email
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email ya existe" });
    }
    res.status(500).json({ error: "Error asignando alumno al curso" });
  }
});

// Listar alumnos del curso (todos los alumnos de todas las clases del curso)
router.get("/:id/students", authMiddleware, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    // No requerimos que el curso pertenezca al profesor logueado; permitimos consultar
    // los alumnos de cualquier curso (manteniendo autenticación).
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });

    // Obtener todas las clases del curso y sus alumnos a través de ClassCourse
    const classLinks = await prisma.classCourse.findMany({ where: { courseId }, include: { class: { include: { students: { include: { student: true } } } } } });

    const classes = classLinks.map(cl => cl.class).filter(Boolean);

    const studentsMap = new Map();
    classes.forEach(cls => {
      if (!cls || !Array.isArray(cls.students)) return;
      cls.students.forEach(cs => {
        const s = cs.student;
        if (s && s.id != null) studentsMap.set(s.id, s);
      });
    });

    const students = Array.from(studentsMap.values()).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando alumnos" });
  }
});

// Quitar alumno del curso (set courseId = null)
router.delete("/:id/students/:studentId", authMiddleware, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const studentId = parseInt(req.params.studentId);
    const professorId = req.user.userId;

    // comprobar curso y autorización
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });
    if (course.professorId !== professorId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // eliminar la(s) asociación(es) del alumno con clases que pertenezcan a este curso (vía ClassCourse)
    const classLinks = await prisma.classCourse.findMany({ where: { courseId }, select: { classId: true } });
    const classIds = classLinks.map(c => c.classId);
    if (classIds.length === 0) return res.status(400).json({ error: "No hay clases en este curso" });

    // comprobar alumno existe
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: "Alumno no encontrado" });

    await prisma.classStudent.deleteMany({ where: { studentId, classId: { in: classIds } } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error quitando alumno del curso" });
  }
});

module.exports = router;
