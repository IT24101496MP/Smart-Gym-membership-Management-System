import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { getRole, logout } from "../../utils/auth";
import "./ManagePage.css";

// ── inline helpers ────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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

// ── User / Client Table ───────────────────────────────────────────────────────

const UserTable = ({ users, onEdit, title }) => (
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
                <td>
                  <button className="btn-edit" onClick={() => onEdit(u)}>Edit</button>
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
  const [editing, setEditing] = useState(null); // user being edited in modal

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

      {/* Edit Modal */}
      {editing && (
        <EditModal
          user={editing}
          onClose={closeModal}
          onSave={handleSaveUser}
          showIsActive={role === "ADMIN" || role === "INSTRUCTOR"}
        />
      )}
    </div>
  );
};

export default ManagePage;
