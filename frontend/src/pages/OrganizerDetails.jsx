import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import '../styles/Event.css';

function OrganizerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const [organizer, setOrganizer] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("upcoming");

    useEffect(() => {
        fetchOrganizerData();
    }, [id]);

    const fetchOrganizerData = async () => {
        setLoading(true);
        setError("");

        try {
            // Fetch organizer info
            const orgRes = await fetch(`http://localhost:8000/api/organizers/${id}`, {
                credentials: "include"
            });
            const orgData = await orgRes.json();

            if (!orgRes.ok) {
                throw new Error(orgData.message || "Failed to fetch organizer");
            }

            setOrganizer(orgData.organizer);

            // Fetch published events by this organizer
            const eventsRes = await fetch(
                `http://localhost:8000/api/events?status=PUBLISHED`,
                { credentials: "include" }
            );
            const eventsData = await eventsRes.json();

            if (eventsRes.ok) {
                const orgEvents = (eventsData.events || []).filter(
                    e => (e.organizer?._id || e.organizer) === id
                );
                setEvents(orgEvents);
            }
        } catch (err) {
            setError(err.message || "Failed to load organizer details");
        } finally {
            setLoading(false);
        }
    };

    const isFollowing = user?.followedOrganizers?.some(
        org => (typeof org === 'string' ? org : org._id) === id
    );

    const handleFollow = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/organizers/${id}/follow`,
                { method: "POST", credentials: "include" }
            );
            const data = await res.json();
            if (res.ok) {
                await refreshUser();
            }
        } catch (err) {
            console.error("Follow error:", err);
        }
    };

    const handleUnfollow = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/organizers/${id}/unfollow`,
                { method: "POST", credentials: "include" }
            );
            const data = await res.json();
            if (res.ok) {
                await refreshUser();
            }
        } catch (err) {
            console.error("Unfollow error:", err);
        }
    };

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.startDate) > now);
    const pastEvents = events.filter(e => new Date(e.endDate) < now);

    const displayedEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="event-browse-container">
                <p className="text-center">Loading organizer details...</p>
            </div>
        );
    }

    if (error || !organizer) {
        return (
            <div className="event-browse-container">
                <div className="alert alert-error">{error || "Organizer not found"}</div>
                <button className="btn-secondary" onClick={() => navigate("/browse-organizers")}>
                    ← Back to Organizers
                </button>
            </div>
        );
    }

    return (
        <div className="event-browse-container">
            <button
                className="btn-secondary"
                onClick={() => navigate("/browse-organizers")}
                style={{ marginBottom: 'var(--spacing-lg)' }}
            >
                ← Back to Organizers
            </button>

            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>{organizer.organizerName}</h1>
                        <span className="event-card-type" style={{ marginBottom: 'var(--spacing-md)', display: 'inline-block' }}>
                            {organizer.category}
                        </span>
                    </div>
                    <button
                        className={isFollowing ? "btn-secondary" : "btn-primary"}
                        onClick={isFollowing ? handleUnfollow : handleFollow}
                    >
                        {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                </div>

                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {organizer.description}
                </p>

                <div style={{ marginTop: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: 'var(--font-size-sm)' }}>Contact Email</span>
                        <p style={{ fontWeight: 500, margin: '4px 0 0' }}>{organizer.contactEmail}</p>
                    </div>
                    <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: 'var(--font-size-sm)' }}>Total Events</span>
                        <p style={{ fontWeight: 500, margin: '4px 0 0' }}>{events.length}</p>
                    </div>
                </div>
            </div>

            {/* Event Tabs */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <button
                    className={activeTab === "upcoming" ? "btn-primary" : "btn-secondary"}
                    onClick={() => setActiveTab("upcoming")}
                >
                    Upcoming ({upcomingEvents.length})
                </button>
                <button
                    className={activeTab === "past" ? "btn-primary" : "btn-secondary"}
                    onClick={() => setActiveTab("past")}
                >
                    Past ({pastEvents.length})
                </button>
            </div>

            {displayedEvents.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-state-text">
                        No {activeTab} events from this organizer.
                    </p>
                </div>
            ) : (
                <div className="event-list">
                    {displayedEvents.map(event => (
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
                                        <span className="event-card-info-label">Date</span>
                                        <span className="event-card-info-value">{formatDate(event.startDate)}</span>
                                    </div>
                                    <div className="event-card-info-item">
                                        <span className="event-card-info-label">Eligibility</span>
                                        <span className="event-card-info-value">{event.eligibility}</span>
                                    </div>
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
                            </div>

                            <div className="event-card-footer">
                                <button onClick={() => navigate(`/events/${event._id}`)}>
                                    View Details & Register
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrganizerDetails;
