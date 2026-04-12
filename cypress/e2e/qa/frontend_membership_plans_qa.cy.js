describe("QA Frontend: Membership Plans Overview", () => {
  const mockedPlans = [
    {
      id: 501,
      planName: "Gym - Single",
      description: "Standard single-member package.",
      durationDays: 90,
      monthlyPrice: 5000,
      admissionFee: 2000,
      maximumMembers: 1,
      status: "ACTIVE",
    },
    {
      id: 502,
      planName: "Gym - Couple",
      description: "Couple package for two members.",
      durationDays: 180,
      monthlyPrice: 9000,
      admissionFee: 0,
      maximumMembers: 2,
      status: "ACTIVE",
    },
    {
      id: 503,
      planName: "Gym - Family",
      description: "Family package with flexible attendance.",
      durationDays: 365,
      monthlyPrice: null,
      admissionFee: null,
      maximumMembers: 5,
      status: "ACTIVE",
    },
  ];

  beforeEach(() => {
    cy.intercept("GET", "**/api/membership-plans/active", {
      statusCode: 200,
      body: mockedPlans,
    }).as("getActivePlans");

    cy.visit("/membership-plans");
    cy.wait("@getActivePlans");
  });

  it("shows all plan cards with type, duration, pricing, and benefits", () => {
    cy.contains("h1", "Membership Plans Overview").should("be.visible");

    cy.contains("Gym - Single").should("be.visible");
    cy.contains("Gym - Couple").should("be.visible");
    cy.contains("Gym - Family").should("be.visible");

    cy.contains("Type: Single | Duration: 3 Months").should("be.visible");
    cy.contains("Type: Couple | Duration: 6 Months").should("be.visible");
    cy.contains("Type: Family | Duration: One Year").should("be.visible");

    cy.contains("Rs 5,000").should("be.visible");
    cy.contains("Rs 9,000").should("be.visible");
    cy.contains("Currently unavailable.").should("be.visible");

    cy.contains("Standard single-member package.").should("be.visible");
    cy.contains("Couple package for two members.").should("be.visible");
    cy.contains("Family package with flexible attendance.").should("be.visible");
  });

  it("shows Join Now CTA and routes prospective user to registration", () => {
    cy.contains("button", "Join Now").should("have.length.at.least", 1);

    cy.contains("article", "Gym - Single")
      .find("button")
      .contains("Join Now")
      .click();

    cy.url().should("include", "/client/register");
  });

  it("disables CTA when pricing is unavailable", () => {
    cy.contains("article", "Gym - Family")
      .find("button")
      .contains("Join Now")
      .should("be.disabled");
  });
});
