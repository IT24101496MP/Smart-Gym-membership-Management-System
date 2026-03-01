describe("Protected Routes - After Login", () => {

  const FRONTEND = "http://localhost:5173";

  function loginMock(role = "ADMIN") {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    const fakeToken = [
      "header",
      btoa(JSON.stringify({ role, exp: futureExp })),
      "signature"
    ].join(".");

    cy.intercept("POST", "http://localhost:8081/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: fakeToken,
        refreshToken: "fakeRefreshToken"
      }
    });

    cy.visit(`${FRONTEND}/login`);
    cy.get("input[name='identifier']").type("admin@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("button[type='submit']").click();
  }

  it("Logged in user can access /profile", () => {
    loginMock();
    cy.visit(`${FRONTEND}/profile`);
    cy.location("pathname").should("include", "/profile");
  });

  it("ADMIN can access /instructor", () => {
    loginMock("ADMIN");
    cy.visit(`${FRONTEND}/instructor`);
    cy.location("pathname").should("include", "/instructor");
  });

  it("CLIENT cannot access /instructor (redirect to /unauthorized)", () => {
    loginMock("CLIENT");
    cy.visit(`${FRONTEND}/instructor`, { failOnStatusCode: false });
    cy.location("pathname").should("include", "/unauthorized");
  });

});