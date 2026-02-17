import { useState } from "react";
import { Link } from "react-router-dom";
import '../styles/CreateEvent.css';

function CreateOrganizer() {
  const [formData, setFormData] = useState({
    organizerName: "",
    category: "",
    description: "",
    contactEmail: "",
    contactNumber: ""
  });

  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(
      "http://localhost:8000/api/admin/create-organizer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      }
    );

    const data = await res.json();

    if (res.ok) {
      setCredentials(data.credentials);
      setFormData({
        organizerName: "",
        category: "",
        description: "",
        contactEmail: "",
        contactNumber: ""
      });
    } else {
      setError(data.message || "Failed to create organizer");
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Create New Organizer</h1>
        <p>Add a new club or organizer account to the system</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {credentials && (
        <div className="alert alert-success" style={{ 
          background: 'linear-gradient(135deg, rgba(122, 155, 92, 0.15) 0%, rgba(122, 155, 92, 0.05) 100%)',
          borderLeft: '5px solid var(--success)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 style={{ color: 'var(--success)', marginBottom: 'var(--spacing-md)' }}>Organizer Created Successfully!</h3>
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div>
              <strong>Login Email:</strong> {credentials.email}
              <button 
                onClick={() => copyToClipboard(credentials.email)}
                className="btn-secondary"
                style={{ marginLeft: 'var(--spacing-md)', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                Copy
              </button>
            </div>
            <div>
              <strong>Password:</strong> {credentials.password}
              <button 
                onClick={() => copyToClipboard(credentials.password)}
                className="btn-secondary"
                style={{ marginLeft: 'var(--spacing-md)', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                Copy
              </button>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
              Save these credentials! Share them with the organizer.
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="form-group">
            <label>Organizer Name</label>
            <input
              name="organizerName"
              placeholder="Enter organizer name (e.g., Tech Club, Drama Society)"
              onChange={handleChange}
              value={formData.organizerName}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              onChange={handleChange}
              value={formData.category}
              required
            >
              <option value="">Select Category</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Literary">Literary</option>
              <option value="Social">Social</option>
              <option value="Academic">Academic</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Brief description of the organizer"
              onChange={handleChange}
              value={formData.description}
              required
              rows="4"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              placeholder="organizer@example.com"
              onChange={handleChange}
              value={formData.contactEmail}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              placeholder="+91 1234567890"
              onChange={handleChange}
              value={formData.contactNumber}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Creating..." : "Create Organizer"}
            </button>
            <Link to="/admin" style={{ flex: 1 }}>
              <button type="button" className="btn-secondary" style={{ width: '100%' }}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrganizer;
