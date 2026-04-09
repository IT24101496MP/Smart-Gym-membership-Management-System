const api = require("../support/apiHelpers");

describe("Full Membership Flow", () => {
  it("activates membership after payment confirmation and handles double callback + activation timeout", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan, clientId }) => {
      const APP = "http://localhost:5173";

      cy.fixture("paymentData.json").then((paymentDefaults) => {
        cy.window().then((win) => {
          win.localStorage.setItem("accessToken", clientTokens.accessToken);
          win.localStorage.setItem("refreshToken", clientTokens.refreshToken);
        });

        cy.visit(`${APP}/payment/${createdPlan.id}`);

        cy.contains("button", "Create Payment Intent").click();
        cy.contains("Payment Intent Created", { timeout: 10000 }).should("be.visible");

        let paymentReference;
        cy.contains(".payment-result p", "paymentIntentId:").invoke("text").then((txt) => {
          const m = txt.match(/paymentIntentId:\s*(\S+)/);
          expect(m, `paymentIntentId in DOM: "${txt}"`).to.not.be.null;
          paymentReference = m[1];
        });

        cy.contains("button", "Confirm Payment (Test)").click();
        cy.contains("Payment confirmed and membership activated successfully.", { timeout: 10000 }).should(
          "be.visible"
        );

        // Timeout/async edge case: activation must be observable quickly
        api
          .waitForClientMembershipActive({
            clientAccessToken: clientTokens.accessToken,
            timeoutMs: paymentDefaults.activationTimeoutMs || 5000,
            intervalMs: paymentDefaults.activationPollIntervalMs || 250,
          })
          .then((meAfterFirst) => {
            const membershipEndDateAfterFirst = meAfterFirst.membershipEndDate;

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
                expect(match, `Membership period: "${periodText}"`).to.not.be.null;

                const start = new Date(`${match[1]}T00:00:00Z`);
                const end = new Date(`${match[2]}T00:00:00Z`);
                const diffDays = Math.round((end - start) / 86400000);
                expect(diffDays).to.eq(createdPlan.durationDays);
              });

            // Double callback should not create a new membership / change expiry
            api
              .confirmMockPayment({
                clientId,
                planId: createdPlan.id,
                paymentReference,
                accessToken: clientTokens.accessToken,
              })
              .then((secondResp) => {
                expect(secondResp.status).to.eq("ALREADY_PROCESSED");
                return api.getAuthMe(clientTokens.accessToken).then((meAfterSecond) => {
                  expect(meAfterSecond.membershipEndDate).to.eq(membershipEndDateAfterFirst);
                  expect(meAfterSecond.membershipStatus).to.eq("ACTIVE");
                });
              });
          });
      });
    });
  });
});

