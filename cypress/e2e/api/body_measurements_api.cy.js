describe("API - Client Body Measurements", () => {
  let token;
  let targetClientId;

  const today = () => new Date().toISOString().slice(0, 10);

  const validPayload = () => ({
    measurementDate: today(),
    heightCm: 170,
    weightKg: 70,
    waistCm: 84,
    hipCm: 95,
    armCm: 33,
    shoulderCm: 48,
    breastCm: 98,
    buttocksCm: 99,
  });

  before(() => {
    cy.request("POST", "/api/auth/login", {
      identifier: "admin@fat2fit.lk",
      password: "Admin@1234",
    }).then((loginRes) => {
      token = loginRes.body.accessToken;

      return cy.request({
        method: "GET",
        url: "/api/manage/clients",
        headers: { Authorization: `Bearer ${token}` },
      });
    }).then((clientsRes) => {
      expect(clientsRes.body).to.be.an("array");
      expect(clientsRes.body.length).to.be.greaterThan(0);
      targetClientId = clientsRes.body[0].id;
    });
  });

  it("saves a valid measurement and auto-calculates BMI", () => {
    const payload = validPayload();

    cy.request({
      method: "POST",
      url: `/api/manage/clients/${targetClientId}/metrics`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.measurementId).to.exist;
      expect(res.body.clientId).to.eq(targetClientId);
      expect(res.body.measurementDate).to.eq(payload.measurementDate);

      const expectedBmi = Number((payload.weightKg / ((payload.heightCm / 100) ** 2)).toFixed(2));
      expect(Number(res.body.bmi)).to.eq(expectedBmi);
      expect(res.body.recordedAt).to.exist;
    });
  });

  it("rejects missing required fields", () => {
    const payload = validPayload();
    payload.weightKg = null;

    cy.request({
      method: "POST",
      url: `/api/manage/clients/${targetClientId}/metrics`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(String(res.body)).to.contain("All measurement fields are required.");
    });
  });

  it("rejects invalid numeric values", () => {
    const payload = validPayload();
    payload.waistCm = -1;

    cy.request({
      method: "POST",
      url: `/api/manage/clients/${targetClientId}/metrics`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(String(res.body)).to.contain("Measurement values must be positive numbers.");
    });
  });

  it("returns measurement history with timestamp", () => {
    cy.request({
      method: "GET",
      url: `/api/manage/clients/${targetClientId}/metrics/history`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);

      const first = res.body[0];
      expect(first.measurementDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
      expect(first.recordedAt).to.exist;
      expect(first.bmi).to.not.be.null;
    });
  });
});
