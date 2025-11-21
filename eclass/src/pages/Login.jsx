import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";
import logo from "../logo/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar errores previos

    try {
      const res = await axios.post("http://localhost:3005/api/auth/login", {
        email,
        password,
      });

      // Guardar token en localStorage
      localStorage.setItem("token", res.data.token);

      // Guardar info del profesor también (opcional)
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/home");
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("Credenciales incorrectas. Intenta de nuevo.");
      } else {
        setError("Error al conectar con el servidor.");
      }
    }
  };

  return (
    <div className="login-container">
      <img
        src={logo}
        alt="Logo de la app"
        className="login-logo"
      />

      <div className="login-card">
        <h1 className="login-title">Inicio de Sesión</h1>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>

          <button
            type="button"
            className="register-button"
            onClick={() => navigate("/register")}
          >
            Crear Cuenta
          </button>
        </form>
      </div>
    </div>
  );
}
