import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { getRole, logout } from "../../utils/auth";
import "./ManagePage.css";

// ── inline helpers ────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT",  label: "Contract" },
];

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
  membershipPlanId: "",
  membershipStartDate: "",
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
  membershipPlanId: u.membershipPlanId != null ? String(u.membershipPlanId) : "",
  membershipStartDate: u.membershipStartDate ?? "",
});

const membershipLabel = (status) => {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

// ── Edit Modal ────────────────────────────────────────────────────────────────

const EditModal = ({ user, onClose, onSave, showIsActive, showMembershipAssignment, membershipPlans }) => {
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
      const payload = {
        ...form,
        membershipPlanId:
          showMembershipAssignment
            ? (form.membershipPlanId === "" ? 0 : Number(form.membershipPlanId))
            : undefined,
        membershipStartDate:
          showMembershipAssignment && form.membershipPlanId !== ""
            ? (form.membershipStartDate || null)
            : null,
      };

      await onSave(payload);
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

          {showMembershipAssignment && (
            <>
              <div className="form-section-label">Membership Assignment</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Membership Plan</label>
                  <select value={form.membershipPlanId} onChange={set("membershipPlanId")}>
                    <option value="">No plan</option>
                    {membershipPlans.map((plan) => (
                      <option key={plan.id} value={String(plan.id)}>
                        {plan.planName} ({plan.durationDays} days)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Membership Start Date</label>
                  <input
                    type="date"
                    value={form.membershipStartDate}
                    onChange={set("membershipStartDate")}
                    disabled={form.membershipPlanId === ""}
                  />
                </div>
              </div>
            </>
          )}

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

// ── Employment Modal (ADMIN only, for INSTRUCTOR) ──────────────────────────────

const emptyEmpForm = () => ({
  employmentType: "",
  workingHoursPerWeek: "",
  salary: "",
  isActive: "",
});

const EmploymentModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyEmpForm());
  const [savedForm, setSavedForm] = useState(emptyEmpForm()); // snapshot for cancel
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    api.get(`/api/instructor/${user.id}`)
      .then(({ data }) => {
        const filled = {
          employmentType: data.employment?.employmentType || "",
          workingHoursPerWeek: data.employment?.workingHoursPerWeek ?? "",
          salary: data.employment?.salary ?? "",
          isActive: data.isActive !== null ? String(data.isActive) : "",
        };
        const hasEmp = !!data.employment?.employmentType;
        setForm(filled);
        setSavedForm(filled);
        setEditing(!hasEmp); // auto-open edit mode if no employment set yet
      })
      .catch(() => setApiError("Failed to load employment details."))
      .finally(() => setLoading(false));
  }, [user.id]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCancelEdit = () => {
    setForm(savedForm);
    setErrors({});
    setEditing(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.employmentType) errs.employmentType = "Required.";
    const hrs = Number(form.workingHoursPerWeek);
    if (form.workingHoursPerWeek === "" || isNaN(hrs) || hrs < 1 || hrs > 168)
      errs.workingHoursPerWeek = "Enter 1–168.";
    const sal = Number(form.salary);
    if (form.salary === "" || isNaN(sal) || sal < 0)
      errs.salary = "Enter a valid salary.";
    if (form.isActive === "") errs.isActive = "Required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setApiError("");
    setSaving(true);
    try {
      const payload = {
        employmentType: form.employmentType,
        workingHoursPerWeek: Number(form.workingHoursPerWeek),
        salary: Number(form.salary),
        isActive: form.isActive === "true",
      };
      await api.put(`/api/instructor/${user.id}/employment`, payload);
      setSavedForm(form);
      setEditing(false);
      onSaved({ id: user.id, payload });
    } catch (err) {
      setApiError(err.response?.data?.message || err.response?.data || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const readonlyCls = editing ? "" : " emp-input--readonly";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Employment — {user.firstName} {user.lastName}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {!loading && !editing && (
              <button className="btn-edit-inline" onClick={() => setEditing(true)}>✎ Edit</button>
            )}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "1rem" }}>Loading…</p>
        ) : (
          <form className="edit-form" onSubmit={handleSubmit}>
            {apiError && <p className="modal-error">{apiError}</p>}

            <div className="form-row">
              <div className="form-group">
                <label>Employment Type{editing && <span className="req"> *</span>}</label>
                <select name="employmentType" value={form.employmentType} onChange={set}
                  disabled={!editing} className={`emp-select${readonlyCls}`}>
                  <option value="">—</option>
                  {EMPLOYMENT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.employmentType && <p className="field-error">{errors.employmentType}</p>}
              </div>
              <div className="form-group">
                <label>Employment Status{editing && <span className="req"> *</span>}</label>
                <select name="isActive" value={form.isActive} onChange={set}
                  disabled={!editing} className={`emp-select${readonlyCls}`}>
                  <option value="">—</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                {errors.isActive && <p className="field-error">{errors.isActive}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Working Hours / Week{editing && <span className="req"> *</span>}</label>
                <input type="number" name="workingHoursPerWeek" min="1" max="168"
                  value={form.workingHoursPerWeek} onChange={set} placeholder="e.g. 40"
                  disabled={!editing} className={readonlyCls.trim()} />
                {errors.workingHoursPerWeek && <p className="field-error">{errors.workingHoursPerWeek}</p>}
              </div>
              <div className="form-group">
                <label>Salary (LKR){editing && <span className="req"> *</span>}</label>
                <input type="number" name="salary" min="0" step="0.01"
                  value={form.salary} onChange={set} placeholder="e.g. 75000.00"
                  disabled={!editing} className={readonlyCls.trim()} />
                {errors.salary && <p className="field-error">{errors.salary}</p>}
              </div>
            </div>

            {editing && (
              <div className="modal-actions">
                {savedForm.employmentType && (
                  <button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                )}
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Saving…" : savedForm.employmentType ? "Save Changes" : "Assign Employment"}
                </button>
              </div>
            )}
          </form>
        )}
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

// ── Search + Filter Toolbar ──────────────────────────────────────────────────────

const Toolbar = ({ search, onSearch, roleFilter, onRoleFilter, viewerRole }) => {
  const roles = viewerRole === "ADMIN"
    ? ["ALL", "ADMIN", "INSTRUCTOR", "CLIENT"]
    : ["ALL", "CLIENT"];
  return (
    <div className="manage-toolbar">
      <input
        className="manage-search"
        type="text"
        placeholder="Search by name, email or phone…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="manage-filter-group">
        {roles.map((r) => (
          <button
            key={r}
            className={`manage-filter-btn${roleFilter === r ? " manage-filter-btn--active" : ""}`}
            onClick={() => onRoleFilter(r)}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── User / Client Table ───────────────────────────────────────────────────────

const UserTable = ({ users, onEdit, onEditMetrics, onEditEmployment, title, viewerRole, navigate }) => (
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
              <th>Membership</th>
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
                  {u.role === "CLIENT" ? (
                    <div className="membership-cell">
                      <span className={`membership-status-badge ${String(u.membershipStatus || "").toLowerCase()}`}>
                        {membershipLabel(u.membershipStatus)}
                      </span>
                      <span className="membership-name">{u.membershipPlanName || "No plan"}</span>
                    </div>
                  ) : (
                    "-"
                  )}
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
                  {/* Instructor actions: ADMIN only */}
                  {viewerRole === "ADMIN" && u.role === "INSTRUCTOR" && (
                    u.instructorStatus === "APPROVED"
                      ? <button className="btn-employment" onClick={() => onEditEmployment(u)}>Employment</button>
                      : <button className="btn-review" onClick={() => navigate(`/instructor/${u.id}`)}>Review</button>
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
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [selfUser, setSelfUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);              // personal-details modal
  const [editingMetrics, setEditingMetrics] = useState(null);  // metrics modal
  const [editingEmployment, setEditingEmployment] = useState(null); // employment modal
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Fetch data based on role
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (role === "ADMIN") {
          const [usersRes, plansRes] = await Promise.all([
            api.get("/api/manage/users"),
            api.get("/api/membership-plans/active"),
          ]);
          setUsers(usersRes.data);
          setMembershipPlans(plansRes.data);
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
  const handleOpenEmployment = (user) => setEditingEmployment(user);
  const closeEmploymentModal = () => setEditingEmployment(null);

  const handleEmploymentSaved = ({ id, payload }) => {
    setUsers((prev) => prev.map((u) =>
      u.id === id
        ? {
            ...u,
            isActive: payload.isActive,
            employmentType: payload.employmentType,
            workingHoursPerWeek: payload.workingHoursPerWeek,
            salary: payload.salary,
          }
        : u
    ));
  };

  // ── derived filtered list ────────────────────────────────────────────────────────
  const visibleUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term) ||
      (u.phoneNumber ?? "").includes(search);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSaveUser = useCallback(
    async (form) => {
      const endpoint =
        role === "ADMIN"
          ? (editing.role === "CLIENT" ? `/api/manage/clients/${editing.id}` : `/api/manage/users/${editing.id}`)
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
            {role === "ADMIN" && (
              <button className="btn-membership" onClick={() => navigate("/membership-plans")}>
                Membership Plans
              </button>
            )}
            <button className="btn-back" onClick={() => navigate("/profile")}>
              ← Profile
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Admin / Instructor: toolbar + user table */}
        {(role === "ADMIN" || role === "INSTRUCTOR") && (
          <>
            <Toolbar
              search={search}
              onSearch={setSearch}
              roleFilter={roleFilter}
              onRoleFilter={setRoleFilter}
              viewerRole={role}
            />
            <UserTable
              users={visibleUsers}
              onEdit={handleEdit}
              onEditMetrics={handleOpenMetrics}
              onEditEmployment={handleOpenEmployment}
              viewerRole={role}
              navigate={navigate}
              title={`${tableTitle} (${visibleUsers.length})`}
            />
          </>
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
          showMembershipAssignment={role === "ADMIN" && editing.role === "CLIENT"}
          membershipPlans={membershipPlans}
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

      {/* Edit Employment Modal */}
      {editingEmployment && (
        <EmploymentModal
          user={editingEmployment}
          onClose={closeEmploymentModal}
          onSaved={handleEmploymentSaved}
        />
      )}
    </div>
  );
};

export default ManagePage;
