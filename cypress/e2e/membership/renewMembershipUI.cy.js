describe('Renew Membership UI - Positive & Negative Tests', () => {

  beforeEach(() => {
    cy.loginAsStaff();
  });

  it('Renew button visible for active member', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.contains('Renew Membership').should('exist');
    });
  });

  it('Renew button visible for expired member', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.expiredMember.id);
      cy.contains('Renew Membership').should('exist');
    });
  });

  it('Successfully renew active membership', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.clickRenew();
      cy.confirmRenew();
      cy.contains('Membership renewed successfully');
      cy.contains('Active');
    });
  });

  it('Successfully renew expired membership', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.expiredMember.id);
      cy.clickRenew();
      cy.confirmRenew();
      cy.contains('Membership renewed successfully');
      cy.contains('Active');
    });
  });

  // Negative tests
  it('Should NOT renew if cancelled', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.clickRenew();
      cy.contains('Cancel').click();
      cy.contains('Membership renewed successfully').should('not.exist');
    });
  });

  it('Renew button not visible for invalid member', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.invalidMember.id);
      cy.contains('Renew Membership').should('not.exist');
    });
  });

  it('Handles API failure gracefully', () => {
    cy.fixture('renewData').then(data => {
      cy.openMemberProfile(data.activeMember.id);
      cy.intercept('POST', '/api/members/*/renew', { statusCode: 500 }).as('renewFail');
      cy.clickRenew();
      cy.confirmRenew();
      cy.wait('@renewFail');
      cy.contains('Error renewing membership');
    });
  });

});