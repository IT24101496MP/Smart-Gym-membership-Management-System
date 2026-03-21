Cypress.Commands.add("loginAsAdmin", () => {
  cy.visit("/login");
  cy.get("#identifier").clear().type("admin@fat2fit.lk");
  cy.get("#password").clear().type("Admin@1234");
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

// Current project does not provide a dedicated staff fixture account in Cypress data.
// Keep helper for backward compatibility in specs that call it.
Cypress.Commands.add("loginAsStaff", () => {
  cy.loginAsAdmin();
});

Cypress.Commands.add("openManagePage", () => {
  cy.visit("/manage");
  cy.contains("h1", "Manage").should("be.visible");
});

Cypress.Commands.add("openClientEditModal", (clientId) => {
  cy.openManagePage();
  cy.get("table.manage-table tbody tr").should("have.length.greaterThan", 0);
  cy.get("table.manage-table tbody tr").then(($rows) => {
    const target = Array.from($rows).find((row) => {
      const idCell = row.querySelector("td.cell-id");
      return idCell && idCell.textContent.trim() === String(clientId);
    });
    expect(target, `client row for id ${clientId}`).to.exist;
    cy.wrap(target).within(() => {
      cy.contains("button", "Edit").click();
    });
  });
  cy.contains("h2", "Edit").should("be.visible");
});