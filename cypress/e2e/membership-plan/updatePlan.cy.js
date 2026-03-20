describe('Update Membership Plan UI Testing', () => {
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

  it('Update plan successfully', function () {
    // Create a plan first
    const createPlan = this.plans.validPlan;
    cy.get('[name="planName"]').type(createPlan.planName);
    cy.get('[name="description"]').type(createPlan.description);
    cy.get('[name="durationDays"]').type(createPlan.durationDays);
    cy.get('[name="monthlyPrice"]').type(createPlan.monthlyPrice);
    cy.get('[name="admissionFee"]').type(createPlan.admissionFee);
    cy.get('[name="maximumMembers"]').type(createPlan.maximumMembers);
    cy.get('button[type="submit"]').click();
    cy.contains('Membership plan created successfully.').should('exist');

    // Now update
    const plan = this.plans.updatedPlan;
    cy.contains('Edit').first().click();
    cy.get('[name="planName"]').clear().type(plan.planName);
    cy.get('[name="description"]').clear().type(plan.description);
    cy.get('[name="durationDays"]').clear().type(plan.durationDays);
    cy.get('[name="monthlyPrice"]').clear().type(plan.monthlyPrice);
    cy.get('[name="admissionFee"]').clear().type(plan.admissionFee);
    cy.get('[name="maximumMembers"]').clear().type(plan.maximumMembers);
    cy.get('button[type="submit"]').click();
    cy.contains(plan.planName).should('exist');
  });

  it('Fail update with invalid input', function () {
    // Create a plan first
    const createPlan = this.plans.validPlan;
    cy.get('[name="planName"]').type(createPlan.planName);
    cy.get('[name="description"]').type(createPlan.description);
    cy.get('[name="durationDays"]').type(createPlan.durationDays);
    cy.get('[name="monthlyPrice"]').type(createPlan.monthlyPrice);
    cy.get('[name="admissionFee"]').type(createPlan.admissionFee);
    cy.get('[name="maximumMembers"]').type(createPlan.maximumMembers);
    cy.get('button[type="submit"]').click();
    cy.contains('Membership plan created successfully.').should('exist');

    // Now try invalid update
    const plan = this.plans.invalidUpdatePlan;
    cy.contains('Edit').first().click();
    cy.get('[name="monthlyPrice"]').clear().type(plan.monthlyPrice);
    cy.get('[name="maximumMembers"]').clear().type(plan.maximumMembers);
    cy.get('button[type="submit"]').click();
    cy.contains('Monthly price cannot be negative.').should('exist');
  });
});