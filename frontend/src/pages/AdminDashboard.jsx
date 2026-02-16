import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Use the organizer management flow to create new club accounts.</p>

      <Link to="/admin/create-organizer">
        <button>Create Organizer</button>
      </Link>
    </div>
  );
}

export default AdminDashboard;
