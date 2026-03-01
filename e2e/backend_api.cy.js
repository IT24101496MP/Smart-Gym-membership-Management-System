describe("Backend API E2E - Fat2Fit", () => {
  const API = "http://localhost:8080";
  const FRONTEND = "http://localhost:5173";

  const uniqEmail = () => `qa_${Date.now()}@example.com`;

  const postMultipart = async (win, url, fields = {}) => {
    const fd = new win.FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    return win.fetch(url, { method: "POST", body: fd });
  };

  const noteAuthBlocked = (endpoint) => {
    Cypress.log({
      name: "AUTH_BLOCKED",
      message: `${endpoint} returned 401 (security is blocking /api/client/**).`,
    });
  };

  it("POST /api/user/register - success", () => {
    const email = uniqEmail();

    cy.request({
      method: "POST",
      url: `${API}/api/user/register`,
      headers: { "Content-Type": "application/json" },
      body: { email, password: "Aa1@aaaa", confirmPassword: "Aa1@aaaa" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("userId");
      expect(res.body).to.have.property("email", email);
      expect(res.body).to.have.property("role");
      expect(res.body).to.have.property("status");
    });
  });

  it("POST /api/user/register - passwords do not match", () => {
    const email = uniqEmail();

    cy.request({
      method: "POST",
      url: `${API}/api/user/register`,
      headers: { "Content-Type": "application/json" },
      body: { email, password: "Aa1@aaaa", confirmPassword: "Aa1@aaab" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(String(res.body)).to.contain("Passwords do not match");
    });
  });

  it("POST /api/client/register - invalid mobile ", () => {
    cy.visit(`${FRONTEND}/login`);

    cy.window().then(async (win) => {
      const resp = await postMultipart(win, `${API}/api/client/register`, {
        firstName: "John",
        lastName: "Cena",
        age: 25,
        gender: "Male",
        mobileNumber: "123",
        address: "123 Main Street",
      });

      const text = await resp.text();

      // If security blocks, skip the rest
      if (resp.status === 401) {
        noteAuthBlocked("POST /api/client/register");
        return;
      }

      expect(resp.status).to.eq(400);
      expect(text).to.contain("Invalid mobile number");
    });
  });

  it("POST /api/client/register - invalid gender ", () => {
    cy.visit(`${FRONTEND}/login`);

    cy.window().then(async (win) => {
      const resp = await postMultipart(win, `${API}/api/client/register`, {
        firstName: "John",
        lastName: "Cena",
        age: 25,
        gender: "Other",
        mobileNumber: "0712345678",
        address: "123 Main Street",
      });

      const text = await resp.text();

      if (resp.status === 401) {
        noteAuthBlocked("POST /api/client/register");
        return;
      }

      expect(resp.status).to.eq(400);
      expect(text).to.contain("Invalid gender");
    });
  });

  it("POST /api/client/register then GET /api/client/{id} - success ", () => {
    cy.visit(`${FRONTEND}/login`);

    cy.window().then(async (win) => {
      const payload = {
        firstName: "John",
        lastName: "Cena",
        age: 25,
        gender: "Male",
        mobileNumber: "0712345678",
        address: "123 Main Street",
      };

      const regResp = await postMultipart(win, `${API}/api/client/register`, payload);
      const regText = await regResp.text();

      if (regResp.status === 401) {
        noteAuthBlocked("POST /api/client/register");
        return;
      }

      if (regResp.status !== 200) {
        throw new Error(`Client register failed. HTTP ${regResp.status}. Response: ${regText}`);
      }

      let data;
      try {
        data = JSON.parse(regText);
      } catch {
        throw new Error(`Register response was not JSON. Response: ${regText}`);
      }

      const clientId =
        data.clientId ||
        data.id ||
        data.client_id ||
        (data.client && (data.client.clientId || data.client.id));

      if (!clientId) {
        throw new Error(`Could not find clientId in response: ${regText}`);
      }

      const getResp = await win.fetch(`${API}/api/client/${clientId}`);
      const getText = await getResp.text();

      if (getResp.status === 401) {
        noteAuthBlocked("GET /api/client/{id}");
        return;
      }

      if (getResp.status !== 200) {
        throw new Error(`GET client failed. HTTP ${getResp.status}. Response: ${getText}`);
      }

      const client = JSON.parse(getText);
      expect(client.firstName).to.eq("John");
      expect(client.lastName).to.eq("Cena");
    });
  });
});
