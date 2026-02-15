import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, setUser } = useAuth();

  const navigate=useNavigate();
  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    setUser(null);
    navigate("/login");

  };

  return (
    <div>
      <h2>Welcome {user.fName}</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}


export default Dashboard;
