describe("Membership Auth Access", () => {
  it("Rejects protected membership endpoint without token", () => {
    cy.request({
      method: "POST",
      url: "/api/membership-plans/renew",
      failOnStatusCode: false,
      body: { clientId: 1, planId: 1 }
    }).then((res) => {
      expect(res.status).to.eq(403);
    });
  });

  it("Allows admin to access membership assignment endpoints", () => {
    cy.request("POST", "/api/auth/login", {
      identifier: "admin@fat2fit.lk",
      password: "Admin@1234"
    }).then((loginRes) => {
      const token = loginRes.body.accessToken;
      return cy.request({
        method: "GET",
        url: "/api/manage/clients",
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(Array.isArray(res.body)).to.eq(true);
    });
  });
});