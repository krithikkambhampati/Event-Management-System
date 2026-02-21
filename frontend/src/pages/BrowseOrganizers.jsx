import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import '../styles/Event.css';

function BrowseOrganizers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [actionLoading, setActionLoading] = useState("");

  const fetchOrganizers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/organizers", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch organizers");
      }

      setOrganizers(data.organizers || []);
    } catch (err) {
      setError(err.message || "Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/organizers/followed/my-organizers", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok) {
        setFollowedOrganizers(data.followedOrganizers.map(org => org._id));
      }
    } catch (err) {
      console.error("Failed to fetch followed organizers:", err);
    }
  };

  useEffect(() => {
    fetchOrganizers();
    if (user?.role === "PARTICIPANT") {
      fetchFollowedOrganizers();
    }
  }, [user]);

  const handleFollowToggle = async (organizerId, organizerName, isFollowing) => {
    setActionLoading(organizerId);
    setError("");
    setSuccess("");

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const res = await fetch(`http://localhost:8000/api/organizers/${organizerId}/${endpoint}`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${endpoint} organizer`);
      }

      if (isFollowing) {
        setFollowedOrganizers(prev => prev.filter(id => id !== organizerId));
        setSuccess(`Unfollowed ${organizerName}`);
      } else {
        setFollowedOrganizers(prev => [...prev, organizerId]);
        setSuccess(`Now following ${organizerName}`);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update follow status");
      setTimeout(() => setError(""), 5000);
    } finally {
      setActionLoading("");
    }
  };

  const getFilteredOrganizers = () => {
    let filtered = organizers;

    if (filterCategory !== "all") {
      filtered = filtered.filter(org => org.category === filterCategory);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(org =>
        org.organizerName.toLowerCase().includes(query) ||
        org.description?.toLowerCase().includes(query) ||
        org.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredOrganizers = getFilteredOrganizers();

  const categories = [...new Set(organizers.map(org => org.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="event-browse-container">
        <p className="text-center">Loading organizers...</p>
      </div>
    );
  }

  return (
    <div className="event-browse-container">
      <div className="event-header">
        <h1>Browse Organizers</h1>
        <p>Discover and follow event organizers</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="event-search-bar">
        <input
          type="text"
          className="event-search-input"
          placeholder="Search organizers by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="event-filters">
        <div className="event-filter-group">
          <label>Filter by Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrganizers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">
            {organizers.length === 0 ? "No Organizers Yet" : "No Results Found"}
          </div>
          <p className="empty-state-text">
            {organizers.length === 0
              ? "No organizers available yet. Check back later."
              : "No organizers match your search criteria. Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
            Found {filteredOrganizers.length} organizer(s)
          </p>

          <div className="event-list">
            {filteredOrganizers.map(organizer => {
              const isFollowing = followedOrganizers.includes(organizer._id);

              return (
                <div key={organizer._id} className="event-card">
                  <div className="event-card-header">
                    <div>
                      <div className="event-card-title">{organizer.organizerName}</div>
                      {organizer.category && (
                        <span className="event-card-type">
                          {organizer.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="event-card-body">
                    <div className="event-card-description">
                      {organizer.description || "No description available"}
                    </div>

                    <div className="event-card-info">
                      {organizer.contactEmail && (
                        <div className="event-card-info-item">
                          <span className="event-card-info-label">Email</span>
                          <span className="event-card-info-value">{organizer.contactEmail}</span>
                        </div>
                      )}
                      {organizer.contactNumber && (
                        <div className="event-card-info-item">
                          <span className="event-card-info-label">Contact</span>
                          <span className="event-card-info-value">{organizer.contactNumber}</span>
                        </div>
                      )}
                    </div>

                    {user?.role === "PARTICIPANT" && (
                      <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                          onClick={() => navigate(`/organizers/${organizer._id}`)}
                          className="btn-secondary"
                          style={{ flex: 1 }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleFollowToggle(organizer._id, organizer.organizerName, isFollowing)}
                          disabled={actionLoading === organizer._id}
                          className={isFollowing ? "btn-secondary" : "btn-primary"}
                          style={{ flex: 1 }}
                        >
                          {actionLoading === organizer._id
                            ? "Processing..."
                            : isFollowing
                              ? "Unfollow"
                              : "Follow"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseOrganizers;
