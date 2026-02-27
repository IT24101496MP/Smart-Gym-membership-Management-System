describe("Instructor List Page", () => {
  const base = "http://localhost:5173";

  it("Should load instructors and filter by status", () => {
    cy.visit(`${base}/instructor`);

    cy.contains("Loading instructors").should("exist");
    cy.contains("Instructors").should("exist");

    cy.contains("PENDING").click();
    cy.contains("APPROVED").click();
    cy.contains("REJECTED").click();
    cy.contains("ALL").click();
  });

  it("Should search by name/email/phone", () => {
    cy.visit(`${base}/instructor`);
    cy.get(".search-input").type("gmail");
    cy.contains("Showing").should("exist");
  });

  it("Should open instructor detail page by clicking Review", () => {
    cy.visit(`${base}/instructor`);
    cy.get("a.review-link").first().click();
    cy.contains("Instructor Review").should("exist");
  });
});