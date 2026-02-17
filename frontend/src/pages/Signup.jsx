import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Auth.css';

function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fName: "",
    lName: "",
    email: "",
    password: "",
    collegeName: "",
    contactNumber: "",
    participantType: "IIIT"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await fetch("http://localhost:8000/api/participants/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      navigate("/login");
    } else {
      setError(data.message || "Signup failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join us today</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label>First Name</label>
            <input 
              name="fName" 
              placeholder="Enter your first name" 
              value={formData.fName}
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input 
              name="lName" 
              placeholder="Enter your last name" 
              value={formData.lName}
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>College / Organization</label>
            <input 
              name="collegeName" 
              placeholder="Enter your college or organization" 
              value={formData.collegeName}
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Participant Type</label>
            <div className="form-group" style={{ gap: 'var(--spacing-md)' }}>
              <label className="form-group checkbox">
                <input
                  type="radio"
                  name="participantType"
                  value="IIIT"
                  checked={formData.participantType === "IIIT"}
                  onChange={handleChange}
                />
                <span>IIIT Student</span>
              </label>

              <label className="form-group checkbox">
                <input
                  type="radio"
                  name="participantType"
                  value="NON_IIIT"
                  checked={formData.participantType === "NON_IIIT"}
                  onChange={handleChange}
                />
                <span>Non-IIIT</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input 
              name="contactNumber" 
              placeholder="Enter your contact number" 
              value={formData.contactNumber}
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              name="email" 
              type="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="Enter a strong password" 
              value={formData.password}
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <a onClick={() => navigate("/login")} style={{ cursor: 'pointer' }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  );
}

export default Signup;
