import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  // Datos simulados: puedes reemplazarlos por API
  const classes = [
    { id: 1, name: "Matemáticas 1º ESO", students: 25 },
    { id: 2, name: "Historia 2º ESO", students: 22 },
    { id: 3, name: "Física 1º Bachillerato", students: 18 },
  ];

  return (
    <div className="home-container">
      <h1 className="home-title">Mis Clases 👨‍🎓</h1>
      <div className="classes-grid">
        {classes.map((c) => (
          <Link to={`/class/${c.id}`} key={c.id} className="class-card">
            <div className="class-info">
              <h2>{c.name}</h2>
              <p>{c.students} alumnos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
