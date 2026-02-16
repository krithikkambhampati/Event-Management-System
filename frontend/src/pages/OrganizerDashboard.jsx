import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    if (!window.confirm(`Publish event "${eventName}"? It will be visible to participants.`)) {
      return;
    }

    setActionLoading(eventId);
    setError("");

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
    } catch (err) {
      setError(err.message || "Failed to publish event");
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!window.confirm(`Delete event "${eventName}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(eventId);
    setError("");

    try {
      // For now, we'll just remove from UI (no delete endpoint yet)
      // Later: implement DELETE endpoint
      setEvents(prevEvents =>
        prevEvents.filter(event => event._id !== eventId)
      );
    } catch (err) {
      setError(err.message || "Failed to delete event");
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
    <div>
      <h2>Welcome, {user?.organizerName || "Organizer"}!</h2>

      {error && (
        <div>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div>
        <div>
          <strong>Total Events:</strong> {stats.total}
        </div>
        <div>
          <strong>Draft:</strong> {stats.draft}
        </div>
        <div>
          <strong>Published:</strong> {stats.published}
        </div>
        <div>
          <strong>Ongoing:</strong> {stats.ongoing}
        </div>
      </div>

      <div>
        <Link to="/organizer/create-event">
          <button>+ Create New Event</button>
        </Link>
        <button onClick={fetchEvents}>Refresh</button>
      </div>

      <h3>Your Events</h3>

      {loading && <p>Loading events...</p>}

      {!loading && events.length === 0 && (
        <p>
          No events yet. <Link to="/organizer/create-event">Create your first event!</Link>
        </p>
      )}

      {!loading && events.length > 0 && (
        <div>
          {events.map(event => (
            <div key={event._id}>
              <div>
                <div>
                  <h4>{event.eventName}</h4>
                  <p>
                    Type: <strong>{event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"}</strong>
                  </p>
                </div>
                <div>
                  [{event.status}]
                </div>
              </div>

              <div>
                <p>
                  <strong>Description:</strong> {event.description.substring(0, 100)}...
                </p>
                <p>
                  <strong>Start:</strong> {formatDate(event.startDate)}
                </p>
                <p>
                  <strong>End:</strong> {formatDate(event.endDate)}
                </p>
                <p>
                  <strong>Registration Deadline:</strong> {formatDate(event.registrationDeadline)}
                </p>
                {event.registrationLimit && (
                  <p>
                    <strong>Capacity:</strong> {event.registrationLimit} participants
                  </p>
                )}
                {event.registrationFee > 0 && (
                  <p>
                    <strong>Fee:</strong> ₹{event.registrationFee}
                  </p>
                )}
              </div>

              <div>
                <button
                  onClick={() => navigate(`/organizer/events/${event._id}`)}
                  disabled={actionLoading === event._id}
                >
                  View Details
                </button>

                {event.status === "DRAFT" && (
                  <>
                    <button
                      onClick={() => handlePublishEvent(event._id, event.eventName)}
                      disabled={actionLoading === event._id}
                    >
                      {actionLoading === event._id ? "Publishing..." : "Publish"}
                    </button>
                    <button
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
