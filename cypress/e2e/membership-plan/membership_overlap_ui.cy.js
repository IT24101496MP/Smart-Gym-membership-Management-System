describe("Membership Assignment UI Validation", () => {
  let token = "";
  let client = null;
  let plan = null;
  const startDate = "2026-07-01";

  beforeEach(() => {
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
  });

  it("Admin can open client edit modal and see membership controls", () => {
    cy.openClientEditModal(client.id);
    cy.contains("Membership Assignment").should("exist");
    cy.contains("label", "Membership Plan").should("exist");
    cy.contains("label", "Membership Start Date").should("exist");
  });

  it("Assigns active plan and updates status visible in list", () => {
    cy.intercept("PUT", `**/api/manage/clients/${client.id}`).as("saveClient");
    cy.openClientEditModal(client.id);
    cy.get(".modal-card").within(() => {
      cy.contains("label", "Membership Plan").parent().find("select").select(String(plan.id));
      cy.contains("label", "Membership Start Date").parent().find('input[type="date"]').clear({ force: true }).type(startDate, { force: true });
      cy.contains("button", "Save Changes").click();
    });
    cy.wait("@saveClient").its("response.statusCode").should("eq", 200);
    cy.contains("table.manage-table tbody tr td.cell-id", String(client.id))
      .parents("tr")
      .within(() => {
        cy.contains(plan.planName).should("be.visible");
        cy.contains(/Active|Upcoming/).should("be.visible");
      });
  });
});