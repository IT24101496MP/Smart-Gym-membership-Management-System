describe('Membership Status API Tests (Admin)', () => {
  let authToken = '';

  before(() => {
    // Login via API as admin to get token
    cy.request('POST', 'http://localhost:8080/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.accessToken;
    });
  });

  it('Fetches client list and has membership status properties', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/api/manage/clients',
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      if (res.body.length > 0) {
        expect(res.body[0]).to.have.property('membershipStatus');
      }
    });
  });

  it('Validates at least one known membership status value is present if clients exist', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/api/manage/clients',
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      if (res.body.length === 0) {
        cy.log('No clients available to verify membership status values');
        return;
      }

      const statuses = res.body.map((c) => c.membershipStatus).filter(Boolean);
      expect(statuses).to.not.be.empty;
      expect(statuses.every((s) => ['ACTIVE', 'EXPIRED', 'PENDING', 'UPCOMING', 'NOT_ASSIGNED'].includes(s))).to.be.true;
    });
  });

  it('Returns 404 for non-existing client metrics endpoint', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/api/manage/clients/999999/metrics',
      headers: { 'Authorization': `Bearer ${authToken}` },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(404);
      expect(res.body).to.eq('Client not found.');
    });
  });
});