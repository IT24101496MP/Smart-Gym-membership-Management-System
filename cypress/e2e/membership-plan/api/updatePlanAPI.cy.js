describe('Update Plan API', () => {
  let authToken = '';

  before(() => {
    // Login as admin to get authentication token
    cy.request('POST', 'http://localhost:8080/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((response) => {
      expect(response.status).to.eq(200);
      authToken = response.body.accessToken;
    });
  });

  beforeEach(() => {
    cy.fixture('membershipPlan.json').as('plans');
  });

  it('Update plan successfully via API', function () {
    const plan = this.plans.updatedPlan;
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/1`,
      body: plan,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
      .then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.planName).to.eq(plan.planName);
      });
  });

  it('Fail update with invalid data', function () {
    const plan = this.plans.invalidUpdatePlan;
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/1`,
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
});