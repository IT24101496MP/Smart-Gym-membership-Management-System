Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.fixture('users').then((users) => {
    cy.get('#identifier').type(users.admin.identifier);
    cy.get('#password').type(users.admin.password);
  });
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('selectMember', (memberName) => {
  cy.get('[data-testid="member-dropdown"]').select(memberName);
});

Cypress.Commands.add('selectPlan', (planName) => {
  cy.get('[data-testid="plan-dropdown"]').select(planName);
});

Cypress.Commands.add('assignMembership', () => {
  cy.get('button').contains('Assign').click();
});