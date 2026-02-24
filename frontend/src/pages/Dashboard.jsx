import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InterestModal from "../components/InterestModal";
import { registrationAPI, participantAPI, notificationAPI } from "../services/api";
import '../styles/Dashboard.css';

function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showInterestModal, setShowInterestModal] = useState(false);
  const hasShownModal = useRef(false);

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const notifRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

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
      // Fetch my registrations
      const { ok: regOk, data: regData } = await registrationAPI.getMyRegistrations();

      if (regOk) {
        const regs = regData.registrations || [];
        setMyRegistrations(regs);

        // Upcoming events = events the user is registered for that haven't started yet
        const now = new Date();
        const upcoming = regs
          .filter(r =>
            r.participationStatus !== "Cancelled" &&
            r.event &&
            new Date(r.event.startDate) > now
          )
          .sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate))
          .slice(0, 6);
        setUpcomingEvents(upcoming);
      }

      // Fetch unread notifications
      try {
        const { ok: notifOk, data: notifData } = await notificationAPI.getUnread();
        if (notifOk) setNotifications(notifData.notifications || []);
      } catch {
        // notifications are optional
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissNotifications = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications([]);
      setShowNotifications(false);
    } catch {
      // ignore
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await participantAPI.update(user._id, { hasCompletedOnboarding: true });
    } catch (err) {
      console.error("Error marking onboarding complete:", err);
    }
  };

  const handleInterestModalClose = () => {
    setShowInterestModal(false);
    markOnboardingComplete();
    refreshUser();
  };

  const handleInterestSave = () => {
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
          refreshUser={refreshUser}
        />
      )}

      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Welcome back, {user?.fName}!</h1>
            <p>Here's what's happening with your events</p>
          </div>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px',
                position: 'relative', padding: '8px'
              }}
              title="Notifications"
            >
              Notifications
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  backgroundColor: '#dc3545', color: 'white',
                  borderRadius: '50%', width: '20px', height: '20px',
                  fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute', right: 0, top: '100%',
                width: '360px', maxHeight: '400px', overflowY: 'auto',
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                zIndex: 200
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <strong style={{ fontSize: '14px' }}>Notifications</strong>
                  {notifications.length > 0 && (
                    <button onClick={handleDismissNotifications}
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: 'var(--accent)', fontSize: '12px', fontWeight: 600
                      }}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id}
                      onClick={async () => {
                        if (n.relatedEvent?._id) {
                          await notificationAPI.markAllRead();
                          setNotifications([]);
                          setShowNotifications(false);
                          navigate(`/events/${n.relatedEvent._id}`);
                        }
                      }}
                      style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        cursor: n.relatedEvent?._id ? 'pointer' : 'default',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        {n.relatedEvent?.eventName && `Event: ${n.relatedEvent.eventName}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
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

      {/* Upcoming Events (only events user registered for) */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3>My Upcoming Events</h3>
          <button className="btn-secondary" onClick={() => navigate("/participation-history")} style={{ fontSize: 'var(--font-size-sm)' }}>
            View All
          </button>
        </div>

        {loading ? (
          <p className="text-secondary">Loading events...</p>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No Upcoming Events</div>
            <p className="empty-state-text">Register for events to see them here!</p>
            <button className="empty-state-button" onClick={() => navigate("/browse-events")}>Browse Events</button>
          </div>
        ) : (
          <div className="dashboard-grid">
            {upcomingEvents.map(reg => (
              <div key={reg._id} className="dashboard-card" onClick={() => navigate(`/events/${reg.event._id}`)} style={{ cursor: 'pointer' }}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">{reg.event.eventName}</div>
                  <span className={`dashboard-card-badge`} style={{
                    background: reg.event.eventType === "NORMAL" ? 'rgba(155, 170, 124, 0.2)' : 'rgba(197, 168, 212, 0.2)',
                    color: reg.event.eventType === "NORMAL" ? 'var(--success)' : 'var(--accent)'
                  }}>
                    {reg.event.eventType === "NORMAL" ? "Event" : "Merch"}
                  </span>
                </div>
                <div className="dashboard-card-body">
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Organizer</span>
                    <span className="dashboard-card-value">{reg.event.organizer?.organizerName}</span>
                  </div>
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Date</span>
                    <span className="dashboard-card-value">{formatDate(reg.event.startDate)}</span>
                  </div>
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Time</span>
                    <span className="dashboard-card-value">{formatTime(reg.event.startDate)}</span>
                  </div>
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Ticket</span>
                    <span className="dashboard-card-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{reg.ticketId}</span>
                  </div>
                  <div className="dashboard-card-item">
                    <span className="dashboard-card-label">Status</span>
                    <span className="dashboard-card-value" style={{
                      color: reg.participationStatus === "Registered" ? 'var(--success)' :
                        reg.participationStatus === "Pending" ? '#856404' : 'var(--text-secondary)'
                    }}>
                      {reg.participationStatus === "Pending" ? "Pending Approval" : reg.participationStatus}
                    </span>
                  </div>
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
