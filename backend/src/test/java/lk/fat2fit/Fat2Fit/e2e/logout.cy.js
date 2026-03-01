describe("Logout Flow", () => {

  const FRONTEND = "http://localhost:5173";

  function loginMock() {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    const fakeToken = [
      "header",
      btoa(JSON.stringify({ role: "ADMIN", exp: futureExp })),
      "signature"
    ].join(".");

    // Mock login
    cy.intercept("POST", "http://localhost:8081/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: fakeToken,
        refreshToken: "fakeRefreshToken"
      }
    });

    // Mock profile fetch (/api/auth/me)
    cy.intercept("GET", "http://localhost:8081/api/auth/me", {
      statusCode: 200,
      body: {
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "ADMIN"
      }
    }).as("getProfile");

    cy.visit(`${FRONTEND}/login`);
    cy.get("input[name='identifier']").type("admin@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("button[type='submit']").click();

    cy.wait("@getProfile");
  }

  it("User can logout from profile", () => {
    loginMock();

    cy.visit(`${FRONTEND}/profile`);
    cy.contains("Logout").should("exist").click();

    cy.location("pathname").should("include", "/login");
  });

});