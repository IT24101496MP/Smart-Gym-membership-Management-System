const API_BASE = "http://localhost:8080";
const FRONTEND_BASE = "http://localhost:5173";

function uniqueEmail(prefix = "client.qa") {
  const rand = Math.floor(Math.random() * 100000);
  return `${prefix}+${Date.now()}_${rand}@example.com`;
}

function uniqueSriLankaMobile() {
  const n = Math.floor(100000000 + Math.random() * 900000000); // 9+ digits source
  return `0${n}`.slice(0, 10);
}

function parseIsoDate(isoDateString) {
  const d = new Date(`${isoDateString}T00:00:00.000Z`);
  return d;
}

function addDaysUTC(isoDateString, daysToAdd) {
  const d = parseIsoDate(isoDateString);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

function loginJson({ identifier, password }) {
  return cy
    .request({
      method: "POST",
      url: `${API_BASE}/api/auth/login`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: { identifier, password },
    })
    .then((resp) => {
      expect(resp.status, resp.body?.toString?.() || "").to.eq(200);
      expect(resp.body).to.have.property("accessToken");
      expect(resp.body).to.have.property("refreshToken");
      return resp.body;
    });
}

function getAuthMe(accessToken) {
  return cy
    .request({
      method: "GET",
      url: `${API_BASE}/api/auth/me`,
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      return resp.body;
    });
}

function postMultipart(url, formData, token) {
  return cy.visit(`${FRONTEND_BASE}/login`, { failOnStatusCode: false }).then(() => {
    return cy.window().then((win) => {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      return win.fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
    });
  });
}

function registerClientClientRegister({ client, clientPassword }) {
  const fd = new FormData();

  fd.append("firstName", client.firstName);
  fd.append("lastName", client.lastName);
  fd.append("age", String(client.age));
  fd.append("dateOfBirth", client.dateOfBirth);
  fd.append("gender", client.gender);
  fd.append("phoneNumber", client.phoneNumber);
  fd.append("email", client.email);
  fd.append("address", client.address);
  fd.append("password", clientPassword);

  return postMultipart(`${API_BASE}/api/client/register`, fd).then(async (resp) => {
    const text = await resp.text().catch(() => "");
    expect(resp.status).to.be.oneOf([200, 201, 409]); // 409 can happen if test data collides
    return { resp, text };
  });
}

function createMembershipPlan({ plan, adminAccessToken }) {
  return cy
    .request({
      method: "POST",
      url: `${API_BASE}/api/membership-plans`,
      failOnStatusCode: false,
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        "Content-Type": "application/json",
      },
      body: plan,
    })
    .then((resp) => {
      expect([200, 201].includes(resp.status), resp.body?.toString?.() || "").to.eq(true);
      expect(resp.body).to.have.property("id");
      return resp.body;
    });
}

function setMembershipPlanStatus({ planId, status, adminAccessToken }) {
  return cy
    .request({
      method: "PUT",
      url: `${API_BASE}/api/membership-plans/${planId}/status`,
      failOnStatusCode: false,
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        "Content-Type": "application/json",
      },
      body: { status },
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      return resp.body;
    });
}

function confirmMockPayment({ clientId, planId, paymentReference, accessToken }) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return cy
    .request({
      method: "POST",
      url: `${API_BASE}/api/payments/confirm`,
      failOnStatusCode: false,
      headers,
      body: { clientId, planId, paymentReference },
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      return resp.body;
    });
}

function getMembershipHistory({ clientId, accessToken }) {
  return cy
    .request({
      method: "GET",
      url: `${API_BASE}/api/membership-plans/history/${clientId}`,
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body).to.be.an("array");
      return resp.body;
    });
}

function waitForClientMembershipActive({ clientAccessToken, timeoutMs = 5000, intervalMs = 250 }) {
  const started = Date.now();

  const pollOnce = () => {
    return getAuthMe(clientAccessToken).then((me) => {
      if (me.membershipStatus === "ACTIVE" || me.membershipStatus?.toLowerCase?.() === "active") {
        return me;
      }

      if (Date.now() - started > timeoutMs) {
        throw new Error(`Timed out waiting for membershipStatus ACTIVE. Last value: ${me.membershipStatus}`);
      }

      return cy.wait(intervalMs).then(pollOnce);
    });
  };

  return pollOnce();
}

function setupPlanAndClient({ planOverrides = {}, clientOverrides = {} } = {}) {
  return cy.fixture("users.json").then((users) => {
    const adminIdentifier = users.admin.identifier;
    const adminPassword = users.admin.password;
    const clientPassword = users.client?.password || "Password123!";

    return cy.fixture("membershipData.json").then((membershipDefaults) => {
      return loginJson({ identifier: adminIdentifier, password: adminPassword }).then((adminTokens) => {
        const plan = {
          planName: `${membershipDefaults.planNamePrefix || "QA Membership Plan"}_${Date.now()}`,
          description: membershipDefaults.description || "QA membership plan created by Cypress",
          durationDays: membershipDefaults.durationDays ?? 30,
          monthlyPrice: membershipDefaults.monthlyPrice ?? 1000,
          admissionFee: membershipDefaults.admissionFee ?? 100,
          maximumMembers: membershipDefaults.maximumMembers ?? 200,
          ...planOverrides,
        };

        return createMembershipPlan({ plan, adminAccessToken: adminTokens.accessToken }).then((createdPlan) => {
          const client = {
            firstName: "QA",
            lastName: `Client_${Date.now()}`,
            age: 25,
            dateOfBirth: "2000-01-01",
            gender: "MALE",
            phoneNumber: uniqueSriLankaMobile(),
            email: uniqueEmail("client.qa"),
            address: "123 Main Street, Colombo",
            ...clientOverrides,
          };

          return registerClientClientRegister({ client, clientPassword }).then(() => {
            return loginJson({ identifier: client.email, password: clientPassword }).then((clientTokens) => {
              return getAuthMe(clientTokens.accessToken).then((me) => {
                return {
                  adminTokens,
                  clientTokens,
                  createdPlan,
                  client,
                  clientId: me.id,
                };
              });
            });
          });
        });
      });
    });
  });
}

module.exports = {
  API_BASE,
  FRONTEND_BASE,
  uniqueEmail,
  uniqueSriLankaMobile,
  parseIsoDate,
  addDaysUTC,
  loginJson,
  getAuthMe,
  createMembershipPlan,
  setMembershipPlanStatus,
  confirmMockPayment,
  getMembershipHistory,
  waitForClientMembershipActive,
  setupPlanAndClient,
  registerClientClientRegister,
};

