import { useParams, Link } from "react-router-dom";

export default function ClassDetail() {
  const { classId } = useParams();

  // Simulación de alumnos por clase
  const studentsByClass = {
    1: ["Ana", "Luis", "Pedro"],
    2: ["Marta", "Carlos", "Sofía"],
    3: ["Laura", "Diego", "Elena"],
  };

  const students = studentsByClass[classId] || [];

  return (
    <div className="class-detail-container">
      <h1>Alumnos de la clase {classId}</h1>
      <ul>
        {students.map((s, index) => (
          <li key={index}>{s}</li>
        ))}
      </ul>
      <Link to="/home">← Volver a mis clases</Link>
    </div>
  );
}
