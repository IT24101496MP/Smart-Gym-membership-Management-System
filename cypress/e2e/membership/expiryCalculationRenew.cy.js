describe('Renew Expiry Calculation', () => {
  it('Expiry extends from current expiry for active member', () => {
    const toISODate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const addDays = (dateStr, days) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + days);
      return toISODate(d);
    };

    let token = '';
    let targetClientId = null;
    let targetPlan = null;
    let previousRecord = null;

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
      const candidate = clientsRes.body.find(
        (client) => client.membershipStatus === 'ACTIVE' || client.membershipStatus === 'EXPIRED'
      ) || clientsRes.body[0];
      targetClientId = candidate.id;
      return cy.request({
        method: 'GET',
        url: `/api/membership-plans/history/${targetClientId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((historyRes) => {
      expect(historyRes.status).to.eq(200);
      expect(historyRes.body.length).to.be.greaterThan(0);
      previousRecord = historyRes.body[0];
      return cy.request({
        method: 'GET',
        url: '/api/membership-plans/active',
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((plansRes) => {
      targetPlan = plansRes.body.find((p) => p.planName === previousRecord.planName) || plansRes.body[0];
      return cy.request({
        method: 'POST',
        url: '/api/membership-plans/renew',
        headers: { Authorization: `Bearer ${token}` },
        body: { clientId: targetClientId, planId: targetPlan.id }
      });
    }).then((renewRes) => {
      expect(renewRes.status).to.eq(200);
      return cy.request({
        method: 'GET',
        url: `/api/membership-plans/history/${targetClientId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((updatedHistoryRes) => {
      expect(updatedHistoryRes.status).to.eq(200);
      const latest = updatedHistoryRes.body[0];

      const expectedStart = previousRecord.status === 'ACTIVE'
        ? previousRecord.expiryDate
        : toISODate(new Date());
      const expectedExpiry = addDays(expectedStart, targetPlan.durationDays);

      expect(latest.startDate).to.eq(expectedStart);
      expect(latest.expiryDate).to.eq(expectedExpiry);
    });
  });
});