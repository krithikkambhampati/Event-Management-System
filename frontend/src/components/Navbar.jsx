import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import '../styles/Navbar.css';

function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    setUser(null);
    navigate("/login");
  };
  
  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          Event Manager
        </div>

        <ul className="navbar-nav">
          {user.role === "PARTICIPANT" && (
            <>
              <li><Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>Dashboard</Link></li>
              <li><Link to="/browse-events" className={isActive("/browse-events") ? "active" : ""}>Browse Events</Link></li>
              <li><Link to="/browse-organizers" className={isActive("/browse-organizers") ? "active" : ""}>Browse Organizers</Link></li>
              <li><Link to="/participation-history" className={isActive("/participation-history") ? "active" : ""}>My Registrations</Link></li>
            </>
          )}

          {user.role === "ADMIN" && (
            <>
              <li><Link to="/admin" className={isActive("/admin") ? "active" : ""}>Dashboard</Link></li>
              <li><Link to="/admin/create-organizer" className={isActive("/admin/create-organizer") ? "active" : ""}>Create Organizer</Link></li>
              <li><Link to="/admin/organizers" className={isActive("/admin/organizers") ? "active" : ""}>Manage Organizers</Link></li>
            </>
          )}

          {user.role === "ORGANIZER" && (
            <>
              <li><Link to="/organizer" className={isActive("/organizer") ? "active" : ""}>Dashboard</Link></li>
              <li><Link to="/organizer/create-event" className={isActive("/organizer/create-event") ? "active" : ""}>Create Event</Link></li>
            </>
          )}
        </ul>

        <div className="navbar-user">
          <span>{user.fName || user.email}</span>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
