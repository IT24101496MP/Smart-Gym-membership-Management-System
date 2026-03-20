describe('Membership Expiry UI Tests (Admin)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('Displays Active status for member whose expiry date is in the future', () => {
    cy.checkMemberStatus('1001').should('contain.text', 'Active');
  });

  it('Displays Expired status for member whose expiry date is in the past', () => {
    cy.checkMemberStatus('1002').should('contain.text', 'Expired');
  });

  it('Handles invalid member gracefully', () => {
    cy.checkMemberStatus('9999').should('not.exist');
  });
});