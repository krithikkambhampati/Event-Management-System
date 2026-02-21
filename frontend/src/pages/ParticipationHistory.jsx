import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import '../styles/ParticipationHistory.css';

function ParticipationHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/participant/my-registrations`,
        { method: "GET", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch registrations");
      setRegistrations(data.registrations || []);
    } catch (err) {
      setError(err.message || "Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "PARTICIPANT") fetchRegistrations();
  }, [user]);

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to cancel this registration?")) return;

    setCancellingId(registrationId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/${registrationId}/cancel`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel registration");

      // Update local state
      setRegistrations(prev =>
        prev.map(r => r._id === registrationId ? { ...r, participationStatus: "Cancelled" } : r)
      );
      setSuccess("Registration cancelled successfully");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to cancel registration");
      setTimeout(() => setError(""), 5000);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFilteredRegistrations = () => {
    switch (activeTab) {
      case "normal":
        return registrations.filter(r => r.event?.eventType === "NORMAL");
      case "merchandise":
        return registrations.filter(r => r.event?.eventType === "MERCH");
      case "pending":
        return registrations.filter(r => r.participationStatus === "Pending");
      case "completed":
        return registrations.filter(r => r.participationStatus === "Completed");
      case "cancelled":
        return registrations.filter(r => r.participationStatus === "Cancelled");
      default:
        return registrations;
    }
  };

  const filteredRegs = getFilteredRegistrations();

  const stats = {
    total: registrations.length,
    normal: registrations.filter(r => r.event?.eventType === "NORMAL").length,
    merchandise: registrations.filter(r => r.event?.eventType === "MERCH").length,
    pending: registrations.filter(r => r.participationStatus === "Pending").length,
    completed: registrations.filter(r => r.participationStatus === "Completed").length,
    cancelled: registrations.filter(r => r.participationStatus === "Cancelled").length
  };

  if (loading) {
    return (
      <div className="participation-container">
        <p className="text-center">Loading participation history...</p>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="participation-container">
        <div className="participation-header">
          <h1>My Participation History</h1>
          <p>Track all your event registrations and attendance</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Registrations Yet</div>
          <p className="empty-state-text">You haven't registered for any events yet.</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/browse-events")}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="participation-container">
      <div className="participation-header">
        <h1>My Participation History</h1>
        <p>Track all your event registrations and attendance</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="participation-stats">
        <div className="stat-item">
          <div className="stat-item-number">{stats.total}</div>
          <div className="stat-item-label">Total</div>
        </div>
        <div className="stat-item">
          <div className="stat-item-number">{stats.normal}</div>
          <div className="stat-item-label">Normal Events</div>
        </div>
        <div className="stat-item">
          <div className="stat-item-number">{stats.merchandise}</div>
          <div className="stat-item-label">Merchandise</div>
        </div>
        <div className="stat-item">
          <div className="stat-item-number">{stats.completed}</div>
          <div className="stat-item-label">Completed</div>
        </div>
        <div className="stat-item">
          <div className="stat-item-number">{stats.cancelled}</div>
          <div className="stat-item-label">Cancelled</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All <span className="tab-badge">{stats.total}</span>
        </button>
        <button
          className={`tab ${activeTab === "normal" ? "active" : ""}`}
          onClick={() => setActiveTab("normal")}
        >
          Normal <span className="tab-badge">{stats.normal}</span>
        </button>
        <button
          className={`tab ${activeTab === "merchandise" ? "active" : ""}`}
          onClick={() => setActiveTab("merchandise")}
        >
          Merchandise <span className="tab-badge">{stats.merchandise}</span>
        </button>
        {stats.pending > 0 && (
          <button
            className={`tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
            style={activeTab === "pending" ? { borderColor: '#f0ad4e', color: '#856404' } : {}}
          >
            Pending <span className="tab-badge" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>{stats.pending}</span>
          </button>
        )}
        <button
          className={`tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed <span className="tab-badge">{stats.completed}</span>
        </button>
        <button
          className={`tab ${activeTab === "cancelled" ? "active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled <span className="tab-badge">{stats.cancelled}</span>
        </button>
      </div>

      {filteredRegs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No {activeTab !== "all" ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : "Registrations"}</div>
          <p className="empty-state-text">
            {activeTab === "all"
              ? "No registrations found. Browse events to get started!"
              : activeTab === "registered"
                ? "No upcoming registrations."
                : activeTab === "completed"
                  ? "You haven't completed any events yet."
                  : "You haven't cancelled any registrations."}
          </p>
          {activeTab === "all" && (
            <button
              className="btn-primary"
              onClick={() => navigate("/browse-events")}
              style={{ marginTop: 'var(--spacing-lg)' }}
            >
              Browse Events
            </button>
          )}
        </div>
      ) : (
        <div className="participation-list">
          {filteredRegs.map(registration => {
            if (!registration || !registration.event) return null;

            return (
              <div key={registration._id} className="participation-card">
                <div className="participation-card-header">
                  <div className="participation-card-title">
                    <h4>{registration.event.eventName}</h4>
                    <div className="participation-card-subtitle">
                      {registration.event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"} • {registration.event.organizer?.organizerName || "Unknown"}
                    </div>
                  </div>
                  <div className={`participation-card-status participation-status-${registration.participationStatus.toLowerCase()}`}
                    style={registration.participationStatus === 'Pending' ? { backgroundColor: 'rgba(255, 193, 7, 0.15)', color: '#856404' } : {}}
                  >
                    {registration.participationStatus === 'Pending' ? 'Pending Approval' : registration.participationStatus}
                  </div>
                </div>

                <div className="participation-card-body">
                  <div className="participation-detail">
                    <div className="participation-detail-label">Ticket ID</div>
                    <div className="participation-detail-value">
                      <span
                        onClick={() => setSelectedTicket(registration)}
                        style={{ cursor: 'pointer', color: 'var(--accent-vivid)', textDecoration: 'underline', fontFamily: 'monospace' }}
                      >
                        {registration.ticketId}
                      </span>
                    </div>
                  </div>
                  <div className="participation-detail">
                    <div className="participation-detail-label">Registered On</div>
                    <div className="participation-detail-value">{formatDate(registration.registeredAt)}</div>
                  </div>
                  <div className="participation-detail">
                    <div className="participation-detail-label">Event Date</div>
                    <div className="participation-detail-value">{formatDate(registration.event.startDate)}</div>
                  </div>
                  {registration.attendanceMarked && (
                    <div className="participation-detail">
                      <div className="participation-detail-label">Attended</div>
                      <div className="participation-detail-value">
                        {registration.attendedAt ? formatDate(registration.attendedAt) : "Marked"}
                      </div>
                    </div>
                  )}
                  {registration.paymentProof && (
                    <div className="participation-detail" style={{ gridColumn: '1 / -1' }}>
                      <div className="participation-detail-label">Payment Proof</div>
                      <div className="participation-detail-value">
                        <img src={registration.paymentProof} alt="Proof" style={{ maxWidth: '120px', borderRadius: '6px', border: '1px solid #ddd' }} />
                      </div>
                    </div>
                  )}
                  {registration.rejectionReason && (
                    <div className="participation-detail" style={{ gridColumn: '1 / -1' }}>
                      <div className="participation-detail-label" style={{ color: '#dc3545' }}>Rejection Reason</div>
                      <div className="participation-detail-value" style={{ color: '#dc3545' }}>{registration.rejectionReason}</div>
                    </div>
                  )}
                </div>

                <div className="participation-card-footer">
                  <button
                    className="participation-button primary"
                    onClick={() => navigate(`/events/${registration.event._id}`)}
                  >
                    View Event Details
                  </button>
                  {(registration.participationStatus === "Registered" || registration.participationStatus === "Pending") && (
                    <button
                      className="participation-button danger"
                      onClick={() => handleCancelRegistration(registration._id)}
                      disabled={cancellingId === registration._id}
                    >
                      {cancellingId === registration._id ? "Cancelling..." : registration.participationStatus === "Pending" ? "Cancel Order" : "Cancel Registration"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="interest-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="interest-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="interest-modal-header" style={{ textAlign: 'center' }}>
              <h2>🎟️ Ticket Details</h2>
            </div>
            <div className="interest-modal-content">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Ticket ID</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px', color: 'var(--text-primary)', marginBottom: '16px' }}>{selectedTicket.ticketId}</div>
                {selectedTicket.participationStatus === "Pending" ? (
                  <div style={{ padding: '16px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082', color: '#856404', fontSize: '14px' }}>
                    QR code will be generated after payment approval
                  </div>
                ) : (
                  <div style={{ display: 'inline-block', padding: '12px', background: 'white', borderRadius: '8px', border: '2px dashed var(--border)' }}>
                    <QRCodeSVG value={selectedTicket.ticketId} size={160} level="H" />
                  </div>
                )}
              </div>
              <div style={{ background: 'var(--surface-alt)', borderRadius: '8px', padding: '16px', display: 'grid', gap: '12px' }}>
                <div><span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '13px' }}>Event</span><br />{selectedTicket.event?.eventName}</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '13px' }}>Type</span><br />{selectedTicket.event?.eventType === 'NORMAL' ? 'Normal Event' : 'Merchandise'}</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '13px' }}>Status</span><br />{selectedTicket.participationStatus}</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '13px' }}>Registered On</span><br />{formatDate(selectedTicket.registeredAt)}</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '13px' }}>Event Date</span><br />{formatDate(selectedTicket.event?.startDate)}</div>
                {selectedTicket.registrationData?.selectedVariant && (
                  <div><span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '13px' }}>Variant</span><br />{selectedTicket.registrationData.selectedVariant}</div>
                )}
              </div>
            </div>
            <div className="interest-modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={() => setSelectedTicket(null)}>Close</button>
              <button className="modal-btn modal-btn-primary" onClick={() => navigate(`/events/${selectedTicket.event?._id}`)}>View Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipationHistory;
