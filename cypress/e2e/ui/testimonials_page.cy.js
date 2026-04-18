describe("Testimonials page", () => {
  it("displays member testimonials with names, optional images, and ratings", () => {
    cy.visit("/testimonials");

    cy.contains("h1", "Testimonials").should("be.visible");
    cy.contains(
      "Hear from our members and see how consistent coaching, structured plans, and supportive trainers",
    ).should("be.visible");

    cy.get('[aria-label="Member testimonials"]')
      .should("be.visible")
      .within(() => {
        cy.get(".testimonial-card").should("have.length", 5);

        cy.contains("h2", "Nadeesha Perera").should("be.visible");
        cy.contains("h2", "Kasun Maduranga").should("be.visible");
        cy.contains("h2", "Selena Fernando").should("be.visible");
        cy.contains("h2", "Ravindu Silva").should("be.visible");
        cy.contains("h2", "Amali Jayasinghe").should("be.visible");

        cy.get("img[alt$='profile']").should("have.length.at.least", 1);
        cy.get(".testimonial-avatar-fallback").should("have.length.at.least", 1);

        cy.get(".testimonial-rating.available").should("have.length.at.least", 1);
        cy.get(".testimonial-rating.unavailable").should("contain", "Rating not provided");
      });
  });

  it("keeps the review form available for visitor feedback", () => {
    cy.visit("/testimonials");

    cy.contains("h2", "Write a Review").should("be.visible");
    cy.get('input[name="name"]').should("be.visible");
    cy.get('input[name="image"]').should("be.visible");
    cy.get('select[name="rating"]').should("be.visible");
    cy.get('textarea[name="review"]').should("be.visible");
  });
});