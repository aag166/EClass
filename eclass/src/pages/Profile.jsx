// src/pages/Profile.jsx
import "../styles/Profile.css";

export default function Profile() {
  // valor por defecto si no hay user en localStorage
  const defaultUser = {
    name: "Profesor/a del Centro",
    email: "profesor@centro.es",
  };

  // intentar parsear localStorage de forma segura
  let user;
  try {
    user = JSON.parse(localStorage.getItem("user")) || defaultUser;
  } catch (e) {
    user = defaultUser;
  }

  // asegurarnos de tener una cadena y obtener la inicial
  const nameStr = user && user.name ? String(user.name) : defaultUser.name;
  const initial = nameStr.length ? nameStr.charAt(0).toUpperCase() : "P";

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <span>{initial}</span>
        </div>
        <h2 className="profile-name">{nameStr}</h2>
        <p className="profile-email">{user.email || defaultUser.email}</p>

        <div className="profile-info">
          <div className="info-item">
            <strong>Centro:</strong> IES Ejemplo
          </div>
          <div className="info-item">
            <strong>Departamento:</strong> Matemáticas
          </div>
          <div className="info-item">
            <strong>Clases asignadas:</strong> 3
          </div>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
