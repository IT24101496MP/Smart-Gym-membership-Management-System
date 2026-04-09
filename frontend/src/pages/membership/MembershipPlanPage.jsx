import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { getRole, logout } from "../../utils/auth";
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

const currency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const toDurationMonths = (durationDays) => Math.max(1, Math.ceil(Number(durationDays || 0) / 30));

const totalAmountForPlan = (plan) => {
  if (!plan) return 0;
  const months = toDurationMonths(plan.durationDays);
  return Number(plan.admissionFee || 0) + Number(plan.monthlyPrice || 0) * months;
};

const MembershipSelectionView = ({ navigate, handleLogout }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [plansRes, meRes] = await Promise.all([
          api.get("/api/membership-plans/active"),
          api.get("/api/manage/me"),
        ]);
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
        setClient(meRes.data);

        if (Array.isArray(plansRes.data) && plansRes.data.length > 0) {
          setSelectedPlanId(String(plansRes.data[0].id));
        }
      } catch {
        setError("Failed to load active membership plans.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const durationMonths = toDurationMonths(selectedPlan?.durationDays);
  const totalAmount = totalAmountForPlan(selectedPlan);

  const proceedToSummary = () => {
    setError("");
    setSuccess("");
    if (!selectedPlan) return;
    setShowSummary(true);
  };

  const confirmAndPay = async () => {
    if (!selectedPlan || !client?.id) return;
    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/api/membership-plans/renew", {
        clientId: client.id,
        planId: selectedPlan.id,
        durationMonths,
        price: totalAmount,
      });
      setSuccess("Payment confirmed and membership activated successfully.");
      setShowSummary(false);
    } catch (err) {
      const response = err.response?.data;
      if (response && typeof response === "object") {
        setError(response.message || "Unable to complete membership activation.");
      } else {
        setError(response || "Unable to complete membership activation.");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="membership-page member-mode">
      <div className="membership-container">
        <div className="membership-header">
          <div>
            <h1>Choose Your Membership</h1>
            <p>Select one active plan, review pricing, and confirm before payment redirect.</p>
          </div>
          <div className="membership-header-actions">
            <button className="btn-back" onClick={() => navigate("/manage")}>← Manage</button>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {error && <p className="message-box message-error">{error}</p>}
        {success && <p className="message-box message-success">{success}</p>}

        {loading ? (
          <div className="plan-list-card"><p className="list-message">Loading active plans...</p></div>
        ) : plans.length === 0 ? (
          <div className="plan-list-card"><p className="list-message">No active plans available.</p></div>
        ) : (
          <>
            <div className="member-plans-grid">
              {plans.map((plan) => {
                const selected = String(plan.id) === selectedPlanId;
                const months = toDurationMonths(plan.durationDays);
                const total = totalAmountForPlan(plan);
                return (
                  <label key={plan.id} className={`member-plan-card ${selected ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="selectedMembershipPlan"
                      value={String(plan.id)}
                      checked={selected}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                    />
                    <div className="member-plan-head">
                      <h3>{plan.planName}</h3>
                      <span className="status-badge active">ACTIVE</span>
                    </div>
                    <p className="member-plan-benefits">{plan.description || "Benefits details will be shared at onboarding."}</p>
                    <ul className="member-plan-meta">
                      <li>Duration: {plan.durationDays} days ({months} month{months > 1 ? "s" : ""})</li>
                      <li>Monthly Price: {currency(plan.monthlyPrice)}</li>
                      <li>Admission Fee: {currency(plan.admissionFee)}</li>
                      <li>Total Amount: {currency(total)}</li>
                    </ul>
                  </label>
                );
              })}
            </div>

            {selectedPlan && (
              <div className="plan-list-card payment-summary-card">
                <h2>Payment Summary</h2>
                <p className="summary-line"><strong>Selected Plan:</strong> {selectedPlan.planName}</p>
                <p className="summary-line"><strong>Duration:</strong> {selectedPlan.durationDays} days ({durationMonths} month{durationMonths > 1 ? "s" : ""})</p>
                <p className="summary-line"><strong>Admission Fee:</strong> {currency(selectedPlan.admissionFee)}</p>
                <p className="summary-line"><strong>Total Amount:</strong> {currency(totalAmount)}</p>
                <div className="form-actions">
                  {!showSummary ? (
                    <button type="button" className="btn-primary" onClick={proceedToSummary}>
                      Proceed to Payment
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn-secondary" onClick={() => setShowSummary(false)}>
                        Cancel
                      </button>
                      <button type="button" className="btn-primary" onClick={confirmAndPay} disabled={processing}>
                        {processing ? "Redirecting..." : "Confirm and Pay"}
                      </button>
                    </>
                  )}
                </div>
                {showSummary && (
                  <p className="summary-note">
                    Confirming will proceed to payment gateway and activate your selected membership plan.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const MembershipPlanPage = () => {
  const navigate = useNavigate();
  const role = getRole();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const editing = useMemo(() => plans.find((p) => p.id === editingPlanId) || null, [plans, editingPlanId]);

  const adminMode = role === "ADMIN";

  useEffect(() => {
    if (!adminMode) {
      return;
    }
    loadPlans();
  }, [adminMode]);

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

  const activatePlan = async (plan) => {
    setMessage("");
    try {
      const { data } = await api.put(`/api/membership-plans/${plan.id}/status`, { status: "ACTIVE" });
      setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      if (editingPlanId === plan.id) {
        setEditingPlanId(data.id);
      }
      setMessage(`Plan '${plan.planName}' activated.`);
    } catch (err) {
      setMessage(err.response?.data || "Failed to activate plan.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!adminMode) {
    return <MembershipSelectionView navigate={navigate} handleLogout={handleLogout} />;
  }

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
                        {plan.status === "INACTIVE" && (
                          <button className="btn-activate" onClick={() => activatePlan(plan)}>
                            Activate
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
