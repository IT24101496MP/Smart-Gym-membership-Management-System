describe('Membership Plan API Testing', () => {
  let authToken = '';

  beforeEach(() => {
    // Login as admin to get authentication token
    cy.request('POST', 'http://localhost:8080/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((response) => {
      expect(response.status).to.eq(200);
      authToken = response.body.accessToken;
    });

    cy.fixture('membershipPlan.json').as('plans');
  });

  it('Create plan successfully via API', function () {
    const plan = this.plans.validPlan;
    cy.request({
      method: 'POST',
      url: Cypress.env('apiUrl'),
      body: plan,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
      .then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body.planName).to.eq(plan.planName);
        expect(res.body.status).to.eq('ACTIVE');
      });
  });

  it('Create plan without description', function () {
    const plan = this.plans.validPlanNoDescription;
    cy.request({
      method: 'POST',
      url: Cypress.env('apiUrl'),
      body: plan,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
      .then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body.planName).to.eq(plan.planName);
      });
  });

  it('Fail creating plan with missing required fields', function () {
    const plan = this.plans.invalidPlanMissingRequired;
    cy.request({
      method: 'POST',
      url: Cypress.env('apiUrl'),
      body: plan,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body).to.eq('Plan name is required.');
    });
  });

  it('Fail creating plan with negative numeric values', function () {
    const plan = this.plans.invalidNumericPlan;
    cy.request({
      method: 'POST',
      url: Cypress.env('apiUrl'),
      body: plan,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body).to.eq('Monthly price cannot be negative.');
    });
  });

  it('Fail creating plan with invalid duration', function () {
    const plan = this.plans.invalidDurationPlan;
    cy.request({
      method: 'POST',
      url: Cypress.env('apiUrl'),
      body: plan,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body).to.eq('Duration must be a positive number of days.');
    });
  });
});