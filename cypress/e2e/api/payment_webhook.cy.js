const api = require("../../support/apiHelpers");

describe("API - Payment Webhook (confirm) -> Auto activation", () => {
  it("creates membership record, sets ACTIVE status, calculates expiry, and is idempotent (double callback)", () => {
    api.setupPlanAndClient().then(
      ({ adminTokens, clientTokens, createdPlan, clientId }) => {
        cy.fixture("paymentData.json").then((paymentDefaults) => {
          const paymentReference = `${paymentDefaults.paymentReferencePrefix || "LOCALPAY-QA"}-${Date.now()}`;

          // "Webhook" /confirm call (payment confirmation) - first callback
          api
            .confirmMockPayment({
              clientId,
              planId: createdPlan.id,
              paymentReference,
              accessToken: clientTokens.accessToken,
            })
            .then((confirmResp) => {
              expect(confirmResp.status).to.eq("SUCCESS");
              expect(confirmResp.message).to.contain("Payment confirmed and membership activated");

              // Timeout/async edge case: activation must be observable quickly
              api
                .waitForClientMembershipActive({
                  clientAccessToken: clientTokens.accessToken,
                  timeoutMs: paymentDefaults.activationTimeoutMs || 5000,
                  intervalMs: paymentDefaults.activationPollIntervalMs || 250,
                })
                .then((meAfterConfirm) => {
                  expect(meAfterConfirm.membershipStatus).to.eq("ACTIVE");
                  expect(meAfterConfirm.membershipStartDate).to.exist;
                  expect(meAfterConfirm.membershipEndDate).to.exist;

                  // Expiry date calculated correctly:
                  const diffDays = Math.round(
                    (new Date(`${meAfterConfirm.membershipEndDate}T00:00:00Z`) -
                      new Date(`${meAfterConfirm.membershipStartDate}T00:00:00Z`)) /
                      86400000
                  );
                  expect(diffDays).to.eq(createdPlan.durationDays);

                  // Membership record exists (via history endpoint)
                  api
                    .getMembershipHistory({
                      clientId,
                      accessToken: adminTokens.accessToken,
                    })
                    .then((history) => {
                      const matching = history.find(
                        (h) =>
                          h.planName === createdPlan.planName &&
                          h.expiryDate === meAfterConfirm.membershipEndDate
                      );
                      expect(matching, `History: ${JSON.stringify(history)}`).to.exist;
                      expect(matching.status.toString()).to.eq("ACTIVE");
                    });

                  // Second webhook callback (double callback) with the same reference
                  api
                    .confirmMockPayment({
                      clientId,
                      planId: createdPlan.id,
                      paymentReference,
                      accessToken: clientTokens.accessToken,
                    })
                    .then((secondResp) => {
                      expect(secondResp.status).to.eq("ALREADY_PROCESSED");
                      expect(secondResp.message).to.contain("skipped");

                      api.getAuthMe(clientTokens.accessToken).then((meAfterSecond) => {
                        expect(meAfterSecond.membershipStatus).to.eq("ACTIVE");
                        expect(meAfterSecond.membershipEndDate).to.eq(
                          meAfterConfirm.membershipEndDate
                        );
                        expect(meAfterSecond.membershipStartDate).to.eq(
                          meAfterConfirm.membershipStartDate
                        );
                      });
                    });
                });
            });
        });
      }
    );
  });
});

