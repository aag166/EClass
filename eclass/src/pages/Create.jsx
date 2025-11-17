import { useState } from "react";
import "../styles/Create.css";

export default function ClassAssignment() {
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");

  // Datos simulados con atributos reales para el algoritmo
  const [students] = useState([
    { id: 1, name: "Ana", nivel: "Alto", comportamiento: "Bueno", neae: false, languageSupport: false, intereses: "Ciencias" },
    { id: 2, name: "Luis", nivel: "Medio", comportamiento: "Regular", neae: false, languageSupport: false, intereses: "Arte" },
    { id: 3, name: "Marta", nivel: "Bajo", comportamiento: "Excelente", neae: true, languageSupport: false, intereses: "Deporte" },
    { id: 4, name: "Pedro", nivel: "Alto", comportamiento: "Bueno", neae: false, languageSupport: true, intereses: "Matemáticas" },
    { id: 5, name: "Sofía", nivel: "Medio", comportamiento: "Regular", neae: false, languageSupport: false, intereses: "Lengua" },
  ]);

  const [selectedStudents, setSelectedStudents] = useState([]);

  // Seleccionar/deseleccionar alumnos
  const handleSelect = (student) => {
    if (selectedStudents.includes(student)) {
      setSelectedStudents(selectedStudents.filter((s) => s !== student));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // -------------------- ALGORITMO INCLUSIVO --------------------
  const organizeInclusiveClass = (students) => {
    // Clasificaciones
    const neae = students.filter((s) => s.neae);
    const high = students.filter((s) => s.nivel === "Alto");
    const low = students.filter((s) => s.nivel === "Bajo");
    const behaviorIssues = students.filter((s) => s.comportamiento === "Malo");
    const languageSupport = students.filter((s) => s.languageSupport);

    let ordered = [];

    // 1. limitar agrupación de NEAE
    neae.forEach((s) => {
      if (ordered.filter((x) => x.neae).length < 2) ordered.push(s);
    });

    // 2. mezclar niveles
    [...high, ...low].forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });

    // 3. evitar juntar comportamientos conflictivos
    behaviorIssues.forEach((s) => {
      const existingBad = ordered.filter((x) => x.comportamiento === "Malo").length;
      if (existingBad < 1) ordered.push(s);
    });

    // 4. alumnos con apoyo lingüístico
    languageSupport.forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });

    // 5. completar con el resto
    students.forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });

    return ordered;
  };

  // -------------------- GUARDAR CLASE --------------------
  const handleSaveClass = () => {
    if (!className || selectedStudents.length === 0) {
      alert("Por favor, completa el nombre de la clase y selecciona al menos un alumno.");
      return;
    }

    // Aplicar algoritmo inclusivo
    const organizedStudents = organizeInclusiveClass(selectedStudents);

    const existingClasses =
      JSON.parse(localStorage.getItem("assignedClasses")) || [];

    const newClass = {
      id: existingClasses.length + 1,
      name: className,
      description: classDescription,
      students: organizedStudents,
    };

    localStorage.setItem(
      "assignedClasses",
      JSON.stringify([...existingClasses, newClass])
    );

    alert("✅ Clase creada aplicando criterios de inclusión correctamente.");
    setClassName("");
    setClassDescription("");
    setSelectedStudents([]);
  };

  // -------------------- RENDER --------------------
  return (
    <div className="class-assignment-container">
      <h1>Asignación de Alumnado</h1>

      {/* Datos de la clase */}
      <div className="section">
        <h2>Datos de la clase</h2>
        <input
          type="text"
          placeholder="Nombre de la clase (Ej: 3ºA)"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
        />
        <textarea
          placeholder="Descripción de la clase"
          value={classDescription}
          onChange={(e) => setClassDescription(e.target.value)}
        />
      </div>

      {/* Listado de alumnos */}
      <div className="section">
        <h2>Selecciona alumnos para esta clase</h2>
        <div className="students-grid">
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => handleSelect(student)}
              className={`student-card ${
                selectedStudents.includes(student) ? "selected" : ""
              }`}
            >
              <p>{student.name}</p>
              <p>Nivel: {student.nivel}</p>
              <p>Comportamiento: {student.comportamiento}</p>
              <p>Intereses: {student.intereses}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      {selectedStudents.length > 0 && (
        <div className="selected-list">
          <h2>Alumnos seleccionados</h2>
          <ul>
            {selectedStudents.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="save-btn" onClick={handleSaveClass}>Guardar Clase</button>
    </div>
  );
}
