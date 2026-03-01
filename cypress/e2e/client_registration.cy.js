describe("Client Registration Page ", () => {
  it("shows validation error banner when required fields missing", () => {
    cy.intercept("POST", "**/api/client/register").as("clientRegister");

    cy.visit("http://localhost:5173/client-registration");

    cy.contains("button", "Register").click();
    cy.get("div.error-message")
      .should("be.visible")
      .and("contain.text", "Please fix the errors below");

    cy.get("@clientRegister.all").should("have.length", 0);
  });

  it("successful registration redirects to /profile (stubbed)", () => {
    cy.intercept("POST", "**/api/client/register", {
      statusCode: 200,
      body: { id: 123 },
    }).as("clientRegister");

    cy.visit("http://localhost:5173/client-registration");
    cy.get("input[name='firstName']").type("John");
    cy.get("input[name='lastName']").type("Cena");
    cy.get("input[name='age']").type("24");
    cy.get("select[name='gender']").select("Male");
    cy.get("input[name='mobileNumber']").type("0712345678");
    cy.get("textarea[name='address']").type("123 Main Street");

    cy.contains("button", "Register").click();

    cy.wait("@clientRegister");

    cy.get("div.success-message")
      .should("be.visible")
      .and("contain.text", "Client registered successfully!");

    cy.location("pathname", { timeout: 8000 }).should("eq", "/profile");
  });
});
