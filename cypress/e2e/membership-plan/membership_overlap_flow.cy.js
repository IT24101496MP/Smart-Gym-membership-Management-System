describe("E2E Membership Flow", () => {
  it("Assign in UI then renew via API", () => {
    let token = "";
    let client = null;
    let plan = null;
    const startDate = "2026-03-01";

    cy.loginAsAdmin();

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
      client = clientsRes.body[0];
      return cy.request({
        method: "GET",
        url: "/api/membership-plans/active",
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((plansRes) => {
      plan = plansRes.body[0];
    });

    cy.then(() => {
      cy.intercept("PUT", `**/api/manage/clients/${client.id}`).as("saveClient");
      cy.openClientEditModal(client.id);
      cy.get(".modal-card").within(() => {
        cy.contains("label", "Membership Plan").parent().find("select").select(String(plan.id));
        cy.contains("label", "Membership Start Date").parent().find('input[type="date"]').clear({ force: true }).type(startDate, { force: true });
        cy.contains("button", "Save Changes").click();
      });
      cy.wait("@saveClient").its("response.statusCode").should("eq", 200);

      cy.request({
        method: "POST",
        url: "/api/membership-plans/renew",
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
        body: { clientId: client.id, planId: plan.id }
      }).then((renewRes) => {
        expect([200, 409]).to.include(renewRes.status);
        if (renewRes.status === 409) {
          cy.request({
            method: "POST",
            url: "/api/membership-plans/renew",
            headers: { Authorization: `Bearer ${token}` },
            body: { clientId: client.id, planId: plan.id, overrideOverlap: true }
          }).then((overrideRes) => {
            expect(overrideRes.status).to.eq(200);
          });
        }
      });
    });
  });
});