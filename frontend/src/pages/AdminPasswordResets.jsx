import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Dashboard.css';

function AdminPasswordResets() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(null);
  const [displayPassword, setDisplayPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/admin/password-resets", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch requests");
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Failed to fetch password reset requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (organizerId) => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/password-resets/${organizerId}/approve`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to approve");
      }

      setDisplayPassword(data.newPassword);
      setShowPassword(organizerId);
      setSuccess("Password reset approved!");
      setRequests(r => r.filter(x => x._id !== organizerId));
      window.dispatchEvent(new Event("password-reset-updated"));
    } catch (err) {
      setError(err.message || "Failed to approve request");
    }
  };

  const handleReject = async (organizerId, organizerName) => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/password-resets/${organizerId}/reject`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reject");
      }

      setSuccess(`Request rejected for ${organizerName}`);
      setRequests(r => r.filter(x => x._id !== organizerId));
      window.dispatchEvent(new Event("password-reset-updated"));
    } catch (err) {
      setError(err.message || "Failed to reject request");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button
          className="event-details-back-btn"
          onClick={() => navigate("/admin")}
          style={{ marginRight: 'auto' }}
        >
          ← Back to Dashboard
        </button>
        <h1>Password Reset Requests</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showPassword && (
        <div style={{
          background: 'var(--surface)',
          border: '2px solid var(--accent)',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Generated Password</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <code style={{
              background: 'var(--bg)',
              padding: '10px 15px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px',
              flex: 1,
              letterSpacing: '1px'
            }}>
              {showPasswordText ? displayPassword : '•'.repeat(displayPassword.length)}
            </code>
            <button
              onClick={() => setShowPasswordText(!showPasswordText)}
              className="btn-secondary"
            >
              {showPasswordText ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(displayPassword);
                setSuccess("Password copied!");
                setTimeout(() => setSuccess(""), 2000);
              }}
              className="btn-primary"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <p>No pending password reset requests</p>
        </div>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'var(--surface)',
          marginTop: '2rem',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--accent)' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Organizer</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Requested</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>{req.organizerName}</td>
                <td style={{ padding: '12px' }}>{req.email}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(req.passwordResetRequestedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleApprove(req._id)}
                    className="btn-success"
                    style={{ marginRight: '5px' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req._id, req.organizerName)}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPasswordResets;
