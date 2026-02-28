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

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  // Redirect to ClientRegistrationPage after successful signup
  const redirectToClientRegistration = (userData) => {
    // Save user info if needed
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("userRole", userData.role);

    // Redirect
    navigate("/client-registration");
  };

  // Normal registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        setSuccess("Registration successful!");
        setFormData({ email: "", password: "", confirmPassword: "" });
        setTimeout(() => redirectToClientRegistration(userData), 1000);
      } else {
        const errorData = await response.text();
        setError(errorData);
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const userInfo = await userInfoResponse.json();

        const response = await fetch(
          "http://localhost:8080/api/user/oauth/google",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userInfo.email),
          }
        );

        if (response.ok) {
          const userData = await response.json();
          redirectToClientRegistration(userData);
        } else {
          const errorData = await response.text();
          setError(errorData);
        }
      } catch (err) {
        setError("Google login failed");
        console.error(err);
      }
    },
    onError: (error) => console.error("Google login error:", error),
  });

  const handleFacebookResponse = async (response) => {
    if (response.email) {
      try {
        const res = await fetch("http://localhost:8080/api/user/oauth/facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response.email),
        });

        if (res.ok) {
          const userData = await res.json();
          redirectToClientRegistration(userData);
        } else {
          const errorData = await res.text();
          setError(errorData);
        }
      } catch (err) {
        setError("Facebook login failed");
        console.error(err);
      }
    } else {
      setError("Facebook login failed: email not provided");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="header-left">
            <div className="header-accent"></div>
            <div>
              <h1>Sign Up</h1>
              <p>Your fitness journey starts here</p>
            </div>
          </div>
          <img src={logo} alt="Fat2Fit Logo" className="header-logo" />
        </div>

        {/* Split Section */}
        <div className="auth-split-full">
          {/* Left Image */}
          <div className="split-left-full">
            <img src={loginImage} alt="Login Page" />
          </div>

          {/* Right Features */}
          <div className="split-right-full">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
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
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>

            <div className="divider">
              <span>OR Sign Up Using</span>
            </div>

            <div className="social-icons">
              <div className="icon-wrapper" onClick={() => googleLogin()}>
                <FcGoogle size={28} />
              </div>
              <FacebookLogin
                appId="YOUR_FACEBOOK_APP_ID"
                callback={handleFacebookResponse}
                render={(renderProps) => (
                  <div
                    className="icon-wrapper facebook"
                    onClick={renderProps.onClick}
                  >
                    <FaFacebookF size={22} color="#fff" />
                  </div>
                )}
              />
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