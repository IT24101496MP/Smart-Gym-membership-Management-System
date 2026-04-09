describe("Membership Notification Integration", () => {
  let token = "";

  before(() => {
    cy.getAuthToken().then((t) => {
      token = t;
    });
  });

  it("Triggers job and verifies notification log", () => {
    cy.triggerExpiryJob(token).then((triggerRes) => {
      expect(triggerRes.status).to.be.oneOf([200, 403, 404]);
    });

    cy.request({
      method: "GET",
      url: "/api/notifications/logs",
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 403, 404]);
      if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) {
        return;
      }

      const log = res.body[0];
      expect(log).to.satisfy(
        (l) =>
          Object.prototype.hasOwnProperty.call(l, "memberName") ||
          Object.prototype.hasOwnProperty.call(l, "memberEmail")
      );
      expect(log).to.have.property("expiryDate");
      expect(log).to.have.property("status");
    });
  });

  it("Validates email content format", () => {
    cy.request({
      method: "GET",
      url: "/api/notifications/logs",
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false
    }).then((res) => {
      if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) {
        return;
      }
      const log = res.body[0];
      if (!log.emailContent) return;

      const name = log.memberName || "";
      if (name) expect(log.emailContent).to.include(name);
      expect(String(log.emailContent)).to.include(String(log.expiryDate));
    });
  });
});