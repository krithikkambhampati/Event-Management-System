import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import DiscussionForum from "../components/DiscussionForum";
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

  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [customFieldResponses, setCustomFieldResponses] = useState({});
  const [selectedVariant, setSelectedVariant] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Edit-mode state for custom fields and merchandise variants
  const [editCustomFields, setEditCustomFields] = useState([]);
  const [editNewField, setEditNewField] = useState({ fieldLabel: "", fieldType: "TEXT", required: false, options: "" });
  const [editMerchVariants, setEditMerchVariants] = useState([]);
  const [editNewVariant, setEditNewVariant] = useState({ name: "", stock: "" });

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
        tags: data.event.tags ? data.event.tags.join(", ") : "",
        purchaseLimitPerUser: data.event.purchaseLimitPerUser || 1
      });
      setEditCustomFields(data.event.customFields || []);
      setEditMerchVariants(data.event.merchandiseVariants || []);
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
          .filter(tag => tag !== ""),
        customFields: editFormData.eventType === "NORMAL" ? editCustomFields : [],
        merchandiseVariants: editFormData.eventType === "MERCH" ? editMerchVariants : [],
        purchaseLimitPerUser: editFormData.eventType === "MERCH" ? parseInt(editFormData.purchaseLimitPerUser) || 1 : 1
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
        const existing = data.registrations.find(r => r.event._id === eventId && r.participationStatus !== "Cancelled");
        if (existing) {
          if (existing.participationStatus === "Pending") {
            setRegistrationStatus("pending");
          } else {
            setRegistrationStatus("registered");
          }
          setRegistrationData(existing);
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

    // Validate MERCH variant selection + payment proof
    if (event.eventType === "MERCH") {
      if (!selectedVariant) {
        setError("Please select a merchandise variant");
        return;
      }
      const variant = event.merchandiseVariants.find(v => v.name === selectedVariant);
      if (!variant || variant.stock <= 0) {
        setError("Selected variant is out of stock");
        return;
      }
      if (!paymentProofUrl) {
        setError("Please upload payment proof before purchasing");
        return;
      }
    }

    // Validate NORMAL custom fields
    if (event.eventType === "NORMAL" && event.customFields && event.customFields.length > 0) {
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
      const regPayload = event.eventType === "MERCH"
        ? { registrationData: { selectedVariant, paymentProof: paymentProofUrl } }
        : { registrationData: customFieldResponses };

      const res = await fetch(
        `http://localhost:8000/api/registrations/${eventId}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(regPayload)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      if (data.isPending) {
        setRegistrationStatus("pending");
        setRegistrationData(data.registration);
        setSuccess("Order placed! Awaiting organizer approval.");
      } else {
        setRegistrationStatus("registered");
        setRegistrationData(data.registration);
        setSuccess(`Successfully registered! Your Ticket ID: ${data.ticketId}`);
      }
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

            {canEditAll && editFormData.eventType === "MERCH" && (
              <div className="form-group">
                <label>Merchandise Variants</label>
                {editMerchVariants.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <span style={{ flex: 1 }}><strong>{v.name}</strong> — Stock: {v.stock}</span>
                    <button type="button" onClick={() => setEditMerchVariants(prev => prev.filter((_, i) => i !== idx))} style={{ background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input type="text" placeholder="Variant name" value={editNewVariant.name} onChange={e => setEditNewVariant(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }} />
                  <input type="number" placeholder="Stock" min="1" value={editNewVariant.stock} onChange={e => setEditNewVariant(p => ({ ...p, stock: e.target.value }))} style={{ width: '80px' }} />
                  <button type="button" onClick={() => { if (!editNewVariant.name.trim() || !editNewVariant.stock) return; setEditMerchVariants(prev => [...prev, { name: editNewVariant.name.trim(), stock: parseInt(editNewVariant.stock) }]); setEditNewVariant({ name: "", stock: "" }); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Add</button>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label>Purchase Limit Per User</label>
                  <input type="number" name="purchaseLimitPerUser" min="1" value={editFormData.purchaseLimitPerUser} onChange={handleEditChange} />
                </div>
              </div>
            )}

            {canEditAll && editFormData.eventType === "NORMAL" && (
              <div className="form-group">
                <label>Custom Registration Fields</label>
                {event.registeredCount > 0 ? (
                  <div style={{ padding: 'var(--spacing-lg)', background: 'rgba(212, 181, 212, 0.1)', border: '2px dashed var(--accent-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: 700 }}>Locked</span>
                    <p style={{ fontWeight: 600, marginTop: '8px', color: 'var(--text-primary)' }}>Form Fields Locked</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', margin: 0 }}>
                      Custom fields cannot be modified because {event.registeredCount} participant(s) have already registered.
                    </p>
                  </div>
                ) : (
                  <>
                    {editCustomFields.map((field, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                        <span style={{ flex: 1 }}><strong>{field.fieldLabel}</strong> ({field.fieldType}){field.required && <span style={{ color: 'red' }}> *</span>}</span>
                        <button type="button" onClick={() => setEditCustomFields(prev => prev.filter((_, i) => i !== idx))} style={{ background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <input type="text" placeholder="Field label" value={editNewField.fieldLabel} onChange={e => setEditNewField(p => ({ ...p, fieldLabel: e.target.value }))} style={{ flex: 1 }} />
                      <select value={editNewField.fieldType} onChange={e => setEditNewField(p => ({ ...p, fieldType: e.target.value }))}>
                        <option value="TEXT">Text</option>
                        <option value="EMAIL">Email</option>
                        <option value="NUMBER">Number</option>
                        <option value="DROPDOWN">Dropdown</option>
                        <option value="CHECKBOX">Checkbox</option>
                        <option value="FILE_UPLOAD">File Upload</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={editNewField.required} onChange={e => setEditNewField(p => ({ ...p, required: e.target.checked }))} />
                        Required
                      </label>
                      <button type="button" onClick={() => { if (!editNewField.fieldLabel.trim()) return; setEditCustomFields(prev => [...prev, { fieldLabel: editNewField.fieldLabel.trim(), fieldType: editNewField.fieldType, required: editNewField.required, options: (editNewField.fieldType === 'DROPDOWN' || editNewField.fieldType === 'CHECKBOX') ? editNewField.options.split(',').map(o => o.trim()).filter(Boolean) : [] }]); setEditNewField({ fieldLabel: "", fieldType: "TEXT", required: false, options: "" }); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Add</button>
                    </div>
                    {(editNewField.fieldType === 'DROPDOWN' || editNewField.fieldType === 'CHECKBOX') && (
                      <input type="text" placeholder="Options (comma-separated)" value={editNewField.options} onChange={e => setEditNewField(p => ({ ...p, options: e.target.value }))} style={{ marginTop: '8px', width: '100%' }} />
                    )}
                  </>
                )}
              </div>
            )}

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
                {(event.registrationFee > 0 || event.eventType === "MERCH") && (
                  <div className="info-item">
                    <div className="info-label">{event.eventType === "MERCH" ? "Price" : "Registration Fee"}</div>
                    <div className="info-value highlight">{event.registrationFee > 0 ? `Rs. ${event.registrationFee}` : "Free"}</div>
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

                {/* Pending approval status (MERCH) */}
                {registrationStatus === "pending" && registrationData && (
                  <div className="registration-status" style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.12) 0%, rgba(255, 193, 7, 0.04) 100%)',
                    border: '2px solid #f0ad4e',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-lg)',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: '#856404', marginTop: '8px' }}>
                      Order Pending Approval
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: '#856404', opacity: 0.8 }}>
                      Your payment proof has been submitted. The organizer will review and approve your order.
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: '8px' }}>
                      No QR code or ticket will be generated until your payment is approved.
                    </p>
                    {registrationData.paymentProof && (
                      <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Your payment proof:</p>
                        <img src={registrationData.paymentProof} alt="Payment proof" style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>
                    )}
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <button className="btn-secondary" onClick={() => navigate("/participation-history")}>
                        View My Orders
                      </button>
                    </div>
                  </div>
                )}

                {/* Registered / Approved status */}
                {registrationStatus === "registered" && registrationData && (
                  <div className="registration-status" style={{
                    background: 'linear-gradient(135deg, rgba(122, 155, 92, 0.12) 0%, rgba(122, 155, 92, 0.04) 100%)',
                    border: '2px solid var(--success)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-lg)'
                  }}>
                    <p className="registration-status-text" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success)' }}>
                      {registrationData.paymentStatus === 'Approved' ? '✅ Payment Approved — You are registered!' : 'You are registered for this event!'}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-dark)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginBottom: '4px' }}>Your Ticket ID</div>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px' }}>
                          {registrationData.ticketId}
                        </div>
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(registrationData.ticketId);
                          setSuccess("Ticket ID copied!");
                          setTimeout(() => setSuccess(""), 2000);
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
                      <div style={{ padding: '12px', background: 'white', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-dark)', textAlign: 'center' }}>
                        <QRCodeSVG value={registrationData.ticketId} size={160} level="H" />
                        <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '8px', marginBottom: 0 }}>Scan for verification</p>
                      </div>
                    </div>
                    {registrationData.registeredAt && (
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: 'var(--spacing-sm)' }}>
                        Registered on: {new Date(registrationData.registeredAt).toLocaleDateString()}
                      </p>
                    )}
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <button className="btn-secondary" onClick={() => navigate("/participation-history")}>
                        View My Registrations
                      </button>
                    </div>
                  </div>
                )}

                {(registrationStatus === "not-registered" || registrationStatus === null) && registrationStatus !== "pending" && (
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
                      <p style={{ marginBottom: 'var(--spacing-md)' }}>
                        {event.eventType === "MERCH" ? "Select your preferred variant and purchase below." : "Join this event by registering below."}
                      </p>
                    )}

                    {/* Merchandise Variant Selection */}
                    {event.eventType === "MERCH" && event.merchandiseVariants && event.merchandiseVariants.length > 0 && (
                      <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Select Variant</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                          {event.merchandiseVariants.map((variant, idx) => (
                            <label key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: 'var(--spacing-md)',
                              border: selectedVariant === variant.name ? '2px solid var(--accent)' : '1px solid #dee2e6',
                              borderRadius: '8px',
                              cursor: variant.stock > 0 ? 'pointer' : 'not-allowed',
                              opacity: variant.stock > 0 ? 1 : 0.5,
                              backgroundColor: selectedVariant === variant.name ? 'rgba(197, 168, 212, 0.1)' : 'white',
                              transition: 'all 0.2s'
                            }}>
                              <input
                                type="radio"
                                name="variant"
                                value={variant.name}
                                checked={selectedVariant === variant.name}
                                onChange={() => setSelectedVariant(variant.name)}
                                disabled={variant.stock <= 0}
                                style={{ marginRight: '12px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <strong>{variant.name}</strong>
                              </div>
                              <span style={{
                                fontSize: '13px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: variant.stock > 0 ? 'rgba(155, 170, 124, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                                color: variant.stock > 0 ? 'var(--success)' : '#dc3545'
                              }}>
                                {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                              </span>
                            </label>
                          ))}
                        </div>
                        {event.purchaseLimitPerUser && (
                          <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '13px', color: '#666' }}>
                            Limit: {event.purchaseLimitPerUser} per person
                          </p>
                        )}
                      </div>
                    )}
                    {/* Payment Proof Upload — only for MERCH events */}
                    {event.eventType === "MERCH" && selectedVariant && (
                      <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '15px' }}>Upload Payment Proof</h3>
                        <p style={{ fontSize: '13px', color: '#856404', marginBottom: 'var(--spacing-md)' }}>
                          Upload a screenshot of your payment (UPI, bank transfer, etc.). Your order will be reviewed by the organizer.
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setError("File too large. Maximum 5MB allowed.");
                              return;
                            }
                            setUploadingProof(true);
                            setError("");
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              const uploadRes = await fetch("http://localhost:8000/api/upload", {
                                method: "POST",
                                credentials: "include",
                                body: formData
                              });
                              const uploadData = await uploadRes.json();
                              if (uploadRes.ok) {
                                setPaymentProofUrl(uploadData.file.url);
                              } else {
                                setError(uploadData.message || "Upload failed");
                              }
                            } catch {
                              setError("Payment proof upload failed");
                            } finally {
                              setUploadingProof(false);
                            }
                          }}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                        />
                        {uploadingProof && <p style={{ fontSize: '12px', color: '#856404', marginTop: '4px' }}>Uploading...</p>}
                        {paymentProofUrl && (
                          <div style={{ marginTop: '8px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--success)', marginBottom: '4px' }}>Payment proof uploaded</p>
                            <img src={paymentProofUrl} alt="Payment proof" style={{ maxWidth: '150px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Registration Form Fields — only for NORMAL events */}
                    {event.eventType === "NORMAL" && event.customFields && event.customFields.length > 0 && (
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

                            {(field.fieldType === 'FILE' || field.fieldType === 'FILE_UPLOAD') && (
                              <div>
                                <input
                                  type="file"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                      setError("File too large. Maximum 5MB allowed.");
                                      return;
                                    }
                                    setCustomFieldResponses(prev => ({
                                      ...prev,
                                      [field.fieldLabel]: "Uploading..."
                                    }));
                                    try {
                                      const formData = new FormData();
                                      formData.append("file", file);
                                      const uploadRes = await fetch("http://localhost:8000/api/upload", {
                                        method: "POST",
                                        credentials: "include",
                                        body: formData
                                      });
                                      const uploadData = await uploadRes.json();
                                      if (uploadRes.ok) {
                                        setCustomFieldResponses(prev => ({
                                          ...prev,
                                          [field.fieldLabel]: uploadData.file.url
                                        }));
                                      } else {
                                        setError(uploadData.message || "Upload failed");
                                        setCustomFieldResponses(prev => ({
                                          ...prev,
                                          [field.fieldLabel]: ""
                                        }));
                                      }
                                    } catch  {
                                      setError("File upload failed");
                                      setCustomFieldResponses(prev => ({
                                        ...prev,
                                        [field.fieldLabel]: ""
                                      }));
                                    }
                                  }}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                                />
                                {customFieldResponses[field.fieldLabel] && customFieldResponses[field.fieldLabel] !== "Uploading..." && (
                                  <p style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>File uploaded</p>
                                )}
                                {customFieldResponses[field.fieldLabel] === "Uploading..." && (
                                  <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Uploading...</p>
                                )}
                              </div>
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
                      {isDeadlinePassed() ? "Registration Closed" : isCapacityReached() ? "Event Full" : isRegistering ? "Processing..." : event.eventType === "MERCH" ? "Purchase Now" : "Register Now"}
                    </button>
                  </>
                )}
              </div>
            )}

            {(isOrganizer || registrationStatus === "registered") && event.status === "PUBLISHED" && (
              <div className="event-section">
                <DiscussionForum eventId={eventId} isOrganizer={isOrganizer} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventDetails;
