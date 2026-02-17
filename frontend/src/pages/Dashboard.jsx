import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();



  return (
    <div>
      <h2>Welcome {user.fName}</h2>
    </div>
  );
}


export default Dashboard;
