describe('Assign Membership UI Tests', () => {
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
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    startDate = `${y}-${m}-${d}`;

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

  it('Assign membership successfully and status becomes Active', () => {
    cy.openClientEditModal(selectedClient.id);
    cy.selectPlanInEditModal(String(selectedPlan.id));
    cy.setMembershipStartDateInEditModal(startDate);
    cy.saveEditModal();

    cy.contains('h2', 'Edit').should('not.exist');
    cy.contains('table.manage-table tbody tr td.cell-id', String(selectedClient.id))
      .parents('tr')
      .within(() => {
        cy.contains(selectedPlan.planName).should('be.visible');
        cy.contains('Active').should('be.visible');
      });
  });

  it('Staff can select a registered member from list', () => {
    cy.openManagePage();
    cy.get('table.manage-table tbody tr td.cell-id')
      .then(($cells) => {
        const ids = Array.from($cells).map((cell) => cell.textContent.trim());
        expect(ids).to.include(String(selectedClient.id));
      });
  });

  it('Staff can select an active membership plan in assignment UI', () => {
    cy.openClientEditModal(selectedClient.id);
    cy.get('.modal-card').within(() => {
      cy.contains('label', 'Membership Plan')
        .parent()
        .find('select option')
        .then(($opts) => {
          const optionTexts = Array.from($opts).map((o) => o.textContent);
          const hasActivePlan = optionTexts.some((txt) => txt.includes(selectedPlan.planName));
          expect(hasActivePlan).to.eq(true);
        });
    });
  });

  it('System records membership start date and auto calculates expiry date', () => {
    cy.openClientEditModal(selectedClient.id);
    cy.selectPlanInEditModal(String(selectedPlan.id));
    cy.setMembershipStartDateInEditModal(startDate);
    cy.saveEditModal();

    const expectedEndDate = plusDays(startDate, selectedPlan.durationDays);
    cy.request({
      method: 'GET',
      url: '/api/manage/clients',
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => {
      const updated = res.body.find((client) => client.id === selectedClient.id);
      expect(updated.membershipStartDate).to.eq(startDate);
      expect(updated.membershipEndDate).to.eq(expectedEndDate);
      expect(['ACTIVE', 'UPCOMING']).to.include(updated.membershipStatus);
    });
  });
});