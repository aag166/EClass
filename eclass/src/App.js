// App.js
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ClassDetail from "./pages/ClassDetail";
import CreateClass from "./pages/Create";

import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  // Detecta si estás en /login
  const hideNavbar = location.pathname === "/login";

  return (
    <>
      {/* Solo muestra el Navbar si NO estás en /login */}
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Redirige al login por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/class/:classId" element={<ClassDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-class" element={<CreateClass />} />
      </Routes>
    </>
  );
}

export default App;
