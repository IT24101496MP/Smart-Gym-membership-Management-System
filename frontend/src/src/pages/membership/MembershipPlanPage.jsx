import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { logout } from "../../utils/auth";
import "./MembershipPlanPage.css";

const emptyForm = {
  planName: "",
  description: "",
  durationDays: "",
  monthlyPrice: "",
  admissionFee: "",
  maximumMembers: "",
};

const toPayload = (form) => ({
  planName: form.planName.trim(),
  description: form.description.trim() || null,
  durationDays: Number(form.durationDays),
  monthlyPrice: Number(form.monthlyPrice),
  admissionFee: Number(form.admissionFee),
  maximumMembers: Number(form.maximumMembers),
});

const MembershipPlanPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const editing = useMemo(() => plans.find((p) => p.id === editingPlanId) || null, [plans, editingPlanId]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/membership-plans");
      setPlans(data);
    } catch (err) {
      setMessage(err.response?.data || "Failed to load membership plans.");
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const next = {};

    if (!form.planName.trim()) next.planName = "Plan name is required.";

    if (form.durationDays === "") next.durationDays = "Duration is required.";
    else if (!Number.isInteger(Number(form.durationDays)) || Number(form.durationDays) <= 0)
      next.durationDays = "Duration must be a positive whole number of days.";

    if (form.monthlyPrice === "") next.monthlyPrice = "Monthly price is required.";
    else if (Number.isNaN(Number(form.monthlyPrice)) || Number(form.monthlyPrice) < 0)
      next.monthlyPrice = "Monthly price cannot be negative.";

    if (form.admissionFee === "") next.admissionFee = "Admission fee is required.";
    else if (Number.isNaN(Number(form.admissionFee)) || Number(form.admissionFee) < 0)
      next.admissionFee = "Admission fee cannot be negative.";

    if (form.maximumMembers === "") next.maximumMembers = "Maximum members is required.";
    else if (!Number.isInteger(Number(form.maximumMembers)) || Number(form.maximumMembers) < 0)
      next.maximumMembers = "Maximum members cannot be negative.";

    return next;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPlanId(null);
    setErrors({});
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMessage("");

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingPlanId) {
        const { data } = await api.put(`/api/membership-plans/${editingPlanId}`, payload);
        setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        setMessage("Membership plan updated successfully.");
      } else {
        const { data } = await api.post("/api/membership-plans", payload);
        setPlans((prev) => [data, ...prev]);
        setMessage("Membership plan created successfully.");
      }
      resetForm();
    } catch (err) {
      setMessage(err.response?.data || "Failed to save membership plan.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (plan) => {
    setEditingPlanId(plan.id);
    setForm({
      planName: plan.planName ?? "",
      description: plan.description ?? "",
      durationDays: String(plan.durationDays ?? ""),
      monthlyPrice: String(plan.monthlyPrice ?? ""),
      admissionFee: String(plan.admissionFee ?? ""),
      maximumMembers: String(plan.maximumMembers ?? ""),
    });
    setErrors({});
    setMessage("");
  };

  const deactivatePlan = async (plan) => {
    setMessage("");
    try {
      const { data } = await api.put(`/api/membership-plans/${plan.id}/status`, { status: "INACTIVE" });
      setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      if (editingPlanId === plan.id) {
        setEditingPlanId(data.id);
      }
      setMessage(`Plan '${plan.planName}' deactivated.`);
    } catch (err) {
      setMessage(err.response?.data || "Failed to deactivate plan.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="membership-page">
      <div className="membership-container">
        <div className="membership-header">
          <div>
            <h1>Create Membership Plan</h1>
            <p>Manage plan pricing, duration, limits, and status.</p>
          </div>
          <div className="membership-header-actions">
            <button className="btn-back" onClick={() => navigate("/manage")}>← Manage</button>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {message && <p className="message-box">{message}</p>}

        <form className="plan-form" onSubmit={onSave}>
          <h2>{editing ? "Update Membership Plan" : "New Membership Plan"}</h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Plan Name *</label>
              <input name="planName" value={form.planName} onChange={onChange} />
              {errors.planName && <span className="field-error">{errors.planName}</span>}
            </div>

            <div className="form-group">
              <label>Duration (Days) *</label>
              <input type="number" min="1" step="1" name="durationDays" value={form.durationDays} onChange={onChange} />
              {errors.durationDays && <span className="field-error">{errors.durationDays}</span>}
            </div>

            <div className="form-group">
              <label>Monthly Price *</label>
              <input type="number" min="0" step="0.01" name="monthlyPrice" value={form.monthlyPrice} onChange={onChange} />
              {errors.monthlyPrice && <span className="field-error">{errors.monthlyPrice}</span>}
            </div>

            <div className="form-group">
              <label>Admission Fee *</label>
              <input type="number" min="0" step="0.01" name="admissionFee" value={form.admissionFee} onChange={onChange} />
              {errors.admissionFee && <span className="field-error">{errors.admissionFee}</span>}
            </div>

            <div className="form-group">
              <label>Maximum Members *</label>
              <input type="number" min="0" step="1" name="maximumMembers" value={form.maximumMembers} onChange={onChange} />
              {errors.maximumMembers && <span className="field-error">{errors.maximumMembers}</span>}
            </div>

            <div className="form-group form-group-wide">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={onChange} rows={3} />
            </div>
          </div>

          <div className="form-actions">
            {editing && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Save"}
            </button>
          </div>
        </form>

        <div className="plan-list-card">
          <h2>Plan List ({plans.length})</h2>

          {loading ? (
            <p className="list-message">Loading plans...</p>
          ) : plans.length === 0 ? (
            <p className="list-message">No membership plans found.</p>
          ) : (
            <div className="table-scroll">
              <table className="plan-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Duration</th>
                    <th>Monthly Price</th>
                    <th>Admission Fee</th>
                    <th>Max Members</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td>{plan.planName}</td>
                      <td>{plan.durationDays} days</td>
                      <td>{plan.monthlyPrice}</td>
                      <td>{plan.admissionFee}</td>
                      <td>{plan.maximumMembers}</td>
                      <td>
                        <span className={`status-badge ${plan.status === "ACTIVE" ? "active" : "inactive"}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <button className="btn-edit" onClick={() => startEdit(plan)}>Edit</button>
                        {plan.status === "ACTIVE" && (
                          <button className="btn-deactivate" onClick={() => deactivatePlan(plan)}>
                            Deactivate
                          </button>
                        )}
                      </td>
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

export default MembershipPlanPage;
