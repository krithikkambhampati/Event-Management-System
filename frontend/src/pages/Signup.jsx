import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { participantAPI, authAPI } from "../services/api";
import '../styles/Auth.css';

function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cachedToken = useRef(null);
  const tokenTimestamp = useRef(null);

  const [formData, setFormData] = useState({
    fName: "",
    lName: "",
    email: "",
    password: "",
    collegeName: "",
    contactNumber: "",
    participantType: "IIIT"
  });

  // Pre-warm reCAPTCHA token on mount
  useEffect(() => {
    if (!executeRecaptcha) return;
    const warm = async () => {
      try {
        cachedToken.current = await executeRecaptcha("signup");
        tokenTimestamp.current = Date.now();
      } catch { /* silent */ }
    };
    warm();
  }, [executeRecaptcha]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    if (!executeRecaptcha) {
      setError("reCAPTCHA not ready. Please wait and try again.");
      return;
    }

    if (formData.contactNumber.length !== 10) {
      setError("Contact number must be exactly 10 digits");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Use cached token if < 90s old, else fetch fresh
      let captchaToken = "";
      try {
        const age = tokenTimestamp.current ? Date.now() - tokenTimestamp.current : Infinity;
        if (cachedToken.current && age < 90000) {
          captchaToken = cachedToken.current;
          cachedToken.current = null;
        } else {
          captchaToken = await executeRecaptcha("signup");
        }
      } catch (captchaErr) {
        console.warn("[reCAPTCHA] Token generation failed, proceeding without:", captchaErr.message);
      }

      // Step 1: Signup with captcha token
      const { ok: signupOk, data: signupData } = await participantAPI.signup({ ...formData, captchaToken });

      if (!signupOk) {
        setError(signupData.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      // Step 2: Auto-login with a fresh token
      let loginToken = "";
      try {
        loginToken = await executeRecaptcha("login");
      } catch (captchaErr) {
        console.warn("[reCAPTCHA] Login token failed, proceeding without:", captchaErr.message);
      }
      const { ok: loginOk, data: loginData } = await authAPI.login({ email: formData.email, password: formData.password, captchaToken: loginToken });

      if (loginOk && loginData.user) {
        setUser(loginData.user);
        navigate("/dashboard");
      } else {
        setError(loginData.message || "Auto-login failed");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [executeRecaptcha, formData, navigate, setUser]);

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
              type="tel"
              placeholder="Enter 10-digit contact number"
              value={formData.contactNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setFormData({ ...formData, contactNumber: val });
              }}
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
            {formData.contactNumber && formData.contactNumber.length !== 10 && (
              <small style={{ color: '#dc3545', fontSize: '12px' }}>Phone number must be exactly 10 digits</small>
            )}
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
                placeholder="Enter a strong password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
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
