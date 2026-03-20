Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('http://localhost:5173/login');
  cy.get('input#identifier').should('exist').type('admin@fat2fit.lk');
  cy.get('input#password').should('exist').type('Admin@1234');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login'); // verify login success
});

// Check membership status in member profile
Cypress.Commands.add('checkMemberStatus', (memberId) => {
  cy.visit(`http://localhost:5173/members/${memberId}`);
  return cy.get('#membershipStatus').should('exist');
});