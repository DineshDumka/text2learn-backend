import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">📘</span>
        <span className="brand-text">Text2Learn</span>
      </Link>

      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/courses/create" className="nav-link nav-link--cta">
              + Create
            </Link>
            <div className="nav-user">
              <span className="nav-user-name">{user?.name}</span>
              <button onClick={handleLogout} className="nav-btn nav-btn--logout">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="nav-link nav-link--cta">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
