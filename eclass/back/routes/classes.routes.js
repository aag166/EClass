const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// Obtener todas las clases del profesor logueado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const professorId = req.user.userId;

    const classes = await prisma.class.findMany({
      where: {
        professorId: professorId,
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        // incluir los enlaces a cursos para poder mostrar al menos el primer curso asociado
        classCourses: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformar los datos para incluir el conteo de estudiantes y el curso (si existe)
    const classesWithCount = classes.map((clase) => ({
      id: clase.id,
      name: clase.name,
      description: clase.description,
      students: Array.isArray(clase.students) ? clase.students.length : 0,
      course: (Array.isArray(clase.classCourses) && clase.classCourses.length > 0) ? clase.classCourses[0].course : null,
      createdAt: clase.createdAt,
      updatedAt: clase.updatedAt,
    }));

    res.json(classesWithCount);
  } catch (err) {
    console.error("Error obteniendo clases:", err);
    res.status(500).json({ error: "Error obteniendo clases" });
  }
});

// Obtener una clase específica con todos sus estudiantes
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const professorId = req.user.userId;

    const clase = await prisma.class.findFirst({
      where: {
        id: classId,
        professorId: professorId, // Asegurar que el profesor es dueño de la clase
      },
      include: {
        students: {
          include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nivel: true,
                    comportamiento: true,
                    intereses: true,
                    birthYear: true,
                    observaciones: true,
                  },
                },
          },
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Incluir los enlaces a cursos para poder devolver un objeto `course` similar al anterior
        classCourses: {
          include: {
            course: { select: { id: true, title: true, description: true } },
          },
        },
      },
    });

    if (!clase) {
      return res.status(404).json({ error: "Clase no encontrada" });
    }

    // Normalizar estudiantes: algunos includes devuelven { student: {...} }
    const students = Array.isArray(clase.students)
      ? clase.students.map((it) => (it && it.student ? it.student : it)).filter(Boolean)
      : [];

    const normalizedClass = {
      ...clase,
      students,
      course: (Array.isArray(clase.classCourses) && clase.classCourses.length > 0) ? clase.classCourses[0].course : null,
    };

    res.json(normalizedClass);
  } catch (err) {
    console.error("Error obteniendo clase:", err);
    res.status(500).json({ error: "Error obteniendo clase" });
  }
});

// Crear una nueva clase (para el profesor logueado)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, courseId, studentIds, professorId: assignedProfessorId } = req.body;
    const professorId = req.user.userId;

    if (!name) {
      return res.status(400).json({ error: "El nombre de la clase es requerido" });
    }


    // `courseId` es opcional: si se proporciona, verificar que existe y pertenece al profesor
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: parseInt(courseId),
          professorId: professorId,
        },
      });

      if (!course) {
        return res.status(404).json({ error: "Curso no encontrado o no autorizado" });
      }
    }

    // Si se asigna un profesor diferente, verificar que existe y es profesor
    if (assignedProfessorId) {
      const assignedProf = await prisma.user.findUnique({
        where: { id: assignedProfessorId },
        select: { role: true },
      });
      if (!assignedProf || assignedProf.role !== "profesor") {
        return res.status(400).json({ error: "El profesor asignado no es válido" });
      }
    }

    // Crear la clase, almacenando el courseId directamente si se proporciona
    const created = await prisma.class.create({
      data: {
        name,
        description: description || null,
        professorId: assignedProfessorId || professorId,
        courseId: courseId ? parseInt(courseId) : undefined,
        students: studentIds
          ? {
              create: studentIds.map((studentId) => ({ studentId })),
            }
          : undefined,
      },
    });

    // Reobtener la clase con includes para la respuesta
    const newClass = await prisma.class.findUnique({
      where: { id: created.id },
      include: {
        students: { include: { student: true } },
        professor: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });

    res.status(201).json(newClass);
  } catch (err) {
    console.error("Error creando clase:", err);
    res.status(500).json({ error: "Error creando clase" });
  }
});

// Crear múltiples clases a la vez (para generación automática)
router.post("/batch", authMiddleware, async (req, res) => {
  try {
    const { classes } = req.body;
    const defaultProfessorId = req.user.userId;

    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ error: "Se requiere un array de clases" });
    }

    // No se requiere `subject` en las clases (campo eliminado del modelo)

    // Verificar que los courseId proporcionados (si los hay) existen y pertenecen al profesor
    const courseIds = [...new Set(classes.map(c => c.courseId).filter(Boolean).map(id => parseInt(id)))];
    if (courseIds.length > 0) {
      const courses = await prisma.course.findMany({
        where: {
          id: { in: courseIds },
          professorId: defaultProfessorId,
        },
        select: { id: true },
      });

      const validCourseIds = new Set(courses.map(c => c.id));
      const invalidCourseIds = courseIds.filter(id => !validCourseIds.has(id));
      
      if (invalidCourseIds.length > 0) {
        return res.status(403).json({
          error: `Cursos no autorizados o no encontrados: ${invalidCourseIds.join(", ")}`,
        });
      }
    }

    // Validar que todos los profesores asignados existen y son profesores
    const professorIds = classes
      .map((c) => c.professorId)
      .filter((id) => id != null);
    
    if (professorIds.length > 0) {
      const professors = await prisma.user.findMany({
        where: {
          id: { in: professorIds },
          role: "profesor",
        },
        select: { id: true },
      });
      
      const validProfessorIds = new Set(professors.map((p) => p.id));
      const invalidIds = professorIds.filter((id) => !validProfessorIds.has(id));
      
      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: `Profesores inválidos: ${invalidIds.join(", ")}`,
        });
      }
    }

    // Crear las clases y almacenar courseId en cada clase si se proporciona
    const createdClasses = [];
    for (const claseData of classes) {
      const created = await prisma.class.create({
        data: {
          name: claseData.name,
          description: claseData.description || null,
          professorId: claseData.professorId || defaultProfessorId,
          courseId: claseData.courseId ? parseInt(claseData.courseId) : undefined,
          students: claseData.studentIds
            ? {
                create: claseData.studentIds.map((studentId) => ({ studentId })),
              }
            : undefined,
        },
      });
      // Re-fetch con includes adaptados
      const fetched = await prisma.class.findUnique({
        where: { id: created.id },
        include: {
          students: { include: { student: { select: { id: true, name: true, email: true } } } },
          professor: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      });

      createdClasses.push(fetched);
    }

    res.status(201).json(createdClasses);
  } catch (err) {
    console.error("Error creando clases:", err);
    res.status(500).json({ error: "Error creando clases" });
  }
});

// Actualizar una clase
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const professorId = req.user.userId;
    const { name, description, courseId, professorId: newProfessorId } = req.body;

    // Verificar que la clase existe y pertenece al profesor
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        professorId: professorId,
      },
    });

    if (!existingClass) {
      return res.status(404).json({ error: "Clase no encontrada" });
    }

    // Actualizar campos simples de la clase
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        name: name || existingClass.name,
        description: description !== undefined ? description : existingClass.description,
        professorId: newProfessorId !== undefined ? newProfessorId : existingClass.professorId,
      },
      include: {
        students: { include: { student: true } },
        course: { select: { id: true, title: true } },
      },
    });

    // Si se proporcionó `courseId`, actualizar el campo courseId de la clase
    if (courseId !== undefined && courseId !== null) {
      await prisma.class.update({ where: { id: classId }, data: { courseId: parseInt(courseId) } });
    }

    res.json(updatedClass);
  } catch (err) {
    console.error("Error actualizando clase:", err);
    res.status(500).json({ error: "Error actualizando clase" });
  }
});

// Eliminar una clase
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const professorId = req.user.userId;

    // Verificar que la clase existe y pertenece al profesor
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        professorId: professorId,
      },
    });

    if (!existingClass) {
      return res.status(404).json({ error: "Clase no encontrada" });
    }

    await prisma.class.delete({
      where: { id: classId },
    });

    res.json({ message: "Clase eliminada correctamente" });
  } catch (err) {
    console.error("Error eliminando clase:", err);
    res.status(500).json({ error: "Error eliminando clase" });
  }
});

module.exports = router;

