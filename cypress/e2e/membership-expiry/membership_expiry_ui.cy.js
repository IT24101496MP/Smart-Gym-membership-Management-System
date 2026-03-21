describe('Membership Expiry UI Tests', () => {
  let token = '';
  let selectedClient = null;
  let selectedPlan = null;
  let startDate = '';

  const plusDays = (dateString, days) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + Number(days));
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  beforeEach(() => {
    // Set today's date as start date
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    startDate = `${y}-${m}-${d}`;

    // Login and fetch token, client and plan
    cy.loginAsAdmin();
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
      selectedClient = clientsRes.body[0];
      return cy.request({
        method: 'GET',
        url: '/api/membership-plans/active',
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then((plansRes) => {
      selectedPlan = plansRes.body[0];
    });
  });

  it('Assign membership and validate expiry date', () => {
    cy.openClientEditModal(selectedClient.id);
    cy.selectPlanInEditModal(String(selectedPlan.id));
    cy.setMembershipStartDateInEditModal(startDate);
    cy.saveEditModal();

    const expectedEndDate = plusDays(startDate, selectedPlan.durationDays);

    // Verify status/plan in table
    cy.contains('table.manage-table tbody tr td.cell-id', String(selectedClient.id))
      .parents('tr')
      .within(() => {
        cy.contains(selectedPlan.planName).should('be.visible');
        cy.contains('Active').should('be.visible');
      });

    // Verify computed dates via API (UI table does not show end date column)
    cy.request({
      method: 'GET',
      url: '/api/manage/clients',
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => {
      const updated = res.body.find((c) => c.id === selectedClient.id);
      expect(updated.membershipStartDate).to.eq(startDate);
      expect(updated.membershipEndDate).to.eq(expectedEndDate);
      expect(updated.membershipStatus).to.eq('ACTIVE');
    });
  });

  it('Membership status becomes Expired automatically after expiry date', () => {
    const pastDate = '2025-01-01';
    const expectedEnd = plusDays(pastDate, selectedPlan.durationDays);

    cy.openClientEditModal(selectedClient.id);
    cy.selectPlanInEditModal(String(selectedPlan.id));
    cy.setMembershipStartDateInEditModal(pastDate);
    cy.saveEditModal();

    cy.contains('table.manage-table tbody tr td.cell-id', String(selectedClient.id))
      .parents('tr')
      .within(() => {
        cy.contains('Expired').should('be.visible');
      });

    cy.request({
      method: 'GET',
      url: '/api/manage/clients',
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => {
      const updated = res.body.find((c) => c.id === selectedClient.id);
      expect(updated.membershipEndDate).to.eq(expectedEnd);
      expect(updated.membershipStatus).to.eq('EXPIRED');
    });
  });
});