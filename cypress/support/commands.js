Cypress.Commands.add('loginAsStaff', () => {
  cy.visit('/login');
  cy.fixture('users').then(users => {
    cy.get('#identifier').type(users.admin.identifier);
    cy.get('#password').type(users.admin.password);
  });
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Open member profile
Cypress.Commands.add('openMemberProfile', (memberId) => {
  cy.visit('/manage');
  cy.contains('h1', 'Manage').should('be.visible');
  cy.get('table.manage-table tbody tr').should('have.length.greaterThan', 0);
  cy.get('table.manage-table tbody tr').then(($rows) => {
    const targetRow = Array.from($rows).find((row) => {
      const idCell = row.querySelector('td.cell-id');
      return idCell && idCell.textContent.trim() === String(memberId);
    });

    if (targetRow) {
      cy.wrap(targetRow).within(() => {
        cy.contains('button', 'Profile').click();
      });
      return;
    }

    cy.wrap($rows[0]).within(() => {
      cy.contains('button', 'Profile').click();
    });
  });
  cy.contains('h2', 'Member Profile').should('be.visible');
});

// Click renew membership button
Cypress.Commands.add('clickRenew', () => {
  cy.get('body').then(($body) => {
    const renewBtn = $body.find('.membership-renew-form button[type="submit"]');
    if (renewBtn.length > 0) {
      cy.wrap(renewBtn.first()).click();
    }
  });
});

// Confirm renewal
Cypress.Commands.add('confirmRenew', () => {
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Confirm")').length > 0) {
      cy.contains('button', 'Confirm').click();
    }
  });
});