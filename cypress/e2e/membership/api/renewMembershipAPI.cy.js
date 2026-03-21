describe('Renew Membership API - Positive & Negative Tests', () => {

  let token = '';

  before(() => {
    cy.request('POST', '/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then(res => {
      token = res.body.accessToken;
    });
  });

  it('Renew active membership successfully', () => {
    cy.request({
      method: 'POST',
      url: '/api/members/1001/renew',
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq('Active');
    });
  });

  it('Return 404 for invalid member', () => {
    cy.request({
      method: 'POST',
      url: '/api/members/9999/renew',
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.eq(404);
    });
  });

  it('Unauthorized if no token', () => {
    cy.request({
      method: 'POST',
      url: '/api/members/1001/renew',
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.eq(401);
    });
  });

  it('Forbidden if invalid token', () => {
    cy.request({
      method: 'POST',
      url: '/api/members/1001/renew',
      headers: { Authorization: 'Bearer invalidToken' },
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.eq(403);
    });
  });

});