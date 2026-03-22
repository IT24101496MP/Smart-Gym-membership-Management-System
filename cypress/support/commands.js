Cypress.Commands.add("getAuthToken", () => {
  return cy.request("POST", "/api/auth/login", {
    identifier: "admin@fat2fit.lk",
    password: "Admin@1234"
  }).then((res) => res.body.accessToken);
});

/** UI login — matches LoginPage → /profile */
Cypress.Commands.add("loginAsAdmin", () => {
  cy.session("admin-ui", () => {
    cy.visit("/login");
    cy.get("#identifier").clear().type("admin@fat2fit.lk");
    cy.get("#password").clear().type("Admin@1234");
    cy.get("form.login-form").submit();
    cy.url({ timeout: 15000 }).should("include", "/profile");
  });
});

Cypress.Commands.add("triggerExpiryJob", (token) => {
  return cy.request({
    method: "POST",
    url: "/api/memberships/trigger-expiry-check",
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false
  });
});