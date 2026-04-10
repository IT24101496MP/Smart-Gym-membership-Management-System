import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/Fat2fit Logo.jpg";
import { setTokens } from "../../utils/auth";
import { publicApi } from "../../utils/api";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setServerError("");
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = "Email or username is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await publicApi.post("/api/auth/login", {
        identifier: formData.identifier.trim(),
        password: formData.password,
      });
      setTokens(data.accessToken, data.refreshToken);
      navigate("/profile");
    } catch (error) {
      setServerError(
        error.response?.data || "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="header-left">
            <div className="header-accent" />
            <div>
              <h1>Welcome Back</h1>
              <p>Sign in to Fat2Fit</p>
            </div>
          </div>
          <img src={logo} alt="Fat2Fit Logo" className="header-logo" />
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Server-level error banner */}
          {serverError && (
            <div className="alert-error" role="alert">
              <span className="alert-icon">!</span>
              {serverError}
            </div>
          )}

          {/* Email / Username */}
          <div className="form-group">
            <label htmlFor="identifier">
              Email or Username <span className="required-star">*</span>
            </label>
            <input
              id="identifier"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your email or username"
              className={errors.identifier ? "error-field" : ""}
              autoComplete="username"
              autoFocus
            />
            {errors.identifier && (
              <span className="error-message">&#9679; {errors.identifier}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required-star">*</span>
            </label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? "error-field" : ""}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* eye-off */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* eye */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">&#9679; {errors.password}</span>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </div>

          <p className="register-prompt">
            Don&apos;t have an account?{" "}
            <Link to="/client/register" className="register-link">
              Register
            </Link>
          </p>

          <Link to="/membership-plans" className="plans-link-button">
            View Membership Plans
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
