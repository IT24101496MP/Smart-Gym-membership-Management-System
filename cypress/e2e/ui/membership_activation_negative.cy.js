const api = require("../../support/apiHelpers");

function makeJwt(payload) {
  const b64 = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const header = { alg: "none", typ: "JWT" };
  return `${b64(header)}.${b64(payload)}.`;
}

describe("UI - Membership Activation (Negative)", () => {
  it("redirects to /login when not authenticated", () => {
    cy.visit("http://localhost:5173/payment/1");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
  });

  it("redirects to /unauthorized when role is not CLIENT", () => {
    const now = Math.floor(Date.now() / 1000);
    cy.window().then((win) => {
      win.localStorage.setItem(
        "accessToken",
        makeJwt({ role: "ADMIN", exp: now + 3600 })
      );
      win.localStorage.setItem(
        "refreshToken",
        makeJwt({ type: "refresh", exp: now + 7 * 24 * 3600 })
      );
    });

    cy.visit("http://localhost:5173/payment/1");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/unauthorized");
    cy.contains("Access Denied").should("be.visible");
  });

  it("shows an error when create-intent fails", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan }) => {
      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", clientTokens.accessToken);
        win.localStorage.setItem("refreshToken", clientTokens.refreshToken);
      });

      cy.intercept("POST", "**/api/payments/create-intent", {
        statusCode: 400,
        body: "Plan is not active",
      }).as("createIntentFail");

      cy.visit(`http://localhost:5173/payment/${createdPlan.id}`);
      cy.contains("button", "Create Payment Intent").click();
      cy.wait("@createIntentFail");

      cy.get(".payment-error", { timeout: 10000 }).should(
        "contain",
        "Plan is not active"
      );
    });
  });

  it("shows an error when confirm fails", () => {
    api.setupPlanAndClient().then(({ clientTokens, createdPlan }) => {
      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", clientTokens.accessToken);
        win.localStorage.setItem("refreshToken", clientTokens.refreshToken);
      });

      cy.intercept("POST", "**/api/payments/create-intent", {
        statusCode: 200,
        body: {
          paymentIntentId: `LOCALPAY-TEST-${Date.now()}`,
          status: "PENDING_CONFIRMATION",
          amountInCents: 100000,
          currency: "usd",
        },
      }).as("createIntentOk");

      cy.intercept("POST", "**/api/payments/confirm", {
        statusCode: 400,
        body: "Payment confirmation failed",
      }).as("confirmFail");

      cy.visit(`http://localhost:5173/payment/${createdPlan.id}`);

      cy.contains("button", "Create Payment Intent").click();
      cy.wait("@createIntentOk");
      cy.contains("Payment Intent Created", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Confirm Payment (Test)").click();
      cy.wait("@confirmFail");
      cy.get(".payment-error", { timeout: 10000 }).should(
        "contain",
        "Payment confirmation failed"
      );
    });
  });
});

