// /back/seed.js
require("dotenv").config({ path: __dirname + "/.env" });

console.log("DEBUG: DATABASE_URL =", process.env.DATABASE_URL);

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Iniciando nuevo seed...");

  const hashedPassword = bcrypt.hashSync("123456", 10);

  try {

    // PROFESORES

    console.log("Creando profesores...");

    const profesores = await Promise.all([
      prisma.user.create({
        data: {
          name: "Profesor Matemáticas",
          email: "profesor.mates@eclass.com",
          password: hashedPassword,
          role: "profesor",
        },
      }),
      prisma.user.create({
        data: {
          name: "Profesor Historia",
          email: "profesor.historia@eclass.com",
          password: hashedPassword,
          role: "profesor",
        },
      }),
      prisma.user.create({
        data: {
          name: "Profesor Lengua",
          email: "profesor.lengua@eclass.com",
          password: hashedPassword,
          role: "profesor",
        },
      }),
    ]);

    console.log("Profesores creados:", profesores.map(p => p.id));


    // CURSOS 
    console.log("Creando cursos...");

    // Cursos por nivel (solo 4 cursos: 1º, 2º, 3º, 4º ESO)
    const listaCursos = [
      "1º ESO",
      "2º ESO",
      "3º ESO",
      "4º ESO",
    ];

    const cursos = [];
    for (let i = 0; i < listaCursos.length; i++) {
      const nuevoCurso = await prisma.course.create({
        data: {
          title: listaCursos[i],
          description: `Alumnado de ${listaCursos[i]}`,
          professorId: profesores[i % profesores.length].id,
        },
      });
      cursos.push(nuevoCurso);
    }

    console.log("Cursos creados:", cursos.map(c => c.id));


    // ALUMNOS 
    console.log("Creando alumnos...");

    const nombres = [
      "Carlos", "Lucía", "María", "Jorge", "Valeria",
      "Rubén", "Sofía", "Iván", "Laura", "Hugo",
      "Aitana", "Pablo", "Claudia", "Daniel", "Irene",
      "Miguel", "Paula", "Nora", "Andrea", "Tomás"
    ];

    const alumnos = [];

    for (let i = 0; i < nombres.length; i++) {
      const alumno = await prisma.user.create({
        data: {
          name: nombres[i],
          email: `${nombres[i].toLowerCase()}@eclass.com`,
          password: hashedPassword,
          role: "alumno",
          nivel: ["alto", "medio", "bajo"][i % 3],
          comportamiento: ["excelente", "bueno", "distraído"][i % 3],
          intereses: ["ciencia", "matemáticas", "arte"][i % 3],
          curso: `Grupo ${i + 1}`,
          birthYear: 2010 + (i % 5),
          observaciones: "Generado automáticamente",
        },
      });

      // Registrar en memoria a qué curso pertenece este alumno (no se guarda en la tabla User)
      alumno.assignedCourseId = cursos[i % cursos.length].id;
      alumnos.push(alumno);
    }

    console.log("Alumnos creados:", alumnos.length);


    // MÓDULOS
    console.log("Creando módulos...");

    for (const curso of cursos) {
      await prisma.module.createMany({
        data: [
          {
            courseId: curso.id,
            title: `Unidad 1 - Introducción a ${curso.title}`,
            description: "Temario introductorio",
            order: 1,
          },
          {
            courseId: curso.id,
            title: `Unidad 2 - Contenido avanzado de ${curso.title}`,
            description: "Temario avanzado",
            order: 2,
          },
        ],
      });
    }

    console.log("Módulos creados.");


    // ACTIVIDADES

    console.log("Creando actividades...");

    const modulos = await prisma.module.findMany();

    for (const modulo of modulos) {
      await prisma.activity.create({
        data: {
          moduleId: modulo.id,
          type: "tarea",
          title: `Tarea de ${modulo.title}`,
          content: "Contenido de la tarea",
        },
      });

      await prisma.activity.create({
        data: {
          moduleId: modulo.id,
          type: "quiz",
          title: `Quiz de ${modulo.title}`,
          content: "Contenido del quiz",
        },
      });
    }

    console.log("Actividades creadas.");


    // Nota: no asignamos `courseId` directo al usuario en la BD. En su lugar
    // registramos en memoria a qué curso debe pertenecer cada alumno para
    // repartirlos luego en las `Class` del curso correspondiente.


    // CLASES: crear clases por curso (p.ej. 1º ESO -> 1º ESO A, 1º ESO B)
    console.log("Creando clases por curso (tutores asignados)...");

    // Definir cuántas clases por curso y sufijos (A, B, C)
    const classSuffixes = ["A", "B", "C"];
    const createdClasses = [];

    for (const curso of cursos) {
      for (const suf of classSuffixes) {
        const className = `${curso.title} ${suf}`;
        const nuevaClase = await prisma.class.create({
          data: {
            name: className,
            description: `Clase ${suf} del ${curso.title}`,
            professorId: curso.professorId, // tutor = profesor del curso
            courseId: curso.id,
          },
        });

        createdClasses.push({ class: nuevaClase, courseId: curso.id });
      }
    }

    console.log("Clases creadas y enlazadas a cursos:", createdClasses.map(c => c.class.id));

    // ASIGNAR ALUMNOS A LAS CLASES DEL MISMO CURSO (distribución round-robin)
    console.log("Asignando alumnos a las clases del mismo curso...");

    for (const curso of cursos) {
      // alumnos pertenecientes a este curso (usamos la asignación en memoria)
      const alumnosDelCurso = alumnos.filter(a => a.assignedCourseId === curso.id);
      // obtener las clases creadas para este curso
      const clasesParaCurso = createdClasses.filter(c => c.courseId === curso.id).map(c => c.class);

      if (clasesParaCurso.length === 0) continue;

      // repartir alumnos round-robin
      let idx = 0;
      for (const alumno of alumnosDelCurso) {
        const targetClass = clasesParaCurso[idx % clasesParaCurso.length];
        await prisma.classStudent.create({ data: { classId: targetClass.id, studentId: alumno.id } });
        idx++;
      }
    }

    console.log("Asignación de alumnos a clases completada.");

    // PROGRESO PARA TODOS LOS ALUMNOS (ahora que las relaciones ClassStudent y ClassCourse existen)
    console.log("Creando progreso inicial (basado en la clase/curso asignado)...");

    for (const alumno of alumnos) {
      // Encontrar la(s) clases a las que pertenece el alumno
      const classStudent = await prisma.classStudent.findFirst({ where: { studentId: alumno.id } });
      if (!classStudent) continue;

      // Obtener el courseId directamente desde la clase
      const claseInfo = await prisma.class.findUnique({ where: { id: classStudent.classId } });
      if (!claseInfo || !claseInfo.courseId) continue;

      const modulosAlumno = await prisma.module.findMany({ where: { courseId: claseInfo.courseId } });
      for (const modulo of modulosAlumno) {
        await prisma.progress.create({
          data: {
            userId: alumno.id,
            moduleId: modulo.id,
            percentage: 0,
          },
        });
      }
    }

    console.log("Progreso creado.");


    console.log("SEED COMPLETADO CORRECTAMENTE");

  } catch (err) {
    console.error("ERROR DURANTE EL SEED:", err);
  }
}

main()
  .catch((e) => console.error("ERROR FATAL:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
