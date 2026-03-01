describe("Client Profile", () => {
  const FRONTEND = "http://localhost:5173";

  const visitWithAuth = () => {
    cy.visit(`${FRONTEND}/profile`, {
      onBeforeLoad(win) {
        win.localStorage.setItem("userId", "101");
        win.localStorage.setItem("token", "fake-jwt-token");
      },
    });
  };

  it("redirects to /login if no auth", () => {
    cy.visit(`${FRONTEND}/profile`, {
      onBeforeLoad(win) {
        win.localStorage.removeItem("userId");
        win.localStorage.removeItem("token");
      },
    });

    cy.location("pathname").should("eq", "/login");
  });

  it("loads profile data when logged in", () => {
    cy.intercept("GET", "http://localhost:8080/api/client/user/101", {
      statusCode: 200,
      body: {
        clientId: 101,
        firstName: "John",
        lastName: "Cena",
        mobileNumber: "0712345678",
        createdAt: "2026-03-01T10:00:00.000Z",
      },
    }).as("getProfile");

    visitWithAuth();

    cy.wait("@getProfile");
    cy.contains("My Profile").should("be.visible");
    cy.contains("John Cena").should("be.visible");
    cy.contains("0712345678").should("be.visible");
  });

  it("logs out and redirects to /login", () => {
    cy.intercept("GET", "http://localhost:8080/api/client/user/101", {
      statusCode: 200,
      body: {
        clientId: 101,
        firstName: "John",
        lastName: "Cena",
        createdAt: "2026-03-01T10:00:00.000Z",
      },
    }).as("getProfile");

    visitWithAuth();
    cy.wait("@getProfile");

    cy.contains("button", "Logout").click();
    cy.location("pathname").should("eq", "/login");
  });
});
