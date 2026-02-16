import { useState } from "react";
import { Link } from "react-router-dom";

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
      // Reset form
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
  };

  return (
    <div>
      <h3>Create Organizer</h3>
      <Link to="/admin">Back to Admin Dashboard</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="organizerName"
          placeholder="Organizer Name"
          onChange={handleChange}
          value={formData.organizerName}
          required
        />
        <br />

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
        </select>
        <br />

        <input
          name="description"
          placeholder="Description"
          onChange={handleChange}
          value={formData.description}
          required
        />
        <br />

        <input
          name="contactEmail"
          placeholder="Contact Email"
          onChange={handleChange}
          value={formData.contactEmail}
          required
        />
        <br />

        <input
          name="contactNumber"
          placeholder="Contact Number"
          onChange={handleChange}
          value={formData.contactNumber}
          required
        />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      {credentials && (
        <div style={{ marginTop: "20px", padding: "15px", border: "2px solid green", borderRadius: "5px", backgroundColor: "#f0fff4" }}>
          <h4>Organizer Created Successfully!</h4>
          <p><strong>Login Email:</strong> {credentials.email}</p>
          <button onClick={() => copyToClipboard(credentials.email)}>Copy Email</button>
          <br /><br />
          <p><strong>Password:</strong> {credentials.password}</p>
          <button onClick={() => copyToClipboard(credentials.password)}>Copy Password</button>
          <br /><br />
          <p style={{ color: "red", fontSize: "12px" }}>Save these credentials! They can only be reset from the Organizers list page.</p>
        </div>
      )}
    </div>
  );
}

export default CreateOrganizer;
