import { useEffect, useMemo, useState, useCallback } from "react";
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

const formatLocalDate = (date) => {
  if (!date) return "-";
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
};

const formatLocalTime = (time) => {
  if (!time) return "-";

  if (typeof time === "string") {
    return time.length >= 5 ? time.substring(0, 5) : time;
  }

  if (typeof time === "object" && time.hour !== undefined && time.minute !== undefined) {
    return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
  }

  return "-";
};

const formatDateRange = (start, end) => {
  if (!start || !end) return "-";
  return `${formatLocalDate(start)} — ${formatLocalDate(end)}`;
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
  
  // History filter states
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMode, setFilterMode] = useState("latest");
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Visit Frequency states
  const [showFrequencyView, setShowFrequencyView] = useState(false);
  const [overallFrequency, setOverallFrequency] = useState(null);
  const [memberFrequencies, setMemberFrequencies] = useState([]);

  const [frequencyWeekRange, setFrequencyWeekRange] = useState("");
  const [frequencyMonthRange, setFrequencyMonthRange] = useState("");
  const [frequencyLoading, setFrequencyLoading] = useState(false);
  const [frequencyError, setFrequencyError] = useState("");

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

  const computeFrequencyRanges = useCallback(() => {
    const now = new Date();

    // ISO week: Monday to Sunday bounds
    const day = now.getDay();
    const daysSinceMonday = (day + 6) % 7; // 0==Monday, 6==Sunday

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setFrequencyWeekRange(formatDateRange(monday, sunday));
    setFrequencyMonthRange(formatDateRange(monthStart, monthEnd));
  }, []);

  const loadFrequencyData = useCallback(async () => {
    setFrequencyLoading(true);
    setFrequencyError("");
    try {
      const [overallRes, membersRes] = await Promise.all([
        api.get("/api/attendance/frequency"),
        api.get("/api/attendance/frequency/members")
      ]);
      setOverallFrequency(overallRes.data);
      setMemberFrequencies(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (err) {
      setFrequencyError(err.response?.data || "Failed to load visit frequency data.");
    } finally {
      setFrequencyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showFrequencyView) {
      loadFrequencyData();
      computeFrequencyRanges();
    }
  }, [showFrequencyView, loadFrequencyData, computeFrequencyRanges]);

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
      } catch {
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

  const getAttendanceHistory = async () => {
    if (!startDate || !endDate) {
      setHistoryError("Please select both start and end date.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setHistoryError("End date cannot be before start date.");
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    setMessage("");

    try {
      // Backend expects ISO8601 local datetime string, not JS chronological Date.toString
      const startISO = `${startDate}T00:00:00`;
      const endISO = `${endDate}T23:59:59`;

      const { data } = await api.get("/api/attendance/history", {
        params: {
          startDate: startISO,
          endDate: endISO,
          sort: filterMode,
        },
      });

      setAttendanceHistory(Array.isArray(data) ? data : []);
      setMessageType("success");
      setMessage(`✓ Found ${Array.isArray(data) ? data.length : 0} attendance records.`);
    } catch (err) {
      setHistoryError(err.response?.data || "Failed to load attendance history.");
      setAttendanceHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getSortedHistory = () => {
    return [...attendanceHistory];
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
          {/* View Toggle Tabs */}
          <div className="view-tabs">
            <button
              className={`tab-button ${!showHistoryView && !showFrequencyView ? "active" : ""}`}
              onClick={() => {
                setShowHistoryView(false);
                setShowFrequencyView(false);
              }}
            >
              Check-In Today
            </button>
            <button
              className={`tab-button ${showHistoryView ? "active" : ""}`}
              onClick={() => {
                setShowHistoryView(true);
                setShowFrequencyView(false);
              }}
            >
              Attendance History
            </button>
            <button
              className={`tab-button ${showFrequencyView ? "active" : ""}`}
              onClick={() => {
                setShowHistoryView(false);
                setShowFrequencyView(true);
              }}
            >
              Visit Frequency
            </button>
          </div>

          {/* CHECK-IN VIEW */}
          {!showHistoryView && !showFrequencyView && (
            <>
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
            </>
          )}

          {/* HISTORY VIEW */}
          {showHistoryView && (
            <>
              {/* Filter Section */}
              <div className="history-filter-section">
                <h3 className="filter-title">Attendance History Filter</h3>
                
                <div className="filter-controls">
                  <div className="filter-group">
                    <label htmlFor="start-date" className="filter-label">Start Date</label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="end-date" className="filter-label">End Date</label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="filter-mode" className="filter-label">Sort By</label>
                    <select
                      id="filter-mode"
                      value={filterMode}
                      onChange={(e) => setFilterMode(e.target.value)}
                      className="filter-select"
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <button
                      className="btn btn-filter"
                      onClick={getAttendanceHistory}
                      disabled={historyLoading || !startDate || !endDate}
                    >
                      {historyLoading ? "Loading..." : "Filter"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className={`message message-${messageType}`}>
                  {message}
                </div>
              )}

              {historyError && (
                <div className="message message-error">
                  {historyError}
                </div>
              )}

              {/* History Table */}
              {attendanceHistory.length > 0 && (
                <div className="attendance-table-wrapper">
                  <div className="history-table-info">
                    <span className="record-count">Total Records: <strong>{attendanceHistory.length}</strong></span>
                  </div>
                  <table className="attendance-table history-table">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}></th>
                        <th className="left-align">Member Name</th>
                        <th style={{ width: "80px" }}>ID</th>
                        <th style={{ width: "140px" }}>Date</th>
                        <th style={{ width: "120px" }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedHistory().map((record, index) => {
                        const profilePic = record.profilePictureBase64
                          ? `data:image/jpeg;base64,${record.profilePictureBase64}`
                          : null;
                        return (
                          <tr key={index}>
                            <td className="history-avatar-cell">
                              {profilePic ? (
                                <img src={profilePic} alt={record.memberName} className="history-profile-avatar" />
                              ) : (
                                <div className="history-profile-avatar-placeholder">
                                  {getInitials(record.firstName, record.lastName)}
                                </div>
                              )}
                            </td>
                            <td className="name-cell">
                              <span className="history-member-name">{record.memberName}</span>
                            </td>
                            <td className="id-cell">{record.id || "-"}</td>
                            <td className="date-cell">
                              {formatLocalDate(record.date)}
                            </td>
                            <td className="time-cell">
                              {formatLocalTime(record.time)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!historyLoading && attendanceHistory.length === 0 && !historyError && startDate && endDate && (
                <div className="no-records-message">
                  <p>No attendance records found for the selected date range.</p>
                </div>
              )}

              {!historyLoading && !historyError && !startDate && !endDate && (
                <div className="no-records-message">
                  <p>Select a date range and click Filter to view attendance history.</p>
                </div>
              )}
            </>
          )}

          {/* FREQUENCY VIEW */}
          {showFrequencyView && (
            <>
              {frequencyLoading ? (
                <div className="frequency-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading visit frequency data…</p>
                </div>
              ) : frequencyError ? (
                <div className="frequency-error">
                  <p>{frequencyError}</p>
                  <button className="btn btn-secondary" onClick={loadFrequencyData}>Refresh</button>
                </div>
              ) : (
                <div className="frequency-dashboard">
                  <div className="frequency-header">
                    <div>
                      <h3>Gym Visit Frequency Metrics</h3>
                      <p style={{ margin: "0.6rem 0 0.4rem", fontSize: '0.9rem', color: '#4b5563' }}>
                        Weekly period: {frequencyWeekRange} • Monthly period: {frequencyMonthRange}
                      </p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => { loadFrequencyData(); computeFrequencyRanges(); }}>
                      Refresh
                    </button>
                  </div>

                  {/* Overall Metrics */}
                  <div className="frequency-section">
                    <h4>Overall Visit Frequency</h4>
                    {overallFrequency ? (
                      <div className="frequency-cards">
                        <div className="frequency-card">
                          <div className="frequency-value">{overallFrequency.weeklyVisits}</div>
                          <div className="frequency-label">Weekly Visits</div>
                        </div>
                        <div className="frequency-card">
                          <div className="frequency-value">{overallFrequency.monthlyVisits}</div>
                          <div className="frequency-label">Monthly Visits</div>
                        </div>
                        <div className="frequency-card">
                          <div className="frequency-value">
                            {memberFrequencies.length > 0
                              ? (() => {
                                  const maxVisits = Math.max(...memberFrequencies.map(m => m.monthlyVisits));
                                  const topMembers = memberFrequencies.filter(m => m.monthlyVisits === maxVisits);
                                  if (topMembers.length === 1) {
                                    return topMembers[0].memberName;
                                  } else {
                                    return `${topMembers.length} Active Members`;
                                  }
                                })()
                              : 'No Active Members'
                            }
                          </div>
                          <div className="frequency-label">Most Active Member</div>
                        </div>
                      </div>
                    ) : (
                      <p>No data available</p>
                    )}
                  </div>

                  {/* Per-Member Metrics */}
                  <div className="frequency-section">
                    <h4>Per-Member Visit Frequency</h4>
                    {memberFrequencies.length > 0 ? (
                      <div className="frequency-table-wrapper">
                        <table className="frequency-table">
                          <thead>
                            <tr>
                              <th>Member Name</th>
                              <th>Weekly Visits</th>
                              <th>Monthly Visits</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberFrequencies.map((member) => (
                              <tr key={member.clientId}>
                                <td>{member.memberName}</td>
                                <td>{member.weeklyVisits}</td>
                                <td>{member.monthlyVisits}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No member data available</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
