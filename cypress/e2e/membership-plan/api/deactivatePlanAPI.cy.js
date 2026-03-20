describe('Deactivate Plan API', () => {
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

  it('Deactivate plan via API', () => {
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/1/status`,
      body: { status: 'INACTIVE' },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
      .then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.status).to.eq('INACTIVE');
      });
  });
});