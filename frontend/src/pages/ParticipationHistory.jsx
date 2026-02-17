import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../styles/ParticipationHistory.css';

function ParticipationHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/participant/my-registrations`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch registrations");
      }

      setRegistrations(data.registrations || []);
    } catch (err) {
      setError(err.message || "Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "PARTICIPANT") {
      fetchRegistrations();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFilteredRegistrations = () => {
    switch (activeTab) {
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
    registered: registrations.filter(r => r.participationStatus === "Registered").length,
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

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="participation-stats">
        <div className="stat-item">
          <div className="stat-item-number">{stats.total}</div>
          <div className="stat-item-label">Total Registrations</div>
        </div>
        <div className="stat-item">
          <div className="stat-item-number">{stats.registered}</div>
          <div className="stat-item-label">Registered</div>
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
            if (!registration || !registration.event) {
              return null;
            }
            
            return (
              <div key={registration._id} className="participation-card">
                <div className="participation-card-header">
                  <div className="participation-card-title">
                    <h4>{registration.event.eventName}</h4>
                  <div className="participation-card-subtitle">
                      {registration.event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"} • {registration.event.organizer?.organizerName || "Unknown"}
                    </div>
                </div>
                <div className={`participation-card-status participation-status-${registration.participationStatus.toLowerCase()}`}>
                  {registration.participationStatus}
                </div>
              </div>

              <div className="participation-card-body">
                <div className="participation-detail">
                  <div className="participation-detail-label">Ticket ID</div>
                  <div className="participation-detail-value">{registration.ticketId}</div>
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
              </div>

              <div className="participation-card-footer">
                <button 
                  className="participation-button primary"
                  onClick={() => navigate(`/events/${registration.event._id}`)}
                >
                  View Event Details
                </button>
                {registration.participationStatus === "Registered" && (
                  <button 
                    className="participation-button danger"
                    onClick={() => alert(`Cancel functionality coming soon. Contact organizer: ${registration.event.organizer?.contactEmail}`)}
                  >
                    Cancel Registration
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ParticipationHistory;
