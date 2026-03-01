describe("User Sign Up Page ", () => {

  it("shows error when submitting empty fields", () => {
    cy.visit("http://localhost:5173/login");

    cy.contains("button", "Sign Up").click();

    cy.contains("Please fill in all fields").should("be.visible");
  });

  it("shows error when passwords do not match", () => {
    cy.visit("http://localhost:5173/login");

    cy.get("input[name='email']").type("test@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("input[name='confirmPassword']").type("Password123@");

    cy.contains("button", "Sign Up").click();

    cy.contains("Passwords do not match").should("be.visible");
  });

  it("shows error when password is weak", () => {
    cy.visit("http://localhost:5173/login");

    cy.get("input[name='email']").type("test@example.com");
    cy.get("input[name='password']").type("abc");
    cy.get("input[name='confirmPassword']").type("abc");

    cy.contains("button", "Sign Up").click();

    cy.contains("Password must be at least 8 chars").should("be.visible");
  });

  it("successful signup redirects to client-registration (stubbed)", () => {

    cy.intercept("POST", "**/api/user/register", {
      statusCode: 200,
      body: { message: "ok" },
    }).as("register");

    cy.visit("http://localhost:5173/login");

    const email = `user${Date.now()}@test.com`;

    cy.get("input[name='email']").type(email);
    cy.get("input[name='password']").type("Password123!");
    cy.get("input[name='confirmPassword']").type("Password123!");

    cy.contains("button", "Sign Up").click();

    cy.wait("@register");

    cy.contains("Account created successfully").should("be.visible");

    cy.location("pathname", { timeout: 8000 })
      .should("eq", "/client-registration");
  });

});
