describe('Membership History - Positive & Negative Tests', () => {

  beforeEach(() => {
    cy.loginAsStaff();
  });

  it('Displays full membership history', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.contains('h3', 'Membership History').should('be.visible');
      cy.get('.membership-history-panel tbody tr').should('exist');
    });
  });

  it('Each record contains Plan, Start Date, Expiry Date, Status', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.contains('.membership-history-panel th', 'Plan Name');
      cy.contains('.membership-history-panel th', 'Start Date');
      cy.contains('.membership-history-panel th', 'Expiry Date');
      cy.contains('.membership-history-panel th', 'Status');
    });
  });

  it('History is read-only', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.get('.membership-history-panel').within(() => {
        cy.contains('Edit').should('not.exist');
        cy.contains('Delete').should('not.exist');
      });
    });
  });

  // Negative tests
  it('Shows empty state for member with no history', () => {
    cy.fixture('renewData').then((data) => {
      cy.intercept('GET', '/api/membership-plans/history/*', {
        statusCode: 200,
        body: []
      }).as('historyEmpty');
      cy.openMemberProfile(data.activeMember.id);
      cy.wait('@historyEmpty');
      cy.contains('No membership records found.').should('be.visible');
    });
  });

  it('Handles API failure gracefully', () => {
    cy.fixture('renewData').then(data => {
      cy.intercept('GET', '/api/membership-plans/history/*', { statusCode: 500 }).as('historyFail');
      cy.openMemberProfile(data.activeMember.id);
      cy.wait('@historyFail');
      cy.contains('Failed to load membership history.').should('be.visible');
    });
  });

});