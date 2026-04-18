describe("Landing page - implemented behavior", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows branding, hero content, and login CTA", () => {
    cy.contains("FAT2FIT WELLNESS STUDIO").should("be.visible");
    cy.get("img.brand-logo").should("be.visible");
    cy.contains("Transform Your Body, Transform Your Life").should("be.visible");
    cy.contains("Build consistency with expert coaching, structured plans, and a motivating fitness community.")
      .should("be.visible");
    cy.contains("button", "Login").should("be.visible");
  });

  it("navigates to login from the header login button", () => {
    cy.contains("button", "Log In").click();
    cy.url().should("include", "/login");
    cy.contains("h1", "Welcome Back").should("be.visible");
  });

  it("shows categorized gallery images and opens the lightbox", () => {
    cy.contains("Inside our gym").should("be.visible");
    cy.contains("button", "Equipment").should("have.attr", "aria-selected", "true");

    cy.get(".gallery-grid-v2 .gallery-item").should("have.length.greaterThan", 0);
    cy.get(".gallery-grid-v2 .gallery-item img").first().should("be.visible");

    cy.contains("button", "Classes").click();
    cy.contains("button", "Classes").should("have.attr", "aria-selected", "true");
    cy.get(".gallery-grid-v2 .gallery-item").should("have.length.greaterThan", 0);

    cy.get(".gallery-grid-v2 .gallery-item").first().click();
    cy.get(".lightbox-v2").should("be.visible");
    cy.get(".lightbox-content-v2 img").should("be.visible");
    cy.get(".lightbox-close-v2").click();
    cy.get(".lightbox-v2").should("not.exist");
  });

  it("shows placeholder behavior when an image fails to load", () => {
    cy.get(".hero-image").then(($img) => {
      const image = $img[0];
      image.src = "http://127.0.0.1:1/missing-hero.jpg";
      image.dispatchEvent(new Event("error"));
    });

    cy.get(".hero-image").should(($img) => {
      expect($img[0].src).to.include("data:image/svg+xml");
    });
  });
});