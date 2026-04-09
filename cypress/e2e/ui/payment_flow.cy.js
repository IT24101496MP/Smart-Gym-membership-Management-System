const api = require("../../support/apiHelpers");

describe("UI - Payment Flow", () => {
  it("creates intent, confirms payment, and is idempotent on double callback", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", clientTokens.accessToken);
        win.localStorage.setItem("refreshToken", clientTokens.refreshToken);
      });

      cy.visit(`${APP}/payment/${createdPlan.id}`);

      cy.contains("button", "Create Payment Intent").click();
      cy.contains("Payment Intent Created", { timeout: 10000 }).should("be.visible");

      cy.contains(".payment-result p", "paymentIntentId:").then(($p) => {
        expect($p.text()).to.not.contain("N/A");
      });

      cy.contains("button", "Confirm Payment (Test)").click();
      cy.contains(
        "Payment confirmed and membership activated successfully.",
        { timeout: 10000 }
      ).should("be.visible");

      // Snapshot membership period after first confirmation
      api.getAuthMe(clientTokens.accessToken).then((meAfterFirst) => {
        expect(meAfterFirst.membershipStatus).to.eq("ACTIVE");

        cy.contains("button", "Confirm Payment (Test)").click();

        cy.contains(
          "Payment already confirmed earlier. Membership is already active for this payment reference.",
          { timeout: 10000 }
        ).should("be.visible");

        api.getAuthMe(clientTokens.accessToken).then((meAfterSecond) => {
          expect(meAfterSecond.membershipStatus).to.eq("ACTIVE");
          expect(meAfterSecond.membershipEndDate).to.eq(meAfterFirst.membershipEndDate);
        });
      });
    });
  });
});

