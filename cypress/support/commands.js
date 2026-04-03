Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('http://localhost:5173/login');
  cy.get('input[name="identifier"]').should('exist').type('admin@fat2fit.lk');
  cy.get('input[name="password"]').should('exist').type('Admin@1234');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('fillMembershipPlanForm', (plan) => {
  if (plan.plan_name !== undefined && plan.plan_name !== '') {
    cy.get('input[name="plan_name"]').should('exist').clear().type(plan.plan_name);
  }
  if (plan.description !== undefined) {
    cy.get('textarea[name="description"]').should('exist').clear().type(plan.description);
  }
  if (plan.duration_days !== undefined && plan.duration_days !== '') {
    cy.get('input[name="duration_days"]').should('exist').clear().type(plan.duration_days);
  }
  if (plan.monthly_price !== undefined && plan.monthly_price !== '') {
    cy.get('input[name="monthly_price"]').should('exist').clear().type(plan.monthly_price);
  }
  if (plan.admission_fee !== undefined && plan.admission_fee !== '') {
    cy.get('input[name="admission_fee"]').should('exist').clear().type(plan.admission_fee);
  }
  if (plan.maximum_members !== undefined && plan.maximum_members !== '') {
    cy.get('input[name="maximum_members"]').should('exist').clear().type(plan.maximum_members);
  }
});

Cypress.Commands.add('deactivatePlan', (planName) => {
  cy.get('table tr').contains('td', planName)
    .should('exist')
    .parent() // get the row
    .find('button.deactivate')
    .should('exist')
    .click();

  cy.contains('Plan deactivated successfully').should('exist');
  cy.get('table tr').contains('td', planName)
    .parent()
    .contains('td', 'INACTIVE')
    .should('exist');
});