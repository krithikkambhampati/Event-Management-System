import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    setUser(null);
    navigate("/login");
  };
  
  if (!user) return null; 
  console.log("USER:", user);

  return (
    <div style={{ padding: "10px", borderBottom: "1px solid black" }}>

      {user.role === "PARTICIPANT" && (
        <>
          <Link to="/dashboard" style={{ marginRight: "15px" }}>
            Dashboard
          </Link>

          <Link to="/events" style={{ marginRight: "15px" }}>
            Events
          </Link>
        </>
      )}

      {user.role === "ADMIN" && (
        <>
          <Link to="/admin" style={{ marginRight: "15px" }}>
            Admin Panel
          </Link>
        </>
      )}

      <span style={{ float: "right" }}>
        {user.fName || user.email}
        <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
          Logout
        </button>
      </span>
    </div>
  );
}

export default Navbar;
