import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { AVAILABLE_INTERESTS } from "../constants/interests";
import "../styles/Profile.css";

function OrganizerProfile() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    organizerName: "",
    category: "",
    description: "",
    contactEmail: "",
    contactNumber: "",
    discordWebhook: ""
  });

  const [passwordResetStatus, setPasswordResetStatus] = useState(null);

  // Fetch organizer data on mount
  useEffect(() => {
    if (user && user._id) {
      fetchOrganizerData();
    }
  }, [user?._id]);

  const fetchOrganizerData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8000/api/organizers/${user._id}`, {
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to fetch organizer data");
      }

      const data = await res.json();

      if (data.success && data.organizer) {
        setPasswordResetStatus(data.organizer.passwordResetStatus);
        setFormData({
          organizerName: data.organizer.organizerName || "",
          category: data.organizer.category || "",
          description: data.organizer.description || "",
          contactEmail: data.organizer.contactEmail || "",
          contactNumber: data.organizer.contactNumber || ""
        });
      }
    } catch (err) {
      console.error("Error fetching organizer data:", err);
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/organizers/${user._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.organizer) {
        await refreshUser();
        setFormData({
          organizerName: data.organizer.organizerName || "",
          category: data.organizer.category || "",
          description: data.organizer.description || "",
          contactEmail: data.organizer.contactEmail || "",
          contactNumber: data.organizer.contactNumber || "",
          discordWebhook: data.organizer.discordWebhook || ""
        });
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Error updating profile: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/organizers/${user._id}/request-password-reset`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (res.ok) {
        setPasswordResetStatus("PENDING");
        setSuccess("Request sent to admin for review");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.message || "Failed to send request");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  if (!user || user.role !== "ORGANIZER") {
    return <div>Only organizers can access this page.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Club Profile</h1>

        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Organizer Name</label>
              <input
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {AVAILABLE_INTERESTS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Discord Webhook URL</label>
              <input
                type="url"
                name="discordWebhook"
                value={formData.discordWebhook}
                onChange={handleChange}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <small style={{ color: "var(--text-light)", fontSize: "12px" }}>
                When set, new events will be auto-posted to your Discord channel when published.
              </small>
            </div>

            <div className="button-group">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-row">
              <span className="label">Club Name:</span>
              <span>{user.organizerName}</span>
            </div>
            <div className="profile-row">
              <span className="label">Category:</span>
              <span>{user.category}</span>
            </div>
            <div className="profile-row">
              <span className="label">Login Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="profile-row">
              <span className="label">Contact Email:</span>
              <span>{user.contactEmail}</span>
            </div>
            <div className="profile-row">
              <span className="label">Contact Number:</span>
              <span>{user.contactNumber}</span>
            </div>
            <div className="profile-row">
              <span className="label">Description:</span>
              <span>{user.description}</span>
            </div>
            <div className="profile-row">
              <span className="label">Discord Webhook:</span>
              <span>
                {formData.discordWebhook
                  ? <span style={{ color: "#5865F2", fontWeight: 600 }}>✓ Connected</span>
                  : <span style={{ color: "var(--text-light)" }}>Not configured</span>
                }
              </span>
            </div>

            <button onClick={() => setIsEditing(true)} className="edit-button">
              Edit Profile
            </button>

            <button
              onClick={handleRequestPasswordReset}
              disabled={passwordResetStatus === "PENDING"}
              className="btn-primary"
              style={{
                marginTop: "10px",
                opacity: passwordResetStatus === "PENDING" ? 0.5 : 1,
                cursor: passwordResetStatus === "PENDING" ? "not-allowed" : "pointer"
              }}
            >
              {passwordResetStatus === "PENDING" ? "Request Pending..." : "Request Password Reset"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizerProfile;
