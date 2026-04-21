describe("UI - Body Measurements", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit("/manage");
    cy.contains("h1", "Manage").should("be.visible");
  });

  const openMetricsModalForFirstClient = () => {
    cy.get("table.manage-table tbody tr", { timeout: 20000 }).should("have.length.greaterThan", 0);
    cy.get("table.manage-table tbody tr").first().within(() => {
      cy.contains("button", "Metrics").click();
    });
    cy.contains("h2", "Body Metrics", { timeout: 10000 }).should("be.visible");
  };

  it("shows required measurement fields", () => {
    openMetricsModalForFirstClient();

    cy.get(".modal-card").within(() => {
      cy.contains("label", "Measurement Date").should("exist");
      cy.contains("label", "Height (cm)").should("exist");
      cy.contains("label", "Weight (kg)").should("exist");
      cy.contains("label", "Waist (cm)").should("exist");
      cy.contains("label", "Hip (cm)").should("exist");
      cy.contains("label", "Arm (cm)").should("exist");
      cy.contains("label", "Shoulder (cm)").should("exist");
      cy.contains("label", "Breast (cm)").should("exist");
      cy.contains("label", "Buttocks (cm)").should("exist");
    });
  });

  it("blocks submit when required date is missing", () => {
    openMetricsModalForFirstClient();

    cy.intercept("POST", "**/api/manage/clients/*/metrics").as("saveMetrics");
    cy.contains("label", "Measurement Date").parent().find('input[type="date"]').clear({ force: true });
    cy.contains("button", "Save Measurement").click();

    cy.get("@saveMetrics.all").should("have.length", 0);
  });

  it("blocks submit for invalid numeric value", () => {
    openMetricsModalForFirstClient();

    cy.intercept("POST", "**/api/manage/clients/*/metrics").as("saveMetrics");
    cy.contains("label", "Height (cm)").parent().find('input[type="number"]').clear().type("0");
    cy.contains("button", "Save Measurement").click();

    cy.get("@saveMetrics.all").should("have.length", 0);
  });

  it("saves a valid measurement and displays latest BMI", () => {
    openMetricsModalForFirstClient();

    cy.intercept("POST", "**/api/manage/clients/*/metrics").as("saveMetrics");

    cy.contains("label", "Measurement Date").parent().find('input[type="date"]').clear({ force: true }).type(new Date().toISOString().slice(0, 10), { force: true });
    cy.contains("label", "Height (cm)").parent().find('input[type="number"]').clear().type("172");
    cy.contains("label", "Weight (kg)").parent().find('input[type="number"]').clear().type("74");
    cy.contains("label", "Waist (cm)").parent().find('input[type="number"]').clear().type("85");
    cy.contains("label", "Hip (cm)").parent().find('input[type="number"]').clear().type("96");
    cy.contains("label", "Arm (cm)").parent().find('input[type="number"]').clear().type("34");
    cy.contains("label", "Shoulder (cm)").parent().find('input[type="number"]').clear().type("49");
    cy.contains("label", "Breast (cm)").parent().find('input[type="number"]').clear().type("99");
    cy.contains("label", "Buttocks (cm)").parent().find('input[type="number"]').clear().type("100");

    cy.contains("button", "Save Measurement").click();

    cy.wait("@saveMetrics").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.bmi).to.exist;
      expect(response.body.recordedAt).to.exist;
    });

    cy.contains("Latest BMI:").should("exist");
  });
});
