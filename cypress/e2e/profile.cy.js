describe("Client Profile Page", () => {

  beforeEach(() => {
    window.localStorage.setItem("userId", "123");
  });

  it("redirects to login if no userId", () => {
    window.localStorage.removeItem("userId");

    cy.visit("http://localhost:5173/profile");

    cy.location("pathname").should("eq", "/login");
  });

  it("loads profile data (stubbed)", () => {

    cy.intercept("GET", "**/api/client/user/123", {
      statusCode: 200,
      body: {
        clientId: 10,
        firstName: "John",
        lastName: "Cena",
        createdAt: new Date().toISOString(),
      },
    }).as("getProfile");

    cy.visit("http://localhost:5173/profile");

    cy.wait("@getProfile");

    cy.contains("John Cena").should("be.visible");
    cy.contains("Edit Profile").should("be.visible");
  });

  it("logout works correctly", () => {

    cy.intercept("GET", "**/api/client/user/123", {
      statusCode: 200,
      body: {
        clientId: 10,
        firstName: "John",
        lastName: "Cena",
        createdAt: new Date().toISOString(),
      },
    });

    cy.visit("http://localhost:5173/profile");

    cy.contains("button", "Logout").click();

    cy.location("pathname").should("eq", "/login");

    cy.window().then((w) => {
      expect(w.localStorage.getItem("userId")).to.eq(null);
    });
  });

});
