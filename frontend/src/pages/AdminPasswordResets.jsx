import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../services/api";
import '../styles/Dashboard.css';

function AdminPasswordResets() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(null);
  const [displayPassword, setDisplayPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [adminComments, setAdminComments] = useState({});

  useEffect(() => {
    fetchRequests();
    fetchHistory();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const { ok, data } = await adminAPI.getPasswordResetRequests();

      if (!ok) {
        throw new Error(data.message || "Failed to fetch requests");
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Failed to fetch password reset requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { ok, data } = await adminAPI.getPasswordResetHistory();
      if (ok) {
        setHistory(data.history || []);
      }
    } catch {
      // silently fail for history
    }
  };

  const handleApprove = async (organizerId) => {
    setError("");
    setSuccess("");

    try {
      const { ok, data } = await adminAPI.approvePasswordReset(organizerId, {
        adminComment: adminComments[organizerId] || ""
      });

      if (!ok) {
        throw new Error(data.message || "Failed to approve");
      }

      setDisplayPassword(data.newPassword);
      setShowPassword(organizerId);
      setSuccess("Password reset approved!");
      setRequests(r => r.filter(x => x._id !== organizerId));
      setAdminComments(prev => { const c = { ...prev }; delete c[organizerId]; return c; });
      window.dispatchEvent(new Event("password-reset-updated"));
      window.scrollTo(0, 0);
      fetchHistory();
    } catch (err) {
      setError(err.message || "Failed to approve request");
    }
  };

  const handleReject = async (organizerId, organizerName) => {
    setError("");
    setSuccess("");

    try {
      const { ok, data } = await adminAPI.rejectPasswordReset(organizerId, {
        adminComment: adminComments[organizerId] || ""
      });

      if (!ok) {
        throw new Error(data.message || "Failed to reject");
      }

      setSuccess(`Request rejected for ${organizerName}`);
      setRequests(r => r.filter(x => x._id !== organizerId));
      setAdminComments(prev => { const c = { ...prev }; delete c[organizerId]; return c; });
      window.dispatchEvent(new Event("password-reset-updated"));
      window.scrollTo(0, 0);
      fetchHistory();
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === "pending" ? '3px solid var(--accent)' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === "pending" ? 600 : 400,
            color: activeTab === "pending" ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 'var(--font-size-base)'
          }}
        >
          Pending Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === "history" ? '3px solid var(--accent)' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === "history" ? 600 : 400,
            color: activeTab === "history" ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 'var(--font-size-base)'
          }}
        >
          History ({history.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <>
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
              marginTop: 'var(--spacing-md)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--accent)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Organizer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Requested</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Admin Comment</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>{req.organizerName}</td>
                    <td style={{ padding: '12px' }}>{req.email}</td>
                    <td style={{ padding: '12px', fontSize: '13px', maxWidth: '200px' }}>
                      {req.passwordResetReason || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No reason provided</span>}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(req.passwordResetRequestedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        placeholder="Optional comment..."
                        value={adminComments[req._id] || ""}
                        onChange={(e) => setAdminComments(prev => ({ ...prev, [req._id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
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
        </>
      )}

      {activeTab === "history" && (
        <>
          {history.length === 0 ? (
            <div className="empty-state">
              <p>No password reset history yet</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'var(--surface)',
              marginTop: 'var(--spacing-md)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--accent)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Organizer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Admin Comment</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Requested</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>{item.organizerName}</td>
                    <td style={{ padding: '12px', fontSize: '13px', maxWidth: '200px' }}>
                      {item.reason || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: item.status === 'APPROVED' ? 'rgba(155, 170, 124, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                        color: item.status === 'APPROVED' ? 'var(--success)' : '#dc3545'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {item.adminComment || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(item.requestedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPasswordResets;
