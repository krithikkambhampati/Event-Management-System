import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { authAPI } from "../services/api";
import '../styles/Auth.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const { setUser } = useAuth();

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    if (!executeRecaptcha) {
      setError("reCAPTCHA not ready. Please wait and try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Always get a fresh token on submit — pre-warmed tokens lack user interaction context
      // and score poorly with reCAPTCHA v3
      let captchaToken = "";
      try {
        captchaToken = await executeRecaptcha("login");
      } catch (captchaErr) {
        console.warn("[reCAPTCHA] Token generation failed, proceeding without:", captchaErr.message);
        // Proceed without captcha — backend will handle gracefully
      }

      const { ok, data } = await authAPI.login({ email, password, captchaToken });

      if (ok && data.user) {
        setUser(data.user);
        if (data.user.role === "ADMIN") {
          navigate("/admin");
        } else if (data.user.role === "ORGANIZER") {
          navigate("/organizer");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch  {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [executeRecaptcha, email, password, navigate, setUser]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?</p>
          <a onClick={() => navigate("/signup")} style={{ cursor: 'pointer' }}>
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;

