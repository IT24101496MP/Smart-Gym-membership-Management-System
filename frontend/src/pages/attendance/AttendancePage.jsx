import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { logout } from "../../utils/auth";
import "./AttendancePage.css";

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getInitials = (firstName, lastName) => {
  const f = (firstName || "").charAt(0).toUpperCase();
  const l = (lastName || "").charAt(0).toUpperCase();
  return `${f}${l}`.slice(0, 2) || "U";
};

const AttendancePage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [checkinLoading, setCheckinLoading] = useState({});

  const attendedClientIds = useMemo(() => {
    return new Set(todayAttendance.map((a) => a.client?.id));
  }, [todayAttendance]);

  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/manage/clients");
      setClients(data || []);
    } catch (err) {
      setError(err.response?.data || "Failed to load member list.");
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const { data } = await api.get("/api/attendance/today");
      setTodayAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load today's attendance", err);
      setTodayAttendance([]);
    }
  };

  useEffect(() => {
    loadClients();
    loadTodayAttendance();
  }, []);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((c) => {
      const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
      const clientId = String(c.id ?? "");
      const phoneNumber = String(c.phoneNumber ?? "");
      return (
        name.includes(term) ||
        clientId.includes(term) ||
        phoneNumber.includes(term)
      );
    });
  }, [clients, search]);

  const presentCount = attendedClientIds.size;

  const checkInClient = async (client) => {
    if (checkinLoading[client.id] || attendedClientIds.has(client.id)) return;

    setMessage("");
    setCheckinLoading((prev) => ({ ...prev, [client.id]: true }));

    try {
      await api.post("/api/attendance/check-in", { clientId: client.id });
      
      // Reload attendance records to reflect the new check-in
      await loadTodayAttendance();
      
      setMessageType("success");
      setMessage(`✓ ${client.firstName} ${client.lastName} checked in successfully.`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setMessageType("error");
        setMessage(`⚠ Member not found. Please refresh and try again.`);
      } else if (status === 409) {
        setMessageType("warning");
        setMessage(`⚠ ${client.firstName} ${client.lastName} already checked in today.`);
        // Still reload the data
        await loadTodayAttendance();
      } else {
        setMessageType("error");
        setMessage(err.response?.data || "Failed to record attendance.");
      }
    } finally {
      setCheckinLoading((prev) => ({ ...prev, [client.id]: false }));
    }
  };

  const markAllPresent = async () => {
    setMessage("");
    const unchecked = filteredClients.filter((c) => !attendedClientIds.has(c.id));
    
    if (unchecked.length === 0) {
      setMessageType("info");
      setMessage("All visible members are already checked in.");
      return;
    }

    let successCount = 0;
    for (const client of unchecked) {
      try {
        await api.post("/api/attendance/check-in", { clientId: client.id });
        successCount++;
      } catch (err) {
        // ignore and continue
      }
    }
    
    // Reload attendance records
    await loadTodayAttendance();
    
    setMessageType("success");
    setMessage(`✓ Checked in ${successCount} member(s).`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <div className="attendance-card">
            <div className="loading-spinner"></div>
            <p>Loading members…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-container">
        {/* Header Section */}
        <div className="attendance-header">
          <div>
            <h1>Attendance</h1>
            <p>Mark daily attendance for gym members.</p>
          </div>
          <div className="attendance-header-actions">
            <button className="btn btn-primary" onClick={markAllPresent} disabled={filteredClients.length === 0 || filteredClients.length === presentCount}>
              Mark All Present
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/manage")}>← Manage</button>
            <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="attendance-content">
          {/* Stats */}
          <div className="attendance-stats">
            <div className="stat-item">
              <span className="stat-label">Total Members</span>
              <span className="stat-value">{clients.length}</span>
            </div>
            <div className="stat-item stat-present">
              <span className="stat-label">Present Today</span>
              <span className="stat-value">{presentCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Attendance Rate</span>
              <span className="stat-value">{clients.length > 0 ? `${Math.round((presentCount / clients.length) * 100)}%` : "0%"}</span>
            </div>
          </div>

          {/* Search */}
          <div className="attendance-search-wrapper">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search by name, ID or mobile number"
              className="attendance-search"
            />
          </div>

          {/* Messages */}
          {message && (
            <div className={`message message-${messageType}`}>
              {message}
            </div>
          )}

          {error && (
            <div className="message message-error">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}></th>
                  <th style={{ maxWidth: "140px" }} className="left-align">Member Name</th>
                  <th style={{ width: "80px" }}>ID</th>
                  <th style={{ width: "140px" }}>Mobile Number</th>
                  <th>Membership Plan</th>
                  <th style={{ width: "180px" }}>Check-in Date & Time</th>
                  <th style={{ width: "130px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">No members found.</td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const isCheckedIn = attendedClientIds.has(client.id);
                    const profilePic = client.profilePicture
                      ? `data:image/jpeg;base64,${client.profilePicture}`
                      : null;

                    return (
                      <tr key={client.id} className={isCheckedIn ? "row-checked-in" : ""}>
                        <td className="avatar-cell">
                          {profilePic ? (
                            <img src={profilePic} alt={`${client.firstName}`} className="profile-avatar" />
                          ) : (
                            <div className="profile-avatar-placeholder">
                              {getInitials(client.firstName, client.lastName)}
                            </div>
                          )}
                        </td>
                        <td className="name-cell">
                          <span className="client-name">
                            {client.firstName} {client.lastName}
                          </span>
                        </td>
                        <td className="id-cell">{client.id}</td>
                        <td className="phone-cell">{client.phoneNumber || "-"}</td>
                        <td className="plan-cell">
                          <span className="plan-badge">
                            {client.membershipPlanName || "-"}
                          </span>
                        </td>
                        <td className="time-cell">
                          {isCheckedIn
                            ? todayAttendance.find((a) => a.client?.id === client.id)?.checkInTime
                              ? formatDateTime(todayAttendance.find((a) => a.client?.id === client.id)?.checkInTime)
                              : "-"
                            : "-"}
                        </td>
                        <td className="action-cell">
                          <button
                            className={`btn-checkin ${isCheckedIn ? "checked-in" : ""}`}
                            onClick={() => checkInClient(client)}
                            disabled={isCheckedIn || !!checkinLoading[client.id]}
                          >
                            {isCheckedIn ? "✓ Present" : checkinLoading[client.id] ? "…" : "Check-In"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
