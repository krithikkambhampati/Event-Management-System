import { Link, Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div>
      <h2>Admin Panel</h2>

      <nav style={{ marginBottom: "20px" }}>
        <Link to="/admin" style={{ marginRight: "15px" }}>
          Dashboard
        </Link>

        <Link to="/admin/organizers" style={{ marginRight: "15px" }}>
          Organizers
        </Link>
      </nav>

      <Outlet />
    </div>
  );
}

export default AdminLayout;
