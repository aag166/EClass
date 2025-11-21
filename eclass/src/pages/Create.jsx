import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Create.css";

const API_URL = "http://localhost:3005/api";

export default function ClassAssignment() {
  const navigate = useNavigate();
  const [numClasses, setNumClasses] = useState(2);
  const [maxStudents, setMaxStudents] = useState(5);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [generatedClasses, setGeneratedClasses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignCourseId, setAssignCourseId] = useState("");
  const [filterText, setFilterText] = useState("");
  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("No hay sesión activa");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Cargar cursos, alumnos y profesores en paralelo
        const [coursesRes, studentsRes, professorsRes] = await Promise.all([
          axios.get(`${API_URL}/courses/all`, { headers }),
          axios.get(`${API_URL}/users/students/all-global`, { headers }),
          axios.get(`${API_URL}/users/professors/all`, { headers }),
        ]);

        setCourses(coursesRes.data);
        setStudents(studentsRes.data);
        setProfessors(professorsRes.data);
        setError("");
      } catch (err) {
        console.error("Error cargando datos:", err);
        if (err.response?.status === 401) {
          setError("Sesión expirada. Redirigiendo...");
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1500);
        } else {
          setError("Error al cargar los datos. Intenta recargar la página.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Recargar alumnos cuando cambia el curso seleccionado
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        // Si hay un curso seleccionado, cargar solo los alumnos de ese curso
        if (selectedCourseId) {
          const { data } = await axios.get(`${API_URL}/courses/${selectedCourseId}/students`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStudents(Array.isArray(data) ? data : []);
          // NO resetear `selectedStudents` para mantener la selección al cambiar filtros
        } else {
          // Si no hay curso seleccionado, cargar todos los alumnos globales
          const { data } = await axios.get(`${API_URL}/users/students/all-global`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStudents(Array.isArray(data) ? data : []);
          // Mantener selección previa
        }
      } catch (err) {
        console.error("Error cargando alumnos:", err);
        setError("Error al cargar los alumnos de la base de datos.");
      }
    };

    fetchStudents();
  }, [selectedCourseId]);

  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  /**
   * Calcula la diversidad de una clase basándose en los atributos de los estudiantes
   */
  const calculateDiversity = (classStudents) => {
    if (classStudents.length === 0) return 0;

    const uniqueNiveles = new Set(classStudents.map(s => s.nivel).filter(Boolean)).size;
    const uniqueComportamientos = new Set(classStudents.map(s => s.comportamiento).filter(Boolean)).size;
    const uniqueIntereses = new Set(classStudents.map(s => s.intereses).filter(Boolean)).size;
    const uniqueCursos = new Set(classStudents.map(s => s.curso).filter(Boolean)).size;
    const uniqueBirthYears = new Set(classStudents.map(s => s.birthYear).filter(Boolean)).size;

    return (
      uniqueNiveles * 3 +
      uniqueComportamientos * 2 +
      uniqueIntereses * 1.5 +
      uniqueCursos * 1 +
      uniqueBirthYears * 0.5
    );
  };

  /**
   * Alogritmo para encontrar la mejor clase para un estudiante dado
   */
  const findBestClass = (student, classes, maxStudents) => {
    let bestIndex = 0;
    let bestScore = -Infinity;

    classes.forEach((clase, index) => {
      if (clase.length >= maxStudents) return;

      const tempClass = [...clase, student];
      const diversityScore = calculateDiversity(tempClass);

      const sameNivel = clase.filter(s => s.nivel === student.nivel).length;
      const sameComportamiento = clase.filter(s => s.comportamiento === student.comportamiento).length;
      const sameIntereses = clase.filter(s => s.intereses === student.intereses).length;

      const penalty = (sameNivel * 2) + (sameComportamiento * 1.5) + (sameIntereses * 1);
      const finalScore = diversityScore - penalty;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestIndex = index;
      }
    });

    return bestIndex;
  };

  /**
   * Algoritmo de generación de clases 
   */
  const handleGenerate = () => {
    if (numClasses <= 0 || maxStudents <= 0) {
      alert("Introduce valores válidos.");
      return;
    }

    const chosen = selectedStudents.length ? selectedStudents : students;

    if (chosen.length === 0) {
      alert("No hay estudiantes disponibles.");
      return;
    }

    const totalSlots = numClasses * maxStudents;
    if (chosen.length > totalSlots) {
      alert(`Hay ${chosen.length} estudiantes pero solo ${totalSlots} plazas disponibles.`);
      return;
    }

    // Inicializar clases vacías
    const classes = Array.from({ length: numClasses }, () => []);

    // Agrupar estudiantes por nivel
    const studentsByNivel = {
      Alto: shuffle(chosen.filter(s => s.nivel === "Alto")),
      Medio: shuffle(chosen.filter(s => s.nivel === "Medio")),
      Bajo: shuffle(chosen.filter(s => s.nivel === "Bajo")),
      null: shuffle(chosen.filter(s => !s.nivel || s.nivel === null))
    };

    // Fase 1: Distribución por nivel (round-robin)
    Object.values(studentsByNivel).forEach(group => {
      let classIndex = 0;
      group.forEach(student => {
        if (classes[classIndex].length < maxStudents) {
          classes[classIndex].push(student);
        } else {
          const availableIndex = classes.findIndex(c => c.length < maxStudents);
          if (availableIndex !== -1) {
            classes[availableIndex].push(student);
          }
        }
        classIndex = (classIndex + 1) % numClasses;
      });
    });

    // Redistribución
    const allStudents = shuffle(chosen);
    const optimizedClasses = Array.from({ length: numClasses }, () => []);

    allStudents.forEach(student => {
      const bestClassIndex = findBestClass(student, optimizedClasses, maxStudents);
      optimizedClasses[bestClassIndex].push(student);
    });

    // Verificar diversidad mínima
    optimizedClasses.forEach((clase, index) => {
      if (clase.length > 0) {
        const uniqueNiveles = new Set(clase.map(s => s.nivel).filter(Boolean)).size;

        if (uniqueNiveles < 2 && clase.length >= 2) {
          for (let otherIndex = 0; otherIndex < optimizedClasses.length; otherIndex++) {
            if (otherIndex === index) continue;
            const otherClass = optimizedClasses[otherIndex];
            const swapCandidate = otherClass.find(s => s.nivel && s.nivel !== clase[0]?.nivel);
            
            if (swapCandidate && otherClass.length > 1) {
              const ourCandidate = clase.find(s => 
                s.nivel === swapCandidate.nivel || 
                (clase.filter(st => st.nivel === s.nivel).length > 1)
              );
              
              if (ourCandidate) {
                optimizedClasses[index] = clase.map(s => 
                  s.id === ourCandidate.id ? swapCandidate : s
                );
                optimizedClasses[otherIndex] = otherClass.map(s => 
                  s.id === swapCandidate.id ? ourCandidate : s
                );
                break;
              }
            }
          }
        }
      }
    });

    //  Generar las clases sin asignarles un curso
    const finalClasses = optimizedClasses.map((c, i) => ({
      id: i + 1,
      name: `Clase ${i + 1}`,
      description: `Clase generada automáticamente con ${c.length} alumnos`,
      students: c.slice(0, maxStudents),
      professorId: null,
      courseId: null,
    }));

    setGeneratedClasses(finalClasses);
    
    const diversityStats = finalClasses.map(c => {
      const stats = {
        niveles: new Set(c.students.map(s => s.nivel).filter(Boolean)).size,
        comportamientos: new Set(c.students.map(s => s.comportamiento).filter(Boolean)).size,
        intereses: new Set(c.students.map(s => s.intereses).filter(Boolean)).size,
        total: c.students.length
      };
      return `Clase ${c.id}: ${stats.total} alumnos, ${stats.niveles} niveles, ${stats.comportamientos} comportamientos, ${stats.intereses} intereses`;
    }).join('\n');
    
    alert(`Clases generadas con diversidad garantizada.\n\n${diversityStats}`);
  };

  const handleSaveClasses = async () => {
    if (generatedClasses.length === 0) {
      alert("No hay clases para guardar.");
      return;
    }


    // Validar que las clases tengan curso
    const classesWithoutCourse = generatedClasses.filter(c => !c.courseId);
    if (classesWithoutCourse.length > 0) {
      alert("Todas las clases deben tener un curso asignado.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const classesToSave = generatedClasses.map(c => ({
        name: c.name,
        description: c.description,
        professorId: c.professorId || null,
        courseId: c.courseId,
        studentIds: c.students.map(s => s.id),
      }));

      const { data } = await axios.post(
        `${API_URL}/classes/batch`,
        { classes: classesToSave },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`¡${data.length} clases guardadas correctamente en la base de datos!`);
      setGeneratedClasses([]);
      setSelectedStudents([]);
      
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("Error guardando clases:", err);
      if (err.response?.status === 401) {
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert(`Error al guardar las clases: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleProfessorChange = (classIndex, professorId) => {
    setGeneratedClasses(prev => 
      prev.map((c, i) => 
        i === classIndex 
          ? { ...c, professorId: professorId ? parseInt(professorId, 10) : null }
          : c
      )
    );
  };

  const handleClassNameChange = (classIndex, newName) => {
    setGeneratedClasses(prev => 
      prev.map((c, i) => 
        i === classIndex 
          ? { ...c, name: newName }
          : c
      )
    );
  };

  const toggleSelectStudent = (student) => {
    setSelectedStudents(prev =>
      prev.find(s => s.id === student.id)
        ? prev.filter(s => s.id !== student.id)
        : [...prev, student]
    );
  };

  const selectAllFiltered = () => {
    // Añadir los alumnos filtrados a la selección existente
    setSelectedStudents(prev => {
      const map = new Map();
      prev.forEach(s => { if (s && s.id != null) map.set(s.id, s); });
      filteredStudents.forEach(s => { if (s && s.id != null) map.set(s.id, s); });
      return Array.from(map.values());
    });
  };

  const deselectAllFiltered = () => {
    setSelectedStudents(prev => prev.filter(s => !filteredStudents.find(f => f.id === s.id)));
  };

  const filteredStudents = students.filter(s => {
    const text = filterText.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(text) ||
      (s.nivel || "").toLowerCase().includes(text) ||
      (s.comportamiento || "").toLowerCase().includes(text) ||
      (s.intereses || "").toLowerCase().includes(text) ||
      (s.curso || "").toLowerCase().includes(text) ||
      (s.birthYear?.toString() || "").includes(text)
    );
  });

  if (loading) {
    return (
      <div className="class-assignment-container">
        <p style={{ textAlign: "center", padding: "2rem" }}>Cargando datos...</p>
      </div>
    );
  }

  if (error && !students.length) {
    return (
      <div className="class-assignment-container">
        <p style={{ textAlign: "center", padding: "2rem", color: "#d32f2f" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="class-assignment-container">
      <h1>Generador Automático de Clases</h1>

      <div className="section">
        <h2>Parámetros de generación</h2>

        <div className="input-group">
          <label htmlFor="numClasses">Número de clases</label>
          <input
            id="numClasses"
            type="number"
            min="1"
            value={numClasses}
            onChange={(e) => setNumClasses(Number(e.target.value))}
            className="generation-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="maxStudents">Cantidad de alumnos por clase</label>
          <input
            id="maxStudents"
            type="number"
            min="1"
            value={maxStudents}
            onChange={(e) => setMaxStudents(Number(e.target.value))}
            className="generation-input"
          />
        </div>

        <button className="generate-btn" onClick={handleGenerate}>
          Generar clases 
        </button>
      </div>

      {/* Selección manual de alumnos */}
      <div className="section">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          Selección manual de alumnos
          <span style={{ background: "#1976d2", color: "#fff", padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.85rem" }}>
            {selectedStudents.length}
          </span>
        </h2>
        <div className="input-group" style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="courseFilterManual">Filtrar por curso</label>
          <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            {`${students.length} ${students.length === 1 ? "alumno disponible" : "alumnos disponibles"}`}
          </p>
          <select
            id="courseFilterManual"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="generation-input"
          >
            <option value="">Todos los cursos</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
          {selectedStudents.length > 0
            ? `${selectedStudents.length} ${selectedStudents.length === 1 ? "alumno seleccionado" : "alumnos seleccionados"}`
            : "Selecciona alumnos específicos o deja vacío para usar todos"}
        </p>

        <div className="filters">
          <input
            type="text"
            placeholder="Filtrar por nombre, nivel, comportamiento, intereses, curso o año"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <button className="filter-btn" onClick={selectAllFiltered}>
            Seleccionar todos
          </button>
          <button className="filter-btn cancel-btn" onClick={deselectAllFiltered}>
            Quitar selección
          </button>
        </div>

        {/* Grid de tarjetas */}
        <div className="students-grid">
          {filteredStudents.map(s => (
            <div
              key={s.id}
              className={`student-card ${selectedStudents.find(st => st.id === s.id) ? "selected" : ""}`}
              onClick={() => toggleSelectStudent(s)}
            >
              <p><strong>{s.name || "Sin nombre"}</strong></p>
              {s.nivel && <p>Nivel: {s.nivel}</p>}
              {s.comportamiento && <p>Comportamiento: {s.comportamiento}</p>}
              {s.intereses && <p>Intereses: {s.intereses}</p>}
              {s.birthYear && <p>Año: {s.birthYear}</p>}
              {s.curso && <p style={{ fontSize: "0.85rem", color: "#666" }}>Curso: {s.curso}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Clases generadas */}
      {generatedClasses.length > 0 && (
        <div className="section">
          <h2>Clases generadas</h2>

          <div style={{ marginBottom: "1rem", display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label htmlFor="assignCourseToGenerated" style={{ marginRight: '0.5rem' }}>Asignar curso a las clases generadas</label>
            <select
              id="assignCourseToGenerated"
              value={assignCourseId}
              onChange={(e) => setAssignCourseId(e.target.value)}
              className="generation-input"
              style={{ minWidth: '220px' }}
            >
              <option value="">Selecciona curso...</option>
              {courses.map(course => (
                <option key={`gen-assign-${course.id}`} value={course.id}>{course.title}</option>
              ))}
            </select>
            <button
              className="filter-btn"
              onClick={() => {
                if (!assignCourseId) {
                  alert('Selecciona un curso para asignar a todas las clases.');
                  return;
                }
                const parsed = parseInt(assignCourseId, 10);
                setGeneratedClasses(prev => prev.map(gc => ({ ...gc, courseId: parsed })));
                setSelectedCourseId(String(parsed));
                alert('Curso asignado a todas las clases generadas.');
              }}
            >
              Aplicar a todas
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <button
              className="generate-btn"
              onClick={handleSaveClasses}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar y generar clases"}
            </button>

          </div>

          {generatedClasses.map((c, classIndex) => {
            const stats = {
              niveles: new Set(c.students.map(s => s.nivel).filter(Boolean)),
              comportamientos: new Set(c.students.map(s => s.comportamiento).filter(Boolean)),
              intereses: new Set(c.students.map(s => s.intereses).filter(Boolean)),
              cursos: new Set(c.students.map(s => s.curso).filter(Boolean)),
            };
            
            return (
              <div key={c.id} style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <div className="input-group" style={{ marginBottom: "1rem" }}>
                  <label htmlFor={`className-${classIndex}`}>Nombre de la clase</label>
                  <input
                    id={`className-${classIndex}`}
                    type="text"
                    value={c.name}
                    onChange={(e) => handleClassNameChange(classIndex, e.target.value)}
                    className="generation-input"
                    placeholder="Ej: Curso 1ºESO A, Curso 3º ESO C, etc."
                  />
                </div>

                
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
                  {c.students.length} {c.students.length === 1 ? "alumno" : "alumnos"}
                </p>
                
                <div className="input-group" style={{ marginTop: "1rem" }}>
                  <label htmlFor={`professor-${classIndex}`}>Asignar tutor</label>
                  <select
                    id={`professor-${classIndex}`}
                    value={c.professorId || ""}
                    onChange={(e) => handleProfessorChange(classIndex, e.target.value)}
                    className="generation-input"
                  >
                    <option value="">Sin asignar</option>
                    {professors.map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name} ({prof.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem', marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  <strong>Diversidad:</strong> {stats.niveles.size} niveles, {stats.comportamientos.size} comportamientos, {stats.intereses.size} intereses, {stats.cursos.size} cursos académicos
                </div>
                <ul className="selected-list">
                  {c.students.map(s => (
                    <li key={s.id}>
                      <strong>{s.name || "Sin nombre"}</strong>
                      {s.nivel && ` — Nivel: ${s.nivel}`}
                      {s.comportamiento && ` — Comportamiento: ${s.comportamiento}`}
                      {s.intereses && ` — Intereses: ${s.intereses}`}
                      {s.curso && ` — Curso: ${s.curso}`}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
