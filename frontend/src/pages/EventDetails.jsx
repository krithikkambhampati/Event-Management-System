import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import '../styles/EventDetails.css';

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // Registration states
  const [registrationStatus, setRegistrationStatus] = useState(null); // null, "registered", "not-registered"
  const [registrationData, setRegistrationData] = useState(null); // stores ticket info if registered
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/events/${eventId}`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch event");
      }

      setEvent(data.event);
      setEditFormData({
        eventName: data.event.eventName,
        description: data.event.description,
        eventType: data.event.eventType,
        eligibility: data.event.eligibility,
        registrationDeadline: data.event.registrationDeadline,
        startDate: data.event.startDate,
        endDate: data.event.endDate,
        registrationLimit: data.event.registrationLimit || "",
        registrationFee: data.event.registrationFee || 0,
        tags: data.event.tags ? data.event.tags.join(", ") : ""
      });
    } catch (err) {
      setError(err.message || "Failed to fetch event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === "registrationLimit" || name === "registrationFee" 
        ? (value === "" ? "" : Number(value))
        : value
    }));
  };

  const handleSaveEdit = async () => {
    setError("");
    setSuccess("");

    try {
      const dataToSend = {
        ...editFormData,
        tags: editFormData.tags
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag !== "")
      };

      const res = await fetch(
        `http://localhost:8000/api/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(dataToSend)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update event");
      }

      setEvent(data.event);
      setIsEditing(false);
      setSuccess("Event updated successfully!");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to update event");
      setTimeout(() => setError(""), 5000);
    }
  };

  const checkRegistrationStatus = async () => {
    if (user?.role !== "PARTICIPANT") return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/participant/my-registrations`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (res.ok) {
        const alreadyRegistered = data.registrations.find(r => r.event._id === eventId);
        if (alreadyRegistered) {
          setRegistrationStatus("registered");
          setRegistrationData(alreadyRegistered);
        } else {
          setRegistrationStatus("not-registered");
        }
      }
    } catch (err) {
      console.error("Error checking registration status:", err);
    }
  };

  // Handle registration
  const handleRegisterForEvent = async () => {
    if (!user || user.role !== "PARTICIPANT") {
      setError("Only participants can register for events");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setIsRegistering(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/${eventId}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({})
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      setRegistrationStatus("registered");
      setRegistrationData(data.registration);
      setSuccess(`Successfully registered! Your Ticket ID: ${data.ticketId}`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to register for event");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOrganizer = user?.role === "ORGANIZER" && user?._id === event?.organizer?._id;
  const canEditAll = isOrganizer && event?.status === "DRAFT";
  const canEditPartial = isOrganizer && event?.status === "PUBLISHED";
  const canEdit = canEditAll || canEditPartial;

  useEffect(() => {
    if (eventId && user?.role === "PARTICIPANT") {
      checkRegistrationStatus();
    }
  }, [eventId, user]);

  if (loading) return <div className="event-details-container"><p>Loading event details...</p></div>;
  if (!event) return <div className="event-details-container"><p>Event not found</p></div>;

  return (
    <div className="event-details-container">
      <div className="event-details-header">
        <button className="event-details-back-btn" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="alert-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <div className="event-details-content">
        <h1 className="event-details-title">{event.eventName}</h1>

        {isEditing && (canEditAll || canEditPartial) ? (
          <div className="event-edit-form">
            <h3>Edit Event {canEditPartial && "(Limited Edit Mode - Published Event)"}</h3>
            
            {canEditAll && (
              <>
                <div className="form-group">
                  <label>
                    Event Name:
                    <input
                      type="text"
                      name="eventName"
                      value={editFormData.eventName}
                      onChange={handleEditChange}
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Event Type:
                    <select
                      name="eventType"
                      value={editFormData.eventType}
                      onChange={handleEditChange}
                    >
                      <option value="NORMAL">Normal Event</option>
                      <option value="MERCH">Merchandise Event</option>
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Eligibility:
                    <select
                      name="eligibility"
                      value={editFormData.eligibility}
                      onChange={handleEditChange}
                    >
                      <option value="IIIT">IIIT Only</option>
                      <option value="NON_IIIT">Non-IIIT Only</option>
                      <option value="BOTH">Both IIIT and Non-IIIT</option>
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Start Date:
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={new Date(editFormData.startDate).toISOString().slice(0, 16)}
                      onChange={handleEditChange}
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    End Date:
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={new Date(editFormData.endDate).toISOString().slice(0, 16)}
                      onChange={handleEditChange}
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Registration Fee (₹):
                    <input
                      type="number"
                      name="registrationFee"
                      value={editFormData.registrationFee}
                      onChange={handleEditChange}
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Tags (comma-separated):
                    <input
                      type="text"
                      name="tags"
                      value={editFormData.tags}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., workshop, beginner, online"
                    />
                  </label>
                </div>
              </>
            )}

            <div className="form-group">
              <label>
                Description:
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Registration Deadline:
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={new Date(editFormData.registrationDeadline).toISOString().slice(0, 16)}
                  onChange={handleEditChange}
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Registration Limit:
                <input
                  type="number"
                  name="registrationLimit"
                  value={editFormData.registrationLimit}
                  onChange={handleEditChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="event-details-meta">
              <div className="event-meta-item">
                <strong>Status</strong>
                <p><span className="event-status">{event.status}</span></p>
              </div>
              <div className="event-meta-item">
                <strong>Type</strong>
                <p><span className="event-type-badge">{event.eventType === "NORMAL" ? "Normal Event" : "Merchandise Event"}</span></p>
              </div>
              <div className="event-meta-item">
                <strong>Eligibility</strong>
                <p>{event.eligibility}</p>
              </div>
            </div>

            <div className="event-description">
              <strong>Description</strong>
              <p>{event.description}</p>
            </div>

            <div className="event-details-meta">
              <div className="event-meta-item">
                <strong>Registration Deadline</strong>
                <p>{formatDate(event.registrationDeadline)}</p>
              </div>
              <div className="event-meta-item">
                <strong>Start Date</strong>
                <p>{formatDate(event.startDate)}</p>
              </div>
              <div className="event-meta-item">
                <strong>End Date</strong>
                <p>{formatDate(event.endDate)}</p>
              </div>
              {event.registrationLimit && (
                <div className="event-meta-item">
                  <strong>Capacity</strong>
                  <p>{event.registrationLimit} participants</p>
                </div>
              )}
              {event.registrationFee > 0 && (
                <div className="event-meta-item">
                  <strong>Registration Fee</strong>
                  <p>₹{event.registrationFee}</p>
                </div>
              )}
            </div>

            {event.tags && event.tags.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <strong style={{ display: 'block', marginBottom: 'var(--spacing-md)', color: 'var(--primary)' }}>Tags</strong>
                <div className="event-tags">
                  {event.tags.map((tag, idx) => (
                    <span key={idx} className="event-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {isOrganizer && (
              <div className="organizer-controls">
                <h3>Organizer Controls</h3>
                <div className="organizer-controls-buttons">
                  {canEdit && (
                    <button className="organizer-controls-btn" onClick={() => setIsEditing(true)}>Edit Event</button>
                  )}
                  {event.status === "DRAFT" && (
                    <button className="organizer-controls-btn" onClick={() => navigate(`/organizer`)}>Publish from Dashboard</button>
                  )}
                </div>
              </div>
            )}

            {user?.role === "PARTICIPANT" && event.status === "PUBLISHED" && (
              <div className="registration-section">
                <h3>Registration</h3>

                {registrationStatus === "registered" && registrationData && (
                  <div className="registration-status registration-registered">
                    <p>✓ You are registered for this event!</p>
                    <div className="registration-ticket-info">
                      <p><strong>Ticket ID:</strong> {registrationData.ticketId}</p>
                      <p><strong>Registered on:</strong> {formatDate(registrationData.registeredAt)}</p>
                      <p><strong>Status:</strong> {registrationData.participationStatus}</p>
                    </div>
                    <button className="btn-view-all" onClick={() => navigate("/participation-history")}>
                      View All My Registrations
                    </button>
                  </div>
                )}

                {registrationStatus === "not-registered" && (
                  <div>
                    <p className="registration-not-registered">You are not yet registered for this event.</p>
                    <button
                      className="btn-register"
                      onClick={handleRegisterForEvent}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Registering..." : "Register for Event"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {isOrganizer && (
              <div className="organizer-info">
                <h3>Organizer Info</h3>
                <p><strong>Organizer:</strong> {event.organizer?.organizerName}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventDetails;
