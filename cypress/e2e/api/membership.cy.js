const api = require("../../support/apiHelpers");

describe("API - Membership Record", () => {
  it("creates membership record after payment confirmation with correct status + expiry", () => {
    api
      .setupPlanAndClient({
        planOverrides: { durationDays: 7 },
      })
      .then(({ adminTokens, clientTokens, createdPlan, clientId }) => {
        cy.fixture("paymentData.json").then((paymentDefaults) => {
          const paymentReference = `${paymentDefaults.paymentReferencePrefix || "LOCALPAY-QA"}-MEM-${Date.now()}`;

          api
            .confirmMockPayment({
              clientId,
              planId: createdPlan.id,
              paymentReference,
              accessToken: clientTokens.accessToken,
            })
            .then((resp) => {
              expect(resp.status).to.eq("SUCCESS");
              expect(resp.message).to.contain("Payment confirmed and membership activated");

              api.waitForClientMembershipActive({
                clientAccessToken: clientTokens.accessToken,
                timeoutMs: paymentDefaults.activationTimeoutMs || 5000,
                intervalMs: paymentDefaults.activationPollIntervalMs || 250,
              }).then((me) => {
                expect(me.membershipStatus).to.eq("ACTIVE");
                expect(me.membershipStartDate).to.exist;
                expect(me.membershipEndDate).to.exist;

                const diffDays = Math.round(
                  (new Date(`${me.membershipEndDate}T00:00:00Z`) -
                    new Date(`${me.membershipStartDate}T00:00:00Z`)) /
                    86400000
                );
                expect(diffDays).to.eq(createdPlan.durationDays);

                api
                  .getMembershipHistory({
                    clientId,
                    accessToken: adminTokens.accessToken,
                  })
                  .then((history) => {
                    const match = history.find(
                      (h) =>
                        h.planName === createdPlan.planName &&
                        h.startDate === me.membershipStartDate &&
                        h.expiryDate === me.membershipEndDate
                    );
                    expect(match, `History: ${JSON.stringify(history)}`).to.exist;
                    expect(match.status.toString()).to.eq("ACTIVE");
                  });
              });
            });
        });
      });
  });
});

