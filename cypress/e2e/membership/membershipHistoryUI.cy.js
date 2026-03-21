describe('Membership History - Positive & Negative Tests', () => {

  beforeEach(() => {
    cy.loginAsStaff();
  });

  it('Displays full membership history', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.contains('Membership History').click();
      cy.get('[data-testid="history-row"]').should('exist');
    });
  });

  it('Each record contains Plan, Start Date, Expiry Date, Status', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.contains('Membership History').click();
      cy.get('[data-testid="history-row"]').first().within(() => {
        cy.contains('Plan');
        cy.contains('Start Date');
        cy.contains('Expiry Date');
        cy.contains('Status');
      });
    });
  });

  it('History is read-only', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.contains('Membership History').click();
      cy.contains('Edit').should('not.exist');
      cy.contains('Delete').should('not.exist');
    });
  });

  // Negative tests
  it('Shows empty state for member with no history', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.noHistoryMember.id);
      cy.contains('Membership History').click();
      cy.contains('No membership history available');
    });
  });

  it('Handles API failure gracefully', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.intercept('GET', '/api/members/*/history', { statusCode: 500 }).as('historyFail');
      cy.contains('Membership History').click();
      cy.wait('@historyFail');
      cy.contains('Failed to load membership history');
    });
  });

});