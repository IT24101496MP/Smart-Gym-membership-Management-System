describe('Renew Membership API - Positive & Negative Tests', () => {

  let token = '';
  let clientId = null;
  let planId = null;

  before(() => {
    cy.request('POST', '/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then(res => {
      token = res.body.accessToken;
      return cy.request({
        method: 'GET',
        url: '/api/manage/clients',
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body.length).to.be.greaterThan(0);
      clientId = res.body[0].id;
      return cy.request({
        method: 'GET',
        url: '/api/membership-plans/active',
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body.length).to.be.greaterThan(0);
      planId = res.body[0].id;
    });
  });

  it('Renew active membership successfully', () => {
    cy.request({
      method: 'POST',
      url: '/api/membership-plans/renew',
      headers: { Authorization: `Bearer ${token}` },
      body: { clientId, planId }
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.eq('Membership renewed successfully.');
    });
  });

  it('Return 400 for invalid member', () => {
    cy.request({
      method: 'POST',
      url: '/api/membership-plans/renew',
      headers: { Authorization: `Bearer ${token}` },
      body: { clientId: 999999999, planId },
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.eq(400);
    });
  });

  it('Forbidden if no token', () => {
    cy.request({
      method: 'POST',
      url: '/api/membership-plans/renew',
      body: { clientId, planId },
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.eq(403);
    });
  });

  it('Forbidden if invalid token', () => {
    cy.request({
      method: 'POST',
      url: '/api/membership-plans/renew',
      headers: { Authorization: 'Bearer invalidToken' },
      body: { clientId, planId },
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.eq(403);
    });
  });

});