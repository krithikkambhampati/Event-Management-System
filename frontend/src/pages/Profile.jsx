import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { AVAILABLE_INTERESTS } from "../constants/interests";
import "../styles/Profile.css";

function Profile() {
  const { user, setUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);

  const [formData, setFormData] = useState({
    fName: user?.fName || "",
    lName: user?.lName || "",
    collegeName: user?.collegeName || "",
    contactNumber: user?.contactNumber || "",
    interests: user?.interests || []
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fName: user.fName || "",
        lName: user.lName || "",
        collegeName: user.collegeName || "",
        contactNumber: user.contactNumber || "",
        interests: user.interests || []
      });
      fetchFollowedOrganizers();
    }
  }, [user?.email]);

  const fetchFollowedOrganizers = async () => {
    setLoadingOrganizers(true);
    try {
      const res = await fetch(`http://localhost:8000/api/organizers/followed/my-organizers`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();
      setFollowedOrganizers(data.followedOrganizers || []);
    } catch (err) {
      console.error("Error fetching followed organizers:", err);
      setFollowedOrganizers([]);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/participants/${user._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        await refreshUser();
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        window.scrollTo(0, 0);
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/participants/${user._id}/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Password changed successfully!");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setIsChangingPassword(false);
        window.scrollTo(0, 0);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      setError("Error changing password: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowOrganizer = async (organizerId) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/organizers/${organizerId}/unfollow`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Organizer unfollowed!");
        await refreshUser();
        setFollowedOrganizers(followedOrganizers.filter(org => org._id !== organizerId));
        window.scrollTo(0, 0);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to unfollow organizer");
      }
    } catch (err) {
      setError("Error unfollowing organizer: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== "PARTICIPANT") {
    return <div>Only participants can access this page.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>My Profile</h1>

        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>First Name</label>
              <input
                name="fName"
                value={formData.fName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                name="lName"
                value={formData.lName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>College / Organization</label>
              <input
                name="collegeName"
                value={formData.collegeName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address (Read-Only)</label>
              <input type="email" value={user.email} disabled />
            </div>

            <div className="form-group">
              <label>Participant Type (Read-Only)</label>
              <input type="text" value={user.participantType} disabled />
            </div>

            <div className="form-group">
              <label>Areas of Interest</label>
              <div className="interests-grid">
                {AVAILABLE_INTERESTS.map(interest => (
                  <label key={interest} className="interest-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleInterestChange(interest)}
                    />
                    <span>{interest}</span>
                  </label>
                ))}
              </div>
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
              <span className="label">First Name:</span>
              <span>{user.fName}</span>
            </div>
            <div className="profile-row">
              <span className="label">Last Name:</span>
              <span>{user.lName}</span>
            </div>
            <div className="profile-row">
              <span className="label">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="profile-row">
              <span className="label">College / Organization:</span>
              <span>{user.collegeName}</span>
            </div>
            <div className="profile-row">
              <span className="label">Contact Number:</span>
              <span>{user.contactNumber}</span>
            </div>
            <div className="profile-row">
              <span className="label">Participant Type:</span>
              <span>{user.participantType}</span>
            </div>
            <div className="profile-row">
              <span className="label">Interests:</span>
              <div className="interests-display">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map(interest => (
                    <span key={interest} className="interest-tag">{interest}</span>
                  ))
                ) : (
                  <span>No interests selected</span>
                )}
              </div>
            </div>

            <hr style={{ margin: "20px 0", opacity: 0.3 }} />

            {isChangingPassword ? (
              <form onSubmit={handlePasswordChange}>
                <h3>Change Password</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? "Changing..." : "Change Password"}
                  </button>
                  <button type="button" onClick={() => setIsChangingPassword(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => {
                  setIsChangingPassword(true);
                  window.scrollTo(0, 0);
                }}
                className="edit-button"
              >
                Change Password
              </button>
            )}

            <hr style={{ margin: "20px 0", opacity: 0.3 }} />

            <h3>Followed Organizers</h3>
            {loadingOrganizers ? (
              <p>Loading organizers...</p>
            ) : followedOrganizers.length === 0 ? (
              <p className="empty-state-text">No followed organizers yet.</p>
            ) : (
              <div className="followed-organizers-list">
                {followedOrganizers.map(org => (
                  <div key={org._id} className="organizer-item">
                    <div className="organizer-info">
                      <h4>{org.name || org.organizerName || "Organizer"}</h4>
                    </div>
                    <button
                      onClick={() => handleUnfollowOrganizer(org._id)}
                      disabled={isLoading}
                      className="unfollow-button"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setIsEditing(true);
                window.scrollTo(0, 0);
              }}
              className="edit-button"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
