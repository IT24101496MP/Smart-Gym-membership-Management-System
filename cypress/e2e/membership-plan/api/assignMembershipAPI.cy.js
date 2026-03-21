describe('Assign Membership API Tests', () => {

  let token = '';

  before(() => {
    cy.request('POST', '/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((res) => {
      token = res.body.accessToken;
    });
  });

  it('Assign membership via API', () => {
    cy.request({
      method: 'POST',
      url: '/api/members/assign-membership',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: {
        memberId: 1001,
        planId: 1
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq('Active');
    });
  });

  it('Should fail for invalid member', () => {
    cy.request({
      method: 'POST',
      url: '/api/members/assign-membership',
      failOnStatusCode: false,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: {
        memberId: 9999,
        planId: 1
      }
    }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });

});