const api = require("../../support/apiHelpers");

describe("API - Payment Webhook (Negative)", () => {
  it("returns 401/403 when confirm is called without Authorization", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan, clientId }) => {
      const paymentReference = `LOCALPAY-NOAUTH-${Date.now()}`;

      cy.request({
        method: "POST",
        url: `${api.API_BASE}/api/payments/confirm`,
        failOnStatusCode: false,
        headers: { "Content-Type": "application/json" },
        body: { clientId, planId: createdPlan.id, paymentReference },
      }).then((resp) => {
        expect([401, 403]).to.include(resp.status);
      });
    });
  });

  it("returns 400 when confirm is called with invalid clientId", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan }) => {
      const paymentReference = `LOCALPAY-BADCLIENT-${Date.now()}`;
      const badClientId = 99999999;

      cy.request({
        method: "POST",
        url: `${api.API_BASE}/api/payments/confirm`,
        failOnStatusCode: false,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientTokens.accessToken}`,
        },
        body: { clientId: badClientId, planId: createdPlan.id, paymentReference },
      }).then((resp) => {
        expect(resp.status).to.eq(400);
        expect(String(resp.body)).to.contain("Client not found");
      });
    });
  });

  it("returns 400 when confirm is called with invalid planId", () => {
    api.setupPlanAndClient().then(({ clientTokens, clientId }) => {
      const paymentReference = `LOCALPAY-BADPLAN-${Date.now()}`;
      const badPlanId = 99999999;

      cy.request({
        method: "POST",
        url: `${api.API_BASE}/api/payments/confirm`,
        failOnStatusCode: false,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientTokens.accessToken}`,
        },
        body: { clientId, planId: badPlanId, paymentReference },
      }).then((resp) => {
        expect(resp.status).to.eq(400);
        expect(String(resp.body)).to.contain("Membership plan not found");
      });
    });
  });

  it("returns 400 when confirm is called for an inactive plan", () => {
    api.setupPlanAndClient().then(({ adminTokens, clientTokens, createdPlan, clientId }) => {
      // Deactivate plan, then confirm should be rejected.
      api
        .setMembershipPlanStatus({
          planId: createdPlan.id,
          status: "INACTIVE",
          adminAccessToken: adminTokens.accessToken,
        })
        .then(() => {
          const paymentReference = `LOCALPAY-INACTIVE-${Date.now()}`;

          cy.request({
            method: "POST",
            url: `${api.API_BASE}/api/payments/confirm`,
            failOnStatusCode: false,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${clientTokens.accessToken}`,
            },
            body: { clientId, planId: createdPlan.id, paymentReference },
          }).then((resp) => {
            expect(resp.status).to.eq(400);
            expect(String(resp.body)).to.contain("Membership plan is not active");

            api.getAuthMe(clientTokens.accessToken).then((me) => {
              expect(me.membershipStatus).to.not.eq("ACTIVE");
            });
          });
        });
    });
  });
});

