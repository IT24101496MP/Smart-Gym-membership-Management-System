import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { getRole, logout } from "../../utils/auth";
import "./ManagePage.css";

// ── inline helpers ────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const FITNESS_GOALS = [
  { value: "FAT_BURNING",          label: "Fat Burning" },
  { value: "CARDIO_TRAINING",      label: "Cardio Training" },
  { value: "MUSCLE_STRENGTHENING", label: "Muscle Strengthening" },
  { value: "ENDURANCE_DEVELOPING", label: "Endurance Developing" },
  { value: "MUSCLE_GAIN",          label: "Muscle Gain" },
  { value: "SLIM_FIT_TRAINING",    label: "Slim Fit Training" },
  { value: "SKILL_DEVELOPING",     label: "Skill Developing" },
  { value: "BMI_MAINTAINING",      label: "BMI Maintaining" },
  { value: "PHYSICAL_FITNESS",     label: "Physical Fitness" },
  { value: "OTHERS",               label: "Others (Specify)" },
];

const emptyMetrics = () => ({
  weightKg: "",
  heightCm: "",
  hipSizeCm: "",
  breastSizeCm: "",
  waistSizeCm: "",
  armSizeCm: "",
  shoulderSizeCm: "",
  buttSizeCm: "",
  fitnessGoals: [],
  otherGoalSpecification: "",
});

const metricsToForm = (m) => ({
  weightKg: m.weightKg ?? "",
  heightCm: m.heightCm ?? "",
  hipSizeCm: m.hipSizeCm ?? "",
  breastSizeCm: m.breastSizeCm ?? "",
  waistSizeCm: m.waistSizeCm ?? "",
  armSizeCm: m.armSizeCm ?? "",
  shoulderSizeCm: m.shoulderSizeCm ?? "",
  buttSizeCm: m.buttSizeCm ?? "",
  fitnessGoals: m.fitnessGoals ?? [],
  otherGoalSpecification: m.otherGoalSpecification ?? "",
});

const emptyEdit = () => ({
  firstName: "",
  lastName: "",
  age: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  phoneNumber: "",
  landPhone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactNumber: "",
  bloodGroup: "",
  isActive: true,
});

const userToForm = (u) => ({
  firstName: u.firstName ?? "",
  lastName: u.lastName ?? "",
  age: u.age ?? "",
  dateOfBirth: u.dateOfBirth ?? "",
  gender: u.gender ?? "",
  email: u.email ?? "",
  phoneNumber: u.phoneNumber ?? "",
  landPhone: u.landPhone ?? "",
  address: u.address ?? "",
  emergencyContactName: u.emergencyContactName ?? "",
  emergencyContactRelationship: u.emergencyContactRelationship ?? "",
  emergencyContactNumber: u.emergencyContactNumber ?? "",
  bloodGroup: u.bloodGroup ?? "",
  isActive: u.isActive ?? true,
});

// ── Edit Modal ────────────────────────────────────────────────────────────────

const EditModal = ({ user, onClose, onSave, showIsActive }) => {
  const [form, setForm] = useState(userToForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit — {user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input value={form.firstName} onChange={set("firstName")} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} onChange={set("lastName")} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input type="number" value={form.age} onChange={set("age")} min="1" required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={set("gender")} required>
                <option value="">Select…</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Blood Group</label>
              <select value={form.bloodGroup} onChange={set("bloodGroup")}>
                <option value="">None</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input value={form.phoneNumber} onChange={set("phoneNumber")} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Land Phone</label>
              <input value={form.landPhone} onChange={set("landPhone")} />
            </div>
            <div className="form-group full">
              <label>Address</label>
              <input value={form.address} onChange={set("address")} required />
            </div>
          </div>

          <div className="form-section-label">Emergency Contact</div>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input value={form.emergencyContactName} onChange={set("emergencyContactName")} />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <input value={form.emergencyContactRelationship} onChange={set("emergencyContactRelationship")} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Number</label>
              <input value={form.emergencyContactNumber} onChange={set("emergencyContactNumber")} />
            </div>
          </div>

          {showIsActive && (
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={set("isActive")}
                  />
                  <span>Account Active</span>
                </label>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Client Metrics Modal (ADMIN + INSTRUCTOR) ─────────────────────────────────

const ClientMetricsModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyMetrics());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/manage/clients/${user.id}/metrics`)
      .then(({ data }) => setForm(metricsToForm(data)))
      .catch(() => setForm(emptyMetrics()))
      .finally(() => setLoading(false));
  }, [user.id]);

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleGoal = (goal) => {
    setForm((prev) => {
      const has = prev.fitnessGoals.includes(goal);
      return {
        ...prev,
        fitnessGoals: has
          ? prev.fitnessGoals.filter((g) => g !== goal)
          : [...prev.fitnessGoals, goal],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        weightKg: form.weightKg === "" ? null : form.weightKg,
        heightCm: form.heightCm === "" ? null : form.heightCm,
        hipSizeCm: form.hipSizeCm === "" ? null : form.hipSizeCm,
        breastSizeCm: form.breastSizeCm === "" ? null : form.breastSizeCm,
        waistSizeCm: form.waistSizeCm === "" ? null : form.waistSizeCm,
        armSizeCm: form.armSizeCm === "" ? null : form.armSizeCm,
        shoulderSizeCm: form.shoulderSizeCm === "" ? null : form.shoulderSizeCm,
        buttSizeCm: form.buttSizeCm === "" ? null : form.buttSizeCm,
      };
      const { data } = await api.put(`/api/manage/clients/${user.id}/metrics`, payload);
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to save metrics.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Body Metrics — {user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ padding: "1rem" }}>Loading…</p>
        ) : (
          <form className="edit-form" onSubmit={handleSubmit}>
            {error && <p className="modal-error">{error}</p>}

            <div className="form-section-label">Body Measurements</div>
            <div className="form-row">
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" step="0.01" min="0" value={form.weightKg} onChange={setField("weightKg")} placeholder="e.g. 72.5" />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" step="0.01" min="0" value={form.heightCm} onChange={setField("heightCm")} placeholder="e.g. 170" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hip Size (cm)</label>
                <input type="number" step="0.01" min="0" value={form.hipSizeCm} onChange={setField("hipSizeCm")} />
              </div>
              <div className="form-group">
                <label>Breast Size (cm)</label>
                <input type="number" step="0.01" min="0" value={form.breastSizeCm} onChange={setField("breastSizeCm")} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Waist Size (cm)</label>
                <input type="number" step="0.01" min="0" value={form.waistSizeCm} onChange={setField("waistSizeCm")} />
              </div>
              <div className="form-group">
                <label>Arm Size (cm)</label>
                <input type="number" step="0.01" min="0" value={form.armSizeCm} onChange={setField("armSizeCm")} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Shoulder Size (cm)</label>
                <input type="number" step="0.01" min="0" value={form.shoulderSizeCm} onChange={setField("shoulderSizeCm")} />
              </div>
              <div className="form-group">
                <label>Butt Size (cm)</label>
                <input type="number" step="0.01" min="0" value={form.buttSizeCm} onChange={setField("buttSizeCm")} />
              </div>
            </div>

            <div className="form-section-label">Fitness Requirements</div>
            <div className="fitness-goals-grid">
              {FITNESS_GOALS.map(({ value, label }) => (
                <label key={value} className="goal-checkbox">
                  <input
                    type="checkbox"
                    checked={form.fitnessGoals.includes(value)}
                    onChange={() => toggleGoal(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {form.fitnessGoals.includes("OTHERS") && (
              <div className="form-row">
                <div className="form-group full">
                  <label>Specify Other Goal</label>
                  <input
                    value={form.otherGoalSpecification}
                    onChange={setField("otherGoalSpecification")}
                    placeholder="Describe the fitness goal…"
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? "Saving…" : "Save Metrics"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── User / Client Table ───────────────────────────────────────────────────────

const UserTable = ({ users, onEdit, onEditMetrics, title, viewerRole }) => (
  <div className="table-container">
    <h2 className="section-title">{title}</h2>
    {users.length === 0 ? (
      <p className="empty-msg">No records found.</p>
    ) : (
      <div className="table-scroll">
        <table className="manage-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="cell-id">{u.id}</td>
                <td className="cell-name">{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.phoneNumber}</td>
                <td>
                  <span className={`role-badge role-${u.role?.toLowerCase()}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${u.isActive ? "active" : "inactive"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="cell-actions">
                  {/* Personal details edit: ADMIN only */}
                  {viewerRole === "ADMIN" && (
                    <button className="btn-edit" onClick={() => onEdit(u)}>Edit</button>
                  )}
                  {/* Body metrics: ADMIN + INSTRUCTOR for clients only */}
                  {(viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && u.role === "CLIENT" && (
                    <button className="btn-metrics" onClick={() => onEditMetrics(u)}>Metrics</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ── Client Self-Edit Form ─────────────────────────────────────────────────────

const SelfEditForm = ({ user, onSaved }) => {
  const [form, setForm] = useState(userToForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const { data } = await api.put("/api/manage/me", form);
      setSuccess("Profile updated successfully.");
      onSaved(data);
    } catch (err) {
      setError(err.response?.data ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="self-edit-card">
      <h2 className="section-title">Edit Your Profile</h2>
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
      <form className="edit-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input value={form.firstName} onChange={set("firstName")} required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input value={form.lastName} onChange={set("lastName")} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input type="number" value={form.age} onChange={set("age")} min="1" required />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Gender</label>
            <select value={form.gender} onChange={set("gender")} required>
              <option value="">Select…</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>{g.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Blood Group</label>
            <select value={form.bloodGroup} onChange={set("bloodGroup")}>
              <option value="">None</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input value={form.phoneNumber} onChange={set("phoneNumber")} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Land Phone</label>
            <input value={form.landPhone} onChange={set("landPhone")} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={form.address} onChange={set("address")} required />
          </div>
        </div>

        <div className="form-section-label">Emergency Contact</div>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input value={form.emergencyContactName} onChange={set("emergencyContactName")} />
          </div>
          <div className="form-group">
            <label>Relationship</label>
            <input value={form.emergencyContactRelationship} onChange={set("emergencyContactRelationship")} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Contact Number</label>
            <input value={form.emergencyContactNumber} onChange={set("emergencyContactNumber")} />
          </div>
        </div>

        <div className="self-edit-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main ManagePage ───────────────────────────────────────────────────────────

const ManagePage = () => {
  const navigate = useNavigate();
  const role = getRole();

  const [users, setUsers] = useState([]);
  const [selfUser, setSelfUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);        // personal-details modal
  const [editingMetrics, setEditingMetrics] = useState(null); // metrics modal

  // Fetch data based on role
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (role === "ADMIN") {
          const { data } = await api.get("/api/manage/users");
          setUsers(data);
        } else if (role === "INSTRUCTOR") {
          const { data } = await api.get("/api/manage/clients");
          setUsers(data);
        } else if (role === "CLIENT") {
          const { data } = await api.get("/api/manage/me");
          setSelfUser(data);
        }
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  const handleEdit = (user) => setEditing(user);
  const closeModal = () => setEditing(null);
  const handleOpenMetrics = (user) => setEditingMetrics(user);
  const closeMetricsModal = () => setEditingMetrics(null);

  const handleSaveUser = useCallback(
    async (form) => {
      const endpoint =
        role === "ADMIN"
          ? `/api/manage/users/${editing.id}`
          : `/api/manage/clients/${editing.id}`;
      const { data } = await api.put(endpoint, form);
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    },
    [editing, role]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ── render ──
  if (loading) {
    return (
      <div className="manage-page">
        <div className="manage-container">
          <p className="loading-msg">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-page">
        <div className="manage-container">
          <p className="error-msg">{error}</p>
        </div>
      </div>
    );
  }

  const tableTitle =
    role === "ADMIN"
      ? "All Users"
      : role === "INSTRUCTOR"
      ? "All Clients"
      : "";

  return (
    <div className="manage-page">
      <div className="manage-container">
        {/* Header */}
        <div className="manage-header">
          <div className="manage-header-left">
            <h1 className="manage-title">Manage</h1>
            <span className={`role-badge role-${role?.toLowerCase()}`}>{role}</span>
          </div>
          <div className="manage-header-right">
            <button className="btn-back" onClick={() => navigate("/profile")}>
              ← Profile
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Admin / Instructor: user table */}
        {(role === "ADMIN" || role === "INSTRUCTOR") && (
          <UserTable
            users={users}
            onEdit={handleEdit}
            onEditMetrics={handleOpenMetrics}
            viewerRole={role}
            title={tableTitle}
          />
        )}

        {/* Client: own profile edit form */}
        {role === "CLIENT" && selfUser && (
          <SelfEditForm
            user={selfUser}
            onSaved={(updated) => setSelfUser(updated)}
          />
        )}
      </div>

      {/* Edit Personal Details Modal */}
      {editing && (
        <EditModal
          user={editing}
          onClose={closeModal}
          onSave={handleSaveUser}
          showIsActive={role === "ADMIN"}
        />
      )}

      {/* Edit Body Metrics Modal */}
      {editingMetrics && (
        <ClientMetricsModal
          user={editingMetrics}
          onClose={closeMetricsModal}
          onSaved={() => {}}
        />
      )}
    </div>
  );
};

export default ManagePage;
