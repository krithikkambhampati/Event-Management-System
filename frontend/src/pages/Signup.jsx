import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import '../styles/Auth.css';

const RECAPTCHA_SITE_KEY = "6LcTYHMsAAAAAG1zZLhI8cBmrBew2GtGP18AeuS8";

function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const recaptchaRef = useRef(null);

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

    // Get reCAPTCHA token
    const captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Signup with captcha token
      const signupRes = await fetch("http://localhost:8000/api/participants/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken })
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.message || "Signup failed");
        recaptchaRef.current?.reset();
        setIsLoading(false);
        return;
      }

      // Step 2: Auto-login (captcha already verified during signup, skip for login)
      const loginRes = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password, captchaToken })
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.user) {
        setUser(loginData.user);
        navigate("/dashboard");
      } else {
        setError(loginData.message || "Auto-login failed");
        recaptchaRef.current?.reset();
      }
    } catch (err) {
      setError("Error: " + err.message);
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
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
            <div className="password-input-wrapper">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
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
