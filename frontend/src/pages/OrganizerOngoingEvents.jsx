import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import '../styles/Event.css';

function OrganizerOngoingEvents() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user?._id) fetchOngoingEvents();
    }, [user?._id]);

    const fetchOngoingEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/events/organizer/${user._id}`, {
                credentials: "include"
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch events");
            }

            // Filter for ONGOING and PUBLISHED events that have started
            const now = new Date();
            const ongoing = (data.events || []).filter(e => {
                const started = new Date(e.startDate) <= now;
                const notEnded = new Date(e.endDate) >= now;
                return (e.status === "ONGOING" || (e.status === "PUBLISHED" && started && notEnded));
            });

            setEvents(ongoing);
        } catch (err) {
            setError(err.message || "Failed to fetch ongoing events");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="event-browse-container">
                <p className="text-center">Loading ongoing events...</p>
            </div>
        );
    }

    return (
        <div className="event-browse-container">
            <div className="event-header">
                <h1>Ongoing Events</h1>
                <p>Events that are currently in progress</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-title">No Ongoing Events</div>
                    <p className="empty-state-text">
                        You don't have any events currently in progress.
                    </p>
                </div>
            ) : (
                <div className="event-list">
                    {events.map(event => (
                        <div key={event._id} className="event-card">
                            <div className="event-card-header">
                                <div>
                                    <div className="event-card-title">{event.eventName}</div>
                                    <span className="event-card-type">
                                        {event.eventType === "NORMAL" ? "Normal Event" : "Merchandise"}
                                    </span>
                                    <span className="event-card-type" style={{ marginLeft: '8px', background: 'var(--success)', color: 'white' }}>
                                        {event.status}
                                    </span>
                                </div>
                            </div>

                            <div className="event-card-body">
                                <div className="event-card-info">
                                    <div className="event-card-info-item">
                                        <span className="event-card-info-label">Start</span>
                                        <span className="event-card-info-value">{formatDate(event.startDate)}</span>
                                    </div>
                                    <div className="event-card-info-item">
                                        <span className="event-card-info-label">End</span>
                                        <span className="event-card-info-value">{formatDate(event.endDate)}</span>
                                    </div>
                                </div>

                                <div className="event-card-description">
                                    {event.description.substring(0, 150)}...
                                </div>
                            </div>

                            <div className="event-card-footer">
                                <button onClick={() => navigate(`/organizer/events/${event._id}`)}>
                                    Manage Event
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrganizerOngoingEvents;
