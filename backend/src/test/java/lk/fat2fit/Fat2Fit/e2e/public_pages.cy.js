describe("Public Pages (absolute URL)", () => {
  const FRONTEND = "http://localhost:5173";

  it("Login page loads", () => {
    cy.visit(`${FRONTEND}/login`);
    cy.contains("Welcome Back").should("exist");
  });

  it("Client registration page loads", () => {
    cy.visit(`${FRONTEND}/client/register`);
    cy.contains("Client Registration").should("exist");
  });

  it("Instructor registration page loads", () => {
    cy.visit(`${FRONTEND}/instructor/register`);
    cy.contains("Instructor Registration").should("exist");
  });

  it("Unauthorized page loads", () => {
    cy.visit(`${FRONTEND}/unauthorized`);
    cy.get("body").should("be.visible");
  });
});