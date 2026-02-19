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
  
  const [registrationStatus, setRegistrationStatus] = useState(null); // null, "registered", "not-registered"
  const [registrationData, setRegistrationData] = useState(null); // stores ticket info if registered
  const [isRegistering, setIsRegistering] = useState(false);
  const [customFieldResponses, setCustomFieldResponses] = useState({});

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

    if (event.customFields && event.customFields.length > 0) {
      for (const field of event.customFields) {
        if (field.required && !customFieldResponses[field.fieldLabel]) {
          setError(`${field.fieldLabel} is required`);
          return;
        }
      }
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
          body: JSON.stringify({ registrationData: customFieldResponses })
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

  const isDeadlinePassed = () => {
    if (!event?.registrationDeadline) return false;
    return new Date() > new Date(event.registrationDeadline);
  };

  const isCapacityReached = () => {
    if (!event?.registrationLimit) return false;
    return event.registeredCount >= event.registrationLimit;
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

  if (loading) return <div className="event-details-container"><div className="event-loading">Loading event details...</div></div>;
  if (!event) return <div className="event-details-container"><div className="event-not-found">Event not found</div></div>;

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
        {isEditing && (canEditAll || canEditPartial) ? (
          // EDIT MODE
          <div className="event-edit-form">
            <h3>Edit Event {canEditPartial && "(Limited Edit Mode - Published Event)"}</h3>
            
            {canEditAll && (
              <>
                <div className="form-group">
                  <label>Event Name</label>
                  <input  
                    type="text"
                    name="eventName"
                    value={editFormData.eventName}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Event Type</label>
                  <select name="eventType" value={editFormData.eventType} onChange={handleEditChange}>
                    <option value="NORMAL">Normal Event</option>
                    <option value="MERCH">Merchandise Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Eligibility</label>
                  <select name="eligibility" value={editFormData.eligibility} onChange={handleEditChange}>
                    <option value="IIIT">IIIT Only</option>
                    <option value="NON_IIIT">Non-IIIT Only</option>
                    <option value="BOTH">Both IIIT and Non-IIIT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={new Date(editFormData.startDate).toISOString().slice(0, 16)}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={new Date(editFormData.endDate).toISOString().slice(0, 16)}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Registration Fee (₹)</label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={editFormData.registrationFee}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., workshop, beginner, online"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-group">
              <label>Registration Deadline</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={new Date(editFormData.registrationDeadline).toISOString().slice(0, 16)}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-group">
              <label>Registration Limit</label>
              <input
                type="number"
                name="registrationLimit"
                value={editFormData.registrationLimit}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-actions">
              <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          // VIEW MODE
          <>
            <div className="event-hero-section">
              <h1 className="event-details-title">{event.eventName}</h1>
              <div className="event-status-bar">
                <span className="event-status">{event.status}</span>
                <span className="event-type-badge">{event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"}</span>
              </div>
            </div>

            {/* Description Section */}
            <div className="event-section">
              <h2 className="event-section-title">About</h2>
              <div className="event-section-content">
                <p className="event-description">{event.description}</p>
              </div>
            </div>

            {/* Key Information */}
            <div className="event-section">
              <h2 className="event-section-title">Event Details</h2>
              <div className="event-key-info">
                <div className="info-item">
                  <div className="info-label">Organizer</div>
                  <div className="info-value">{event.organizer?.organizerName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Eligibility</div>
                  <div className="info-value">{event.eligibility}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Registration Deadline</div>
                  <div className="info-value">{formatDate(event.registrationDeadline)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Start Date</div>
                  <div className="info-value">{formatDate(event.startDate)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">End Date</div>
                  <div className="info-value">{formatDate(event.endDate)}</div>
                </div>
                {event.registrationLimit && (
                  <div className="info-item">
                    <div className="info-label">Capacity</div>
                    <div className="info-value highlight">{event.registrationLimit}</div>
                  </div>
                )}
                {event.registrationFee > 0 && (
                  <div className="info-item">
                    <div className="info-label">Registration Fee</div>
                    <div className="info-value highlight">₹{event.registrationFee}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="event-section">
                <h2 className="event-section-title">Tags</h2>
                <div className="event-tags">
                  {event.tags.map((tag, idx) => (
                    <span key={idx} className="event-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer Controls */}
            {isOrganizer && (
              <div className="event-section">
                <h2 className="event-section-title">Organizer Controls</h2>
                <div className="event-actions">
                  {canEdit && (
                    <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit Event</button>
                  )}
                  {event.status === "DRAFT" && (
                    <button className="btn-secondary" onClick={() => navigate(`/organizer`)}>Publish Event</button>
                  )}
                </div>
              </div>
            )}

            {/* Registration Section for Participants */}
            {user?.role === "PARTICIPANT" && event.status === "PUBLISHED" && (
              <div className="event-section">
                <h2 className="event-section-title">Registration</h2>
                
                {registrationStatus === "registered" && registrationData && (
                  <div className="registration-status">
                    <p className="registration-status-text">You are registered for this event!</p>
                    <div className="ticket-id"><strong>Ticket ID:</strong> {registrationData.ticketId}</div>
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <button className="btn-secondary" onClick={() => navigate("/participation-history")}>
                        View My Registrations
                      </button>
                    </div>
                  </div>
                )}

                {(registrationStatus === "not-registered" || registrationStatus === null) && (
                  <>
                    {isDeadlinePassed() && (
                      <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                        Registration Closed - The deadline for this event has passed.
                      </div>
                    )}
                    
                    {isCapacityReached() && (
                      <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                        Event Full - This event has reached its maximum capacity.
                      </div>
                    )}

                    {!isDeadlinePassed() && !isCapacityReached() && (
                      <p style={{ marginBottom: 'var(--spacing-md)' }}>Join this event by registering below.</p>
                    )}

                    {/* Custom Registration Form Fields */}
                    {event.customFields && event.customFields.length > 0 && (
                      <div className="custom-form-section" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Registration Details</h3>
                        {event.customFields.map((field, idx) => (
                          <div key={idx} className="form-field-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                              {field.fieldLabel}
                              {field.required && <span style={{ color: '#dc3545' }}> *</span>}
                            </label>

                            {field.fieldType === 'TEXT' && (
                              <input
                                type="text"
                                placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                                value={customFieldResponses[field.fieldLabel] || ''}
                                onChange={(e) => setCustomFieldResponses(prev => ({
                                  ...prev,
                                  [field.fieldLabel]: e.target.value
                                }))}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                              />
                            )}

                            {field.fieldType === 'EMAIL' && (
                              <input
                                type="email"
                                placeholder="Enter email"
                                value={customFieldResponses[field.fieldLabel] || ''}
                                onChange={(e) => setCustomFieldResponses(prev => ({
                                  ...prev,
                                  [field.fieldLabel]: e.target.value
                                }))}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                              />
                            )}

                            {field.fieldType === 'NUMBER' && (
                              <input
                                type="number"
                                placeholder="Enter number"
                                value={customFieldResponses[field.fieldLabel] || ''}
                                onChange={(e) => setCustomFieldResponses(prev => ({
                                  ...prev,
                                  [field.fieldLabel]: e.target.value
                                }))}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                              />
                            )}

                            {field.fieldType === 'DROPDOWN' && (
                              <select
                                value={customFieldResponses[field.fieldLabel] || ''}
                                onChange={(e) => setCustomFieldResponses(prev => ({
                                  ...prev,
                                  [field.fieldLabel]: e.target.value
                                }))}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}
                              >
                                <option value="">Select an option</option>
                                {field.options && field.options.map((opt, oidx) => (
                                  <option key={oidx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {field.fieldType === 'CHECKBOX' && (
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {field.options && field.options.map((opt, oidx) => (
                                  <label key={oidx} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      value={opt}
                                      checked={(customFieldResponses[field.fieldLabel] || []).includes(opt)}
                                      onChange={(e) => {
                                        const currentValues = customFieldResponses[field.fieldLabel] || [];
                                        const updatedValues = e.target.checked
                                          ? [...currentValues, opt]
                                          : currentValues.filter(v => v !== opt);
                                        setCustomFieldResponses(prev => ({
                                          ...prev,
                                          [field.fieldLabel]: updatedValues
                                        }));
                                      }}
                                      style={{ marginRight: '6px', cursor: 'pointer' }}
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}

                            {field.fieldType === 'FILE' && (
                              <input
                                type="file"
                                onChange={(e) => setCustomFieldResponses(prev => ({
                                  ...prev,
                                  [field.fieldLabel]: e.target.files?.[0]?.name || ''
                                }))}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      className="btn-primary"
                      onClick={handleRegisterForEvent}
                      disabled={isRegistering || isDeadlinePassed() || isCapacityReached()}
                    >
                      {isDeadlinePassed() ? "Registration Closed" : isCapacityReached() ? "Event Full" : isRegistering ? "Registering..." : "Register Now"}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventDetails;
