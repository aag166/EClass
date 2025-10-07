import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../logo/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simulación de login
    if (email === "profesor@centro.es" && password === "1234") {
      localStorage.setItem("user", JSON.stringify({ email }));
      navigate("/home"); 
    } else {
      setError("Credenciales incorrectas. Intenta de nuevo.");
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
          <h2>¿No tienes cuenta?</h2>
          <button type="submit" className="register-button">
          Crear Cuenta
          </button>
        </form>
      </div>
    </div>
  );
}
