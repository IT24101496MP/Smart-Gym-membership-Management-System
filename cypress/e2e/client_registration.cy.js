describe("Client Registration Page ", () => {
  it("shows validation error banner when required fields missing", () => {
    // Spy on network to ensure form is NOT submitted when validation fails
    cy.intercept("POST", "**/api/client/register").as("clientRegister");

    cy.visit("http://localhost:5173/client-registration");

    cy.contains("button", "Register").click();

    // ✅ This is the only error text your UI actually displays
    cy.get("div.error-message")
      .should("be.visible")
      .and("contain.text", "Please fix the errors below");

    // ✅ Ensure the API request was NOT sent (client-side validation blocked submit)
    cy.get("@clientRegister.all").should("have.length", 0);
  });

  it("successful registration redirects to /profile (stubbed)", () => {
    cy.intercept("POST", "**/api/client/register", {
      statusCode: 200,
      body: { id: 123 },
    }).as("clientRegister");

    cy.visit("http://localhost:5173/client-registration");

    // Fill only required fields based on your validateForm()
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