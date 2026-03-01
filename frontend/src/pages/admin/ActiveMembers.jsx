import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ActiveMembers.css";

const ActiveMembers = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [inactiveMembers, setInactiveMembers] = useState([]);
  const [currentTab, setCurrentTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/client/active");
      if (response.ok) {
        const data = await response.json();
        setAllMembers(data);
        setActiveMembers(data.filter(m => m.status === "Active"));
        setError("");
      } else {
        setError("Failed to load members");
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Error loading members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMembers = async () => {
    // Fetch all members including inactive ones
    try {
      const response = await fetch("http://localhost:8080/api/client");
      if (response.ok) {
        const data = await response.json();
        setAllMembers(data);
        setActiveMembers(data.filter(m => m.status === "Active"));
        setInactiveMembers(data.filter(m => m.status === "Inactive"));
      }
    } catch (err) {
      console.error("Error fetching all members:", err);
    }
  };

  useEffect(() => {
    fetchAllMembers();
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this member?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/client/${id}/deactivate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Role": role,
          },
        }
      );

      if (response.ok) {
        setSuccessMsg("Member deactivated successfully");
        setTimeout(() => setSuccessMsg(""), 3000);

        // Update local state
        const updatedMembers = allMembers.map(m =>
          m.clientId === id || m.id === id ? { ...m, status: "Inactive" } : m
        );
        setAllMembers(updatedMembers);
        setActiveMembers(updatedMembers.filter(m => m.status === "Active"));
        setInactiveMembers(updatedMembers.filter(m => m.status === "Inactive"));
      } else {
        const text = await response.text();
        setError(text || "Failed to deactivate member");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Deactivation failed: " + error.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm("Are you sure you want to activate this member?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/client/${id}/activate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Role": role,
          },
        }
      );

      if (response.ok) {
        setSuccessMsg("Member activated successfully");
        setTimeout(() => setSuccessMsg(""), 3000);

        const updatedMembers = allMembers.map(m =>
          m.clientId === id || m.id === id ? { ...m, status: "Active" } : m
        );
        setAllMembers(updatedMembers);
        setActiveMembers(updatedMembers.filter(m => m.status === "Active"));
        setInactiveMembers(updatedMembers.filter(m => m.status === "Inactive"));
      } else {
        const text = await response.text();
        setError(text || "Failed to activate member");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Activation failed: " + error.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const displayMembers = currentTab === "active" ? activeMembers : inactiveMembers;

  return (
    <div className="active-members-container">
      <div className="page-header">
        <div className="header-title">Fitness Members</div>
        <button className="back-button" onClick={() => navigate("/login")}>
          ← Back to Login
        </button>
      </div>

      <div className="members-content">
        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="success-message">{successMsg}</div>}

        <div className="tabs-container">
          <button
            className={`tab-button ${currentTab === "active" ? "active" : ""}`}
            onClick={() => setCurrentTab("active")}
          >
            Active Members ({activeMembers.length})
          </button>
          <button
            className={`tab-button ${currentTab === "inactive" ? "active" : ""}`}
            onClick={() => setCurrentTab("inactive")}
          >
            Deactivated Members ({inactiveMembers.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading members...</div>
        ) : displayMembers.length === 0 ? (
          <div className="no-members">
            <div className="no-members-icon">👥</div>
            <p>
              No {currentTab === "active" ? "active" : "deactivated"} members
              found
            </p>
          </div>
        ) : (
          <table className="members-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Member Since</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((member) => (
                <tr key={member.clientId || member.id}>
                  <td>{member.firstName}</td>
                  <td>{member.lastName}</td>
                  <td>{member.email || "N/A"}</td>
                  <td>{formatDate(member.createdAt)}</td>
                  <td>
                    <span
                      className={
                        member.status === "Active"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {member.status}
                    </span>
                  </td>
                  <td>
                    {(role === "ADMIN" || role === "INSTRUCTOR") && (
                      <>
                        {member.status === "Active" ? (
                          <button
                            className="deactivate-button"
                            onClick={() =>
                              handleDeactivate(member.clientId || member.id)
                            }
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="activate-button"
                            onClick={() =>
                              handleActivate(member.clientId || member.id)
                            }
                          >
                            Activate
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActiveMembers;

