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
  const [success, setSuccess] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Approval workflow state
  const [processing, setProcessing] = useState(null); // registration ID being processed
  const [rejectModal, setRejectModal] = useState(null); // registration to reject
  const [rejectReason, setRejectReason] = useState("");
  const [proofModal, setProofModal] = useState(null); // proof image URL to show full size

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
    if (eventId) fetchEventAndRegistrations();
  }, [eventId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCapacityPercentage = () => {
    if (!event?.registrationLimit) return 0;
    return Math.round((stats?.registered / event.registrationLimit) * 100);
  };

  // Revenue calculation
  const totalRevenue = registrations
    .filter(r => r.participationStatus !== "Cancelled" && r.participationStatus !== "Pending")
    .length * (event?.registrationFee || 0);

  // Filtered registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = filterStatus === "all" || reg.participationStatus === filterStatus;
    const matchesSearch = searchQuery.trim() === "" ||
      (reg.participant?.fName + " " + reg.participant?.lName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.ticketId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Approve payment
  const handleApprove = async (registrationId) => {
    setProcessing(registrationId);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/${registrationId}/approve-payment`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      setSuccess("Payment approved! Ticket and email sent.");
      setTimeout(() => setSuccess(""), 4000);
      fetchEventAndRegistrations(); // refresh data
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessing(null);
    }
  };

  // Reject payment
  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal._id);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8000/api/registrations/${rejectModal._id}/reject-payment`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason || "Payment rejected by organizer" })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      setSuccess("Payment rejected.");
      setTimeout(() => setSuccess(""), 4000);
      setRejectModal(null);
      setRejectReason("");
      fetchEventAndRegistrations();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessing(null);
    }
  };

  // CSV export — includes form response data
  const handleExportCSV = () => {
    const formFieldNames = new Set();
    filteredRegistrations.forEach(reg => {
      if (reg.registrationData && typeof reg.registrationData === "object") {
        Object.keys(reg.registrationData).forEach(key => formFieldNames.add(key));
      }
    });
    const fieldNames = [...formFieldNames];

    const headers = ["Ticket ID", "Name", "Email", "Registered At", "Status", "Payment Status", ...fieldNames];
    const rows = filteredRegistrations.map(reg => {
      const baseRow = [
        reg.ticketId,
        `${reg.participant?.fName || ""} ${reg.participant?.lName || ""}`.trim(),
        reg.participant?.email || "",
        new Date(reg.registeredAt).toLocaleString(),
        reg.participationStatus,
        reg.paymentStatus || "N/A"
      ];
      const formData = fieldNames.map(field => {
        const val = reg.registrationData?.[field];
        if (Array.isArray(val)) return val.join("; ");
        return val != null ? String(val) : "";
      });
      return [...baseRow, ...formData];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event?.eventName || "event"}_registrations.csv`;
    link.click();
  };

  const getStatusStyle = (status, paymentStatus) => {
    if (status === "Pending" || paymentStatus === "Pending") {
      return { backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#856404' };
    }
    if (status === "Registered") {
      return { backgroundColor: 'rgba(155, 170, 124, 0.2)', color: 'var(--success)' };
    }
    if (status === "Completed") {
      return { backgroundColor: 'rgba(197, 168, 212, 0.2)', color: 'var(--accent)' };
    }
    return { backgroundColor: 'rgba(220, 53, 69, 0.2)', color: '#dc3545' };
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
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-md)', padding: '12px', background: 'rgba(155, 170, 124, 0.15)', border: '1px solid var(--success)', borderRadius: '4px', color: 'var(--success)' }}>{success}</div>}

      {/* Analytics Stats */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-box">
            <div className="stat-box-number">{stats.registered}</div>
            <div className="stat-box-label">Approved</div>
          </div>
          {stats.pending > 0 && (
            <div className="stat-box" style={{ border: '2px solid #f0ad4e' }}>
              <div className="stat-box-number" style={{ color: '#856404' }}>{stats.pending}</div>
              <div className="stat-box-label" style={{ color: '#856404' }}>Pending</div>
            </div>
          )}
          <div className="stat-box">
            <div className="stat-box-number">{getCapacityPercentage()}%</div>
            <div className="stat-box-label">Capacity</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-number">{stats.attended}</div>
            <div className="stat-box-label">Attended</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-number">{stats.cancelled}</div>
            <div className="stat-box-label">Cancelled</div>
          </div>
          {event?.registrationFee > 0 && (
            <div className="stat-box">
              <div className="stat-box-number">Rs.{totalRevenue}</div>
              <div className="stat-box-label">Revenue</div>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: 'var(--spacing-md)' }}>
          {['all', ...(event?.eventType === 'MERCH' ? ['Pending'] : []), 'Registered', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: filterStatus === tab ? '3px solid var(--accent)' : '3px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontWeight: filterStatus === tab ? 600 : 400,
                color: filterStatus === tab ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-base)',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'all' ? 'All' : tab === 'Pending' ? `Pending Orders (${stats?.pending || 0})` : tab}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <h3>Participants ({filteredRegistrations.length})</h3>
          <button className="btn-secondary" onClick={handleExportCSV} disabled={filteredRegistrations.length === 0}>
            Export CSV
          </button>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, email, or ticket ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 300px',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--surface)'
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--surface)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending Approval</option>
            <option value="Registered">Approved / Registered</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled / Rejected</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      {filteredRegistrations.length === 0 ? (
        <div className="empty-state">
          <p>{registrations.length === 0 ? "No registrations yet" : "No participants match your search"}</p>
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
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Status</th>
                {event?.eventType === "MERCH" && (
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>Payment</th>
                )}
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', backgroundColor: reg.participationStatus === "Pending" ? 'rgba(255, 193, 7, 0.05)' : 'transparent' }}>
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
                      ...getStatusStyle(reg.participationStatus, reg.paymentStatus),
                      fontSize: '13px',
                      fontWeight: 500
                    }}>
                      {reg.participationStatus === "Pending" ? "Pending" : reg.participationStatus}
                    </span>
                  </td>
                  {event?.eventType === "MERCH" && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {reg.paymentProof ? (
                        <button
                          onClick={() => setProofModal(reg.paymentProof)}
                          style={{
                            padding: '4px 10px',
                            background: '#e3f2fd',
                            color: '#1565c0',
                            border: '1px solid #90caf9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          View Proof
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* Approve / Reject buttons for pending orders */}
                      {reg.participationStatus === "Pending" && reg.paymentStatus === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(reg._id)}
                            disabled={processing === reg._id}
                            style={{
                              padding: '5px 10px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: processing === reg._id ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              opacity: processing === reg._id ? 0.6 : 1
                            }}
                          >
                            {processing === reg._id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => { setRejectModal(reg); setRejectReason(""); }}
                            disabled={processing === reg._id}
                            style={{
                              padding: '5px 10px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: processing === reg._id ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              opacity: processing === reg._id ? 0.6 : 1
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {/* View details button */}
                      <button
                        onClick={() => setSelectedRegistration(selectedRegistration?._id === reg._id ? null : reg)}
                        style={{
                          padding: '5px 10px',
                          background: 'linear-gradient(135deg, var(--accent) 0%, #A8689E 100%)',
                          color: 'var(--surface)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {selectedRegistration?._id === reg._id ? "Hide" : "View"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            {selectedRegistration.participant?.fName} {selectedRegistration.participant?.lName} - Details
          </h3>

          {/* Payment info for merch */}
          {selectedRegistration.paymentStatus && selectedRegistration.paymentStatus !== "Not Required" && (
            <div style={{
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              backgroundColor: selectedRegistration.paymentStatus === "Pending" ? '#fff8e1' : selectedRegistration.paymentStatus === "Approved" ? '#e8f5e9' : '#ffebee',
              borderRadius: '8px',
              border: `1px solid ${selectedRegistration.paymentStatus === "Pending" ? '#ffe082' : selectedRegistration.paymentStatus === "Approved" ? '#a5d6a7' : '#ef9a9a'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <strong>Payment Status:</strong>{' '}
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    ...getStatusStyle(selectedRegistration.participationStatus, selectedRegistration.paymentStatus),
                    fontSize: '13px'
                  }}>
                    {selectedRegistration.paymentStatus}
                  </span>
                </div>
                {selectedRegistration.registrationData?.selectedVariant && (
                  <div><strong>Variant:</strong> {selectedRegistration.registrationData.selectedVariant}</div>
                )}
              </div>
              {selectedRegistration.paymentProof && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Payment Proof:</p>
                  <img
                    src={selectedRegistration.paymentProof}
                    alt="Payment proof"
                    style={{ maxWidth: '300px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setProofModal(selectedRegistration.paymentProof)}
                  />
                </div>
              )}
              {selectedRegistration.rejectionReason && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc3545' }}>
                  <strong>Rejection reason:</strong> {selectedRegistration.rejectionReason}
                </div>
              )}
            </div>
          )}

          {/* Form response data */}
          {!selectedRegistration.registrationData || Object.keys(selectedRegistration.registrationData).length === 0 ? (
            <p style={{ color: '#666' }}>No form data submitted</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
              {Object.entries(selectedRegistration.registrationData)
                .filter(([key]) => key !== 'selectedVariant' && key !== 'paymentProof')
                .map(([fieldLabel, fieldValue], idx) => (
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

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '12px', color: '#dc3545' }}>Reject Payment</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Rejecting payment for <strong>{rejectModal.participant?.fName} {rejectModal.participant?.lName}</strong>
            </p>
            <textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '10px', border: '1px solid #ddd',
                borderRadius: '6px', fontSize: '14px', resize: 'vertical',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                style={{
                  padding: '8px 16px', background: '#dc3545', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}
              >
                {processing ? "Rejecting..." : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Full-Size Modal */}
      {proofModal && (
        <div
          onClick={() => setProofModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'pointer'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={proofModal}
              alt="Payment proof"
              style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setProofModal(null); }}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '2px solid white',
                borderRadius: '50%', width: '36px', height: '36px',
                cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(220,53,69,0.9)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventRegistrations;
