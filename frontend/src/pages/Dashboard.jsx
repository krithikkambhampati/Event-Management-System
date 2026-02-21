import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InterestModal from "../components/InterestModal";
import '../styles/Dashboard.css';

function Dashboard() {
  const { user, setUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showInterestModal, setShowInterestModal] = useState(false);
  const hasShownModal = useRef(false);

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.hasCompletedOnboarding === false && !hasShownModal.current) {
      hasShownModal.current = true;
      setShowInterestModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) fetchDashboardData();
  }, [user?._id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch upcoming published events
      const eventsRes = await fetch("http://localhost:8000/api/events?status=PUBLISHED", {
        credentials: "include"
      });
      const eventsData = await eventsRes.json();

      if (eventsRes.ok) {
        const now = new Date();
        const upcoming = (eventsData.events || [])
          .filter(e => new Date(e.startDate) > now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 6);
        setUpcomingEvents(upcoming);
      }

      // Fetch my registrations
      const regRes = await fetch("http://localhost:8000/api/registrations/participant/my-registrations", {
        credentials: "include"
      });
      const regData = await regRes.json();

      if (regRes.ok) {
        setMyRegistrations(regData.registrations || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await fetch(`http://localhost:8000/api/participants/${user._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasCompletedOnboarding: true })
      });
    } catch (err) {
      console.error("Error marking onboarding complete:", err);
    }
  };

  const handleInterestModalClose = () => {
    setShowInterestModal(false);
    markOnboardingComplete();
    refreshUser();
  };

  const handleInterestSave = (interests) => {
    setShowInterestModal(false);
    markOnboardingComplete();
    refreshUser();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Stats
  const registeredCount = myRegistrations.filter(r => r.participationStatus === "Registered").length;
  const completedCount = myRegistrations.filter(r => r.participationStatus === "Completed").length;
  const cancelledCount = myRegistrations.filter(r => r.participationStatus === "Cancelled").length;

  return (
    <div className="dashboard-container">
      {showInterestModal && (
        <InterestModal
          onClose={handleInterestModalClose}
          onSave={handleInterestSave}
          user={user}
        />
      )}

      <div className="dashboard-header">
        <h1>Welcome back, {user?.fName}!</h1>
        <p>Here's what's happening with your events</p>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-box" onClick={() => navigate("/participation-history")} style={{ cursor: 'pointer' }}>
          <div className="stat-box-number">{myRegistrations.length}</div>
          <div className="stat-box-label">Total Registrations</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{registeredCount}</div>
          <div className="stat-box-label">Upcoming</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{completedCount}</div>
          <div className="stat-box-label">Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-number">{cancelledCount}</div>
          <div className="stat-box-label">Cancelled</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => navigate("/browse-events")}>Browse Events</button>
        <button className="btn-secondary" onClick={() => navigate("/browse-organizers")}>Browse Organizers</button>
        <button className="btn-secondary" onClick={() => navigate("/participation-history")}>My Registrations</button>
      </div>

      {/* Upcoming Events */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3>Upcoming Events</h3>
          <button className="btn-secondary" onClick={() => navigate("/browse-events")} style={{ fontSize: 'var(--font-size-sm)' }}>
            View All
          </button>
        </div>

        {loading ? (
          <p className="text-secondary">Loading events...</p>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No Upcoming Events</div>
            <p className="empty-state-text">Browse events to find something interesting!</p>
            <button className="empty-state-button" onClick={() => navigate("/browse-events")}>Browse Events</button>
          </div>
        ) : (
          <div className="dashboard-grid">
            {upcomingEvents.map(event => (
              <div key={event._id} className="dashboard-card" onClick={() => navigate(`/events/${event._id}`)} style={{ cursor: 'pointer' }}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">{event.eventName}</div>
                  <span className={`dashboard-card-badge`} style={{
                    background: event.eventType === "NORMAL" ? 'rgba(155, 170, 124, 0.2)' : 'rgba(197, 168, 212, 0.2)',
                    color: event.eventType === "NORMAL" ? 'var(--success)' : 'var(--accent)'
                  }}>
                    {event.eventType === "NORMAL" ? "Event" : "Merch"}
                  </span>
                </div>
                <div className="dashboard-card-body">
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Organizer</span>
                    <span className="dashboard-card-value">{event.organizer?.organizerName}</span>
                  </div>
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Date</span>
                    <span className="dashboard-card-value">{formatDate(event.startDate)}</span>
                  </div>
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Time</span>
                    <span className="dashboard-card-value">{formatTime(event.startDate)}</span>
                  </div>
                  {event.registrationFee > 0 && (
                    <div className="dashboard-card-item">
                      <span className="dashboard-card-label">Fee</span>
                      <span className="dashboard-card-value">Rs. {event.registrationFee}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Registrations */}
      {myRegistrations.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h3>Recent Registrations</h3>
            <button className="btn-secondary" onClick={() => navigate("/participation-history")} style={{ fontSize: 'var(--font-size-sm)' }}>
              View All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--accent)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Event</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Ticket ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRegistrations.slice(0, 5).map((reg, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => navigate(`/events/${reg.event?._id}`)}
                  >
                    <td style={{ padding: '12px', fontWeight: 500 }}>{reg.event?.eventName}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>{reg.ticketId}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {formatDate(reg.registeredAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor:
                          reg.participationStatus === "Registered" ? 'rgba(155, 170, 124, 0.2)' :
                            reg.participationStatus === "Completed" ? 'rgba(197, 168, 212, 0.2)' :
                              'rgba(220, 53, 69, 0.2)',
                        color:
                          reg.participationStatus === "Registered" ? 'var(--success)' :
                            reg.participationStatus === "Completed" ? 'var(--accent)' :
                              '#dc3545'
                      }}>
                        {reg.participationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
