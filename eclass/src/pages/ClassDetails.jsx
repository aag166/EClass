import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ClassDetails.css";

export default function ClassDetails() {
  const { classId } = useParams();
  const [clase, setClase] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No hay sesión activa");
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`http://localhost:3005/api/classes/${classId}`, { headers });
        const data = res.data;
        setClase(data);

        // extraer estudiantes 
        let classStudents = [];
        if (Array.isArray(data.students) && data.students.length > 0) {
          classStudents = data.students
            .map((s) => (s && typeof s === "object" ? (s.student ? s.student : s) : null))
            .filter(Boolean);
        }

        // Desduplicar por id por si acaso algunas consultas pueden devolver duplicados
        const uniqueById = Array.from(
          new Map(classStudents.map((st) => [st.id, st])).values()
        );

        setStudents(uniqueById);
        setError(null);
      } catch (err) {
        console.error("Error cargando la clase:", err);
        if (err.response?.status === 401) {
          setError("Sesión expirada. Por favor inicia sesión de nuevo.");
          setTimeout(() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }, 1500);
        } else if (err.response?.status === 404) {
          setError("Clase no encontrada.");
        } else {
          setError("Error al cargar la clase. Intenta recargar la página.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchClass();
  }, [classId]);

  if (loading) {
    return (
      <div className="class-details-container">
        <div className="class-details-card">
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando clase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-details-container">
        <div className="class-details-card">
          <p style={{ textAlign: "center", padding: "2rem", color: "#d32f2f" }}>{error}</p>
          <Link to="/home" className="back-link">← Volver a Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="class-details-container">
      <div className="class-details-card">
        <h1 className="class-title">{clase?.name}</h1>
        {clase?.description && <p className="muted">{clase.description}</p>}

        {clase?.professor && (
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Profesor</h3>
            <p style={{ margin: 0 }}>{clase.professor.name} {clase.professor.email && `— ${clase.professor.email}`}</p>
          </div>
        )}

        {(() => {
          const linkedCourse = clase?.course || (clase?.courses && clase.courses[0]?.course);
          if (linkedCourse) {
            return (
              <div style={{ marginTop: "0.75rem", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Curso</h3>
                <Link to={`/class/${linkedCourse.id}`} style={{ color: "#1976d2", textDecoration: "underline" }}>{linkedCourse.title}</Link>
              </div>
            );
          }
          return null;
        })()}

        <h2 className="student-list-title">Alumnos ({students.length})</h2>

        {students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
            <p>No hay alumnos en esta clase.</p>
          </div>
        ) : (
          <ul className="student-list">
            {students.map((s) => (
              <li key={s.id} className="student-item">
                <Link to={`/students/${s.id}`} className="student-item-link">
                  <span className="student-avatar">{s.name?.charAt(0).toUpperCase() || "?"}</span>
                  <div className="student-item-body">
                    <span className="student-name">{s.name}</span>
                    {s.email && <p className="student-email-meta">{s.email}</p>}
                  </div>
                  <span className="student-link-icon"> → </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link to="/home" className="back-link">← Volver a Home</Link>
      </div>
    </div>
  );
}
