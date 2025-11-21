// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Profile.css";

const API_URL = "http://localhost:3005/api/users/me";
const DEFAULT_USER = {
  name: "Profesor/a del Centro",
  email: "profesor@centro.es",
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No hay sesión activa");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }

        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        setError("");
      } catch (err) {
        console.error("Error cargando el perfil del profesor:", err);
        if (err.response?.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
          localStorage.removeItem("token");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        } else {
          setError("No se pudo cargar el perfil. Intenta de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const name = profile?.name || DEFAULT_USER.name;
  const email = profile?.email || DEFAULT_USER.email;
  const initial = name ? name.charAt(0).toUpperCase() : "P";
  const role =
    profile?.role === "profesor"
      ? "Profesor"
      : profile?.role === "alumno"
      ? "Alumno"
      : "Docente";
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-ES")
    : "Sin registro";
  const stats = profile?.stats || {};
  const courses = stats.courses ?? 0;
  const classes = stats.classes ?? 0;
  const students = stats.students ?? 0;

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p style={{ textAlign: "center" }}>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p style={{ textAlign: "center", color: "#d32f2f" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <span>{initial}</span>
        </div>
        <h2 className="profile-name">{name}</h2>
        <p className="profile-email">{email}</p>

        <div className="profile-info">
          <div className="info-item">
            <strong>Miembro desde:</strong> {joinDate}
          </div>
          <div className="info-item">
            <strong>Cursos activos:</strong> {courses}
          </div>
          <div className="info-item">
            <strong>Clases asignadas:</strong> {classes}
          </div>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("token");
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
