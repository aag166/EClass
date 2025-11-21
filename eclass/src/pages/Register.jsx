import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css"; // CSS separado

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:3005/api/auth/register", formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/home");
    } catch (err) {
      console.error(err);
      console.log("ERROR DEL BACKEND:", err.response?.data);
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Crear Cuenta</h1>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            className="register-input"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Correo institucional"
            className="register-input"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="register-input"
            onChange={handleChange}
            required
          />

          {error && <p className="register-error">{error}</p>}

          <button type="submit" className="register-button">
            Registrarse
          </button>
        </form>

        <h2 className="register-footer">
          ¿Ya tienes cuenta?{" "}
          <span
            className="register-login-link"
            onClick={() => navigate("/")}
          >
            Inicia sesión
          </span>
        </h2>
      </div>
    </div>
  );
}
