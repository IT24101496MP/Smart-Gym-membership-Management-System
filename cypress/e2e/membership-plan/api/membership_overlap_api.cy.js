describe("Membership Renewal API", () => {
  let token = "";
  let clientId = null;
  let planId = null;

  before(() => {
    cy.request("POST", "/api/auth/login", {
      identifier: "admin@fat2fit.lk",
      password: "Admin@1234"
    }).then((loginRes) => {
      token = loginRes.body.accessToken;
      return cy.request({
        method: "GET",
        url: "/api/manage/clients",
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((clientsRes) => {
      clientId = clientsRes.body[0].id;
      return cy.request({
        method: "GET",
        url: "/api/membership-plans/active",
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((plansRes) => {
      planId = plansRes.body[0].id;
    });
  });

  it("Renews membership successfully using valid client and plan", () => {
    cy.request({
      method: "POST",
      url: "/api/membership-plans/renew",
      headers: { Authorization: `Bearer ${token}` },
      body: { clientId, planId }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.exist;
    });
  });

  it("Rejects renewal when client is invalid", () => {
    cy.request({
      method: "POST",
      url: "/api/membership-plans/renew",
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: { clientId: 999999999, planId }
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});