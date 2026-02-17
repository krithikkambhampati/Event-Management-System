import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/Dashboard.css';

function OrganizersList() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [tempPasswords, setTempPasswords] = useState({});

  const fetchOrganizers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/admin/organizers", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch organizers");
      }

      setOrganizers(data.organizers || []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleToggleStatus = async (organizer) => {
    setActionLoadingId(organizer._id);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/organizers/${organizer._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !organizer.isActive })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update organizer status");
      }

      setOrganizers((prev) =>
        prev.map((item) =>
          item._id === organizer._id ? { ...item, isActive: !organizer.isActive } : item
        )
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to update organizer status");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDelete = async (organizerId) => {
    const confirmed = window.confirm("Delete this organizer permanently? This action cannot be undone.");
    if (!confirmed) return;

    setActionLoadingId(organizerId);
    setError("");

    try {
      const res = await fetch(`http://localhost:8000/api/admin/organizers/${organizerId}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete organizer");
      }

      setOrganizers((prev) => prev.filter((item) => item._id !== organizerId));
      setTempPasswords((prev) => {
        const copy = { ...prev };
        delete copy[organizerId];
        return copy;
      });
    } catch (requestError) {
      setError(requestError.message || "Failed to delete organizer");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleResetPassword = async (organizerId) => {
    setActionLoadingId(organizerId);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/organizers/${organizerId}/reset-password`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setTempPasswords((prev) => ({
        ...prev,
        [organizerId]: data.credentials?.password || ""
      }));
      
      alert(`Password reset successful! New password: ${data.credentials?.password}`);
    } catch (requestError) {
      setError(requestError.message || "Failed to reset password");
    } finally {
      setActionLoadingId("");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="text-center">Loading organizers...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Manage Organizers</h1>
        <p>View, edit, and manage all organizer accounts</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
        <Link to="/admin/create-organizer">
          <button className="btn-primary">Create New Organizer</button>
        </Link>
        <button onClick={fetchOrganizers} className="btn-secondary">
          Refresh List
        </button>
      </div>

      {organizers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No Organizers Yet</div>
          <p className="empty-state-text">Create your first organizer account to get started.</p>
          <Link to="/admin/create-organizer">
            <button className="empty-state-button">Create Organizer</button>
          </Link>
        </div>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {organizers.map((organizer) => (
            <div key={organizer._id} className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">{organizer.organizerName}</h3>
                <span className={`dashboard-card-badge ${organizer.isActive ? 'status-published' : 'status-draft'}`}>
                  {organizer.isActive ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="dashboard-card-body">
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">Category</span>
                  <span className="dashboard-card-value">{organizer.category}</span>
                </div>
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">Login Email</span>
                  <span className="dashboard-card-value" style={{ fontSize: 'var(--font-size-sm)' }}>
                    {organizer.email}
                  </span>
                </div>
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">Contact</span>
                  <span className="dashboard-card-value" style={{ fontSize: 'var(--font-size-sm)' }}>
                    {organizer.contactEmail}
                  </span>
                </div>
                {tempPasswords[organizer._id] && (
                  <div style={{ 
                    marginTop: 'var(--spacing-md)', 
                    padding: 'var(--spacing-md)', 
                    background: 'rgba(122, 155, 92, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--success)'
                  }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                      New Password
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <code style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}>
                        {tempPasswords[organizer._id]}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(tempPasswords[organizer._id])}
                        className="btn-secondary"
                        style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="dashboard-card-footer" style={{ flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button
                    onClick={() => handleResetPassword(organizer._id)}
                    disabled={actionLoadingId === organizer._id}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleToggleStatus(organizer)}
                    disabled={actionLoadingId === organizer._id}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    {organizer.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(organizer._id)}
                  disabled={actionLoadingId === organizer._id}
                  className="btn-danger"
                  style={{ width: '100%' }}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <Link to="/admin">
          <button className="btn-secondary">Back to Dashboard</button>
        </Link>
      </div>
    </div>
  );
}

export default OrganizersList;
