describe('Assign Membership UI Tests', () => {

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/assign-membership');
  });

  it('Assign membership successfully', () => {
    cy.fixture('membershipData').then((data) => {

      cy.selectMember(data.validMember.name);
      cy.selectPlan(data.validPlan.name);

      cy.assignMembership();

      cy.contains('Membership assigned successfully');
      cy.contains('Active');
    });
  });

  it('Should show error if member not selected', () => {
    cy.selectPlan('Monthly Plan');
    cy.assignMembership();

    cy.contains('Please select a member');
  });

  it('Should show error if plan not selected', () => {
    cy.selectMember('John Doe');
    cy.assignMembership();

    cy.contains('Please select a plan');
  });

  it('Should not allow inactive plans', () => {
    cy.get('[data-testid="plan-dropdown"] option').each(($el) => {
      if ($el.text().includes('Inactive')) {
        expect($el).to.be.disabled;
      }
    });
  });

});