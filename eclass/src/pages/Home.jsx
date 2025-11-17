import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Importa los estilos base del calendario

export default function Home() {


  const [selectedDate, setSelectedDate] = useState(new Date());

  const classes = [
    { id: 1, name: "Matemáticas 1º ESO", students: 25 },
    { id: 2, name: "Historia 2º ESO", students: 22 },
    { id: 3, name: "Física 1º Bachillerato", students: 18 },
  ];

  const events = [
    { date: "2025-10-15", title: "Reunión de departamento" },
    { date: "2025-10-18", title: "Examen 2º ESO Historia" },
    { date: "2025-10-20", title: "Entrega de notas 1º ESO" },
  ];

  
  // Filtra eventos del día seleccionado
  const selectedEvents = events.filter(
    (e) => e.date === selectedDate.toISOString().split("T")[0]
  );

  return (
    <div className="home-container">

      <h1 className="home-title">Panel del Profesor</h1>
      
      {/* Clases */}
      <section className="section">
        <h2 className="section-title">Mis Clases</h2>
        <div className="classes-grid">
          {classes.map((c) => (
            <Link to={`/class/${c.id}`} key={c.id} className="class-card">
              <div className="class-info">
                <h3>{c.name}</h3>
                <p>{c.students} alumnos</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
