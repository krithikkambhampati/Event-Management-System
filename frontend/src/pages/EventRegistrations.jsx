import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import '../styles/Dashboard.css';

function EventRegistrations() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  const fetchEventAndRegistrations = async () => {
    setLoading(true);
    setError("");

    try {
      const eventRes = await fetch(
        `http://localhost:8000/api/events/${eventId}`,
        { method: "GET", credentials: "include" }
      );
      const eventData = await eventRes.json();
      if (!eventRes.ok) throw new Error(eventData.message || "Failed to fetch event");
      setEvent(eventData.event);

      // Fetch registrations
      const regRes = await fetch(
        `http://localhost:8000/api/registrations/${eventId}/registrations`,
        { method: "GET", credentials: "include" }
      );
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.message || "Failed to fetch registrations");
      
      setRegistrations(regData.registrations || []);
      setStats(regData.stats || {});
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventAndRegistrations();
    }
  }, [eventId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCapacityPercentage = () => {
    if (!event?.registrationLimit) return 0;
    return Math.round((stats?.registered / event.registrationLimit) * 100);
  };

  if (loading) {
    return <div className="dashboard-container"><div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button 
          className="event-details-back-btn" 
          onClick={() => navigate("/organizer")}
          style={{ marginRight: 'auto' }}
        >
          ← Back to Dashboard
        </button>
        <h1>{event?.eventName} - Registrations</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Section */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-box">
            <div className="stat-box-number">{stats.registered}</div>
            <div className="stat-box-label">Registered</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-number">{getCapacityPercentage()}%</div>
            <div className="stat-box-label">Capacity</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-number">{stats.completed}</div>
            <div className="stat-box-label">Completed</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-number">{stats.attended}</div>
            <div className="stat-box-label">Attended</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-number">{stats.cancelled}</div>
            <div className="stat-box-label">Cancelled</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Participants</h3>
        
        {registrations.length === 0 ? (
          <div className="empty-state">
            <p>No registrations yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'var(--surface)',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--accent)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Ticket ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Participant</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Registered</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {reg.ticketId}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                      {reg.participant?.fName} {reg.participant?.lName}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{reg.participant?.email}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {formatDate(reg.registeredAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 
                          reg.participationStatus === "Registered" ? 'rgba(155, 170, 124, 0.2)' :
                          reg.participationStatus === "Completed" ? 'rgba(197, 168, 212, 0.2)' :
                          'rgba(220, 53, 69, 0.2)',
                        color: 
                          reg.participationStatus === "Registered" ? 'var(--success)' :
                          reg.participationStatus === "Completed" ? 'var(--accent)' :
                          '#dc3545',
                        fontSize: '13px',
                        fontWeight: 500
                      }}>
                        {reg.participationStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedRegistration(selectedRegistration?._id === reg._id ? null : reg)}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, var(--accent) 0%, #A8689E 100%)',
                          color: 'var(--surface)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'linear-gradient(135deg, var(--accent-dark) 0%, #9B5A88 100%)'}
                        onMouseOut={(e) => e.target.style.background = 'linear-gradient(135deg, var(--accent) 0%, #A8689E 100%)'}
                      >
                        {selectedRegistration?._id === reg._id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Registration Details */}
      {selectedRegistration && (
        <div style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
            {selectedRegistration.participant?.fName} {selectedRegistration.participant?.lName} - Form Response
          </h3>

          {!selectedRegistration.registrationData || Object.keys(selectedRegistration.registrationData).length === 0 ? (
            <p style={{ color: '#666' }}>No form data submitted</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
              {Object.entries(selectedRegistration.registrationData).map(([fieldLabel, fieldValue], idx) => (
                <div key={idx} style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', color: '#333' }}>
                    {fieldLabel}
                  </div>
                  <div style={{ color: '#666', wordBreak: 'break-word' }}>
                    {Array.isArray(fieldValue) ? fieldValue.join(', ') : String(fieldValue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventRegistrations;
