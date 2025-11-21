# Documentación del Modelo Class

## Resumen de Cambios

Se ha adaptado la base de datos para soportar el algoritmo de generación de clases con las siguientes características:

### 1. Nuevo Modelo `Class`
- Representa las clases generadas por el algoritmo
- Tiene un profesor asignado **opcional** (puede ser `null`)
- Puede estar asociada a un curso (opcional)
- Contiene múltiples estudiantes a través de una relación many-to-many

### 2. Nuevo Modelo `ClassStudent`
- Tabla intermedia para la relación many-to-many entre `Class` y `User` (alumnos)
- Previene duplicados (un estudiante no puede estar dos veces en la misma clase)
- Se elimina automáticamente cuando se elimina la clase o el estudiante (CASCADE)

### 3. Campos Agregados al Modelo `User`
Se agregaron campos para almacenar características especiales de los alumnos:

- `nivel`: String? - Nivel académico (Alto, Medio, Bajo)
- `comportamiento`: String? - Comportamiento (Bueno, Regular, Excelente)
- `intereses`: String? - Intereses del alumno (Ciencias, Arte, Deporte, etc.)
- `curso`: String? - Curso académico (1A, 2B, etc.)
- `birthYear`: Int? - Año de nacimiento
- `observaciones`: String? - Observaciones o características especiales adicionales

## Estructura de Relaciones

```
User (Profesor)
  └── taughtClasses: Class[] (opcional - un profesor puede tener 0 o más clases)

User (Alumno)
  └── classes: ClassStudent[] (many-to-many con Class)

Class
  ├── professor: User? (opcional - puede ser null)
  ├── students: ClassStudent[] (many-to-many con User)
  └── course: Course? (opcional - puede estar asociada a un curso)

Course
  └── classes: Class[] (clases generadas para este curso)
```

## Casos de Uso

### Caso 1: Clase con Profesor
```javascript
const clase = await prisma.class.create({
  data: {
    name: "Clase 1",
    professorId: 1, // Profesor asignado
    students: {
      create: [
        { studentId: 2 },
        { studentId: 3 }
      ]
    }
  }
});
```

### Caso 2: Clase sin Profesor
```javascript
const clase = await prisma.class.create({
  data: {
    name: "Clase 2",
    // professorId: null (implícito)
    students: {
      create: [
        { studentId: 4 },
        { studentId: 5 }
      ]
    }
  }
});
```

### Caso 3: Asignar Profesor Posteriormente
```javascript
// Crear clase sin profesor
const clase = await prisma.class.create({
  data: {
    name: "Clase 3",
    students: { create: [{ studentId: 6 }] }
  }
});

// Asignar profesor después
await prisma.class.update({
  where: { id: clase.id },
  data: { professorId: 2 }
});
```

### Caso 4: Remover Profesor de una Clase
```javascript
await prisma.class.update({
  where: { id: claseId },
  data: { professorId: null }
});
```

## Consultas Útiles

### Obtener todas las clases con detalles
```javascript
const classes = await prisma.class.findMany({
  include: {
    professor: true,
    students: {
      include: {
        student: true
      }
    },
    course: true
  }
});
```

### Obtener estudiantes con sus características
```javascript
const students = await prisma.user.findMany({
  where: { role: 'alumno' },
  select: {
    id: true,
    name: true,
    nivel: true,
    comportamiento: true,
    intereses: true,
    curso: true,
    birthYear: true,
    observaciones: true
  }
});
```

### Obtener clases de un profesor
```javascript
const classes = await prisma.class.findMany({
  where: { professorId: profesorId },
  include: {
    students: {
      include: { student: true }
    }
  }
});
```

### Obtener clases sin profesor asignado
```javascript
const classes = await prisma.class.findMany({
  where: { professorId: null },
  include: {
    students: {
      include: { student: true }
    }
  }
});
```

## Migración

Para aplicar estos cambios a tu base de datos:

```bash
cd src/back
npx prisma migrate dev --name add_class_model
```

Esto creará una nueva migración que:
1. Agregará los campos nuevos al modelo `User`
2. Creará la tabla `Class`
3. Creará la tabla `ClassStudent`
4. Establecerá todas las relaciones y constraints

## Notas Importantes

1. **Profesor Opcional**: El campo `professorId` en `Class` es opcional (`Int?`), lo que significa que una clase puede existir sin profesor asignado.

2. **Cascade Delete**: Cuando se elimina una `Class`, todos los registros relacionados en `ClassStudent` se eliminan automáticamente. Lo mismo ocurre si se elimina un `User` (estudiante).

3. **Unicidad**: Un estudiante no puede estar duplicado en la misma clase gracias al constraint `@@unique([classId, studentId])`.

4. **Índices**: Se han agregado índices en `classId` y `studentId` en `ClassStudent` para mejorar el rendimiento de las consultas.

5. **Campos Opcionales**: Todos los campos de características especiales en `User` son opcionales (`String?`, `Int?`), permitiendo que los usuarios existentes no se vean afectados.

