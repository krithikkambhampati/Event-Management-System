import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import '../styles/CreateEvent.css';

function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    eventType: "NORMAL",
    eligibility: "BOTH",
    registrationDeadline: "",
    registrationDeadlineTime: "09:00",
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "11:00",
    registrationLimit: "",
    registrationFee: 0,
    tags: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [customFields, setCustomFields] = useState([]);
  const [newField, setNewField] = useState({
    fieldLabel: "",
    fieldType: "TEXT",
    required: false,
    options: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError(""); 
  };

  const addCustomField = () => {
    if (!newField.fieldLabel.trim()) {
      setError("Field label is required");
      return;
    }
    const field = {
      fieldLabel: newField.fieldLabel,
      fieldType: newField.fieldType,
      required: newField.required,
      options: newField.fieldType === "DROPDOWN" || newField.fieldType === "CHECKBOX"
        ? newField.options.split(",").map(opt => opt.trim()).filter(opt => opt)
        : []
    };
    setCustomFields([...customFields, field]);
    setNewField({ fieldLabel: "", fieldType: "TEXT", required: false, options: "" });
    setError("");
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.eventName.trim()) {
      setError("Event name is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.registrationDeadline) {
      setError("Registration deadline is required");
      return false;
    }
    if (!formData.startDate) {
      setError("Start date is required");
      return false;
    }
    if (!formData.endDate) {
      setError("End date is required");
      return false;
    }

    const deadline = new Date(formData.registrationDeadline);
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
      setError("Start date must be before end date");
      return false;
    }
    if (deadline >= start) {
      setError("Registration deadline must be before start date");
      return false;
    }

    if (formData.registrationLimit && formData.registrationLimit <= 0) {
      setError("Registration limit must be greater than 0");
      return false;
    }

    return true;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tagsArray = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const registrationDeadline = formData.registrationDeadline 
        ? `${formData.registrationDeadline}T${formData.registrationDeadlineTime}`
        : "";
      const startDate = formData.startDate 
        ? `${formData.startDate}T${formData.startTime}`
        : "";
      const endDate = formData.endDate 
        ? `${formData.endDate}T${formData.endTime}`
        : "";

      const eventData = {
        eventName: formData.eventName.trim(),
        description: formData.description.trim(),
        eventType: formData.eventType,
        eligibility: formData.eligibility,
        registrationDeadline: registrationDeadline,
        startDate: startDate,
        endDate: endDate,
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : null,
        registrationFee: formData.registrationFee ? parseInt(formData.registrationFee) : 0,
        tags: tagsArray,
        customFields: customFields
      };

      const res = await fetch(
        `http://localhost:8000/api/events/organizer/${user._id}/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(eventData)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create event");
      }

      setSuccessMessage(`Event "${data.event.eventName}" created successfully as DRAFT!`);
      setShowSuccessPopup(true);

      setFormData({
        eventName: "",
        description: "",
        eventType: "NORMAL",
        eligibility: "BOTH",
        registrationDeadline: "",
        registrationDeadlineTime: "09:00",
        startDate: "",
        startTime: "10:00",
        endDate: "",
        endTime: "11:00",
        registrationLimit: "",
        registrationFee: 0,
        tags: ""
      });

      setTimeout(() => {
        navigate("/organizer");
      }, 2000);

    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container">
      <div className="create-header">
        <h1>Create New Event</h1>
        <p>Fill in the details to create a new event as a draft</p>
      </div>

      {error && (
        <div className="form-alert form-alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateEvent} className="create-form">
        <div className="form-section">
          <div className="form-section-title">Basic Information</div>
          
          <div className="form-group form-row full">
            <label>
              Event Name *
              <input
                type="text"
                name="eventName"
                placeholder="e.g., Tech Workshop"
                value={formData.eventName}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-group form-row full">
            <label>
              Description *
              <textarea
                name="description"
                placeholder="Describe your event in detail..."
                value={formData.description}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Event Type *
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                >
                  <option value="NORMAL">Normal Event</option>
                  <option value="MERCH">Merchandise Event</option>
                </select>
              </label>
            </div>

            <div className="form-group">
              <label>
                Eligibility *
                <select
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                >
                  <option value="BOTH">Both IIIT & Non-IIIT</option>
                  <option value="IIIT">IIIT Only</option>
                  <option value="NON_IIIT">Non-IIIT Only</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Event Schedule</div>

          <div className="form-group form-row full">
            <label>
              Registration Deadline *
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ flex: 1 }}
                />
                <input
                  type="time"
                  name="registrationDeadlineTime"
                  value={formData.registrationDeadlineTime}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
              </div>
            </label>
          </div>

          <div className="form-group form-row full">
            <label>
              Start Date & Time *
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ flex: 1 }}
                />
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
              </div>
            </label>
          </div>

          <div className="form-group form-row full">
            <label>
              End Date & Time *
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ flex: 1 }}
                />
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Registration Details</div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Registration Limit
                <input
                  type="number"
                  name="registrationLimit"
                  placeholder="Leave empty for unlimited"
                  value={formData.registrationLimit}
                  onChange={handleChange}
                />
              </label>
              <p className="form-help-text">Maximum number of participants allowed</p>
            </div>

            <div className="form-group">
              <label>
                Registration Fee (₹)
                <input
                  type="number"
                  name="registrationFee"
                  placeholder="0 for free"
                  value={formData.registrationFee}
                  onChange={handleChange}
                />
              </label>
              <p className="form-help-text">Leave blank or enter 0 for free event</p>
            </div>
          </div>

          <div className="form-group form-row full">
            <label>
              Tags (comma-separated)
              <input
                type="text"
                name="tags"
                placeholder="e.g., coding, nodejs, react"
                value={formData.tags}
                onChange={handleChange}
              />
            </label>
            <p className="form-help-text">Help participants discover your event</p>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Registration Form Fields</div>
          <p className="form-help-text">Add custom fields for participant information</p>

          <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Field Label
                  <input
                    type="text"
                    placeholder="e.g., Phone Number, Dietary Preference"
                    value={newField.fieldLabel}
                    onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value })}
                  />
                </label>
              </div>
              <div className="form-group">
                <label>Field Type
                  <select value={newField.fieldType} onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}>
                    <option value="TEXT">Text</option>
                    <option value="EMAIL">Email</option>
                    <option value="NUMBER">Number</option>
                    <option value="DROPDOWN">Dropdown</option>
                    <option value="CHECKBOX">Checkbox</option>
                  </select>
                </label>
              </div>
            </div>

            {(newField.fieldType === "DROPDOWN" || newField.fieldType === "CHECKBOX") && (
              <div className="form-group form-row full">
                <label>Options (comma-separated)
                  <input
                    type="text"
                    placeholder="e.g., Option 1, Option 2, Option 3"
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                  />
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', margin: 0 }}>
                <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} />
                <span>Required Field</span>
              </label>
              <button type="button" onClick={addCustomField} style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                Add Field
              </button>
            </div>
          </div>

          {customFields.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Added Fields ({customFields.length})</h4>
              {customFields.map((field, idx) => (
                <div key={idx} style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)', background: 'var(--background)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{field.fieldLabel}</strong> ({field.fieldType}){field.required && <span style={{ color: 'red' }}>*</span>}
                  </div>
                  <button type="button" onClick={() => removeCustomField(idx)} style={{ padding: 'var(--spacing-xs) var(--spacing-md)', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/organizer")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create as Draft"}
          </button>
        </div>
      </form>

      {showSuccessPopup && (
        <>
          <div className="success-popup-overlay" />
          <div className="success-popup">
            <div className="success-popup-icon">✓</div>
            <h2>Event Created Successfully!</h2>
            <p>{successMessage}</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Redirecting to dashboard in a moment...
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default CreateEvent;
