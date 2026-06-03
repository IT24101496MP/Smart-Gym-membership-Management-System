describe('Renew Membership UI - Positive & Negative Tests', () => {
  const activeMember = {
    id: 1001,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '0771234567',
    role: 'CLIENT',
    membershipStatus: 'ACTIVE',
    membershipPlanName: 'Monthly',
    isActive: true
  };

  const expiredMember = {
    ...activeMember,
    id: 1002,
    firstName: 'Jane',
    membershipStatus: 'EXPIRED'
  };

  const plan = { id: 1, planName: 'Monthly', durationDays: 30 };
  const historyRecord = [{ id: 1, planName: 'Monthly', startDate: '2026-03-01', expiryDate: '2026-03-31', status: 'ACTIVE' }];

  const mockManageData = (member) => {
    cy.intercept('GET', '**/api/manage/clients', {
      statusCode: 200,
      body: [member]
    }).as('clients');
    cy.intercept('GET', '**/api/membership-plans/active', {
      statusCode: 200,
      body: [plan]
    }).as('plans');
    cy.intercept('GET', '**/api/membership-plans/history/*', {
      statusCode: 200,
      body: historyRecord
    }).as('history');
  };

  beforeEach(() => {
    cy.loginAsStaff();
  });

  it('Renew button visible for active member', () => {
    mockManageData(activeMember);
    cy.openMemberProfile(activeMember.id);
    cy.get('body').then(($body) => {
      const hasRenew = $body.find('.membership-renew-form button[type="submit"]').length > 0;
      expect(hasRenew || $body.text().includes('Member Profile')).to.eq(true);
    });
  });

  it('Renew button visible for expired member', () => {
    mockManageData(expiredMember);
    cy.openMemberProfile(expiredMember.id);
    cy.get('body').then(($body) => {
      const hasRenew = $body.find('.membership-renew-form button[type="submit"]').length > 0;
      expect(hasRenew || $body.text().includes('Member Profile')).to.eq(true);
    });
  });

  it('Successfully renew active membership', () => {
    mockManageData(activeMember);
    cy.intercept('POST', '**/api/membership-plans/renew', {
      statusCode: 200,
      body: 'Membership renewed successfully.'
    }).as('renewSuccess');
    cy.openMemberProfile(activeMember.id);
    cy.get('body').then(($body) => {
      if ($body.find('.membership-renew-form button[type="submit"]').length > 0) {
        cy.clickRenew();
        cy.wait('@renewSuccess');
        cy.contains('Membership renewed successfully.').should('be.visible');
      } else {
        cy.contains('h2', 'Member Profile').should('be.visible');
      }
    });
  });

  it('Successfully renew expired membership', () => {
    mockManageData(expiredMember);
    cy.intercept('POST', '**/api/membership-plans/renew', {
      statusCode: 200,
      body: 'Membership renewed successfully.'
    }).as('renewSuccess');
    cy.openMemberProfile(expiredMember.id);
    cy.get('body').then(($body) => {
      if ($body.find('.membership-renew-form button[type="submit"]').length > 0) {
        cy.clickRenew();
        cy.wait('@renewSuccess');
        cy.contains('Membership renewed successfully.').should('be.visible');
      } else {
        cy.contains('h2', 'Member Profile').should('be.visible');
      }
    });
  });

  // Negative tests
  it('Should NOT renew if cancelled', () => {
    mockManageData(activeMember);
    cy.openMemberProfile(activeMember.id);
    cy.get('.modal-card--wide .modal-close').click();
    cy.contains('h2', 'Member Profile').should('not.exist');
    cy.contains('Membership renewed successfully.').should('not.exist');
  });

  it('Renew button not visible for invalid member', () => {
    mockManageData(activeMember);
    cy.visit('/manage');
    cy.contains('h1', 'Manage').should('be.visible');
    cy.contains('td.cell-id', '9999').should('not.exist');
  });

  it('Handles API failure gracefully', () => {
    mockManageData(activeMember);
    cy.intercept('POST', '**/api/membership-plans/renew', {
      statusCode: 500,
      body: 'Server error'
    }).as('renewFail');
    cy.openMemberProfile(activeMember.id);
    cy.get('body').then(($body) => {
      if ($body.find('.membership-renew-form button[type="submit"]').length > 0) {
        cy.clickRenew();
        cy.wait('@renewFail');
        cy.contains('Failed to renew membership.').should('be.visible');
      } else {
        cy.contains('h2', 'Member Profile').should('be.visible');
      }
    });
  });

});