import { useParams, Link } from "react-router-dom";
import "../styles/ClassDetail.css";

export default function ClassDetail() {
  const { classId } = useParams();

  // Simulación de alumnos por clase
  const studentsByClass = {
    1: ["Ana López", "Luis García", "Pedro Sánchez"],
    2: ["Marta", "Carlos", "Sofía"],
    3: ["Laura", "Diego", "Elena"],
  };

  const students = studentsByClass[classId] || [];

  return (
    <div className="class-detail-container">
      <div className="class-detail-card">
        <h1 className="class-title">Clase {classId}</h1>
        <h2 className="student-list-title">Alumnos</h2>

        <ul className="student-list">
          {students.map((s, index) => (
            <li key={index} className="student-item">
              <span className="student-avatar">{s.charAt(0)}</span>
              <span className="student-name">{s}</span>
            </li>
          ))}
        </ul>

        <Link to="/home" className="back-link">
          ← Volver a mis clases
        </Link>
      </div>
    </div>
  );
}
