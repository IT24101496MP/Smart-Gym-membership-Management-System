describe('Membership Plan UI Testing', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('input[name="identifier"]').type('admin@fat2fit.lk');
    cy.get('input[name="password"]').type('Admin@1234');
    cy.contains('button', 'Sign In').click();
    cy.url().should('not.include', '/login'); // Wait for redirect

    cy.visit('/membership-plans');
    cy.fixture('membershipPlan.json').as('plans');
  });

  it('Create valid plan with description', function () {
    const plan = this.plans.validPlan;
    cy.get('.plan-form').should('be.visible');
    cy.get('[name="planName"]').type(plan.planName);
    cy.get('[name="description"]').type(plan.description);
    cy.get('[name="durationDays"]').type(plan.durationDays);
    cy.get('[name="monthlyPrice"]').type(plan.monthlyPrice);
    cy.get('[name="admissionFee"]').type(plan.admissionFee);
    cy.get('[name="maximumMembers"]').type(plan.maximumMembers);
    cy.get('button[type="submit"]').click();

    cy.contains('Membership plan created successfully.').should('exist');
    cy.contains(plan.planName).should('exist');
    cy.contains('ACTIVE').should('exist');
  });

  it('Create valid plan without description', function () {
    const plan = this.plans.validPlanNoDescription;
    cy.get('.plan-form').should('be.visible');
    cy.get('[name="planName"]').type(plan.planName);
    cy.get('[name="durationDays"]').type(plan.durationDays);
    cy.get('[name="monthlyPrice"]').type(plan.monthlyPrice);
    cy.get('[name="admissionFee"]').type(plan.admissionFee);
    cy.get('[name="maximumMembers"]').type(plan.maximumMembers);
    cy.get('button[type="submit"]').click();

    cy.contains('Membership plan created successfully.').should('exist');
    cy.contains(plan.planName).should('exist');
  });

  it('Submit plan with missing required fields', function () {
    const plan = this.plans.invalidPlanMissingRequired;
    cy.get('.plan-form').should('be.visible');
    if (plan.planName) {
      cy.get('[name="planName"]').type(plan.planName);
    } else {
      cy.get('[name="planName"]').clear();
    }
    if (plan.description) {
      cy.get('[name="description"]').type(plan.description);
    } else {
      cy.get('[name="description"]').clear();
    }
    if (plan.durationDays) {
      cy.get('[name="durationDays"]').type(plan.durationDays);
    } else {
      cy.get('[name="durationDays"]').clear();
    }
    if (plan.monthlyPrice) {
      cy.get('[name="monthlyPrice"]').type(plan.monthlyPrice);
    } else {
      cy.get('[name="monthlyPrice"]').clear();
    }
    if (plan.admissionFee) {
      cy.get('[name="admissionFee"]').type(plan.admissionFee);
    } else {
      cy.get('[name="admissionFee"]').clear();
    }
    if (plan.maximumMembers) {
      cy.get('[name="maximumMembers"]').type(plan.maximumMembers);
    } else {
      cy.get('[name="maximumMembers"]').clear();
    }
    cy.get('button[type="submit"]').click();

    cy.contains('Plan name is required.').should('exist');
    cy.contains('Monthly price is required.').should('exist');
    cy.contains('Duration is required.').should('exist');
  });

  it('Enter negative numeric values', function () {
    const plan = this.plans.invalidNumericPlan;
    cy.get('.plan-form').should('be.visible');
    cy.get('[name="planName"]').type(plan.planName);
    cy.get('[name="description"]').type(plan.description);
    cy.get('[name="durationDays"]').type(plan.durationDays.toString());
    cy.get('[name="monthlyPrice"]').type(plan.monthlyPrice.toString());
    cy.get('[name="admissionFee"]').type(plan.admissionFee.toString());
    cy.get('[name="maximumMembers"]').type(plan.maximumMembers.toString());
    cy.get('button[type="submit"]').click();

    cy.contains('Monthly price cannot be negative.').should('exist');
  });

  it('Enter invalid duration', function () {
    const plan = this.plans.invalidDurationPlan;
    cy.get('.plan-form').should('be.visible');
    cy.get('[name="planName"]').clear().type(plan.planName);
    cy.get('[name="description"]').clear().type(plan.description);
    cy.get('[name="durationDays"]').clear().type(plan.durationDays.toString());
    cy.get('[name="monthlyPrice"]').clear().type(plan.monthlyPrice.toString());
    cy.get('[name="admissionFee"]').clear().type(plan.admissionFee.toString());
    cy.get('[name="maximumMembers"]').clear().type(plan.maximumMembers.toString());
    cy.get('button[type="submit"]').click();

    cy.contains('Duration must be a positive whole number of days.').should('be.visible');
  });
});