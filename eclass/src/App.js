// App.js
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import CourseDetail from "./pages/CourseDetail";
import ClassDetails from "./pages/ClassDetails";
import StudentDetail from "./pages/StudentDetail";
import CreateClass from "./pages/Create";
import Register from "./pages/Register";

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
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/class/:classId" element={<CourseDetail />} />
        <Route path="/class-details/:classId" element={<ClassDetails />} />
        <Route path="/students/:studentId" element={<StudentDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-class" element={<CreateClass />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

export default App;
