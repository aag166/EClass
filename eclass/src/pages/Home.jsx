import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Importa los estilos base del calendario

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const events = [
    { date: "2025-10-15", title: "Reunión de departamento" },
    { date: "2025-10-18", title: "Examen 2º ESO Historia" },
    { date: "2025-10-20", title: "Entrega de notas 1º ESO" },
  ];

  // Cargar cursos y clases del profesor desde la base de datos
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

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Cargar cursos y clases en paralelo
        const [coursesResponse, classesResponse] = await Promise.all([
          axios.get("http://localhost:3005/api/courses", { headers }),
          axios.get("http://localhost:3005/api/classes", { headers }),
        ]);
        let fetchedCourses = coursesResponse.data || [];

        // Si el backend no devuelve la lista `students` dentro de cada curso,
        // hacemos peticiones paralelas para obtenerlos por curso y así mostrar el contador.
        const needsStudents = fetchedCourses.some((c) => c.students === undefined);
        if (needsStudents && fetchedCourses.length > 0) {
          try {
            const coursesWithStudents = await Promise.all(
              fetchedCourses.map(async (c) => {
                if (c.students !== undefined) return c;
                try {
                  const resp = await axios.get(`http://localhost:3005/api/courses/${c.id}/students`, { headers });
                  return { ...c, students: resp.data };
                } catch (err) {
                  // Si falla la petición por cualquiera razón devolvemos el curso tal cual
                  return { ...c, students: [] };
                }
              })
            );
            fetchedCourses = coursesWithStudents;
          } catch (err) {
            // no bloquear la carga si algo falla aquí
            console.warn("No se pudieron cargar estudiantes por curso:", err);
          }
        }

        setCourses(fetchedCourses);
        setClasses(classesResponse.data);
        setError(null);
      } catch (err) {
        console.error("Error cargando datos:", err);
        if (err.response?.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
          // Redirigir al login si el token es inválido
          setTimeout(() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }, 2000);
        } else {
          setError("Error al cargar los datos. Intenta recargar la página.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtra eventos del día seleccionado
  const selectedEvents = events.filter(
    (e) => e.date === selectedDate.toISOString().split("T")[0]
  );

  return (
    <div className="home-container">

      <h1 className="home-title">Panel del Profesor</h1>
      
      {/* Cursos */}
      <section className="section">
        <h2 className="section-title">Mis Cursos</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Cargando datos...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#d32f2f" }}>
            <p>{error}</p>
          </div>
        ) : courses.length === 0 && classes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>No tienes cursos ni clases asignados aún.</p>
            <Link to="/create-class" style={{ color: "#1976d2", textDecoration: "underline" }}>
              Generar clases automáticamente
            </Link>
          </div>
        ) : (
          <>
            {courses.length > 0 && (
              <div className="classes-grid">
                {courses.map((course) => (
                  <Link to={`/class/${course.id}`} key={course.id} className="class-card">
                    <div className="class-info">
                      <h3>{course.title}</h3>
                      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#444" }}>
                        {(course.students?.length ?? 0)} {(course.students?.length === 1 ? "alumno" : "alumnos")}
                      </p>
                      {course.description && (
                        <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
                          {course.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Clases Generadas */}
      {classes.length > 0 && (
        <section className="section">
          <h2 className="section-title">Mis Clases</h2>
          <div className="classes-grid">
            {classes.map((clase) => (
              <Link to={`/class-details/${clase.id}`} key={clase.id} className="class-card">
                <div className="class-info">
                  <h3>{clase.name}</h3>
                  {(() => {
                    const count = Array.isArray(clase.students) ? clase.students.length : (typeof clase.students === 'number' ? clase.students : 0);
                    return <p>{count} {count === 1 ? "alumno" : "alumnos"}</p>;
                  })()}
                  {clase.description && (
                    <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
                      {clase.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Calendario */}
      <section className="section">
        <h2 className="section-title">Calendario del Profesor</h2>
        <div className="calendar-wrapper">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="es-ES"
            className="calendar"
          />
          <div className="calendar-events">
            <h3>Eventos del {selectedDate.toLocaleDateString()}</h3>
            {selectedEvents.length > 0 ? (
              <ul>
                {selectedEvents.map((e, i) => (
                  <li key={i}>{e.title}</li>
                ))}
              </ul>
            ) : (
              <p>No hay eventos programados.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
