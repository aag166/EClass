require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando asignación de alumnos a clases...');

  // Cargar cursos y clases
  const courses = await prisma.course.findMany();
  const classes = await prisma.class.findMany({ include: { classCourses: true } });

  // Si hay clases sin enlace a curso, intentar inferir por nombre y crear ClassCourse
  for (const cls of classes) {
    if (!cls.classCourses || cls.classCourses.length === 0) {
      // Heurística: buscar un curso cuyo title esté al inicio del nombre de la clase
      const match = courses.find(c => cls.name && cls.name.toLowerCase().startsWith((c.title || '').toLowerCase()));
      if (match) {
        try {
          await prisma.classCourse.create({ data: { classId: cls.id, courseId: match.id } });
          console.log(`Enlazado class ${cls.id} -> course ${match.id} por heurística (nombre).`);
        } catch (e) {
          console.warn(`No se pudo crear ClassCourse para class ${cls.id} y course ${match.id}:`, e.message);
        }
      } else {
        console.log(`No se encontró curso evidente para la clase ${cls.id} ('${cls.name}').`);
      }
    }
  }

  // Re-cargar clases con sus enlaces actualizados
  const classesWithLinks = await prisma.class.findMany({ include: { classCourses: { include: { course: true } } } });

  // Construir mapa courseId -> [class]
  const courseToClasses = new Map();
  for (const cl of classesWithLinks) {
    if (Array.isArray(cl.classCourses) && cl.classCourses.length > 0) {
      for (const cc of cl.classCourses) {
        const courseId = cc.courseId;
        if (!courseToClasses.has(courseId)) courseToClasses.set(courseId, []);
        courseToClasses.get(courseId).push(cl);
      }
    }
  }

  // Si no hay clases enlazadas a cursos, abortar
  if (courseToClasses.size === 0) {
    console.error('No hay clases enlazadas a cursos. Crea enlaces ClassCourse primero o revisa los nombres de las clases.');
    return;
  }

  // Obtener todos los alumnos
  const students = await prisma.user.findMany({ where: { role: 'alumno' } });
  console.log(`Alumnos encontrados: ${students.length}`);

  // Contador inicial por clase
  const classCounts = new Map();
  const existingClassStudents = await prisma.classStudent.findMany();
  for (const cs of existingClassStudents) {
    classCounts.set(cs.classId, (classCounts.get(cs.classId) || 0) + 1);
  }

  // Asignar alumnos sin clase
  let assigned = 0;
  for (const student of students) {
    const already = await prisma.classStudent.findFirst({ where: { studentId: student.id } });
    if (already) continue; // ya asignado

    // Heurística: si el usuario tiene un campo "curso" o "assignedCourseId" en la BD (caso raro), intentar usarlo
    let targetCourseId = null;
    if (student.curso) {
      const match = courses.find(c => (c.title || '').toLowerCase() === (student.curso || '').toLowerCase());
      if (match) targetCourseId = match.id;
    }
    if (!targetCourseId && student.assignedCourseId) {
      const match = courses.find(c => c.id === student.assignedCourseId);
      if (match) targetCourseId = match.id;
    }

    // Si no podemos inferir curso, elegir el curso con menos alumnos actualmente (sumando por clases)
    if (!targetCourseId) {
      // calcular recuento por curso
      const courseCounts = {};
      for (const [courseId, clsList] of courseToClasses.entries()) {
        let sum = 0;
        for (const cl of clsList) sum += (classCounts.get(cl.id) || 0);
        courseCounts[courseId] = sum;
      }
      // elegir courseId con min sum
      targetCourseId = Number(Object.keys(courseCounts).reduce((a, b) => courseCounts[a] <= courseCounts[b] ? a : b));
    }

    const classList = courseToClasses.get(targetCourseId);
    if (!classList || classList.length === 0) {
      console.warn(`No hay clases disponibles para el curso ${targetCourseId}, saltando alumno ${student.id}`);
      continue;
    }

    // elegir la clase con menos alumnos
    let targetClass = classList[0];
    let minCount = classCounts.get(targetClass.id) || 0;
    for (const cl of classList) {
      const cnt = classCounts.get(cl.id) || 0;
      if (cnt < minCount) {
        minCount = cnt;
        targetClass = cl;
      }
    }

    try {
      await prisma.classStudent.create({ data: { classId: targetClass.id, studentId: student.id } });
      classCounts.set(targetClass.id, (classCounts.get(targetClass.id) || 0) + 1);
      assigned++;
      console.log(`Asignado alumno ${student.id} -> clase ${targetClass.id} (curso ${targetCourseId})`);

      // Crear progress para módulos de ese curso
      const modules = await prisma.module.findMany({ where: { courseId: targetCourseId } });
      for (const mod of modules) {
        const existing = await prisma.progress.findFirst({ where: { userId: student.id, moduleId: mod.id } });
        if (!existing) {
          await prisma.progress.create({ data: { userId: student.id, moduleId: mod.id, percentage: 0 } });
        }
      }

    } catch (e) {
      console.error(`Error asignando alumno ${student.id} a la clase ${targetClass.id}:`, e.message);
    }
  }

  console.log(`Asignación completada. Alumnos asignados: ${assigned}`);
}

main()
  .catch((e) => {
    console.error('Error en script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
