import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function OrganizersList() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [tempPasswords, setTempPasswords] = useState({});

  const fetchOrganizers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/admin/organizers", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch organizers");
      }

      setOrganizers(data.organizers || []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleToggleStatus = async (organizer) => {
    setActionLoadingId(organizer._id);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/organizers/${organizer._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !organizer.isActive })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update organizer status");
      }

      setOrganizers((prev) =>
        prev.map((item) =>
          item._id === organizer._id ? { ...item, isActive: !organizer.isActive } : item
        )
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to update organizer status");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDelete = async (organizerId) => {
    const confirmed = window.confirm("Delete this organizer permanently?");
    if (!confirmed) return;

    setActionLoadingId(organizerId);
    setError("");

    try {
      const res = await fetch(`http://localhost:8000/api/admin/organizers/${organizerId}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete organizer");
      }

      setOrganizers((prev) => prev.filter((item) => item._id !== organizerId));
      setTempPasswords((prev) => {
        const copy = { ...prev };
        delete copy[organizerId];
        return copy;
      });
    } catch (requestError) {
      setError(requestError.message || "Failed to delete organizer");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleResetPassword = async (organizerId) => {
    setActionLoadingId(organizerId);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/organizers/${organizerId}/reset-password`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setTempPasswords((prev) => ({
        ...prev,
        [organizerId]: data.credentials?.password || ""
      }));
    } catch (requestError) {
      setError(requestError.message || "Failed to reset password");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div>
      <h3>Organizers</h3>

      <Link to="/admin/create-organizer">
        <button>Create Organizer</button>
      </Link>

      <button onClick={fetchOrganizers} style={{ marginLeft: "12px" }}>
        Refresh
      </button>

      {loading && <p>Loading organizers...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ marginTop: "20px" }}>
          {organizers.length === 0 ? (
            <p>No organizers created yet.</p>
          ) : (
            <ul>
              {organizers.map((organizer) => (
                <li key={organizer._id} style={{ marginBottom: "14px" }}>
                  <div>
                    <strong>{organizer.organizerName}</strong> - {organizer.category}
                  </div>
                  <div>Login Email: {organizer.email}</div>
                  <div>Status: {organizer.isActive ? "Active" : "Disabled"}</div>
                  <div>
                    Password: {tempPasswords[organizer._id] || "Not retrievable. Click Reset Password."}
                  </div>
                  <button
                    onClick={() => handleResetPassword(organizer._id)}
                    disabled={actionLoadingId === organizer._id}
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleToggleStatus(organizer)}
                    disabled={actionLoadingId === organizer._id}
                    style={{ marginLeft: "8px" }}
                  >
                    {organizer.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDelete(organizer._id)}
                    disabled={actionLoadingId === organizer._id}
                    style={{ marginLeft: "8px" }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ marginTop: "12px" }}>
        <Link to="/admin">Back to Admin Dashboard</Link>
      </div>
    </div>
  );
}

export default OrganizersList;
