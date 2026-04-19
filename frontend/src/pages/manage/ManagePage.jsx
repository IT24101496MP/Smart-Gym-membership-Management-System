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

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
];

const HEALTH_SCREENING_QUESTIONS = [
  { key: "cardiacConditions", label: "Cardiac conditions" },
  { key: "respiratoryIssues", label: "Respiratory issues" },
  { key: "faintingOrBalanceProblems", label: "Fainting or balance problems" },
  { key: "jointOrMuscleDisorders", label: "Joint or muscle disorders" },
  { key: "highBloodPressure", label: "High blood pressure" },
  { key: "cholesterolLevels", label: "Cholesterol levels" },
  { key: "currentMedications", label: "Current medications" },
  { key: "disabilitiesOrPhysicalLimitations", label: "Disabilities or physical limitations" },
];

const FITNESS_GOAL_OPTIONS = [
  { value: "FAT_BURNING", label: "Fat Burning" },
  { value: "CARDIO_TRAINING", label: "Cardio Training" },
  { value: "ENDURANCE_DEVELOPING", label: "Endurance Developing" },
  { value: "SKILL_DEVELOPING", label: "Skill Developing" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "SLIM_FIT_TRAINING", label: "Slim Fit Training" },
  { value: "MUSCLE_STRENGTHENING", label: "Muscle Strengthening" },
  { value: "PHYSICAL_FITNESS", label: "Physical Fitness" },
  { value: "BMI_MAINTAINING", label: "BMI Maintaining" },
  { value: "OTHERS", label: "Other" },
];

const FITNESS_GOAL_STATUS_OPTIONS = ["ACTIVE", "ACHIEVED", "ABANDONED"];

const emptyHealthScreeningForm = () =>
  HEALTH_SCREENING_QUESTIONS.reduce(
    (acc, item) => ({ ...acc, [item.key]: "" }),
    { additionalNotes: "" }
  );

const screeningValueToBool = (value) => value === "YES";
const boolToScreeningValue = (value) => (value ? "YES" : "NO");

const emptyWorkoutScheduleForm = () => ({
  trainingType: "",
  fitnessGoal: "FAT_BURNING",
  exercises: "",
  durationMinutes: "",
  frequencyPerWeek: "",
  specialInstructions: "",
});

const workoutScheduleToForm = (schedule) => ({
  trainingType: schedule?.trainingType ?? "",
  fitnessGoal: schedule?.fitnessGoal ?? "FAT_BURNING",
  exercises: schedule?.exercises ?? "",
  durationMinutes: schedule?.durationMinutes != null ? String(schedule.durationMinutes) : "",
  frequencyPerWeek: schedule?.frequencyPerWeek != null ? String(schedule.frequencyPerWeek) : "",
  specialInstructions: schedule?.specialInstructions ?? "",
});

const emptyMetrics = () => ({
  heightCm: "",
  weightKg: "",
  waistCm: "",
  hipCm: "",
  armCm: "",
  shoulderCm: "",
  breastCm: "",
  buttocksCm: "",
  measurementDate: new Date().toISOString().slice(0, 10),
});

const metricsToForm = (m) => ({
  heightCm: m.heightCm ?? "",
  weightKg: m.weightKg ?? "",
  waistCm: m.waistCm ?? "",
  hipCm: m.hipCm ?? "",
  armCm: m.armCm ?? "",
  shoulderCm: m.shoulderCm ?? "",
  breastCm: m.breastCm ?? "",
  buttocksCm: m.buttocksCm ?? "",
  measurementDate: m.measurementDate ?? new Date().toISOString().slice(0, 10),
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

const fitnessGoalLabel = (goal) => {
  if (!goal) return "Unknown";
  const matched = FITNESS_GOAL_OPTIONS.find((item) => item.value === goal);
  if (matched) return matched.label;
  return goal
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const canRenewMembership = (status) => {
  const normalized = String(status || "").toUpperCase();
  return normalized === "ACTIVE" || normalized === "EXPIRED";
};

const BMI_TREND_METRIC = { key: "bmi", label: "BMI", unit: "", color: "#1a6b3c" };

const TREND_METRICS = [
  { key: "heightCm", label: "Height", unit: "cm", color: "#34495e" },
  { key: "weightKg", label: "Weight", unit: "kg", color: "#c0392b" },
  { key: "waistCm", label: "Waist", unit: "cm", color: "#2c5f8a" },
  { key: "hipCm", label: "Hip", unit: "cm", color: "#8e44ad" },
  { key: "armCm", label: "Arm", unit: "cm", color: "#16a085" },
  { key: "shoulderCm", label: "Shoulder", unit: "cm", color: "#d35400" },
  { key: "breastCm", label: "Breast", unit: "cm", color: "#7f8c8d" },
  { key: "buttocksCm", label: "Buttocks", unit: "cm", color: "#2e86c1" },
];

const formatRecordedAt = (value) => {
  if (!value) return "-";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const dt = new Date(normalized);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
};

const toValidDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sortHistoryChronological = (items) => {
  return [...items].sort((a, b) => {
    const aDate = toValidDate(a.measurementDate);
    const bDate = toValidDate(b.measurementDate);
    if (aDate && bDate) {
      const byDate = aDate.getTime() - bDate.getTime();
      if (byDate !== 0) return byDate;
    }

    const aRecorded = toValidDate(a.recordedAt);
    const bRecorded = toValidDate(b.recordedAt);
    if (aRecorded && bRecorded) return aRecorded.getTime() - bRecorded.getTime();
    if (aRecorded) return 1;
    if (bRecorded) return -1;
    return 0;
  });
};

const SimpleTrendChart = ({ title, unit, color, entries, valueKey }) => {
  try {
    const chartWidth = 520;
    const chartHeight = 170;
    const padX = 26;
    const padY = 18;
    const width = chartWidth - padX * 2;
    const height = chartHeight - padY * 2;

    const points = entries
      .map((entry, index) => {
        const value = Number(entry[valueKey]);
        if (Number.isNaN(value)) return null;
        return { index, value, date: entry.measurementDate };
      })
      .filter(Boolean);

    if (points.length < 2) {
      return (
        <div className="trend-chart-card">
          <h4>{title}</h4>
          <p className="empty-msg">Need at least 2 measurements to render this chart.</p>
        </div>
      );
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(max - min, 1);

    const coords = points.map((point, i) => {
      const x = padX + (i / (points.length - 1)) * width;
      const normalized = (point.value - min) / spread;
      const y = padY + (1 - normalized) * height;
      return { ...point, x, y };
    });

    const linePath = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const latest = coords[coords.length - 1];

    return (
      <div className="trend-chart-card">
        <div className="trend-chart-head">
          <h4>{title}</h4>
          <span>
            Latest: {latest.value.toFixed(2)}{unit ? ` ${unit}` : ""}
          </span>
        </div>
        <svg
          className="trend-chart-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label={`${title} trend chart`}
        >
          <line x1={padX} y1={padY + height} x2={padX + width} y2={padY + height} stroke="#d8d8d8" strokeWidth="1" />
          <line x1={padX} y1={padY} x2={padX} y2={padY + height} stroke="#d8d8d8" strokeWidth="1" />
          <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={linePath} />
          {coords.map((point) => (
            <circle key={`${valueKey}-${point.index}`} cx={point.x} cy={point.y} r="3.5" fill={color} />
          ))}
          <text x={padX + 2} y={padY + 12} fontSize="11" fill="#666">{max.toFixed(2)}</text>
          <text x={padX + 2} y={padY + height - 4} fontSize="11" fill="#666">{min.toFixed(2)}</text>
        </svg>
      </div>
    );
  } catch {
    return <p className="modal-error">Unable to load chart.</p>;
  }
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

const MembershipProfileModal = ({
  user,
  viewerRole,
  history,
  historyLoading,
  historyError,
  paymentHistory,
  paymentHistoryLoading,
  paymentHistoryError,
  membershipPlans,
  renewing,
  renewError,
  renewSuccess,
  renewConflict,
  onRenew,
  onOverrideRenew,
  onRefresh,
  onClose,
}) => {
  const [planId, setPlanId] = useState("");
  const effectivePlanId =
    planId || (membershipPlans.length > 0 ? String(membershipPlans[0].id) : "");

  const submitRenewal = async (e) => {
    e.preventDefault();
    if (!effectivePlanId) return;
    await onRenew(Number(effectivePlanId));
  };

  const selectedPlan = membershipPlans.find((plan) => String(plan.id) === effectivePlanId) || null;
  const durationMonths = selectedPlan ? Math.max(1, Math.ceil((selectedPlan.durationDays || 0) / 30)) : 0;
  const totalAmount = selectedPlan
    ? Number(selectedPlan.admissionFee || 0) + Number(selectedPlan.monthlyPrice || 0) * durationMonths
    : 0;

  const allowRenew =
    (viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && canRenewMembership(user.membershipStatus);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Member Profile - {user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="member-profile-grid">
          <div className="member-profile-item">
            <span className="member-profile-label">Client ID</span>
            <span className="member-profile-value">#{user.id}</span>
          </div>
          <div className="member-profile-item">
            <span className="member-profile-label">Email</span>
            <span className="member-profile-value">{user.email}</span>
          </div>
          <div className="member-profile-item">
            <span className="member-profile-label">Current Plan</span>
            <span className="member-profile-value">{user.membershipPlanName || "Not assigned"}</span>
          </div>
          <div className="member-profile-item">
            <span className="member-profile-label">Current Status</span>
            <span className={`membership-status-badge ${String(user.membershipStatus || "").toLowerCase()}`}>
              {membershipLabel(user.membershipStatus)}
            </span>
          </div>
        </div>

        {allowRenew && (
          <div className="membership-renew-panel">
            <h3>Renew Membership</h3>
            <form className="membership-renew-form" onSubmit={submitRenewal}>
              <select
                value={effectivePlanId}
                onChange={(e) => setPlanId(e.target.value)}
                disabled={renewing || membershipPlans.length === 0}
                required
              >
                {membershipPlans.length === 0 ? (
                  <option value="">No active plans available</option>
                ) : (
                  membershipPlans.map((plan) => (
                    <option key={plan.id} value={String(plan.id)}>
                      {plan.planName} ({plan.durationDays} days)
                    </option>
                  ))
                )}
              </select>
              <button
                type="submit"
                className="btn-save"
                disabled={renewing || membershipPlans.length === 0 || !effectivePlanId}
              >
                {renewing ? "Renewing..." : "Renew Membership"}
              </button>
            </form>
            {selectedPlan && (
              <div className="renew-summary-note">
                <p><strong>Selected Plan:</strong> {selectedPlan.planName}</p>
                <p><strong>Duration:</strong> {selectedPlan.durationDays} days ({durationMonths} month{durationMonths > 1 ? "s" : ""})</p>
                <p><strong>Admission Fee:</strong> LKR {Number(selectedPlan.admissionFee || 0).toFixed(2)}</p>
                <p><strong>Total Amount:</strong> LKR {totalAmount.toFixed(2)}</p>
              </div>
            )}
            {renewError && <p className="modal-error">{renewError}</p>}
            {renewSuccess && <p className="form-success">{renewSuccess}</p>}
            {renewConflict?.overlapDetected && viewerRole === "ADMIN" && (
              <button
                type="button"
                className="btn-save"
                onClick={() => onOverrideRenew(Number(effectivePlanId))}
                disabled={renewing || !effectivePlanId}
              >
                {renewing ? "Applying Override..." : "Admin Override and Renew"}
              </button>
            )}
          </div>
        )}

        <div className="membership-history-panel">
          <div className="membership-history-header">
            <h3>Membership History</h3>
            <button className="btn-edit-inline" onClick={onRefresh} disabled={historyLoading}>
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {historyError && <p className="modal-error">{historyError}</p>}
          {historyLoading ? (
            <p className="empty-msg">Loading membership history...</p>
          ) : history.length === 0 ? (
            <p className="empty-msg">No membership records found.</p>
          ) : (
            <div className="table-scroll">
              <table className="manage-table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Start Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={record.id ?? `${record.planName}-${record.startDate}-${record.expiryDate}-${index}`}>
                      <td>{record.planName}</td>
                      <td>{record.startDate}</td>
                      <td>{record.expiryDate}</td>
                      <td>
                        <span className={`membership-status-badge ${String(record.status || "").toLowerCase()}`}>
                          {membershipLabel(record.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="membership-history-panel">
          <div className="membership-history-header">
            <h3>Payment History</h3>
          </div>
          {paymentHistoryError && <p className="modal-error">{paymentHistoryError}</p>}
          {paymentHistoryLoading ? (
            <p className="empty-msg">Loading payment history...</p>
          ) : paymentHistory.length === 0 ? (
            <p className="empty-msg">No payment records found.</p>
          ) : (
            <div className="table-scroll">
              <table className="manage-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Receipt Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((record, index) => (
                    <tr key={record.paymentId ?? `${record.paymentDate}-${record.amount}-${index}`}>
                      <td>{record.paymentDate || "-"}</td>
                      <td>{record.amount ?? "-"}</td>
                      <td>{record.paymentMethod || "-"}</td>
                      <td>{record.receiptNumber || "Not generated"}</td>
                      <td>{record.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentRecordModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    membershipPlanId: user.membershipPlanId ? String(user.membershipPlanId) : "",
    paymentAmount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "CASH",
    referenceNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const needsReference = form.paymentMethod === "BANK_TRANSFER" || form.paymentMethod === "CARD";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.membershipPlanId) {
      setError("Membership plan is required.");
      return;
    }

    if (!form.paymentAmount || Number(form.paymentAmount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (needsReference && !form.referenceNumber.trim()) {
      setError("Reference number is required for bank transfer or card payments.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId: user.id,
        membershipPlanId: Number(form.membershipPlanId),
        paymentAmount: Number(form.paymentAmount),
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber.trim() || null,
      };
      const { data } = await api.post("/api/payments/record", payload);
      setSuccess(data.message || "Payment recorded successfully.");
      onSaved?.(data);
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setError(err.response?.data || "Payment recording failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Record Payment - {user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="member-profile-grid">
          <div className="member-profile-item">
            <span className="member-profile-label">Member ID</span>
            <span className="member-profile-value">#{user.id}</span>
          </div>
          <div className="member-profile-item">
            <span className="member-profile-label">Membership Plan</span>
            <span className="member-profile-value">{user.membershipPlanName || "No plan"}</span>
          </div>
          <div className="member-profile-item">
            <span className="member-profile-label">Membership Status</span>
            <span className={`membership-status-badge ${String(user.membershipStatus || "").toLowerCase()}`}>
              {membershipLabel(user.membershipStatus)}
            </span>
          </div>
        </div>

        {error && <p className="modal-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Membership Plan</label>
              <input value={user.membershipPlanName || "No active plan"} disabled />
            </div>
            <div className="form-group">
              <label>Payment Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.paymentAmount}
                onChange={set("paymentAmount")}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={set("paymentDate")} required />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={form.paymentMethod} onChange={set("paymentMethod")} required>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label>Reference Number {needsReference ? "*" : "(Optional)"}</label>
              <input
                value={form.referenceNumber}
                onChange={set("referenceNumber")}
                placeholder="Enter transaction or receipt reference"
                required={needsReference}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={submitting}>
              {submitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HealthScreeningModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyHealthScreeningForm());
  const [submitting, setSubmitting] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [latestSaved, setLatestSaved] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadLatestScreening = async () => {
      setLoadingLatest(true);
      try {
        const { data } = await api.get(`/api/manage/clients/${user.id}/health-screening/latest`);
        setLatestSaved(data);
        const restored = HEALTH_SCREENING_QUESTIONS.reduce((acc, question) => {
          acc[question.key] = boolToScreeningValue(Boolean(data[question.key]));
          return acc;
        }, {});
        restored.additionalNotes = data.additionalNotes ?? "";
        setForm(restored);
      } catch (err) {
        if (err.response?.status === 404) {
          setLatestSaved(null);
          setForm(emptyHealthScreeningForm());
        } else {
          setError("Failed to load existing health screening data.");
        }
      } finally {
        setLoadingLatest(false);
      }
    };

    loadLatestScreening();
  }, [user.id]);

  const setQuestion = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const setNotes = (event) => {
    setForm((prev) => ({ ...prev, additionalNotes: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const hasMissingResponses = HEALTH_SCREENING_QUESTIONS.some(
      ({ key }) => form[key] !== "YES" && form[key] !== "NO"
    );

    if (hasMissingResponses) {
      setError("Please answer all required questionnaire responses.");
      return;
    }

    const payload = HEALTH_SCREENING_QUESTIONS.reduce((acc, question) => {
      acc[question.key] = screeningValueToBool(form[question.key]);
      return acc;
    }, {});

    payload.additionalNotes = form.additionalNotes.trim() || null;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/api/manage/clients/${user.id}/health-screening`, payload);
      setLatestSaved(data);
      setSuccess("Health screening submitted successfully.");
      onSaved?.(data);
      setTimeout(() => onClose(), 700);
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response?.data || "Please answer all required questionnaire responses.");
      } else {
        setError("Health screening submission failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activeRiskLabels = latestSaved
    ? HEALTH_SCREENING_QUESTIONS.filter((question) => latestSaved[question.key]).map((question) => question.label)
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Health Screening - {user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>

        <div className="member-profile-grid">
          <div className="member-profile-item">
            <span className="member-profile-label">Member ID</span>
            <span className="member-profile-value">#{user.id}</span>
          </div>
          <div className="member-profile-item">
            <span className="member-profile-label">Current Risk Flag</span>
            <span className={`health-risk-badge ${user.highRiskMember ? "high" : "normal"}`}>
              {user.highRiskMember ? "High Risk" : "Normal"}
            </span>
          </div>
        </div>

        {error && <p className="modal-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        {loadingLatest ? (
          <p className="empty-msg">Loading latest screening...</p>
        ) : latestSaved ? (
          <div className="measurement-summary-card">
            <p><strong>Last Screening:</strong> {formatRecordedAt(latestSaved.recordedAt)}</p>
            <p><strong>Saved Risk Status:</strong> {latestSaved.highRisk ? "High Risk" : "Normal"}</p>
            <p>
              <strong>Identified Risk Areas:</strong>{" "}
              {activeRiskLabels.length > 0 ? activeRiskLabels.join(", ") : "None"}
            </p>
          </div>
        ) : (
          <p className="empty-msg">No previous health screening found for this member.</p>
        )}

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="health-question-list">
            {HEALTH_SCREENING_QUESTIONS.map((question) => (
              <div className="health-question-row" key={question.key}>
                <label>{question.label}<span className="req"> *</span></label>
                <div className="health-question-options">
                  <label>
                    <input
                      type="radio"
                      name={question.key}
                      value="YES"
                      checked={form[question.key] === "YES"}
                      onChange={setQuestion(question.key)}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={question.key}
                      value="NO"
                      checked={form[question.key] === "NO"}
                      onChange={setQuestion(question.key)}
                    />
                    No
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              value={form.additionalNotes}
              onChange={setNotes}
              rows={3}
              placeholder="Optional notes about safety concerns"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Screening"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Client Metrics + Trends Modal ─────────────────────────────────────────────

const ClientMetricsModal = ({ user, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState(emptyMetrics());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [latestSavedMeasurement, setLatestSavedMeasurement] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeDateRange, setActiveDateRange] = useState({ fromDate: "", toDate: "" });
  const [compareDateA, setCompareDateA] = useState("");
  const [compareDateB, setCompareDateB] = useState("");

  const numericFields = [
    { key: "heightCm", label: "Height" },
    { key: "weightKg", label: "Weight" },
    { key: "waistCm", label: "Waist" },
    { key: "hipCm", label: "Hip" },
    { key: "armCm", label: "Arm" },
    { key: "shoulderCm", label: "Shoulder" },
    { key: "breastCm", label: "Breast" },
    { key: "buttocksCm", label: "Buttocks" },
  ];

  useEffect(() => {
    if (readOnly) {
      setLoading(false);
      api.get("/api/manage/me/metrics/history")
        .then(({ data }) => {
          const rows = Array.isArray(data) ? data : [];
          setHistory(rows);
          setLatestSavedMeasurement(rows[0] || null);
        })
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
      return;
    }

    api.get(`/api/manage/clients/${user.id}/metrics`)
      .then(({ data }) => {
        if (data?.measurementId) {
          setForm(metricsToForm(data));
          setLatestSavedMeasurement(data);
        } else {
          setForm(emptyMetrics());
        }
      })
      .catch(() => setForm(emptyMetrics()))
      .finally(() => setLoading(false));

    api.get(`/api/manage/clients/${user.id}/metrics/history`)
      .then(({ data }) => {
        const rows = Array.isArray(data) ? data : [];
        setHistory(rows);
        if (rows.length > 0) {
          setLatestSavedMeasurement(rows[0]);
        }
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [user.id, readOnly]);

  const sortedHistory = sortHistoryChronological(history);

  const filteredHistory = sortedHistory.filter((entry) => {
    const date = entry.measurementDate || "";
    if (!date) return false;
    if (activeDateRange.fromDate && date < activeDateRange.fromDate) return false;
    if (activeDateRange.toDate && date > activeDateRange.toDate) return false;
    return true;
  });

  const uniqueDates = [...new Set(sortedHistory.map((entry) => entry.measurementDate).filter(Boolean))];
  const uniqueDatesKey = uniqueDates.join("|");

  useEffect(() => {
    if (uniqueDates.length < 2) {
      setCompareDateA("");
      setCompareDateB("");
      return;
    }

    setCompareDateA((prev) => (prev && uniqueDates.includes(prev) ? prev : uniqueDates[0]));
    setCompareDateB((prev) => (prev && uniqueDates.includes(prev) ? prev : uniqueDates[uniqueDates.length - 1]));
  }, [uniqueDatesKey]);

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validateForm = () => {
    if (!form.measurementDate) {
      return "Measurement date is required.";
    }

    const missingField = numericFields.find(({ key }) => form[key] === "" || form[key] === null || form[key] === undefined);
    if (missingField) {
      return `${missingField.label} is required.`;
    }

    const invalidField = numericFields.find(({ key }) => Number(form[key]) <= 0 || Number.isNaN(Number(form[key])));
    if (invalidField) {
      return `${invalidField.label} must be a positive numeric value.`;
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationError("");

    const validation = validateForm();
    if (validation) {
      setValidationError(validation);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        measurementDate: form.measurementDate,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        waistCm: Number(form.waistCm),
        hipCm: Number(form.hipCm),
        armCm: Number(form.armCm),
        shoulderCm: Number(form.shoulderCm),
        breastCm: Number(form.breastCm),
        buttocksCm: Number(form.buttocksCm),
      };

      const { data } = await api.post(`/api/manage/clients/${user.id}/metrics`, payload);
      setLatestSavedMeasurement(data);
      setHistory((prev) => [...prev, data]);
      onSaved(data);
      setValidationError("");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Measurement saving failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyDateFilter = () => {
    setActiveDateRange({ fromDate, toDate });
  };

  const handleClearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setActiveDateRange({ fromDate: "", toDate: "" });
  };

  const pickMeasurementByDate = (dateValue) => {
    if (!dateValue) return null;
    const matches = sortedHistory.filter((entry) => entry.measurementDate === dateValue);
    if (matches.length === 0) return null;
    return matches[matches.length - 1];
  };

  const compareA = pickMeasurementByDate(compareDateA);
  const compareB = pickMeasurementByDate(compareDateB);

  const comparisonRows = [
    { key: "weightKg", label: "Weight", unit: "kg" },
    { key: "bmi", label: "BMI", unit: "" },
    { key: "waistCm", label: "Waist", unit: "cm" },
    { key: "hipCm", label: "Hip", unit: "cm" },
  ];

  const displayDelta = (a, b, unit) => {
    if (a == null || b == null) return "-";
    const delta = Number(b) - Number(a);
    if (Number.isNaN(delta)) return "-";
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(2)}${unit ? ` ${unit}` : ""}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Body Metrics & Trends — {user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ padding: "1rem" }}>Loading…</p>
        ) : (
          <div className="edit-form">
            {!readOnly && (
              <form className="edit-form" onSubmit={handleSubmit}>
                {validationError && <p className="modal-error">{validationError}</p>}
                {error && <p className="modal-error">{error}</p>}

                {latestSavedMeasurement?.bmi != null && (
                  <div className="measurement-summary-card">
                    <p><strong>Latest BMI:</strong> {Number(latestSavedMeasurement.bmi).toFixed(2)}</p>
                    <p><strong>Measurement Date:</strong> {latestSavedMeasurement.measurementDate || "-"}</p>
                    <p><strong>Recorded At:</strong> {formatRecordedAt(latestSavedMeasurement.recordedAt)}</p>
                  </div>
                )}

                <div className="form-section-label">Body Measurements (Required)</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Measurement Date</label>
                    <input type="date" value={form.measurementDate} onChange={setField("measurementDate")} required />
                  </div>
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.heightCm} onChange={setField("heightCm")} placeholder="e.g. 170" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input type="number" step="0.01" min="0.01" value={form.weightKg} onChange={setField("weightKg")} placeholder="e.g. 72.5" required />
                  </div>
                  <div className="form-group">
                    <label>Waist (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.waistCm} onChange={setField("waistCm")} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Hip (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.hipCm} onChange={setField("hipCm")} required />
                  </div>
                  <div className="form-group">
                    <label>Arm (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.armCm} onChange={setField("armCm")} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Shoulder (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.shoulderCm} onChange={setField("shoulderCm")} required />
                  </div>
                  <div className="form-group">
                    <label>Breast (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.breastCm} onChange={setField("breastCm")} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Buttocks (cm)</label>
                    <input type="number" step="0.01" min="0.01" value={form.buttocksCm} onChange={setField("buttocksCm")} required />
                  </div>
                </div>

                <div className="modal-actions modal-actions--tight">
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? "Saving..." : "Save Measurement"}
                  </button>
                </div>
              </form>
            )}

            <div className="form-section-label">View Trends</div>

            <div className="trend-filter-row">
              <div className="form-group">
                <label>From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="trend-filter-actions">
                <button type="button" className="btn-save" onClick={handleApplyDateFilter}>Apply Filter</button>
                <button type="button" className="btn-cancel" onClick={handleClearDateFilter}>Clear</button>
              </div>
            </div>

            {historyLoading ? (
              <p className="empty-msg">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="empty-msg">No measurement data available.</p>
            ) : (
              <>
                {filteredHistory.length === 0 ? (
                  <p className="empty-msg">No measurements found in the selected date range.</p>
                ) : (
                  <>
                    <div className="trend-chart-solo">
                      <SimpleTrendChart
                        key={BMI_TREND_METRIC.key}
                        title={`${BMI_TREND_METRIC.label} Trend`}
                        unit={BMI_TREND_METRIC.unit}
                        color={BMI_TREND_METRIC.color}
                        entries={filteredHistory}
                        valueKey={BMI_TREND_METRIC.key}
                      />
                    </div>

                    <div className="trend-charts-grid">
                      {TREND_METRICS.map((metric) => (
                        <SimpleTrendChart
                          key={metric.key}
                          title={`${metric.label} Trend`}
                          unit={metric.unit}
                          color={metric.color}
                          entries={filteredHistory}
                          valueKey={metric.key}
                        />
                      ))}
                    </div>

                    <div className="form-section-label">Compare Two Dates</div>
                    <div className="trend-compare-controls">
                      <div className="form-group">
                        <label>Date A</label>
                        <select value={compareDateA} onChange={(e) => setCompareDateA(e.target.value)}>
                          <option value="">Select date</option>
                          {uniqueDates.map((dateValue) => (
                            <option key={`a-${dateValue}`} value={dateValue}>{dateValue}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date B</label>
                        <select value={compareDateB} onChange={(e) => setCompareDateB(e.target.value)}>
                          <option value="">Select date</option>
                          {uniqueDates.map((dateValue) => (
                            <option key={`b-${dateValue}`} value={dateValue}>{dateValue}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {compareA && compareB ? (
                      <div className="table-scroll">
                        <table className="manage-table measurement-history-table">
                          <thead>
                            <tr>
                              <th>Metric</th>
                              <th>{compareDateA}</th>
                              <th>{compareDateB}</th>
                              <th>Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonRows.map((row) => {
                              const valA = compareA[row.key];
                              const valB = compareB[row.key];
                              return (
                                <tr key={row.key}>
                                  <td>{row.label}</td>
                                  <td>{valA != null ? `${Number(valA).toFixed(2)}${row.unit ? ` ${row.unit}` : ""}` : "-"}</td>
                                  <td>{valB != null ? `${Number(valB).toFixed(2)}${row.unit ? ` ${row.unit}` : ""}` : "-"}</td>
                                  <td>{displayDelta(valA, valB, row.unit)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="empty-msg">Select two dates to compare measurements.</p>
                    )}

                    <div className="form-section-label">Measurement History (Chronological)</div>
                    <div className="table-scroll">
                      <table className="manage-table measurement-history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Height</th>
                            <th>Weight</th>
                            <th>BMI</th>
                            <th>Waist</th>
                            <th>Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map((entry) => (
                            <tr key={entry.measurementId || `${entry.measurementDate}-${entry.recordedAt}`}>
                              <td>{entry.measurementDate || "-"}</td>
                              <td>{entry.heightCm != null ? Number(entry.heightCm).toFixed(2) : "-"}</td>
                              <td>{entry.weightKg != null ? Number(entry.weightKg).toFixed(2) : "-"}</td>
                              <td>{entry.bmi != null ? Number(entry.bmi).toFixed(2) : "-"}</td>
                              <td>{entry.waistCm != null ? Number(entry.waistCm).toFixed(2) : "-"}</td>
                              <td>{formatRecordedAt(entry.recordedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FitnessGoalsModal = ({ user, onClose, selfManage = false, onSaved }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveErrorById, setSaveErrorById] = useState({});
  const [savingById, setSavingById] = useState({});
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignForm, setAssignForm] = useState({
    goal: "FAT_BURNING",
    otherGoalSpecification: "",
    instructorRequirements: "",
    allowTargetWeightUpdate: false,
    allowTargetParametersUpdate: false,
    allowTargetDateUpdate: false,
    targetWeightKg: "",
    targetParameters: "",
    targetCompletionDate: "",
    progressPercent: "",
    progressNotes: "",
    status: "ACTIVE",
  });
  const [editById, setEditById] = useState({});

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = selfManage
        ? "/api/manage/me/fitness-goals"
        : `/api/manage/clients/${user.id}/fitness-goals`;
      const { data } = await api.get(endpoint);
      const rows = Array.isArray(data) ? data : [];
      setGoals(rows);
      const initialEdit = rows.reduce((acc, g) => {
        acc[g.id] = {
          goal: g.goal || "FAT_BURNING",
          otherGoalSpecification: g.otherGoalSpecification ?? "",
          instructorRequirements: g.instructorRequirements ?? "",
          allowTargetWeightUpdate: Boolean(g.allowTargetWeightUpdate),
          allowTargetParametersUpdate: Boolean(g.allowTargetParametersUpdate),
          allowTargetDateUpdate: Boolean(g.allowTargetDateUpdate),
          status: g.status || "ACTIVE",
          targetWeightKg: g.targetWeightKg ?? "",
          targetParameters: g.targetParameters ?? "",
          targetCompletionDate: g.targetCompletionDate ?? "",
          progressPercent: g.progressPercent ?? "",
          progressNotes: g.progressNotes ?? "",
        };
        return acc;
      }, {});
      setEditById(initialEdit);
    } catch {
      setGoals([]);
      setError("Failed to load fitness goals.");
    } finally {
      setLoading(false);
    }
  }, [selfManage, user.id]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const setAssign = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setAssignForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateAssign = () => {
    if (!assignForm.instructorRequirements.trim()) {
      return "Instructor guidance is required.";
    }
    if (assignForm.goal === "OTHERS" && !assignForm.otherGoalSpecification.trim()) {
      return "Other goal specification is required for Other goal.";
    }
    if (assignForm.targetCompletionDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (assignForm.targetCompletionDate < today) {
        return "Target completion date cannot be in the past.";
      }
    }
    if (assignForm.targetWeightKg !== "") {
      const val = Number(assignForm.targetWeightKg);
      if (Number.isNaN(val) || val <= 0) {
        return "Target weight must be a positive number.";
      }
    }
    if (assignForm.progressPercent !== "") {
      const val = Number(assignForm.progressPercent);
      if (Number.isNaN(val) || val < 0 || val > 100) {
        return "Progress percent must be between 0 and 100.";
      }
    }
    return "";
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    setAssignError("");
    const validation = validateAssign();
    if (validation) {
      setAssignError(validation);
      return;
    }

    setSavingAssign(true);
    try {
      const payload = {
        goal: assignForm.goal,
        otherGoalSpecification: assignForm.goal === "OTHERS" ? assignForm.otherGoalSpecification.trim() : null,
        instructorRequirements: assignForm.instructorRequirements.trim(),
        allowTargetWeightUpdate: assignForm.allowTargetWeightUpdate,
        allowTargetParametersUpdate: assignForm.allowTargetParametersUpdate,
        allowTargetDateUpdate: assignForm.allowTargetDateUpdate,
        targetWeightKg: assignForm.targetWeightKg === "" ? null : Number(assignForm.targetWeightKg),
        targetParameters: assignForm.targetParameters.trim() || null,
        targetCompletionDate: assignForm.targetCompletionDate || null,
        progressPercent: assignForm.progressPercent === "" ? null : Number(assignForm.progressPercent),
        progressNotes: assignForm.progressNotes.trim() || null,
        status: assignForm.status,
      };
      await api.post(`/api/manage/clients/${user.id}/fitness-goals`, payload);
      setAssignForm((prev) => ({
        ...prev,
        instructorRequirements: "",
        otherGoalSpecification: "",
        targetWeightKg: "",
        targetParameters: "",
        targetCompletionDate: "",
        progressPercent: "",
        progressNotes: "",
      }));
      await loadGoals();
      onSaved?.();
    } catch (err) {
      setAssignError(err.response?.data || "Failed to assign goal.");
    } finally {
      setSavingAssign(false);
    }
  };

  const setGoalField = (goalId, field, value) => {
    setEditById((prev) => ({
      ...prev,
      [goalId]: { ...(prev[goalId] || {}), [field]: value },
    }));
  };

  const saveGoalUpdate = async (goalId) => {
    const payload = editById[goalId] || {};
    setSaveErrorById((prev) => ({ ...prev, [goalId]: "" }));

    if (!selfManage) {
      if (!payload.instructorRequirements || !payload.instructorRequirements.trim()) {
        setSaveErrorById((prev) => ({ ...prev, [goalId]: "Instructor guidance is required." }));
        return;
      }
      if (payload.goal === "OTHERS" && !String(payload.otherGoalSpecification || "").trim()) {
        setSaveErrorById((prev) => ({ ...prev, [goalId]: "Other goal specification is required for Other goal." }));
        return;
      }
    }

    if (payload.targetCompletionDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (payload.targetCompletionDate < today) {
        setSaveErrorById((prev) => ({ ...prev, [goalId]: "Target completion date cannot be in the past." }));
        return;
      }
    }
    if (payload.targetWeightKg !== "" && payload.targetWeightKg != null) {
      const val = Number(payload.targetWeightKg);
      if (Number.isNaN(val) || val <= 0) {
        setSaveErrorById((prev) => ({ ...prev, [goalId]: "Target weight must be a positive number." }));
        return;
      }
    }

    setSavingById((prev) => ({ ...prev, [goalId]: true }));
    try {
      if (selfManage) {
        await api.put(`/api/manage/me/fitness-goals/${goalId}`, {
          status: payload.status,
          targetWeightKg: payload.targetWeightKg === "" ? null : Number(payload.targetWeightKg),
          targetParameters: payload.targetParameters === "" ? null : payload.targetParameters,
          targetCompletionDate: payload.targetCompletionDate === "" ? null : payload.targetCompletionDate,
          progressPercent: payload.progressPercent === "" ? null : Number(payload.progressPercent),
          progressNotes: payload.progressNotes === "" ? null : payload.progressNotes,
        });
      } else {
        await api.put(`/api/manage/clients/${user.id}/fitness-goals/${goalId}`, {
          goal: payload.goal,
          otherGoalSpecification: payload.goal === "OTHERS" ? String(payload.otherGoalSpecification || "").trim() : null,
          instructorRequirements: String(payload.instructorRequirements || "").trim(),
          allowTargetWeightUpdate: Boolean(payload.allowTargetWeightUpdate),
          allowTargetParametersUpdate: Boolean(payload.allowTargetParametersUpdate),
          allowTargetDateUpdate: Boolean(payload.allowTargetDateUpdate),
          targetWeightKg: payload.targetWeightKg === "" ? null : Number(payload.targetWeightKg),
          targetParameters: payload.targetParameters === "" ? null : payload.targetParameters,
          targetCompletionDate: payload.targetCompletionDate === "" ? null : payload.targetCompletionDate,
          progressPercent: payload.progressPercent === "" ? null : Number(payload.progressPercent),
          progressNotes: payload.progressNotes === "" ? null : payload.progressNotes,
          status: payload.status,
        });
      }
      await loadGoals();
      onSaved?.();
    } catch (err) {
      setSaveErrorById((prev) => ({ ...prev, [goalId]: err.response?.data || "Failed to update goal." }));
    } finally {
      setSavingById((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {selfManage ? "My Fitness Goals" : `Fitness Goals - ${user.firstName} ${user.lastName}`}
          </h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>

        {!selfManage && (
          <form className="edit-form" onSubmit={submitAssign}>
            <div className="form-section-label">Assign New Goal</div>
            {assignError && <p className="modal-error">{assignError}</p>}

            <div className="form-row">
              <div className="form-group">
                <label>Goal Type</label>
                <select value={assignForm.goal} onChange={setAssign("goal")}>
                  {FITNESS_GOAL_OPTIONS.map((goal) => (
                    <option key={goal.value} value={goal.value}>{goal.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Initial Status</label>
                <select value={assignForm.status} onChange={setAssign("status")}>
                  {FITNESS_GOAL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{membershipLabel(status)}</option>
                  ))}
                </select>
              </div>
            </div>

            {assignForm.goal === "OTHERS" && (
              <div className="form-row">
                <div className="form-group full">
                  <label>Other Goal Specification</label>
                  <input value={assignForm.otherGoalSpecification} onChange={setAssign("otherGoalSpecification")} />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group full">
                <label>Instructor Guidance</label>
                <textarea
                  rows={3}
                  value={assignForm.instructorRequirements}
                  onChange={setAssign("instructorRequirements")}
                  placeholder="Provide measurable guidance for this goal"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label><input type="checkbox" checked={assignForm.allowTargetWeightUpdate} onChange={setAssign("allowTargetWeightUpdate")} /> Allow target weight updates</label>
              </div>
              <div className="form-group checkbox-group">
                <label><input type="checkbox" checked={assignForm.allowTargetParametersUpdate} onChange={setAssign("allowTargetParametersUpdate")} /> Allow target parameter updates</label>
              </div>
              <div className="form-group checkbox-group">
                <label><input type="checkbox" checked={assignForm.allowTargetDateUpdate} onChange={setAssign("allowTargetDateUpdate")} /> Allow target date updates</label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Weight (kg)</label>
                <input type="number" min="0.01" step="0.01" value={assignForm.targetWeightKg} onChange={setAssign("targetWeightKg")} />
              </div>
              <div className="form-group">
                <label>Target Completion Date</label>
                <input type="date" value={assignForm.targetCompletionDate} onChange={setAssign("targetCompletionDate")} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full">
                <label>Target Parameters</label>
                <input value={assignForm.targetParameters} onChange={setAssign("targetParameters")} placeholder="e.g. 3 cardio sessions/week" />
              </div>
            </div>

            <div className="modal-actions modal-actions--tight">
              <button type="submit" className="btn-save" disabled={savingAssign}>
                {savingAssign ? "Assigning..." : "Assign Goal"}
              </button>
            </div>
          </form>
        )}

        <div className="form-section-label">Assigned Goals</div>
        {error && <p className="modal-error">{error}</p>}
        {loading ? (
          <p className="empty-msg">Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="empty-msg">No goals assigned yet.</p>
        ) : (
          <div className="fitness-goals-list">
            {goals.map((goal) => {
              const edit = editById[goal.id] || {};
              const canEditWeight = selfManage ? Boolean(goal.allowTargetWeightUpdate) : true;
              const canEditParams = selfManage ? Boolean(goal.allowTargetParametersUpdate) : true;
              const canEditDate = selfManage ? Boolean(goal.allowTargetDateUpdate) : true;

              return (
                <div className="fitness-goal-card" key={goal.id}>
                  <div className="fitness-goal-card-header">
                    <h4>{fitnessGoalLabel(edit.goal || goal.goal)}</h4>
                    <span className={`membership-status-badge ${String(goal.status || "").toLowerCase()}`}>
                      {membershipLabel(goal.status)}
                    </span>
                  </div>

                  {goal.goal === "OTHERS" && goal.otherGoalSpecification && (
                    <p><strong>Other Goal:</strong> {goal.otherGoalSpecification}</p>
                  )}
                  <p><strong>Instructor Guidance:</strong> {goal.instructorRequirements || "-"}</p>

                  <div className="fitness-goal-grid">
                    <div>
                      <strong>Target Weight:</strong> {goal.targetWeightKg ?? "-"}
                    </div>
                    <div>
                      <strong>Target Date:</strong> {goal.targetCompletionDate || "-"}
                    </div>
                    <div>
                      <strong>Progress:</strong> {goal.progressPercent ?? 0}%
                    </div>
                    <div>
                      <strong>Approved:</strong> {goal.approvedByInstructor ? "Yes" : "No"}
                    </div>
                  </div>

                  <div className="edit-form">
                      {!selfManage && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Goal Type</label>
                              <select value={edit.goal ?? goal.goal} onChange={(e) => setGoalField(goal.id, "goal", e.target.value)}>
                                {FITNESS_GOAL_OPTIONS.map((option) => (
                                  <option key={`${goal.id}-goal-${option.value}`} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select value={edit.status ?? goal.status} onChange={(e) => setGoalField(goal.id, "status", e.target.value)}>
                                {FITNESS_GOAL_STATUS_OPTIONS.map((status) => (
                                  <option key={`${goal.id}-${status}`} value={status}>{membershipLabel(status)}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {(edit.goal ?? goal.goal) === "OTHERS" && (
                            <div className="form-row">
                              <div className="form-group full">
                                <label>Other Goal Specification</label>
                                <input
                                  value={edit.otherGoalSpecification ?? ""}
                                  onChange={(e) => setGoalField(goal.id, "otherGoalSpecification", e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          <div className="form-row">
                            <div className="form-group full">
                              <label>Instructor Guidance</label>
                              <textarea
                                rows={2}
                                value={edit.instructorRequirements ?? ""}
                                onChange={(e) => setGoalField(goal.id, "instructorRequirements", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group checkbox-group">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={Boolean(edit.allowTargetWeightUpdate)}
                                  onChange={(e) => setGoalField(goal.id, "allowTargetWeightUpdate", e.target.checked)}
                                />
                                Allow target weight updates
                              </label>
                            </div>
                            <div className="form-group checkbox-group">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={Boolean(edit.allowTargetParametersUpdate)}
                                  onChange={(e) => setGoalField(goal.id, "allowTargetParametersUpdate", e.target.checked)}
                                />
                                Allow target parameter updates
                              </label>
                            </div>
                            <div className="form-group checkbox-group">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={Boolean(edit.allowTargetDateUpdate)}
                                  onChange={(e) => setGoalField(goal.id, "allowTargetDateUpdate", e.target.checked)}
                                />
                                Allow target date updates
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="form-row">
                        <div className="form-group">
                          <label>{selfManage ? "Status" : "Progress %"}</label>
                          {selfManage ? (
                            <select value={edit.status ?? goal.status} onChange={(e) => setGoalField(goal.id, "status", e.target.value)}>
                              {FITNESS_GOAL_STATUS_OPTIONS.map((status) => (
                                <option key={`${goal.id}-${status}`} value={status}>{membershipLabel(status)}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={edit.progressPercent ?? ""}
                              onChange={(e) => setGoalField(goal.id, "progressPercent", e.target.value)}
                            />
                          )}
                        </div>
                        <div className="form-group">
                          <label>{selfManage ? "Progress %" : "Status"}</label>
                          {selfManage ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={edit.progressPercent ?? ""}
                              onChange={(e) => setGoalField(goal.id, "progressPercent", e.target.value)}
                            />
                          ) : (
                            <select value={edit.status ?? goal.status} onChange={(e) => setGoalField(goal.id, "status", e.target.value)}>
                              {FITNESS_GOAL_STATUS_OPTIONS.map((status) => (
                                <option key={`${goal.id}-status-${status}`} value={status}>{membershipLabel(status)}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Target Weight</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            disabled={!canEditWeight}
                            value={edit.targetWeightKg ?? ""}
                            onChange={(e) => setGoalField(goal.id, "targetWeightKg", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Target Completion Date</label>
                          <input
                            type="date"
                            disabled={!canEditDate}
                            value={edit.targetCompletionDate ?? ""}
                            onChange={(e) => setGoalField(goal.id, "targetCompletionDate", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group full">
                          <label>Target Parameters</label>
                          <input
                            disabled={!canEditParams}
                            value={edit.targetParameters ?? ""}
                            onChange={(e) => setGoalField(goal.id, "targetParameters", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group full">
                          <label>Progress Notes</label>
                          <textarea
                            rows={2}
                            value={edit.progressNotes ?? ""}
                            onChange={(e) => setGoalField(goal.id, "progressNotes", e.target.value)}
                          />
                        </div>
                      </div>

                      {saveErrorById[goal.id] && <p className="modal-error">{saveErrorById[goal.id]}</p>}
                      <div className="modal-actions modal-actions--tight">
                        <button
                          type="button"
                          className="btn-save"
                          onClick={() => saveGoalUpdate(goal.id)}
                          disabled={Boolean(savingById[goal.id])}
                        >
                          {savingById[goal.id] ? "Saving..." : "Save Goal Update"}
                        </button>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const WorkoutScheduleModal = ({ user, onClose, viewerRole, selfView = false, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [form, setForm] = useState(emptyWorkoutScheduleForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [permissionError, setPermissionError] = useState("");

  const canEdit = viewerRole === "INSTRUCTOR" && !selfView;

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      setError("");
      setPermissionError("");
      try {
        if (!selfView && !user?.id) {
          setError("Please select a member before assigning a workout schedule.");
          return;
        }

        const endpoint = selfView
          ? "/api/manage/me/workout-schedule"
          : `/api/manage/clients/${user.id}/workout-schedule`;
        const { data } = await api.get(endpoint);
        setSchedule(data);
        setForm(workoutScheduleToForm(data));
      } catch (err) {
        if (err.response?.status === 404) {
          setSchedule(null);
          setForm(emptyWorkoutScheduleForm());
        } else if (err.response?.status === 403) {
          setPermissionError(err.response?.data || "You are not authorized to access workout schedules.");
        } else {
          setError("Failed to load workout schedule.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [selfView, user?.id]);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess("");
    setPermissionError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPermissionError("");

    if (!canEdit) {
      setPermissionError("You are not authorized to modify this workout schedule.");
      return;
    }

    if (!user?.id) {
      setError("Please select a member before assigning a workout schedule.");
      return;
    }

    if (!form.trainingType.trim() || !form.fitnessGoal.trim() || !form.exercises.trim()
      || !form.durationMinutes || !form.frequencyPerWeek) {
      setError("All required schedule details must be provided.");
      return;
    }

    const durationMinutes = Number(form.durationMinutes);
    const frequencyPerWeek = Number(form.frequencyPerWeek);
    if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
      setError("Duration must be a positive number.");
      return;
    }
    if (Number.isNaN(frequencyPerWeek) || frequencyPerWeek <= 0) {
      setError("Frequency must be a positive number.");
      return;
    }

    const payload = {
      trainingType: form.trainingType.trim(),
      fitnessGoal: form.fitnessGoal.trim(),
      exercises: form.exercises.trim(),
      durationMinutes,
      frequencyPerWeek,
      specialInstructions: form.specialInstructions.trim() || null,
    };

    const hasExisting = Boolean(schedule?.id);
    const method = hasExisting ? "put" : "post";
    const endpoint = `/api/manage/clients/${user.id}/workout-schedule`;

    setSaving(true);
    try {
      const { data } = await api[method](endpoint, payload);
      setSchedule(data);
      setForm(workoutScheduleToForm(data));
      setSuccess(hasExisting ? "Workout schedule updated successfully." : "Workout schedule assigned successfully.");
      onSaved?.(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setPermissionError(err.response?.data || "You are not authorized to modify this workout schedule.");
      } else if (method === "put") {
        setError(err.response?.data || "Schedule update failed. Please try again.");
      } else {
        setError(err.response?.data || "Workout schedule saving failed. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMemberEditAttempt = () => {
    setPermissionError("You are not authorized to modify this workout schedule.");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {selfView ? "My Workout Schedule" : `Workout Schedule - ${user.firstName} ${user.lastName}`}
          </h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>

        {loading ? (
          <p className="empty-msg">Loading workout schedule...</p>
        ) : (
          <>
            {error && <p className="modal-error">{error}</p>}
            {permissionError && <p className="modal-error">{permissionError}</p>}
            {success && <p className="form-success">{success}</p>}

            {schedule ? (
              <div className="measurement-summary-card">
                <p><strong>Assigned Goal:</strong> {fitnessGoalLabel(schedule.fitnessGoal)}</p>
                <p><strong>Duration:</strong> {schedule.durationMinutes} minutes</p>
                <p><strong>Frequency:</strong> {schedule.frequencyPerWeek} sessions per week</p>
                <p><strong>Last Updated:</strong> {formatRecordedAt(schedule.updatedAt)}</p>
              </div>
            ) : (
              <p className="empty-msg">
                {canEdit ? "No workout schedule assigned yet. Create one below." : "No workout schedule assigned yet."}
              </p>
            )}

            <form className="edit-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Training Type</label>
                  <input
                    value={form.trainingType}
                    onChange={set("trainingType")}
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fitness Goal</label>
                  <select
                    value={form.fitnessGoal}
                    onChange={set("fitnessGoal")}
                    disabled={!canEdit}
                    required
                  >
                    {FITNESS_GOAL_OPTIONS.map((goal) => (
                      <option key={goal.value} value={goal.value}>{goal.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Exercises</label>
                  <textarea
                    rows={4}
                    value={form.exercises}
                    onChange={set("exercises")}
                    disabled={!canEdit}
                    placeholder="List workout exercises and sets"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.durationMinutes}
                    onChange={set("durationMinutes")}
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Frequency (sessions/week)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.frequencyPerWeek}
                    onChange={set("frequencyPerWeek")}
                    disabled={!canEdit}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Special Instructions</label>
                  <textarea
                    rows={3}
                    value={form.specialInstructions}
                    onChange={set("specialInstructions")}
                    disabled={!canEdit}
                    placeholder="Optional coach notes and cautions"
                  />
                </div>
              </div>

              <div className="modal-actions modal-actions--tight">
                {canEdit ? (
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? "Saving..." : schedule ? "Update Schedule" : "Assign Schedule"}
                  </button>
                ) : (
                  <button type="button" className="btn-cancel" onClick={handleMemberEditAttempt}>
                    Edit Schedule
                  </button>
                )}
              </div>
            </form>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Close</button>
            </div>
          </>
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

const UserTable = ({
  users,
  onEdit,
  onEditMetrics,
  onManageGoals,
  onManageWorkout,
  onEditEmployment,
  onOpenMemberProfile,
  onOpenHealthScreening,
  onRecordPayment,
  title,
  viewerRole,
  navigate,
}) => (
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
              <th>Health Risk</th>
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
                  {u.role === "CLIENT" ? (
                    <span className={`health-risk-badge ${u.highRiskMember ? "high" : "normal"}`}>
                      {u.highRiskMember ? "High Risk" : "Normal"}
                    </span>
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
                    <button className="btn-metrics" onClick={() => onEditMetrics(u)}>View Trends</button>
                  )}
                  {(viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && u.role === "CLIENT" && (
                    <button className="btn-goals" onClick={() => onManageGoals(u)}>Goals</button>
                  )}
                  {(viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && u.role === "CLIENT" && (
                    <button className="btn-workout" onClick={() => onManageWorkout(u)}>Workout</button>
                  )}
                  {(viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && u.role === "CLIENT" && (
                    <button className="btn-membership-profile" onClick={() => onOpenMemberProfile(u)}>Profile</button>
                  )}
                  {(viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && u.role === "CLIENT" && (
                    <button className="btn-health" onClick={() => onOpenHealthScreening(u)}>Health</button>
                  )}
                  {(viewerRole === "ADMIN" || viewerRole === "INSTRUCTOR") && u.role === "CLIENT" && (
                    <button className="btn-payment" onClick={() => onRecordPayment(u)}>Record Payment</button>
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
  const [goalsClient, setGoalsClient] = useState(null);
  const [workoutClient, setWorkoutClient] = useState(null);
  const [selfTrendsOpen, setSelfTrendsOpen] = useState(false);
  const [selfGoalsOpen, setSelfGoalsOpen] = useState(false);
  const [selfWorkoutOpen, setSelfWorkoutOpen] = useState(false);
  const [editingEmployment, setEditingEmployment] = useState(null); // employment modal
  const [recordingPayment, setRecordingPayment] = useState(null);
  const [screeningClient, setScreeningClient] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [membershipHistoryLoading, setMembershipHistoryLoading] = useState(false);
  const [membershipHistoryError, setMembershipHistoryError] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");
  const [renewingMembership, setRenewingMembership] = useState(false);
  const [renewMembershipError, setRenewMembershipError] = useState("");
  const [renewMembershipSuccess, setRenewMembershipSuccess] = useState("");
  const [renewMembershipConflict, setRenewMembershipConflict] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState("");
  const [approvalBusyId, setApprovalBusyId] = useState(null);
  const [rejectBusyId, setRejectBusyId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});
  const [emailFailures, setEmailFailures] = useState([]);
  const [emailFailuresLoading, setEmailFailuresLoading] = useState(false);
  const [emailFailuresError, setEmailFailuresError] = useState("");
  const [resendBusyId, setResendBusyId] = useState(null);
  const [retryReceiptBusyId, setRetryReceiptBusyId] = useState(null);

  const loadPendingApprovals = useCallback(async () => {
    if (role !== "ADMIN" && role !== "INSTRUCTOR") return;
    setPendingLoading(true);
    setPendingError("");
    try {
      const { data } = await api.get("/api/payments/approvals/pending");
      setPendingPayments(Array.isArray(data) ? data : []);
    } catch {
      setPendingPayments([]);
      setPendingError("Failed to load pending payment approvals.");
    } finally {
      setPendingLoading(false);
    }
  }, [role]);

  const loadEmailFailures = useCallback(async () => {
    if (role !== "ADMIN" && role !== "INSTRUCTOR") return;
    setEmailFailuresLoading(true);
    setEmailFailuresError("");
    try {
      const { data } = await api.get("/api/payments/email-failures");
      setEmailFailures(Array.isArray(data) ? data : []);
    } catch {
      setEmailFailures([]);
      setEmailFailuresError("Failed to load payment email failures.");
    } finally {
      setEmailFailuresLoading(false);
    }
  }, [role]);

  const loadMembershipHistory = useCallback(async (clientId) => {
    setMembershipHistoryLoading(true);
    setMembershipHistoryError("");
    try {
      const { data } = await api.get(`/api/membership-plans/history/${clientId}`);
      setMembershipHistory(Array.isArray(data) ? data : []);
    } catch {
      setMembershipHistory([]);
      setMembershipHistoryError("Failed to load membership history.");
    } finally {
      setMembershipHistoryLoading(false);
    }
  }, []);

  const loadPaymentHistory = useCallback(async (clientId) => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryError("");
    try {
      const { data } = await api.get(`/api/payments/history/${clientId}`);
      setPaymentHistory(Array.isArray(data) ? data : []);
    } catch {
      setPaymentHistory([]);
      setPaymentHistoryError("Unable to retrieve payment history.");
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, []);

  const refreshUserList = useCallback(async () => {
    if (role === "ADMIN") {
      const { data } = await api.get("/api/manage/users");
      setUsers(data);
      return data;
    }
    if (role === "INSTRUCTOR") {
      const { data } = await api.get("/api/manage/clients");
      setUsers(data);
      return data;
    }
    return [];
  }, [role]);

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
          const [clientsRes, plansRes] = await Promise.all([
            api.get("/api/manage/clients"),
            api.get("/api/membership-plans/active"),
          ]);
          setUsers(clientsRes.data);
          setMembershipPlans(plansRes.data);
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

  useEffect(() => {
    loadPendingApprovals();
  }, [loadPendingApprovals]);

  useEffect(() => {
    loadEmailFailures();
  }, [loadEmailFailures]);

  const handleEdit = (user) => setEditing(user);
  const closeModal = () => setEditing(null);
  const handleOpenMetrics = (user) => setEditingMetrics(user);
  const closeMetricsModal = () => setEditingMetrics(null);
  const handleOpenGoals = (user) => setGoalsClient(user);
  const closeGoalsModal = () => setGoalsClient(null);
  const handleOpenWorkout = (user) => setWorkoutClient(user);
  const closeWorkoutModal = () => setWorkoutClient(null);
  const handleOpenSelfTrends = () => setSelfTrendsOpen(true);
  const closeSelfTrendsModal = () => setSelfTrendsOpen(false);
  const handleOpenSelfGoals = () => setSelfGoalsOpen(true);
  const closeSelfGoalsModal = () => setSelfGoalsOpen(false);
  const handleOpenSelfWorkout = () => setSelfWorkoutOpen(true);
  const closeSelfWorkoutModal = () => setSelfWorkoutOpen(false);
  const handleOpenEmployment = (user) => setEditingEmployment(user);
  const closeEmploymentModal = () => setEditingEmployment(null);
  const handleOpenPaymentRecord = (user) => setRecordingPayment(user);
  const closePaymentRecordModal = () => setRecordingPayment(null);
  const handleOpenHealthScreening = (user) => setScreeningClient(user);
  const closeHealthScreeningModal = () => setScreeningClient(null);

  const handleOpenMemberProfile = async (user) => {
    setMemberProfile(user);
    setRenewMembershipError("");
    setRenewMembershipSuccess("");
    await Promise.all([
      loadMembershipHistory(user.id),
      loadPaymentHistory(user.id),
    ]);
  };

  const closeMemberProfile = () => {
    setMemberProfile(null);
    setMembershipHistory([]);
    setMembershipHistoryError("");
    setPaymentHistory([]);
    setPaymentHistoryError("");
    setRenewMembershipError("");
    setRenewMembershipSuccess("");
    setRenewMembershipConflict(null);
  };

  const submitMembershipRenewal = async (planId, overrideOverlap = false) => {
    if (!memberProfile) return;
    setRenewingMembership(true);
    setRenewMembershipError("");
    setRenewMembershipSuccess("");
    setRenewMembershipConflict(null);
    try {
      await api.post("/api/membership-plans/renew", {
        clientId: memberProfile.id,
        planId,
        overrideOverlap,
      });
      setRenewMembershipSuccess("Membership renewed successfully.");
      const [, refreshedUsers] = await Promise.all([
        loadMembershipHistory(memberProfile.id),
        refreshUserList(),
      ]);
      const updatedMember = (refreshedUsers || []).find((u) => u.id === memberProfile.id);
      if (updatedMember) {
        setMemberProfile(updatedMember);
      }
    } catch (err) {
      const response = err.response?.data;
      if (response && typeof response === "object") {
        setRenewMembershipConflict(response);
        setRenewMembershipError(response.message ?? "Failed to renew membership.");
      } else {
        setRenewMembershipError(response ?? "Failed to renew membership.");
      }
    } finally {
      setRenewingMembership(false);
    }
  };

  const handleRenewMembership = async (planId) => {
    await submitMembershipRenewal(planId, false);
  };

  const handleOverrideRenewMembership = async (planId) => {
    await submitMembershipRenewal(planId, true);
  };

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

  const handleViewProof = async (paymentId) => {
    try {
      const response = await api.get(`/api/payments/approvals/${paymentId}/proof`, {
        responseType: "blob",
      });
      const contentType = response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setPendingError("Failed to open proof document.");
    }
  };

  const handleApprovePayment = async (paymentId) => {
    setApprovalBusyId(paymentId);
    setPendingError("");
    try {
      await api.post(`/api/payments/approvals/${paymentId}/approve`);
      await loadPendingApprovals();
    } catch (err) {
      setPendingError(err.response?.data || "Failed to approve payment.");
    } finally {
      setApprovalBusyId(null);
    }
  };

  const handleRejectReasonChange = (paymentId, value) => {
    setRejectReasons((prev) => ({ ...prev, [paymentId]: value }));
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = (rejectReasons[paymentId] || "").trim();
    if (!reason) {
      setPendingError("Rejection reason is required.");
      return;
    }

    setRejectBusyId(paymentId);
    setPendingError("");
    try {
      await api.post(`/api/payments/approvals/${paymentId}/reject`, { reason });
      setRejectReasons((prev) => ({ ...prev, [paymentId]: "" }));
      await loadPendingApprovals();
    } catch (err) {
      setPendingError(err.response?.data || "Failed to reject payment.");
    } finally {
      setRejectBusyId(null);
    }
  };

  const handleViewReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/api/payments/${paymentId}/receipt`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setEmailFailuresError("Failed to open receipt.");
    }
  };

  const handleRetryReceipt = async (paymentId) => {
    setRetryReceiptBusyId(paymentId);
    setEmailFailuresError("");
    try {
      await api.post(`/api/payments/${paymentId}/retry-receipt`);
      await loadEmailFailures();
    } catch (err) {
      setEmailFailuresError(err.response?.data || "Failed to retry receipt generation.");
    } finally {
      setRetryReceiptBusyId(null);
    }
  };

  const handleResendEmail = async (paymentId) => {
    setResendBusyId(paymentId);
    setEmailFailuresError("");
    try {
      await api.post(`/api/payments/${paymentId}/resend-email`);
      await loadEmailFailures();
    } catch (err) {
      setEmailFailuresError(err.response?.data || "Failed to resend payment email.");
    } finally {
      setResendBusyId(null);
    }
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
              <>
                <button className="btn-attendance" onClick={() => navigate("/attendance")}>
                  Attendance
                </button>
                <button className="btn-membership" onClick={() => navigate("/membership-plans")}>
                  Membership Plans
                </button>
              </>
            )}
            {role === "CLIENT" && (
              <>
                <button className="btn-metrics" onClick={handleOpenSelfTrends}>
                  View Trends
                </button>
                <button className="btn-goals" onClick={handleOpenSelfGoals}>
                  Manage Goals
                </button>
                <button className="btn-workout" onClick={handleOpenSelfWorkout}>
                  Workout Schedule
                </button>
              </>
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
              onManageGoals={handleOpenGoals}
              onManageWorkout={handleOpenWorkout}
              onEditEmployment={handleOpenEmployment}
              onOpenMemberProfile={handleOpenMemberProfile}
              onOpenHealthScreening={handleOpenHealthScreening}
              onRecordPayment={handleOpenPaymentRecord}
              viewerRole={role}
              navigate={navigate}
              title={`${tableTitle} (${visibleUsers.length})`}
            />

            <div className="table-container pending-payments-section">
              <h2 className="section-title">Pending Bank Transfer Approvals ({pendingPayments.length})</h2>
              {pendingLoading && <p className="loading-msg">Loading pending approvals...</p>}
              {pendingError && <p className="error-msg">{pendingError}</p>}
              {!pendingLoading && !pendingError && pendingPayments.length === 0 && (
                <p className="loading-msg">No pending bank transfer payments.</p>
              )}

              {!pendingLoading && pendingPayments.length > 0 && (
                <div className="table-scroll">
                  <table className="manage-table">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Member</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Proof</th>
                        <th>Reject Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((p) => (
                        <tr key={p.paymentId}>
                          <td className="cell-id">{p.paymentId}</td>
                          <td className="cell-name">{p.memberName}</td>
                          <td>{p.membershipPlanName}</td>
                          <td>{p.paymentAmount}</td>
                          <td>{p.paymentDate}</td>
                          <td>{p.referenceNumber || "—"}</td>
                          <td>
                            <button className="btn-secondary-action" onClick={() => handleViewProof(p.paymentId)}>
                              View Proof
                            </button>
                          </td>
                          <td>
                            <input
                              className="reject-reason-input"
                              type="text"
                              value={rejectReasons[p.paymentId] || ""}
                              onChange={(e) => handleRejectReasonChange(p.paymentId, e.target.value)}
                              placeholder="Reason"
                            />
                          </td>
                          <td>
                            <div className="approval-actions">
                              <button
                                className="btn-edit"
                                onClick={() => handleApprovePayment(p.paymentId)}
                                disabled={approvalBusyId === p.paymentId || rejectBusyId === p.paymentId}
                              >
                                {approvalBusyId === p.paymentId ? "Approving..." : "Approve"}
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleRejectPayment(p.paymentId)}
                                disabled={approvalBusyId === p.paymentId || rejectBusyId === p.paymentId}
                              >
                                {rejectBusyId === p.paymentId ? "Rejecting..." : "Reject"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="table-container pending-payments-section">
              <h2 className="section-title">Payment Email Follow-ups ({emailFailures.length})</h2>
              {emailFailuresLoading && <p className="loading-msg">Loading payment email follow-ups...</p>}
              {emailFailuresError && <p className="error-msg">{emailFailuresError}</p>}
              {!emailFailuresLoading && !emailFailuresError && emailFailures.length === 0 && (
                <p className="loading-msg">No pending payment email follow-ups.</p>
              )}

              {!emailFailuresLoading && emailFailures.length > 0 && (
                <div className="table-scroll">
                  <table className="manage-table">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Member</th>
                        <th>Email</th>
                        <th>Receipt</th>
                        <th>Failure</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailFailures.map((item) => (
                        <tr key={item.paymentId}>
                          <td className="cell-id">{item.paymentId}</td>
                          <td className="cell-name">{item.memberName}</td>
                          <td>{item.memberEmail || "—"}</td>
                          <td>{item.receiptNumber || "Not generated"}</td>
                          <td>{item.emailFailureReason || "—"}</td>
                          <td>
                            <div className="approval-actions">
                              <button
                                className="btn-secondary-action"
                                onClick={() => handleRetryReceipt(item.paymentId)}
                                disabled={retryReceiptBusyId === item.paymentId || resendBusyId === item.paymentId}
                              >
                                {retryReceiptBusyId === item.paymentId ? "Retrying..." : "Retry Receipt"}
                              </button>
                              <button
                                className="btn-edit"
                                onClick={() => handleResendEmail(item.paymentId)}
                                disabled={retryReceiptBusyId === item.paymentId || resendBusyId === item.paymentId}
                              >
                                {resendBusyId === item.paymentId ? "Sending..." : "Resend Email"}
                              </button>
                              <button
                                className="btn-secondary-action"
                                onClick={() => handleViewReceipt(item.paymentId)}
                              >
                                View Receipt
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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

      {selfTrendsOpen && selfUser && (
        <ClientMetricsModal
          user={selfUser}
          onClose={closeSelfTrendsModal}
          onSaved={() => {}}
          readOnly
        />
      )}

      {goalsClient && (
        <FitnessGoalsModal
          user={goalsClient}
          onClose={closeGoalsModal}
          onSaved={async () => {
            await refreshUserList();
          }}
        />
      )}

      {selfGoalsOpen && selfUser && (
        <FitnessGoalsModal
          user={selfUser}
          selfManage
          onClose={closeSelfGoalsModal}
          onSaved={() => {}}
        />
      )}

      {workoutClient && (
        <WorkoutScheduleModal
          user={workoutClient}
          viewerRole={role}
          onClose={closeWorkoutModal}
          onSaved={async () => {
            await refreshUserList();
          }}
        />
      )}

      {selfWorkoutOpen && selfUser && (
        <WorkoutScheduleModal
          user={selfUser}
          viewerRole={role}
          selfView
          onClose={closeSelfWorkoutModal}
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

      {recordingPayment && (
        <PaymentRecordModal
          user={recordingPayment}
          onClose={closePaymentRecordModal}
          onSaved={async () => {
            const refreshedUsers = await refreshUserList();
            const refreshed = (refreshedUsers || []).find((u) => u.id === recordingPayment.id);
            if (refreshed) {
              setRecordingPayment(refreshed);
            }
          }}
        />
      )}

      {screeningClient && (
        <HealthScreeningModal
          user={screeningClient}
          onClose={closeHealthScreeningModal}
          onSaved={(saved) => {
            const updatedRisk = saved?.memberHighRisk ?? saved?.highRisk ?? false;

            setUsers((prev) =>
              prev.map((u) =>
                u.id === screeningClient.id
                  ? { ...u, highRiskMember: updatedRisk }
                  : u
              )
            );

            setMemberProfile((prev) => {
              if (!prev || prev.id !== screeningClient.id) return prev;
              return { ...prev, highRiskMember: updatedRisk };
            });
          }}
        />
      )}

      {memberProfile && (
        <MembershipProfileModal
          user={memberProfile}
          viewerRole={role}
          history={membershipHistory}
          historyLoading={membershipHistoryLoading}
          historyError={membershipHistoryError}
          paymentHistory={paymentHistory}
          paymentHistoryLoading={paymentHistoryLoading}
          paymentHistoryError={paymentHistoryError}
          membershipPlans={membershipPlans}
          renewing={renewingMembership}
          renewError={renewMembershipError}
          renewSuccess={renewMembershipSuccess}
          renewConflict={renewMembershipConflict}
          onRenew={handleRenewMembership}
          onRefresh={() => Promise.all([
            loadMembershipHistory(memberProfile.id),
            loadPaymentHistory(memberProfile.id),
          ])}
          onClose={closeMemberProfile}
        />
      )}
    </div>
  );
};

export default ManagePage;
