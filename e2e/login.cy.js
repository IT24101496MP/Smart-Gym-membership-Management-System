describe("Login Page", () => {

  const FRONTEND = "http://localhost:5173";

  it("Login page loads correctly", () => {
    cy.visit(`${FRONTEND}/login`);
    cy.contains("Welcome Back").should("exist");
    cy.get("input[name='identifier']").should("exist");
    cy.get("input[name='password']").should("exist");
  });

  it("Shows validation errors for empty submit", () => {
    cy.visit(`${FRONTEND}/login`);
    cy.get("button[type='submit']").click();

    cy.contains("Email or username is required").should("exist");
    cy.contains("Password is required").should("exist");
  });

  it("Shows error for invalid login", () => {
    cy.intercept("POST", "http://localhost:8081/api/auth/login", {
      statusCode: 401,
      body: "Invalid credentials"
    });

    cy.visit(`${FRONTEND}/login`);
    cy.get("input[name='identifier']").type("wrong@example.com");
    cy.get("input[name='password']").type("wrongpassword");
    cy.get("button[type='submit']").click();

    cy.get("[role='alert']").should("exist");
  });

  it("Successful login redirects to /profile (mocked)", () => {

    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    const fakePayload = {
      role: "ADMIN",
      exp: futureExp
    };

    const fakeToken = [
      "header",
      btoa(JSON.stringify(fakePayload)),
      "signature"
    ].join(".");

    cy.intercept("POST", "http://localhost:8081/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: fakeToken,
        refreshToken: "fakeRefreshToken"
      }
    }).as("loginRequest");

    cy.visit(`${FRONTEND}/login`);

    cy.get("input[name='identifier']").type("admin@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("button[type='submit']").click();

    cy.wait("@loginRequest");

    cy.location("pathname", { timeout: 10000 })
      .should("include", "/profile");
  });

});
