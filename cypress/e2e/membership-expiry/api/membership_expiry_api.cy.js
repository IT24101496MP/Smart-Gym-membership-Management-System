describe('Membership Expiry API Tests', () => {
  let token = '';
  let clientId = null;
  let plan = null;
  const startDate = '2026-03-20';

  const plusDays = (dateString, days) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + Number(days));
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  before(() => {
    // Login and fetch token, client, plan
    cy.request('POST', '/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((res) => {
      token = res.body.accessToken;
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
    });
  });

  it('Assign membership via API and verify expiry', () => {
    const expectedEndDate = plusDays(startDate, plan.durationDays);

    cy.request({
      method: 'PUT',
      url: `/api/manage/clients/${clientId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        membershipPlanId: plan.id,
        membershipStartDate: startDate
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.membershipPlanId).to.eq(plan.id);
      expect(res.body.membershipStartDate).to.eq(startDate);
      expect(res.body.membershipEndDate).to.eq(expectedEndDate);
      expect(res.body.membershipStatus).to.eq('ACTIVE');
    });
  });

  it('Membership becomes Expired automatically after end date', () => {
    const pastStartDate = '2025-01-01';
    const pastEndDate = plusDays(pastStartDate, plan.durationDays);

    cy.request({
      method: 'PUT',
      url: `/api/manage/clients/${clientId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        membershipPlanId: plan.id,
        membershipStartDate: pastStartDate
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.membershipEndDate).to.eq(pastEndDate);
      expect(res.body.membershipStatus).to.eq('EXPIRED');
    });
  });

  it('Fails for invalid member', () => {
    cy.request({
      method: 'PUT',
      url: '/api/manage/clients/999999',
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        membershipPlanId: plan.id,
        membershipStartDate: startDate
      }
    }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });
});