const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de la base de datos...");

  // Crear usuarios
  const profesor1 = await prisma.user.create({
    data: {
      name: "Profesor A",
      email: "profesorA@eclass.com",
      password: "123456",
      role: "profesor",
    },
  });

  const profesor2 = await prisma.user.create({
    data: {
      name: "Profesor B",
      email: "profesorB@eclass.com",
      password: "123456",
      role: "profesor",
    },
  });

  const alumno1 = await prisma.user.create({
    data: {
      name: "Alumno 1",
      email: "alumno1@eclass.com",
      password: "123456",
    },
  });

  const alumno2 = await prisma.user.create({
    data: {
      name: "Alumno 2",
      email: "alumno2@eclass.com",
      password: "123456",
    },
  });

  const alumno3 = await prisma.user.create({
    data: {
      name: "Alumno 3",
      email: "alumno3@eclass.com",
      password: "123456",
    },
  });

  // Crear cursos
  const curso1 = await prisma.course.create({
    data: {
      title: "Curso de Matemáticas",
      description: "Curso básico de matemáticas",
      professorId: profesor1.id,
    },
  });

  const curso2 = await prisma.course.create({
    data: {
      title: "Curso de Historia",
      description: "Curso básico de historia",
      professorId: profesor2.id,
    },
  });

  // Crear módulos para cada curso
  const modulo1Curso1 = await prisma.module.create({
    data: {
      courseId: curso1.id,
      title: "Álgebra",
      description: "Módulo de álgebra básica",
      order: 1,
    },
  });

  const modulo2Curso1 = await prisma.module.create({
    data: {
      courseId: curso1.id,
      title: "Geometría",
      description: "Módulo de geometría básica",
      order: 2,
    },
  });

  const modulo1Curso2 = await prisma.module.create({
    data: {
      courseId: curso2.id,
      title: "Historia Antigua",
      description: "Módulo de historia antigua",
      order: 1,
    },
  });

  const modulo2Curso2 = await prisma.module.create({
    data: {
      courseId: curso2.id,
      title: "Historia Moderna",
      description: "Módulo de historia moderna",
      order: 2,
    },
  });

  // Crear actividades para cada módulo
  const actividades = [];

  for (const modulo of [modulo1Curso1, modulo2Curso1, modulo1Curso2, modulo2Curso2]) {
    actividades.push(
      await prisma.activity.create({
        data: {
          moduleId: modulo.id,
          type: "tarea",
          title: "Tarea 1 " + modulo.title,
          content: "Contenido de la tarea 1",
        },
      }),
      await prisma.activity.create({
        data: {
          moduleId: modulo.id,
          type: "quiz",
          title: "Quiz 1 " + modulo.title,
          content: "Contenido del quiz 1",
        },
      })
    );
  }

  // Inscripciones
  const alumnos = [alumno1, alumno2, alumno3];
  const cursos = [curso1, curso2];

  for (const alumno of alumnos) {
    for (const curso of cursos) {
      await prisma.enrollment.create({
        data: {
          userId: alumno.id,
          courseId: curso.id,
        },
      });

      // Crear progreso inicial 0% para cada módulo del curso
      const moduloCurso = await prisma.module.findMany({ where: { courseId: curso.id } });
      for (const modulo of moduloCurso) {
        await prisma.progress.create({
          data: {
            userId: alumno.id,
            moduleId: modulo.id,
            percentage: 0,
          },
        });
      }
    }
  }

  console.log("Seed completado correctamente");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
