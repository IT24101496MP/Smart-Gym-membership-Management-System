import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { logout } from "../../utils/auth";
import "./ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => setError("Failed to load profile."));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-card error-card">
          <p>{error}</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="loading">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.firstName.charAt(0).toUpperCase()}
            {user.lastName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="profile-name">{user.firstName} {user.lastName}</h1>
            <span className={`profile-role role-${user.role.toLowerCase()}`}>{user.role}</span>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">User ID</span>
            <span className="detail-value">#{user.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">First Name</span>
            <span className="detail-value">{user.firstName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Last Name</span>
            <span className="detail-value">{user.lastName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Role</span>
            <span className="detail-value">{user.role}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
