import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/StudentDetail.css";

const API_URL = "http://localhost:3005/api/users";

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const buildFormState = (dataSource) => ({
    name: dataSource?.name || "",
    email: dataSource?.email || "",
    nivel: dataSource?.nivel || "",
    comportamiento: dataSource?.comportamiento || "",
    intereses: dataSource?.intereses || "",
    curso: dataSource?.curso || "",
    birthYear: dataSource?.birthYear ?? "",
    observaciones: dataSource?.observaciones || "",
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (!studentId) {
          setError("Alumno no válido");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          setError("No hay sesión activa");
          setLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 1500);
          return;
        }

        const { data } = await axios.get(`${API_URL}/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudent(data);
        setFormData(buildFormState(data));
        setError("");
      } catch (err) {
        console.error("Error cargando alumno:", err);
        if (err.response?.status === 404) {
          setError("Alumno no encontrado");
        } else if (err.response?.status === 403) {
          setError("No tienes permiso para ver este alumno");
        } else if (err.response?.status === 401) {
          setError("Sesión expirada. Inicia sesión de nuevo.");
          localStorage.removeItem("token");
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        } else {
          setError("No se pudo cargar la información. Intenta de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, navigate]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const name = student?.name || formData?.name || "Alumno";
  const email = student?.email || "Sin correo";
  // `courses` es un array calculado por el backend (vía ClassStudent->ClassCourse)
  const course = (student?.courses && student.courses.length > 0) ? student.courses[0].title : "No asignado";
  const courseId = (student?.courses && student.courses.length > 0) ? student.courses[0].id : null;
  const joinDate = student?.createdAt
    ? new Date(student.createdAt).toLocaleDateString("es-ES")
    : "Sin dato";
  const age =
    student?.birthYear && Number.isInteger(student.birthYear)
      ? new Date().getFullYear() - student.birthYear
      : null;

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "birthYear" ? value.replace(/[^\d]/g, "") : value,
    }));
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData(buildFormState(student));
    setSuccessMsg("");
    setError("");
  };

  const handleStartEdit = () => {
    setFormData(buildFormState(student));
    setEditMode(true);
    setSuccessMsg("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Sesión expirada. Inicia sesión de nuevo.");
        navigate("/login");
        return;
      }

      const payload = {
        ...formData,
        birthYear:
          formData.birthYear === "" ? null : parseInt(formData.birthYear, 10),
      };

      const { data } = await axios.put(`${API_URL}/${studentId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudent(data);
      setEditMode(false);
      setSuccessMsg("Alumno actualizado correctamente");
    } catch (err) {
      console.error("Error actualizando alumno:", err);
      if (err.response?.status === 403) {
        setError("No tienes permiso para editar este alumno");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || "Datos inválidos");
      } else {
        setError("No se pudo guardar. Intenta de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="student-detail-container">
        <div className="student-detail-card">
          <p style={{ textAlign: "center" }}>Cargando alumno...</p>
        </div>
      </div>
    );
  }

  if (error && !editMode && !student) {
    return (
      <div className="student-detail-container">
        <div className="student-detail-card">
          <p style={{ textAlign: "center", color: "#d32f2f" }}>{error}</p>
          <button className="student-back-button" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-detail-container">
      <div className="student-detail-card">
        <div className="student-avatar-lg">
          {name.charAt(0)?.toUpperCase() || "A"}
        </div>
        <h1 className="student-name-title">{name}</h1>
        <p className="student-email">{email}</p>

        {successMsg && (
          <p className="student-success">{successMsg}</p>
        )}
        {error && !loading && (
          <p className="student-error-inline">{error}</p>
        )}

        {editMode ? (
          <form className="student-edit-form" onSubmit={handleSave}>
            <div className="form-row">
              <label htmlFor="name">Nombre completo</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData?.name || ""}
                onChange={handleFieldChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="email">Correo</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData?.email || ""}
                onChange={handleFieldChange}
                required
              />
            </div>

            <div className="form-row-grid">
              <div className="form-row">
                <label htmlFor="nivel">Nivel</label>
                <input
                  id="nivel"
                  name="nivel"
                  type="text"
                  value={formData?.nivel || ""}
                  onChange={handleFieldChange}
                  placeholder="Ej. Medio"
                />
              </div>
              <div className="form-row">
                <label htmlFor="curso">Curso académico</label>
                <input
                  id="curso"
                  name="curso"
                  type="text"
                  value={formData?.curso || ""}
                  onChange={handleFieldChange}
                  placeholder="Ej. 2º ESO"
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-row">
                <label htmlFor="comportamiento">Comportamiento</label>
                <select
                  id="comportamiento"
                  name="comportamiento"
                  value={formData?.comportamiento || ""}
                  onChange={handleFieldChange}
                >
                  <option value="">Sin definir</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Requiere seguimiento">Requiere seguimiento</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="birthYear">Año de nacimiento</label>
                <input
                  id="birthYear"
                  name="birthYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData?.birthYear ?? ""}
                  onChange={handleFieldChange}
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="intereses">Intereses</label>
              <input
                id="intereses"
                name="intereses"
                type="text"
                value={formData?.intereses || ""}
                onChange={handleFieldChange}
                placeholder="Ej. Música, ciencias"
              />
            </div>

            <div className="form-row">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows={4}
                value={formData?.observaciones || ""}
                onChange={handleFieldChange}
                placeholder="Notas personalizadas sobre el alumno"
              />
            </div>

            <div className="student-edit-actions">
              <button
                type="button"
                className="student-back-button"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="student-save-button"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="student-info-grid">
              <div className="student-info-item">
                <span>Curso asignado</span>
                <strong>{course}</strong>
              </div>
              <div className="student-info-item">
                <span>Fecha de ingreso</span>
                <strong>{joinDate}</strong>
              </div>
              <div className="student-info-item">
                <span>Nivel</span>
                <strong>{student?.nivel || "Sin definir"}</strong>
              </div>
              <div className="student-info-item">
                <span>Comportamiento</span>
                <strong>{student?.comportamiento || "Sin definir"}</strong>
              </div>
              <div className="student-info-item">
                <span>Intereses</span>
                <strong>{student?.intereses || "Sin definir"}</strong>
              </div>
              <div className="student-info-item">
                <span>Curso académico</span>
                <strong>{student?.curso || "Sin definir"}</strong>
              </div>
              <div className="student-info-item">
                <span>Año de nacimiento</span>
                <strong>
                  {student?.birthYear
                    ? `${student.birthYear}${age ? ` (${age} años)` : ""}`
                    : "Sin definir"}
                </strong>
              </div>
            </div>

            {student?.observaciones && (
              <div className="student-notes">
                <h2>Observaciones</h2>
                <p>{student.observaciones}</p>
              </div>
            )}
          </>
        )}

        <div className="student-actions">
          <button className="student-back-button" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          {courseId && (
            <Link to={`/class/${courseId}`} className="student-course-link">
              Ver curso
            </Link>
          )}
          {!editMode && (
            <button
              className="student-edit-toggle"
              onClick={handleStartEdit}
            >
              Editar alumno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
