describe('Expiry Calculation Tests', () => {

  it('Expiry date should be correctly calculated', () => {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let token = '';
    let clientId = null;
    let plan = null;

    const plusDays = (dateString, days) => {
      const [y, m, d] = dateString.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + Number(days));
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    cy.request('POST', '/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((loginRes) => {
      token = loginRes.body.accessToken;
      return cy.request({
        method: 'GET',
        url: '/api/manage/clients',
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((clientsRes) => {
      clientId = clientsRes.body[0].id;
      return cy.request({
        method: 'GET',
        url: '/api/membership-plans/active',
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((plansRes) => {
      plan = plansRes.body[0];
      return cy.request({
        method: 'PUT',
        url: `/api/manage/clients/${clientId}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { membershipPlanId: plan.id, membershipStartDate: startDate }
      });
    }).then((assignRes) => {
      expect(assignRes.status).to.eq(200);
      const expectedExpiry = plusDays(startDate, plan.durationDays);
      expect(assignRes.body.membershipStartDate).to.eq(startDate);
      expect(assignRes.body.membershipEndDate).to.eq(expectedExpiry);
      expect(assignRes.body.membershipStatus).to.eq('ACTIVE');
    });
  });

});