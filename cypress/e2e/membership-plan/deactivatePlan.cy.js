describe('Deactivate Plan UI Testing', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('input[name="identifier"]').type('admin@fat2fit.lk');
    cy.get('input[name="password"]').type('Admin@1234');
    cy.contains('button', 'Sign In').click();
    cy.url().should('not.include', '/login'); // Wait for redirect

    cy.visit('/membership-plans');
    cy.get('.plan-form').should('be.visible');
    cy.fixture('membershipPlan.json').as('plans');
  });

  it('Deactivate plan successfully', function () {
    // Create a plan first
    const plan = this.plans.validPlan;
    cy.get('[name="planName"]').type(plan.planName);
    cy.get('[name="description"]').type(plan.description);
    cy.get('[name="durationDays"]').type(plan.durationDays);
    cy.get('[name="monthlyPrice"]').type(plan.monthlyPrice);
    cy.get('[name="admissionFee"]').type(plan.admissionFee);
    cy.get('[name="maximumMembers"]').type(plan.maximumMembers);
    cy.get('button[type="submit"]').click();
    cy.contains('Membership plan created successfully.').should('exist');

    // Now deactivate
    cy.contains('Deactivate').first().click();
    cy.contains('deactivated.').should('exist');
    cy.get('.status-badge').first().should('contain', 'INACTIVE');
  });
});