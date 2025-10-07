import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUser } from "react-icons/fa";
import "../styles/Navbar.css";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      {/* Version PC: enlaces de texto */}
      <div className="nav-links-desktop">
        <Link
          to="/home"
          className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}
        >
          Home
        </Link>
        <Link
          to="/profile"
          className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}
        >
          Profile
        </Link>
      </div>

      {/* Version móvil: barra con iconos */}
      <div className="nav-links-mobile">
        <Link
          to="/home"
          className={`nav-icon ${location.pathname === "/home" ? "active" : ""}`}
        >
          <FaHome size={24} />
        </Link>
        <Link
          to="/profile"
          className={`nav-icon ${location.pathname === "/profile" ? "active" : ""}`}
        >
          <FaUser size={24} />
        </Link>
      </div>
    </nav>
  );
}
