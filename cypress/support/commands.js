Cypress.Commands.add("getAuthToken", () => {
  return cy
    .request("POST", "/api/auth/login", {
      identifier: "admin@fat2fit.lk",
      password: "Admin@1234",
    })
    .then((res) => res.body.accessToken);
});

Cypress.Commands.add("loginAsAdmin", () => {
  cy.session("admin-ui", () => {
    cy.visit("/login");
    cy.get("#identifier").clear().type("admin@fat2fit.lk");
    cy.get("#password").clear().type("Admin@1234");
    cy.get("form.login-form").submit();
    cy.url({ timeout: 15000 }).should("include", "/profile");
  });
});

Cypress.Commands.add("loginAsStaff", () => {
  cy.visit("/login");
  cy.fixture("users").then((users) => {
    cy.get("#identifier").type(users.admin.identifier);
    cy.get("#password").type(users.admin.password);
  });
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

Cypress.Commands.add("loginAsInstructor", () => {
  cy.visit("http://localhost:5173/login");
  cy.get('input[name="identifier"]').should("exist").type("instructor@gmail.com");
  cy.get('input[name="password"]').should("exist").type("12345678");
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

Cypress.Commands.add("triggerExpiryJob", (token) => {
  return cy.request({
    method: "POST",
    url: "/api/memberships/trigger-expiry-check",
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("fillMembershipPlanForm", (plan) => {
  if (plan.plan_name !== undefined && plan.plan_name !== "") {
    cy.get('input[name="plan_name"]').should("exist").clear().type(plan.plan_name);
  }
  if (plan.description !== undefined) {
    cy.get('textarea[name="description"]').should("exist").clear().type(plan.description);
  }
  if (plan.duration_days !== undefined && plan.duration_days !== "") {
    cy.get('input[name="duration_days"]').should("exist").clear().type(plan.duration_days);
  }
  if (plan.monthly_price !== undefined && plan.monthly_price !== "") {
    cy.get('input[name="monthly_price"]').should("exist").clear().type(plan.monthly_price);
  }
  if (plan.admission_fee !== undefined && plan.admission_fee !== "") {
    cy.get('input[name="admission_fee"]').should("exist").clear().type(plan.admission_fee);
  }
  if (plan.maximum_members !== undefined && plan.maximum_members !== "") {
    cy.get('input[name="maximum_members"]').should("exist").clear().type(plan.maximum_members);
  }
});

Cypress.Commands.add("deactivatePlan", (planName) => {
  cy.get("table tr")
    .contains("td", planName)
    .should("exist")
    .parent()
    .find("button.deactivate")
    .should("exist")
    .click();

  cy.contains("Plan deactivated successfully").should("exist");
  cy.get("table tr")
    .contains("td", planName)
    .parent()
    .contains("td", "INACTIVE")
    .should("exist");
});

Cypress.Commands.add("openMemberProfile", (memberId) => {
  cy.visit("/manage");
  cy.contains("h1", "Manage").should("be.visible");
  cy.get("table.manage-table tbody tr").should("have.length.greaterThan", 0);
  cy.get("table.manage-table tbody tr").then(($rows) => {
    const targetRow = Array.from($rows).find((row) => {
      const idCell = row.querySelector("td.cell-id");
      return idCell && idCell.textContent.trim() === String(memberId);
    });

    if (targetRow) {
      cy.wrap(targetRow).within(() => {
        cy.contains("button", "Profile").click();
      });
      return;
    }

    cy.wrap($rows[0]).within(() => {
      cy.contains("button", "Profile").click();
    });
  });
  cy.contains("h2", "Member Profile").should("be.visible");
});

Cypress.Commands.add("clickRenew", () => {
  cy.get("body").then(($body) => {
    const renewBtn = $body.find('.membership-renew-form button[type="submit"]');
    if (renewBtn.length > 0) {
      cy.wrap(renewBtn.first()).click();
    }
  });
});

Cypress.Commands.add("confirmRenew", () => {
  cy.get("body").then(($body) => {
    if ($body.find('button:contains("Confirm")').length > 0) {
      cy.contains("button", "Confirm").click();
    }
  });
});

Cypress.Commands.add("openManagePage", () => {
  cy.visit("/manage");
  cy.contains("h1", "Manage").should("be.visible");
});

Cypress.Commands.add("openClientEditModal", (clientId) => {
  cy.openManagePage();
  cy.get("table.manage-table tbody tr").should("have.length.greaterThan", 0);
  cy.get("table.manage-table tbody tr").then(($rows) => {
    const target = Array.from($rows).find((row) => {
      const idCell = row.querySelector("td.cell-id");
      return idCell && idCell.textContent.trim() === String(clientId);
    });
    expect(target, `client row for id ${clientId}`).to.exist;
    cy.wrap(target).within(() => {
      cy.contains("button", "Edit").click();
    });
  });
  cy.contains("h2", "Edit").should("be.visible");
});

Cypress.Commands.add("selectPlanInEditModal", (planName) => {
  cy.get(".modal-card").within(() => {
    cy.contains("label", "Membership Plan")
      .parent()
      .find("select")
      .then(($select) => {
        cy.wrap($select).select(String(planName));
      });
  });
});

Cypress.Commands.add("setMembershipStartDateInEditModal", (dateValue) => {
  cy.get(".modal-card").within(() => {
    cy.contains("label", "Membership Start Date")
      .parent()
      .find('input[type="date"]')
      .should("be.enabled")
      .clear({ force: true })
      .type(dateValue, { force: true })
      .blur()
      .should("have.value", dateValue);
  });
});

Cypress.Commands.add("saveEditModal", () => {
  cy.get(".modal-card").within(() => {
    cy.contains("button", "Save Changes").click();
  });
});
