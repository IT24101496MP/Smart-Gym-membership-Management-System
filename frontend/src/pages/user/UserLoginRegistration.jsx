import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

import logo from "../../assets/Fat2fit Logo.jpg";
import loginImage from "../../assets/Login page.jpg";
import "./UserLoginRegistration.css";

const UserLoginRegistration = () => {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => console.log("Google login success:", tokenResponse),
    onError: (error) => console.error("Google login error:", error),
  });

  const handleFacebookResponse = (response) => {
    console.log("Facebook login response:", response);
  };

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            {/* Email Input */}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Enter your email" />
            </div>

            {/* Password Input */}
            <div className="form-group password-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="form-group password-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Sign Up Button */}
            <div className="signup-center">
              <button className="submit-button">Sign Up</button>
            </div>

            {/* Divider */}
            <div className="divider">
              <span>OR Sign Up Using</span>
            </div>

            {/* Social Icons */}
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

            {/* Login Link */}
            <p className="login-text">
              Have an account?
              <Link to="/login"> Login</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserLoginRegistration;