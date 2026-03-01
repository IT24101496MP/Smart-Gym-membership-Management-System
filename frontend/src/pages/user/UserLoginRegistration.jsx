import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

import logo from "../../assets/Fat2fit Logo.jpg";
import loginImage from "../../assets/Login page.jpg";
import "./UserLoginRegistration.css";

const UserLoginRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const isStrongPassword = (password) => {
    if (!password) return false;
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return pattern.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError("Password must be at least 8 chars and include upper, lower, number, and special char");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const res = await fetch("http://localhost:8080/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg("Account created successfully. Redirecting to client registration...");
        setTimeout(() => navigate("/client-registration"), 1000);
      } else {
        const txt = await res.text();
        setError(txt || `Registration failed (${res.status})`);
      }
    } catch (err) {
      console.error("Registration error", err);
      setError("Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-header">
          <div className="header-left">
            <div className="header-accent"></div>
            <div>
              <h1>Sign Up</h1>
              <p>Your fitness journey starts here</p>
            </div>
          </div>

          <div className="logo-wrapper">
            <img src={logo} alt="Fat2Fit Logo" />
          </div>
        </div>

        <div className="auth-split-full">

          <div className="split-left-full">
            <img src={loginImage} alt="Gym" />
          </div>

          {/* RIGHT FORM */}
          <div className="split-right-full">

            {error && <div className="error-message">{error}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group password-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="form-group password-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="signup-center">
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </div>

            {/* Divider */}
            <div className="divider">
              <span>OR Sign Up Using</span>
            </div>

            <div className="social-icons">
              <div className="icon-wrapper">
                <FcGoogle size={28} />
              </div>

              <div className="icon-wrapper facebook">
                <FaFacebookF size={22} color="#fff" />
              </div>
            </div>

            <p className="login-text">
              Have an account? <Link to="/login">Login</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginRegistration;