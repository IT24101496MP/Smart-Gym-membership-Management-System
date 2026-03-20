describe('Membership Status UI Tests (Admin)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('http://localhost:5173/manage');
  });

  it('Displays membership status badge for at least one client row', () => {
    cy.get('table.manage-table tbody tr').first().within(() => {
      cy.get('.membership-status-badge').should('exist').and(($badge) => {
        const text = $badge.text().trim();
        expect(text).to.match(/Active|Expired|Pending|Upcoming|Not assigned/i);
      });
    });
  });

  it('Displays membership status in profile panel for first client', () => {
    cy.get('table.manage-table tbody tr').first().within(() => {
      cy.get('.btn-membership-profile').click();
    });

    cy.get('.member-profile-grid .membership-status-badge').should('exist').and('not.be.empty');
  });

  it('Handles missing client row gracefully for invalid member ID', () => {
    cy.get('table.manage-table tbody tr').contains('999999').should('not.exist');
  });
});