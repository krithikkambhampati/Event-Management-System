import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

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
      alert("Event updated successfully");
    } catch (err) {
      setError(err.message || "Failed to update event");
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

  if (loading) return <div><p>Loading event details...</p></div>;
  if (!event) return <div><p>Event not found</p></div>;

  return (
    <div>
      <button onClick={() => navigate(-1)}> Back</button>

      {error && (
        <div>
          <strong>Error:</strong> {error}
        </div>
      )}

      <h2>{event.eventName}</h2>

      <div>
        <p>
          <strong>Status:</strong> [{event.status}]
        </p>
        <p>
          <strong>Type:</strong> {event.eventType === "NORMAL" ? "Normal Event" : "Merchandise Event"}
        </p>
        <p>
          <strong>Eligibility:</strong> {event.eligibility}
        </p>
      </div>

      {isEditing && canEdit ? (
        <div>
          <h3>Edit Event {canEditPartial && "(Limited Edit Mode - Published Event)"}</h3>
          
          {canEditAll && (
            <>
              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
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

          {/* Common fields for both DRAFT and PUBLISHED */}
          <div>
            <label>
              Description:
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
              />
            </label>
          </div>

          <div>
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

          <div>
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

          <button onClick={handleSaveEdit}>Save Changes</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <div>
            <p>
              <strong>Description:</strong> {event.description}
            </p>
            <p>
              <strong>Registration Deadline:</strong> {formatDate(event.registrationDeadline)}
            </p>
            <p>
              <strong>Start Date:</strong> {formatDate(event.startDate)}
            </p>
            <p>
              <strong>End Date:</strong> {formatDate(event.endDate)}
            </p>
            {event.registrationLimit && (
              <p>
                <strong>Capacity:</strong> {event.registrationLimit} participants
              </p>
            )}
            {event.registrationFee > 0 && (
              <p>
                <strong>Registration Fee:</strong> ₹{event.registrationFee}
              </p>
            )}
            {event.tags && event.tags.length > 0 && (
              <p>
                <strong>Tags:</strong> {event.tags.join(", ")}
              </p>
            )}
          </div>

          {isOrganizer && (
            <div>
              <h3>Organizer Controls</h3>
              {canEdit && (
                <button onClick={() => setIsEditing(true)}>Edit Event</button>
              )}
              {event.status === "DRAFT" && (
                <button onClick={() => navigate(`/organizer`)}>Publish from Dashboard</button>
              )}
            </div>
          )}

          {user?.role === "PARTICIPANT" && event.status === "PUBLISHED" && (
            <div>
              <button onClick={() => navigate(`/events/${eventId}/register`)}>
                Register for Event
              </button>
            </div>
          )}
        </div>
      )}

      {isOrganizer && (
        <div>
          <h3>Organizer Info</h3>
          <p>
            <strong>Organizer:</strong> {event.organizer?.organizerName}
          </p>
        </div>
      )}
    </div>
  );
}

export default EventDetails;
