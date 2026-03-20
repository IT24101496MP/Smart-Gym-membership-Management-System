Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('http://localhost:5173/login');
  cy.get('input#identifier').should('exist').type('admin@fat2fit.lk');
  cy.get('input#password').should('exist').type('Admin@1234');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login'); // verify login success
});

Cypress.Commands.add('checkMemberStatus', (memberId) => {
  cy.visit('http://localhost:5173/manage');
  return cy.contains('table.manage-table tbody tr td.cell-id', memberId)
    .parents('tr')
    .find('.membership-status-badge');
});

Cypress.Commands.add('verifyStatusInAttendance', (memberId, expectedStatus) => {
  cy.visit('http://localhost:5173/attendance');
  cy.get(`#memberStatus_${memberId}`).should('contain.text', expectedStatus);
});