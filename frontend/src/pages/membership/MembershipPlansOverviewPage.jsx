import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, isAuthenticated } from "../../utils/auth";
import api, { publicApi } from "../../utils/api";
import fat2fitLogo from "../../assets/Fat2fit Logo.jpg";
import "./MembershipPlansOverviewPage.css";

const normalizePlan = (plan) => ({
  id: plan.id ?? null,
  planName: plan.planName ?? "Unknown Plan",
  description: plan.description ?? "",
  durationDays: plan.durationDays ?? null,
  monthlyPrice: plan.monthlyPrice ?? null,
  admissionFee: plan.admissionFee ?? null,
  maximumMembers: plan.maximumMembers ?? null,
  status: plan.status ?? "ACTIVE",
});

const getActiveMembershipPlans = async () => {
  const { data } = await publicApi.get("/api/membership-plans/active");
  if (!Array.isArray(data)) return [];
  return data.map(normalizePlan);
};

const getCurrentUserProfile = async () => {
  const { data } = await api.get("/api/auth/me");
  return data;
};

const getClientsMembershipAssignments = async () => {
  const { data } = await api.get("/api/manage/clients");
  return Array.isArray(data) ? data : [];
};

const createMembershipPlanByAdmin = async (payload) => {
  const { data } = await api.post("/api/membership-plans", payload);
  return normalizePlan(data);
};

const updateMembershipPlanByAdmin = async (planId, payload) => {
  const { data } = await api.put(`/api/membership-plans/${planId}`, payload);
  return normalizePlan(data);
};

const renewMembershipPlan = async ({
  clientId,
  plan,
  renewalDate,
}) => {
  const payload = {
    clientId,
    planId: plan.id,
    planName: plan.planName,
    durationMonths: plan.durationDays ? Math.max(1, Math.round(plan.durationDays / 30)) : 1,
    price: typeof plan.monthlyPrice === "number" ? plan.monthlyPrice : Number(plan.monthlyPrice),
    renewalDate,
  };

  const { data } = await api.post("/api/membership-plans/renew", payload);
  return data;
};

const membershipOverviewFallbackData = [
  {
    id: "single-day",
    planName: "Gym - Single",
    description: "Daily access for one member.",
    durationDays: 1,
    monthlyPrice: 750,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "single-1m",
    planName: "Gym - Single",
    description: "Standard individual monthly membership.",
    durationDays: 30,
    monthlyPrice: 5000,
    admissionFee: 2000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "single-3m",
    planName: "Gym - Single",
    description: "Quarterly individual membership at a better rate.",
    durationDays: 90,
    monthlyPrice: 13500,
    admissionFee: 2000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "single-6m",
    planName: "Gym - Single",
    description: "Half-year individual membership.",
    durationDays: 180,
    monthlyPrice: 24000,
    admissionFee: 2000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "single-1y",
    planName: "Gym - Single",
    description: "Annual individual membership with free admission.",
    durationDays: 365,
    monthlyPrice: 42000,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "family-2p-1m",
    planName: "Gym - Family (02 P)",
    description: "Family/couple membership for two people.",
    durationDays: 30,
    monthlyPrice: 9000,
    admissionFee: 3000,
    maximumMembers: 2,
    status: "ACTIVE",
  },
  {
    id: "family-2p-3m",
    planName: "Gym - Family (02 P)",
    description: "Three-month package for two people.",
    durationDays: 90,
    monthlyPrice: 24000,
    admissionFee: 3000,
    maximumMembers: 2,
    status: "ACTIVE",
  },
  {
    id: "family-2p-6m",
    planName: "Gym - Family (02 P)",
    description: "Six-month package for two people.",
    durationDays: 180,
    monthlyPrice: 42000,
    admissionFee: 3000,
    maximumMembers: 2,
    status: "ACTIVE",
  },
  {
    id: "family-2p-1y",
    planName: "Gym - Family (02 P)",
    description: "Annual two-person package with free admission.",
    durationDays: 365,
    monthlyPrice: 72000,
    admissionFee: 0,
    maximumMembers: 2,
    status: "ACTIVE",
  },
  {
    id: "family-3to5-1m",
    planName: "Gym - Family (3-5 P)",
    description: "Monthly package priced per member.",
    durationDays: 30,
    monthlyPrice: 4000,
    admissionFee: 750,
    maximumMembers: 5,
    status: "ACTIVE",
  },
  {
    id: "family-6plus-1m",
    planName: "Gym - Family (6 P to up)",
    description: "Monthly large-family package priced per member.",
    durationDays: 30,
    monthlyPrice: 3500,
    admissionFee: 500,
    maximumMembers: 6,
    status: "ACTIVE",
  },
  {
    id: "aerobics-day",
    planName: "Aerobics",
    description: "Per day aerobics access.",
    durationDays: 1,
    monthlyPrice: 750,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "aerobics-1m",
    planName: "Aerobics",
    description: "Monthly aerobics membership.",
    durationDays: 30,
    monthlyPrice: 5000,
    admissionFee: 1000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "zumba-day",
    planName: "Zumba",
    description: "Per day zumba access.",
    durationDays: 1,
    monthlyPrice: 750,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "zumba-1m",
    planName: "Zumba",
    description: "Monthly zumba membership.",
    durationDays: 30,
    monthlyPrice: 5000,
    admissionFee: 1000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "muay-thai-day",
    planName: "Muay Thai",
    description: "Per day Muay Thai access.",
    durationDays: 1,
    monthlyPrice: 750,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "muay-thai-1m",
    planName: "Muay Thai",
    description: "Monthly Muay Thai membership.",
    durationDays: 30,
    monthlyPrice: 5000,
    admissionFee: 1000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "combo-azy-1m",
    planName: "Aerobics/Zumba/Yoga",
    description: "Combined class package for one month.",
    durationDays: 30,
    monthlyPrice: 5000,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "personal-training-day",
    planName: "Personal Training",
    description: "One day personal training package.",
    durationDays: 1,
    monthlyPrice: 2500,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "group-training-day",
    planName: "Group Training (10 Persons)",
    description: "One day group package up to 10 people.",
    durationDays: 1,
    monthlyPrice: 10000,
    admissionFee: 0,
    maximumMembers: 10,
    status: "ACTIVE",
  },
  {
    id: "doctor-consult-3m",
    planName: "Doctor Consulting",
    description: "Consultation package once in 3 months.",
    durationDays: 90,
    monthlyPrice: 2000,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "counseling-inspection",
    planName: "Counseling",
    description: "Single inspection counseling package.",
    durationDays: null,
    monthlyPrice: 2500,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "physio-full-body",
    planName: "Physiotherapy (Full Body)",
    description: "Full body physiotherapy package.",
    durationDays: null,
    monthlyPrice: 5000,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "physio-head-shoulders",
    planName: "Physiotherapy (Head and Shoulders)",
    description: "Head and shoulders physiotherapy package.",
    durationDays: null,
    monthlyPrice: 3500,
    admissionFee: 0,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "gym-zumba-1m",
    planName: "Gym + Zumba",
    description: "One-month combined gym and zumba package.",
    durationDays: 30,
    monthlyPrice: 8000,
    admissionFee: 2000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
  {
    id: "gym-yoga-1m",
    planName: "Gym + Yoga",
    description: "One-month combined gym and yoga package.",
    durationDays: 30,
    monthlyPrice: 8000,
    admissionFee: 2000,
    maximumMembers: 1,
    status: "ACTIVE",
  },
];

const categoryOptions = ["All", "Single", "Couple", "Family", "Class", "Therapy", "Training"];
const durationOptions = ["All", "Day", "3 Months", "6 Months", "One Year", "Custom"];

const adminEmptyForm = {
  planName: "",
  description: "",
  durationDays: "",
  monthlyPrice: "",
  admissionFee: "",
  maximumMembers: "",
};

const normalizeCurrency = (value) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return "Currently unavailable.";
  return `Rs ${numeric.toLocaleString()}`;
};

const formatDuration = (durationDays) => {
  if (durationDays === 1) return "Day";
  if (durationDays === 90) return "3 Months";
  if (durationDays === 180) return "6 Months";
  if (durationDays === 365) return "One Year";
  return "Custom";
};

const planCategory = (planName) => {
  const name = (planName || "").toLowerCase();
  if (name.includes("single")) return "Single";
  if (name.includes("couple") || name.includes("02 p")) return "Couple";
  if (name.includes("family")) return "Family";
  if (name.includes("training")) return "Training";
  if (name.includes("physio") || name.includes("counsel") || name.includes("doctor")) return "Therapy";
  return "Class";
};

const planBenefits = (plan) => {
  const benefits = [];

  if (plan.maximumMembers && plan.maximumMembers > 1) {
    benefits.push(`Suitable for up to ${plan.maximumMembers} members.`);
  } else {
    benefits.push("Personalized access for individual goals.");
  }

  if (plan.admissionFee === 0) {
    benefits.push("Free admission included.");
  } else if (plan.admissionFee != null) {
    benefits.push(`Admission fee: ${normalizeCurrency(plan.admissionFee)}.`);
  }

  benefits.push(`Flexible duration option: ${formatDuration(plan.durationDays)}.`);

  if (plan.description) {
    benefits.push(plan.description);
  } else {
    benefits.push("Progress tracking and guided support included.");
  }

  return benefits;
};

const toCreatePayload = (form) => ({
  planName: form.planName.trim(),
  description: form.description.trim() || null,
  durationDays: Number(form.durationDays),
  monthlyPrice: Number(form.monthlyPrice),
  admissionFee: Number(form.admissionFee),
  maximumMembers: Number(form.maximumMembers),
});

const MembershipPlansOverviewPage = () => {
  const navigate = useNavigate();
  const role = getRole();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricingUnavailable, setPricingUnavailable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [durationFilter, setDurationFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [adminForm, setAdminForm] = useState(adminEmptyForm);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setPricingUnavailable(false);
      try {
        const apiPlans = await getActiveMembershipPlans();
        setPlans(apiPlans);
      } catch {
        setPlans(membershipOverviewFallbackData);
        setPricingUnavailable(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!role) return;

    const loadMe = async () => {
      try {
        const data = await getCurrentUserProfile();
        setMe(data);
      } catch {
        setMe(null);
      }
    };

    loadMe();
  }, [role]);

  useEffect(() => {
    if (role !== "ADMIN") return;

    const loadMembers = async () => {
      setMembersLoading(true);
      setMembersError("");
      try {
        const data = await getClientsMembershipAssignments();
        setMembers(data);
      } catch {
        setMembers([]);
        setMembersError("Failed to load registered members.");
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [role]);

  const membersByPlan = useMemo(() => {
    const grouped = members.reduce((acc, member) => {
      const planName = String(member.membershipPlanName || "").trim();
      if (!planName) {
        return acc;
      }
      if (!acc[planName]) {
        acc[planName] = [];
      }
      acc[planName].push(member);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [members]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (selectedCategory !== "All" && planCategory(plan.planName) !== selectedCategory) {
        return false;
      }

      if (durationFilter !== "All") {
        const durationLabel = formatDuration(plan.durationDays).toLowerCase();
        if (!durationLabel.includes(durationFilter.toLowerCase())) {
          return false;
        }
      }

      const text = `${plan.planName} ${plan.description || ""}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [plans, query, selectedCategory, durationFilter]);

  const onAdminChange = (event) => {
    const { name, value } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const createPlan = async (event) => {
    event.preventDefault();
    setMessage("");

    if (
      !adminForm.planName.trim() ||
      !adminForm.durationDays ||
      !adminForm.monthlyPrice ||
      adminForm.admissionFee === "" ||
      adminForm.maximumMembers === ""
    ) {
      setMessageType("error");
      setMessage("Please complete all required fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = toCreatePayload(adminForm);

      if (editingPlanId) {
        const updatedPlan = await updateMembershipPlanByAdmin(editingPlanId, payload);
        setPlans((prev) => prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)));
        setMessageType("success");
        setMessage("Membership plan updated successfully.");
      } else {
        const createdPlan = await createMembershipPlanByAdmin(payload);
        setPlans((prev) => [createdPlan, ...prev]);
        setMessageType("success");
        setMessage("Membership plan created successfully.");
      }

      setAdminForm(adminEmptyForm);
      setEditingPlanId(null);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data || "Unable to save the membership plan.");
    } finally {
      setSaving(false);
    }
  };

  const editPlan = (plan) => {
    if (role !== "ADMIN") return;

    if (!plan.id || Number.isNaN(Number(plan.id))) {
      setMessageType("error");
      setMessage("This plan cannot be edited because it is not synced with the server.");
      return;
    }

    setEditingPlanId(Number(plan.id));
    setAdminForm({
      planName: plan.planName ?? "",
      description: plan.description ?? "",
      durationDays: String(plan.durationDays ?? ""),
      monthlyPrice: String(plan.monthlyPrice ?? ""),
      admissionFee: String(plan.admissionFee ?? ""),
      maximumMembers: String(plan.maximumMembers ?? ""),
    });
    setMessageType("success");
    setMessage(`Editing plan: ${plan.planName}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingPlanId(null);
    setAdminForm(adminEmptyForm);
    setMessage("");
  };

  const joinPlan = async (plan) => {
    setMessage("");

    const authenticated = await isAuthenticated();
    const currentRole = getRole();

    if (!authenticated || !currentRole) {
      setMessageType("error");
      setMessage("Please register or log in before joining a membership plan.");
      navigate("/client/register");
      return;
    }

    if (currentRole === "CLIENT") {
      let verifiedUser = me;
      if (!verifiedUser?.id) {
        try {
          verifiedUser = await getCurrentUserProfile();
          setMe(verifiedUser);
        } catch {
          setMessageType("error");
          setMessage("Please register or log in before joining a membership plan.");
          navigate("/client/register");
          return;
        }
      }

      if (!plan.id) {
        setMessageType("error");
        setMessage("This plan is currently unavailable for online joining.");
        return;
      }

      navigate(`/payment/${plan.id}`);
      return;
    }

    if (!me?.id) {
      setMessageType("error");
      setMessage("Unable to identify your account. Please log in again.");
      return;
    }

    try {
      await renewMembershipPlan({
        clientId: Number(me.id),
        plan,
        renewalDate: new Date().toISOString().slice(0, 10),
      });
      setMessageType("success");
      setMessage(`Successfully joined ${plan.planName}.`);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data || "Failed to join this plan right now.");
    }
  };

  const ctaText = !role || role === "CLIENT" ? "Join Now" : role === "ADMIN" ? "Edit Plan" : "Select Plan";

  return (
    <div className="membership-overview-page">
      <div className="membership-overview-shell">
        <section className="membership-overview-hero">
          <div>
            <h1>Membership Plans Overview</h1>
            <p>
              Compare plan types, durations, prices, and benefits to choose what fits your fitness preferences.
              Every plan includes a clear red call-to-action so members can join quickly.
            </p>
          </div>
          <img src={fat2fitLogo} alt="Fat2Fit logo" className="membership-overview-logo" />
        </section>

        <section className="membership-overview-toolbar">
          <div>
            <p className="filter-label">Membership Type</p>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="filter-label">Duration</p>
            <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)}>
              {durationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="filter-label">Search</p>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find by plan name"
            />
          </div>
        </section>

        {pricingUnavailable && (
          <div className="membership-msg error">
            Pricing data unavailable from server. Showing the latest verified plan sheet values.
          </div>
        )}

        {message && <div className={`membership-msg ${messageType}`}>{message}</div>}

        {role === "ADMIN" && (
          <>
            <section className="membership-overview-admin">
              <h2>{editingPlanId ? "Admin: Edit Membership Plan" : "Admin: Create Membership Plan"}</h2>
              <p>
                {editingPlanId
                  ? "Update selected plan details, then save changes."
                  : "Create plans that members can join according to their preferences."}
              </p>
              <form className="membership-overview-admin-form" onSubmit={createPlan}>
                <input
                  name="planName"
                  value={adminForm.planName}
                  onChange={onAdminChange}
                  placeholder="Plan name"
                />
                <input
                  name="durationDays"
                  type="number"
                  min="1"
                  step="1"
                  value={adminForm.durationDays}
                  onChange={onAdminChange}
                  placeholder="Duration days"
                />
                <input
                  name="monthlyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={adminForm.monthlyPrice}
                  onChange={onAdminChange}
                  placeholder="Price"
                />
                <input
                  name="admissionFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={adminForm.admissionFee}
                  onChange={onAdminChange}
                  placeholder="Admission fee"
                />
                <input
                  name="maximumMembers"
                  type="number"
                  min="1"
                  step="1"
                  value={adminForm.maximumMembers}
                  onChange={onAdminChange}
                  placeholder="Maximum members"
                />
                <textarea
                  className="full"
                  name="description"
                  rows={3}
                  value={adminForm.description}
                  onChange={onAdminChange}
                  placeholder="Benefits / description"
                />
                <div className="membership-admin-actions full">
                  {editingPlanId && (
                    <button className="membership-btn secondary" type="button" onClick={cancelEdit}>
                      Cancel Edit
                    </button>
                  )}
                  <button className="membership-btn" type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}
                  </button>
                </div>
              </form>
            </section>

            <section className="membership-overview-admin membership-overview-registrations">
              <h2>Admin:Members Registered by Plan</h2>
              <p>View which plan each user has registered for.</p>

              {membersLoading ? (
                <div className="membership-overview-empty">Loading registered members...</div>
              ) : membersError ? (
                <div className="membership-msg error">{membersError}</div>
              ) : membersByPlan.length === 0 ? (
                <div className="membership-overview-empty">No members have registered for a plan yet.</div>
              ) : (
                <div className="membership-registration-groups">
                  {membersByPlan.map(([planName, planMembers]) => (
                    <article key={planName} className="membership-registration-group">
                      <h3>{planName}</h3>
                      <span>{planMembers.length} member(s)</span>

                      <div className="membership-registration-table-wrap">
                        <table className="membership-registration-table">
                          <thead>
                            <tr>
                              <th>Member</th>
                              <th>Email</th>
                              <th>Registered Plan</th>
                              <th>Status</th>
                              <th>Period</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planMembers.map((member) => (
                              <tr key={member.id}>
                                <td>{`${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unnamed"}</td>
                                <td>{member.email || "-"}</td>
                                <td>{member.membershipPlanName || "-"}</td>
                                <td>{member.membershipStatus || "-"}</td>
                                <td>
                                  {member.membershipStartDate && member.membershipEndDate
                                    ? `${member.membershipStartDate} to ${member.membershipEndDate}`
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {loading ? (
          <div className="membership-overview-empty">Loading membership plans...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="membership-overview-empty">
            No plans match your filters. Try another membership type or clear search.
          </div>
        ) : (
          <section className="membership-overview-grid">
            {filteredPlans.map((plan, index) => (
              <article className="membership-plan-card" key={`${plan.planName}-${plan.id || index}`}>
                <h3>{plan.planName}</h3>
                <div className="membership-plan-meta">
                  Type: {planCategory(plan.planName)} | Duration: {formatDuration(plan.durationDays)}
                </div>

                <div className="membership-plan-price">
                  {plan.monthlyPrice == null ? "Currently unavailable." : normalizeCurrency(plan.monthlyPrice)}
                  <small>
                    Admission: {plan.admissionFee == null ? "Currently unavailable." : normalizeCurrency(plan.admissionFee)}
                  </small>
                </div>

                <ul className="membership-plan-benefits">
                  {planBenefits(plan).map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="membership-btn"
                  onClick={() => (role === "ADMIN" ? editPlan(plan) : joinPlan(plan))}
                  disabled={plan.monthlyPrice == null}
                >
                  {ctaText}
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default MembershipPlansOverviewPage;
