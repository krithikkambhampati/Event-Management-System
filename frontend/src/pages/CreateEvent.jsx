import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError(""); 
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

      // Combine date and time
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
        tags: tagsArray
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
    <div>
      <h2>Create New Event</h2>

      {error && (
        <div style={{ color: "red", marginBottom: "15px", padding: "10px", border: "1px solid red" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleCreateEvent}>
        <div style={{ marginBottom: "15px" }}>
          <label>Event Name *</label>
          <br />
          <input
            type="text"
            name="eventName"
            placeholder="e.g., Tech Workshop"
            value={formData.eventName}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Description *</label>
          <br />
          <textarea
            name="description"
            placeholder="Describe your event..."
            value={formData.description}
            onChange={handleChange}
            rows="4"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Event Type *</label>
          <br />
          <select
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
            style={{ padding: "8px", width: "100%" }}
          >
            <option value="NORMAL">Normal Event</option>
            <option value="MERCH">Merchandise</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Eligibility *</label>
          <br />
          <select
            name="eligibility"
            value={formData.eligibility}
            onChange={handleChange}
            style={{ padding: "8px", width: "100%" }}
          >
            <option value="BOTH">Both IIIT & Non-IIIT</option>
            <option value="IIIT">IIIT Only</option>
            <option value="NON_IIIT">Non-IIIT Only</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Registration Deadline *</label>
          <br />
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <input
                type="date"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                style={{ padding: "8px", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="time"
                name="registrationDeadlineTime"
                value={formData.registrationDeadlineTime}
                onChange={handleChange}
                style={{ padding: "8px", width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Start Date & Time *</label>
          <br />
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                style={{ padding: "8px", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                style={{ padding: "8px", width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>End Date & Time *</label>
          <br />
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                style={{ padding: "8px", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                style={{ padding: "8px", width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Registration Limit (leave empty for unlimited)</label>
          <br />
          <input
            type="number"
            name="registrationLimit"
            placeholder="e.g., 100"
            value={formData.registrationLimit}
            onChange={handleChange}
            style={{ padding: "8px", width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Registration Fee (₹)</label>
          <br />
          <input
            type="number"
            name="registrationFee"
            placeholder="e.g., 0"
            value={formData.registrationFee}
            onChange={handleChange}
            style={{ padding: "8px", width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Tags (comma-separated)</label>
          <br />
          <input
            type="text"
            name="tags"
            placeholder="e.g., coding, nodejs, react"
            value={formData.tags}
            onChange={handleChange}
            style={{ padding: "8px", width: "100%" }}
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Creating..." : "Create as Draft"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/organizer")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#808080",
              color: "white",
              border: "none",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      {showSuccessPopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "30px",
            borderRadius: "8px",
            textAlign: "center",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}
        >
          <h3>{successMessage}</h3>
          <p>Redirecting to dashboard...</p>
        </div>
      )}

      {showSuccessPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}

export default CreateEvent;
