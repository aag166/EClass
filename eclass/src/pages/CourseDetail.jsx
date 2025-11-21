import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ClassDetail.css";

export default function ClassDetail() {
  const { classId } = useParams();
  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [isCourse, setIsCourse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("No hay sesión activa");
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Intentar primero como curso
        try {
          const courseResponse = await axios.get(`http://localhost:3005/api/courses/${classId}`, { headers });

          // Normalizar estudiantes: helper para compatibilidad con versiones previas
          const normalizeStudentsArray = (arr) => {
            const raw = Array.isArray(arr) ? arr : [];
            const mapped = raw.map((it) => (it && it.student ? it.student : it)).filter(Boolean);
            const uniq = new Map();
            mapped.forEach((s) => {
              if (s && s.id != null) uniq.set(s.id, s);
            });
            return Array.from(uniq.values());
          };

          // Es un curso - tiene clases agrupadas
          const courseData = courseResponse.data || {};
          // Normalizar clases y sus estudiantes (si vienen como wrappers)
          const normalizedClasses = (courseData.classes || []).map((c) => ({
            ...c,
            students: Array.isArray(c.students) ? c.students.map((it) => (it && it.student ? it.student : it)).filter(Boolean) : [],
          }));

          // Obtener listado de estudiantes del curso: el endpoint ahora devuelve `course.students`.
          const normalizedStudents = Array.isArray(courseData.students)
            ? normalizeStudentsArray(courseData.students)
            : // fallback a petición dedicada si no existe
              normalizeStudentsArray((await axios.get(`http://localhost:3005/api/courses/${classId}/students`, { headers })).data);

          setCourse(courseData);
          setClasses(normalizedClasses);
          setStudents(normalizedStudents);
          setIsCourse(true);
          setError(null);
        } catch (courseErr) {
          // Si no es un curso, intentar como clase generada
          if (courseErr.response?.status === 404) {
            const classResponse = await axios.get(`http://localhost:3005/api/classes/${classId}`, { headers });
            
            // Es una clase individual
            const classData = classResponse.data;
            setCourse({
              id: classData.id,
              title: classData.name,
              description: classData.description || null,
            });

            // Extraer y normalizar estudiantes de la estructura de clase generada
            const classStudentsRaw = Array.isArray(classData.students) ? classData.students : [];
            const classStudents = classStudentsRaw.map((cs) => (cs && cs.student ? cs.student : cs)).filter(Boolean);
            // desduplicar por id
            const uniq = new Map();
            classStudents.forEach((s) => {
              if (s && s.id != null) uniq.set(s.id, s);
            });
            setStudents(Array.from(uniq.values()));
            setIsCourse(false);
            setError(null);
          } else {
            throw courseErr;
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        if (err.response?.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
          setTimeout(() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }, 2000);
        } else if (err.response?.status === 404) {
          setError("Curso o clase no encontrado.");
        } else if (err.response?.status === 403) {
          setError("No tienes autorización para ver este contenido.");
        } else {
          setError("Error al cargar los datos. Intenta recargar la página.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchData();
    }
  }, [classId]);

  // Eliminar curso completo
  const handleDeleteCourse = async () => {
    if (!course?.id) return;
    const confirm = window.confirm("¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.");
    if (!confirm) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`http://localhost:3005/api/courses/${course.id}`, { headers });

      // Redirigir a home al eliminar curso
      window.location.href = "/home";
    } catch (err) {
      console.error("Error eliminando curso:", err);
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }, 1500);
      } else if (err.response?.status === 403) {
        setError("No tienes autorización para eliminar este curso.");
      } else if (err.response?.status === 404) {
        setError("Curso no encontrado.");
      } else {
        setError("Error al eliminar el curso. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una clase (vista individual)
  const handleDeleteClass = async () => {
    if (!course?.id) return;
    const confirm = window.confirm("¿Eliminar esta clase? Esta acción no se puede deshacer.");
    if (!confirm) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`http://localhost:3005/api/classes/${course.id}`, { headers });
      window.location.href = "/home";
    } catch (err) {
      console.error("Error eliminando clase:", err);
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }, 1500);
      } else if (err.response?.status === 403) {
        setError("No tienes autorización para eliminar esta clase.");
      } else if (err.response?.status === 404) {
        setError("Clase no encontrada.");
      } else {
        setError("Error al eliminar la clase. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una clase específica dentro de un curso (lista de clases)
  const handleDeleteClassFromCourse = async (classIdToDelete) => {
    if (!classIdToDelete) return;
    const confirm = window.confirm("¿Eliminar esta clase del curso? Esta acción no se puede deshacer.");
    if (!confirm) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`http://localhost:3005/api/classes/${classIdToDelete}`, { headers });

      // Actualizar estado eliminando la clase localmente
      setClasses((prev) => prev.filter((c) => c.id !== classIdToDelete));
      setError(null);
    } catch (err) {
      console.error("Error eliminando clase del curso:", err);
      if (err.response?.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }, 1500);
      } else if (err.response?.status === 403) {
        setError("No tienes autorización para eliminar esta clase.");
      } else if (err.response?.status === 404) {
        setError("Clase no encontrada.");
      } else {
        setError("Error al eliminar la clase. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="class-detail-container">
        <div className="class-detail-card">
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando información del curso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-detail-container">
        <div className="class-detail-card">
          <p style={{ textAlign: "center", padding: "2rem", color: "#d32f2f" }}>{error}</p>
          <Link to="/home" className="back-link">
            ← Volver a Home
          </Link>
        </div>
      </div>
    );
  }

  // Las clases se muestran simplemente como una lista ordenada por nombre
  const classesBySubject = {};

  return (
    <div className="class-detail-container">
      <div className="class-detail-card">
        <h1 className="class-title">
          {isCourse ? course?.title : course?.title}
        </h1>
        {/* Botones de acción: eliminar curso o clase */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {isCourse ? (
            <button
              onClick={handleDeleteCourse}
              style={{ background: "#d32f2f", color: "#fff", border: "none", padding: "0.5rem 0.75rem", borderRadius: "6px", cursor: "pointer" }}
            >
              Eliminar curso
            </button>
          ) : (
            <button
              onClick={handleDeleteClass}
              style={{ background: "#d32f2f", color: "#fff", border: "none", padding: "0.5rem 0.75rem", borderRadius: "6px", cursor: "pointer" }}
            >
            </button>
          )}
        </div>
        {course?.description && (
          <p style={{ marginBottom: "1.5rem", color: "#666" }}>{course.description}</p>
        )}

        {isCourse ? (
          <>
            <h2 className="student-list-title" style={{ marginTop: "2rem" }}>
              Todos los Alumnos del Curso ({students.length})
            </h2>
          </>
        ) : (
          /* Vista de clase individual: mostrar solo alumnos de esta clase */
          <h2 className="student-list-title">
            Alumnos ({students.length})
          </h2>
        )}

        {students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
            <p>No hay alumnos {isCourse ? "en este curso" : "en esta clase"}.</p>
          </div>
        ) : (
          <ul className="student-list">
            {students.map((student) => (
              <li key={student.id} className="student-item">
                <Link to={`/students/${student.id}`} className="student-item-link">
                  <span className="student-avatar">
                    {student.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="student-item-body">
                    <span className="student-name">{student.name}</span>
                    {student.email && (
                      <p className="student-email-meta">
                        {student.email}
                      </p>
                    )}
                  </div>
                  <span className="student-link-icon"> → </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link to="/home" className="back-link">
          ← Volver a Home
        </Link>
      </div>
    </div>
  );
}
