import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import '../styles/Dashboard.css';

function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/events/organizer/${user._id}`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch events");
      }

      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchEvents();
    }
  }, [user?._id]);

  const handlePublishEvent = async (eventId, eventName) => {
    setActionLoading(eventId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/events/${eventId}/publish`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to publish event");
      }

      setEvents(prevEvents =>
        prevEvents.map(event =>
          event._id === eventId ? { ...event, status: "PUBLISHED" } : event
        )
      );
      setSuccess(`Event "${eventName}" published successfully!`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to publish event");
      setTimeout(() => setError(""), 5000);
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    setActionLoading(eventId);
    setError("");
    setSuccess("");

    try {
      setEvents(prevEvents =>
        prevEvents.filter(event => event._id !== eventId)
      );
      setSuccess(`Event "${eventName}" deleted successfully!`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to delete event");
      setTimeout(() => setError(""), 5000);
    } finally {
      setActionLoading("");
    }
  };

  const stats = {
    total: events.length,
    published: events.filter(e => e.status === "PUBLISHED").length,
    draft: events.filter(e => e.status === "DRAFT").length,
    ongoing: events.filter(e => e.status === "ONGOING").length
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.organizerName || "Organizer"}!</h1>
        <p>Manage your events and track their performance</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-box-number">{stats.total}</div>
          <div className="stat-box-label">Total Events</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{stats.draft}</div>
          <div className="stat-box-label">Draft</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{stats.published}</div>
          <div className="stat-box-label">Published</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{stats.ongoing}</div>
          <div className="stat-box-label">Ongoing</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Link to="/organizer/create-event" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">+ Create New Event</button>
        </Link>
        <button className="btn-secondary" onClick={fetchEvents}>Refresh</button>
      </div>

      <div className="dashboard-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Your Events</h3>
      </div>

      {loading && (
        <div className="empty-state">
          <p>Loading events...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">No Events Yet</div>
          <p className="empty-state-text">
            Get started by creating your first event!
          </p>
          <Link to="/organizer/create-event" style={{ textDecoration: 'none' }}>
            <button className="empty-state-button">Create Event</button>
          </Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="dashboard-grid">
          {events.map(event => (
            <div key={event._id} className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">{event.eventName}</div>
                <span className={`dashboard-card-badge status-${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>

              <div className="dashboard-card-body">
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">Type</span>
                  <span className="dashboard-card-value">
                    {event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"}
                  </span>
                </div>
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">Start Date</span>
                  <span className="dashboard-card-value">{formatDate(event.startDate)}</span>
                </div>
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">End Date</span>
                  <span className="dashboard-card-value">{formatDate(event.endDate)}</span>
                </div>
                <div className="dashboard-card-item">
                  <span className="dashboard-card-label">Registration Deadline</span>
                  <span className="dashboard-card-value">{formatDate(event.registrationDeadline)}</span>
                </div>
                {event.registrationLimit && (
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Capacity</span>
                    <span className="dashboard-card-value">{event.registrationLimit} participants</span>
                  </div>
                )}
                {event.registrationFee > 0 && (
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Fee</span>
                    <span className="dashboard-card-value">₹{event.registrationFee}</span>
                  </div>
                )}
              </div>

              <div className="dashboard-card-footer">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/organizer/events/${event._id}`)}
                  disabled={actionLoading === event._id}
                >
                  View Details
                </button>

                {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/organizer/events/${event._id}/registrations`)}
                    disabled={actionLoading === event._id}
                  >
                    View Registrations
                  </button>
                )}

                {event.status === "DRAFT" && (
                  <>
                    <button
                      className="btn-success"
                      onClick={() => handlePublishEvent(event._id, event.eventName)}
                      disabled={actionLoading === event._id}
                    >
                      {actionLoading === event._id ? "Publishing..." : "Publish"}
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteEvent(event._id, event.eventName)}
                      disabled={actionLoading === event._id}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;
