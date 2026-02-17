import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Event.css';

function BrowseEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/events?status=PUBLISHED`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch events");
      }

      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Failed to fetch events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getFilteredEvents = () => {
    let filtered = events;

    if (filterType !== "all") {
      filtered = filtered.filter(e => e.eventType === filterType);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.eventName.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        (e.tags && e.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isRegistrationOpen = (event) => {
    return new Date() < new Date(event.registrationDeadline);
  };

  if (loading) {
    return (
      <div className="event-browse-container">
        <p className="text-center">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="event-browse-container">
      <div className="event-header">
        <h1>Browse Events</h1>
        <p>Discover and register for exciting events</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="event-search-bar">
        <input
          type="text"
          className="event-search-input"
          placeholder="Search events by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="event-filters">
        <div className="event-filter-group">
          <label>Filter by Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Events</option>
            <option value="NORMAL">Normal Events</option>
            <option value="MERCH">Merchandise Events</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">
            {events.length === 0 ? "No Events Yet" : "No Results Found"}
          </div>
          <p className="empty-state-text">
            {events.length === 0
              ? "No published events available yet. Check back later."
              : "No events match your search criteria. Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
            Found {filteredEvents.length} event(s)
          </p>

          <div className="event-list">
            {filteredEvents.map(event => (
              <div key={event._id} className="event-card">
                <div className="event-card-header">
                  <div>
                    <div className="event-card-title">{event.eventName}</div>
                    <span className="event-card-type">
                      {event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"}
                    </span>
                  </div>
                </div>

                <div className="event-card-body">
                  <div className="event-card-info">
                    <div className="event-card-info-item">
                      <span className="event-card-info-label">Organizer</span>
                      <span className="event-card-info-value">{event.organizer?.organizerName}</span>
                    </div>
                    <div className="event-card-info-item">
                      <span className="event-card-info-label">Eligibility</span>
                      <span className="event-card-info-value">{event.eligibility}</span>
                    </div>
                    <div className="event-card-info-item">
                      <span className="event-card-info-label">Event Date</span>
                      <span className="event-card-info-value">{formatDate(event.startDate)}</span>
                    </div>
                    {event.registrationLimit && (
                      <div className="event-card-info-item">
                        <span className="event-card-info-label">Capacity</span>
                        <span className="event-card-info-value">{event.registrationLimit} participants</span>
                      </div>
                    )}
                    {event.registrationFee > 0 && (
                      <div className="event-card-info-item">
                        <span className="event-card-info-label">Fee</span>
                        <span className="event-card-info-value">₹{event.registrationFee}</span>
                      </div>
                    )}
                  </div>

                  <div className="event-card-description">
                    {event.description.substring(0, 150)}...
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                        {event.tags.join(", ")}
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-md)' }}>
                    {isRegistrationOpen(event) ? (
                      <p className="text-success" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                        Registration Open
                      </p>
                    ) : (
                      <p className="text-error" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                        Registration Closed
                      </p>
                    )}
                  </div>
                </div>

                <div className="event-card-footer">
                  <button onClick={() => navigate(`/events/${event._id}`)}>
                    View Details & Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseEvents;
