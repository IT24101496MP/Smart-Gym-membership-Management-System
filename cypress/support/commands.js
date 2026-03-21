Cypress.Commands.add('loginAsStaff', () => {
  cy.visit('/login');
  cy.fixture('users').then(users => {
    cy.get('#identifier').type(users.admin.identifier);
    cy.get('#password').type(users.admin.password);
  });
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('openMemberProfile', (memberId) => {
  cy.visit(`/members/${memberId}`);
});

Cypress.Commands.add('clickRenew', () => {
  cy.contains('Renew Membership').click();
});

Cypress.Commands.add('confirmRenew', () => {
  cy.get('button').contains('Confirm').click();
});