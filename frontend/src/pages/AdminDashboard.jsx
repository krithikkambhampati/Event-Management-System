import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/Dashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrganizers: 0,
    activeOrganizers: 0,
    pendingPasswordResets: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener("password-reset-updated", handleRefresh);
    return () => window.removeEventListener("password-reset-updated", handleRefresh);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/organizers", {
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        const pendingCount = data.organizers?.filter(o => o.passwordResetStatus === "PENDING")?.length || 0;
        setStats({
          totalOrganizers: data.organizers?.length || 0,
          activeOrganizers: data.organizers?.filter(o => !o.disabled)?.length || 0,
          pendingPasswordResets: pendingCount
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage organizers and oversee the event management system</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-box-number">{stats.totalOrganizers}</div>
          <div className="stat-box-label">Total Organizers</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{stats.activeOrganizers}</div>
          <div className="stat-box-label">Active Organizers</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{stats.pendingPasswordResets}</div>
          <div className="stat-box-label">Password Reset Requests</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Create Organizer</h3>
          </div>
          <div className="dashboard-card-body">
            <p>Add a new club or organizer account to the system. Auto-generate login credentials and share with the club.</p>
          </div>
          <div className="dashboard-card-footer">
            <Link to="/admin/create-organizer" style={{ flex: 1 }}>
              <button className="btn-primary" style={{ width: '100%' }}>Create New Organizer</button>
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Manage Organizers</h3>
          </div>
          <div className="dashboard-card-body">
            <p>View all organizers, edit details, disable/enable accounts, or permanently delete organizer profiles.</p>
          </div>
          <div className="dashboard-card-footer">
            <Link to="/admin/organizers" style={{ flex: 1 }}>
              <button className="btn-primary" style={{ width: '100%' }}>View All Organizers</button>
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Password Reset Requests</h3>
          </div>
          <div className="dashboard-card-body">
            <p>Review password reset requests from organizers, approve and generate new passwords, or reject requests.</p>
          </div>
          <div className="dashboard-card-footer">
            <Link to="/admin/password-resets" style={{ flex: 1 }}>
              <button className="btn-primary" style={{ width: '100%' }}>View Requests ({stats.pendingPasswordResets})</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
