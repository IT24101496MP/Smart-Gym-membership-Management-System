const api = require("../../support/apiHelpers");

describe("UI - Health Screening Risk Flag", () => {
  let adminTokens;
  let targetClient;

  const screeningPayload = (hasRisk) => ({
    cardiacConditions: hasRisk,
    respiratoryIssues: false,
    faintingOrBalanceProblems: false,
    jointOrMuscleDisorders: false,
    highBloodPressure: false,
    cholesterolLevels: false,
    currentMedications: false,
    disabilitiesOrPhysicalLimitations: false,
    additionalNotes: hasRisk
      ? "Risk identified for verification"
      : "All answers marked no",
  });

  const authenticateAdmin = () => {
    return cy.fixture("users.json").then((users) => {
      return api
        .loginJson({
          identifier: users.admin.identifier,
          password: users.admin.password,
        })
        .then((tokens) => {
          adminTokens = tokens;
          return cy
            .request({
              method: "GET",
              url: `${api.API_BASE}/api/manage/clients`,
              headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
              failOnStatusCode: false,
            })
            .then((resp) => {
              expect(resp.status).to.eq(200);
              expect(resp.body).to.be.an("array").and.not.be.empty;
              targetClient = resp.body[0];
            });
        });
    });
  };

  const visitManageAsAdmin = () => {
    cy.visit("/manage", {
      onBeforeLoad(win) {
        win.localStorage.setItem("accessToken", adminTokens.accessToken);
        win.localStorage.setItem("refreshToken", adminTokens.refreshToken);
      },
    });
    cy.contains("h1", "Manage", { timeout: 15000 }).should("be.visible");
  };

  const openHealthModalForClient = (clientId) => {
    cy.get("table.manage-table tbody tr", { timeout: 15000 })
      .should("have.length.greaterThan", 0)
      .then(($rows) => {
        const targetRow = Array.from($rows).find((row) => {
          const idCell = row.querySelector("td.cell-id");
          return idCell && idCell.textContent.trim() === String(clientId);
        });

        expect(targetRow, `client row for id ${clientId}`).to.exist;
        cy.wrap(targetRow).within(() => {
          cy.contains("button", "Health").click();
        });
      });

    cy.contains("h2", "Health Screening", { timeout: 10000 }).should("be.visible");
  };

  beforeEach(() => {
    authenticateAdmin();
  });

  it("shows High Risk after questionnaire with at least one YES", () => {
    cy.request({
      method: "POST",
      url: `${api.API_BASE}/api/manage/clients/${targetClient.id}/health-screening`,
      headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
      body: screeningPayload(true),
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.highRisk).to.eq(true);
      expect(resp.body.memberHighRisk).to.eq(true);
    });

    visitManageAsAdmin();
    openHealthModalForClient(targetClient.id);

    cy.contains("Current Risk Flag")
      .parent()
      .find(".health-risk-badge")
      .should("contain", "High Risk");

    cy.contains("Saved Risk Status:").should("contain", "High Risk");
  });

  it("shows Normal after questionnaire with all NO responses", () => {
    cy.request({
      method: "POST",
      url: `${api.API_BASE}/api/manage/clients/${targetClient.id}/health-screening`,
      headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
      body: screeningPayload(false),
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.highRisk).to.eq(false);
      expect(resp.body.memberHighRisk).to.eq(false);
    });

    visitManageAsAdmin();
    openHealthModalForClient(targetClient.id);

    cy.contains("Current Risk Flag")
      .parent()
      .find(".health-risk-badge")
      .should("contain", "Normal");

    cy.contains("Saved Risk Status:").should("contain", "Normal");
  });

  it("prevents submission when questionnaire responses are incomplete", () => {
    visitManageAsAdmin();
    openHealthModalForClient(targetClient.id);

    cy.contains("button", "Submit Screening").click();
    cy.contains("Please answer all required questionnaire responses.").should("be.visible");
  });
});