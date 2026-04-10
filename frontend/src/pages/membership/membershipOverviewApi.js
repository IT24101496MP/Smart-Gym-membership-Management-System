import api, { publicApi } from "../../utils/api";

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

export const getActiveMembershipPlans = async () => {
  const { data } = await publicApi.get("/api/membership-plans/active");
  if (!Array.isArray(data)) return [];
  return data.map(normalizePlan);
};

export const getCurrentUserProfile = async () => {
  const { data } = await api.get("/api/auth/me");
  return data;
};

export const getClientsMembershipAssignments = async () => {
  const { data } = await api.get("/api/manage/clients");
  return Array.isArray(data) ? data : [];
};

export const createMembershipPlanByAdmin = async (payload) => {
  const { data } = await api.post("/api/membership-plans", payload);
  return normalizePlan(data);
};

export const updateMembershipPlanByAdmin = async (planId, payload) => {
  const { data } = await api.put(`/api/membership-plans/${planId}`, payload);
  return normalizePlan(data);
};

export const renewMembershipPlan = async ({
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
