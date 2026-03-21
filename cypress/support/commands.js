Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.fixture('users').then((users) => {
    cy.get('#identifier').type(users.admin.identifier);
    cy.get('#password').type(users.admin.password);
  });
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('openManagePage', () => {
  cy.visit('/manage');
  cy.contains('h1', 'Manage').should('be.visible');
});

Cypress.Commands.add('openClientEditModal', (clientId) => {
  cy.openManagePage();
  cy.get('table.manage-table tbody tr').should('have.length.greaterThan', 0);
  cy.get('table.manage-table tbody tr').then(($rows) => {
    const target = Array.from($rows).find((row) => {
      const idCell = row.querySelector('td.cell-id');
      return idCell && idCell.textContent.trim() === String(clientId);
    });
    expect(target, `client row for id ${clientId}`).to.exist;
    cy.wrap(target).within(() => {
      cy.contains('button', 'Edit').click();
    });
  });
  cy.contains('h2', 'Edit').should('be.visible');
});

Cypress.Commands.add('selectPlanInEditModal', (planId) => {
  cy.get('.modal-card').within(() => {
    cy.contains('label', 'Membership Plan').parent().find('select').select(String(planId));
  });
});

Cypress.Commands.add('setMembershipStartDateInEditModal', (dateValue) => {
  cy.get('.modal-card').within(() => {
    cy.contains('label', 'Membership Start Date')
      .parent()
      .find('input[type="date"]')
      .should('be.enabled')
      .clear({ force: true })
      .type(dateValue, { force: true })
      .blur()
      .should('have.value', dateValue);
  });
});

Cypress.Commands.add('saveEditModal', () => {
  cy.get('.modal-card').within(() => {
    cy.contains('button', 'Save Changes').click();
  });
});