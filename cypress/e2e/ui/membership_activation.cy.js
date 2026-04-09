const api = require("../../support/apiHelpers");

describe("UI - Membership Activation", () => {
  it("auto-activates membership after successful payment confirmation", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", clientTokens.accessToken);
        win.localStorage.setItem("refreshToken", clientTokens.refreshToken);
      });

      cy.visit(`${APP}/payment/${createdPlan.id}`);

      cy.contains("button", "Create Payment Intent").click();
      cy.contains("Payment Intent Created", { timeout: 10000 }).should("be.visible");

      // Confirm payment and trigger activation
      cy.contains("button", "Confirm Payment (Test)").click();

      cy.contains("Payment confirmed and membership activated successfully.", { timeout: 10000 }).should(
        "be.visible"
      );

      cy.contains("button", "Go to Profile").click();

      cy.contains("Membership Status")
        .parent()
        .find(".membership-status-badge")
        .should("contain", "Active");

      cy.contains("Membership Period")
        .parent()
        .find(".detail-value")
        .invoke("text")
        .then((periodText) => {
          const match = periodText.match(
            /(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})/
          );
          expect(match, `Membership period text: "${periodText}"`).to.not.be.null;

          const start = new Date(`${match[1]}T00:00:00Z`);
          const end = new Date(`${match[2]}T00:00:00Z`);
          const diffDays = Math.round((end - start) / 86400000);
          expect(diffDays).to.eq(createdPlan.durationDays);
        });
    });
  });
});

