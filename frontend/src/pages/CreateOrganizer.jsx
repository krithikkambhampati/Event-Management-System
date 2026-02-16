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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    } else {
      alert(data.message);
    }
  };

  return (
    <div>
      <h3>Create Organizer</h3>
      <Link to="/admin">Back to Admin Dashboard</Link>

      <form onSubmit={handleSubmit}>
        <input
          name="organizerName"
          placeholder="Organizer Name"
          onChange={handleChange}
          required
        />
        <br />

        <select
          name="category"
          onChange={handleChange}
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
          required
        />
        <br />

        <input
          name="contactEmail"
          placeholder="Contact Email"
          onChange={handleChange}
          required
        />
        <br />

        <input
          name="contactNumber"
          placeholder="Contact Number"
          onChange={handleChange}
          required
        />
        <br />

        <button type="submit">Create</button>
      </form>

      {credentials && (
        <div style={{ marginTop: "20px" }}>
          <h4>Generated Credentials</h4>
          <p>Login Email: {credentials.email}</p>
          <p>Password: {credentials.password}</p>
        </div>
      )}
    </div>
  );
}

export default CreateOrganizer;
