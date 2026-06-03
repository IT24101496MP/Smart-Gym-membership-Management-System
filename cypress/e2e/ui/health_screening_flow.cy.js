const api = require("../../support/apiHelpers");

describe("UI - Health Screening Questionnaire", () => {
  it("should allow staff to record health screening with all low-risk responses", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      cy.visit(`${APP}/manage`);

      // Find and open the client in the list
      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      // Wait for modal to appear
      cy.contains("Health Screening").should("be.visible");

      // Verify all 8 questions are present
      cy.contains("Cardiac conditions").should("be.visible");
      cy.contains("Respiratory issues").should("be.visible");
      cy.contains("Fainting or balance problems").should("be.visible");
      cy.contains("Joint or muscle disorders").should("be.visible");
      cy.contains("High blood pressure").should("be.visible");
      cy.contains("Cholesterol levels").should("be.visible");
      cy.contains("Current medications").should("be.visible");
      cy.contains("Disabilities or physical limitations").should("be.visible");

      // Select "No" for all questions
      cy.get('input[name="cardiacConditions"][value="NO"]').click();
      cy.get('input[name="respiratoryIssues"][value="NO"]').click();
      cy.get('input[name="faintingOrBalanceProblems"][value="NO"]').click();
      cy.get('input[name="jointOrMuscleDisorders"][value="NO"]').click();
      cy.get('input[name="highBloodPressure"][value="NO"]').click();
      cy.get('input[name="cholesterolLevels"][value="NO"]').click();
      cy.get('input[name="currentMedications"][value="NO"]').click();
      cy.get('input[name="disabilitiesOrPhysicalLimitations"][value="NO"]').click();

      // Add optional notes
      cy.get("textarea[placeholder='Optional notes about safety concerns']").type("No health concerns at this time");

      // Submit the form
      cy.contains("button", "Submit Screening").click();

      // Verify success message
      cy.contains("Health screening submitted successfully", { timeout: 10000 }).should("be.visible");

      // Verify risk badge shows "Normal"
      cy.contains("span", "Normal").should("be.visible");
    });
  });

  it("should flag member as high-risk when cardiac condition is selected", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      cy.visit(`${APP}/manage`);

      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      // Select "Yes" for cardiac condition
      cy.get('input[name="cardiacConditions"][value="YES"]').click();

      // Select "No" for all other questions
      cy.get('input[name="respiratoryIssues"][value="NO"]').click();
      cy.get('input[name="faintingOrBalanceProblems"][value="NO"]').click();
      cy.get('input[name="jointOrMuscleDisorders"][value="NO"]').click();
      cy.get('input[name="highBloodPressure"][value="NO"]').click();
      cy.get('input[name="cholesterolLevels"][value="NO"]').click();
      cy.get('input[name="currentMedications"][value="NO"]').click();
      cy.get('input[name="disabilitiesOrPhysicalLimitations"][value="NO"]').click();

      cy.contains("button", "Submit Screening").click();

      cy.contains("Health screening submitted successfully", { timeout: 10000 }).should("be.visible");

      // Verify risk badge shows "High Risk"
      cy.contains("span", "High Risk").should("be.visible");

      // Verify identified risk areas show cardiac condition
      cy.contains("Cardiac conditions").should("be.visible");
    });
  });

  it("should flag member as high-risk when multiple indicators are selected", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      cy.visit(`${APP}/manage`);

      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      // Select "Yes" for multiple risk indicators
      cy.get('input[name="cardiacConditions"][value="NO"]').click();
      cy.get('input[name="respiratoryIssues"][value="YES"]').click();
      cy.get('input[name="faintingOrBalanceProblems"][value="YES"]').click();
      cy.get('input[name="jointOrMuscleDisorders"][value="NO"]').click();
      cy.get('input[name="highBloodPressure"][value="YES"]').click();
      cy.get('input[name="cholesterolLevels"][value="NO"]').click();
      cy.get('input[name="currentMedications"][value="YES"]').click();
      cy.get('input[name="disabilitiesOrPhysicalLimitations"][value="NO"]').click();

      cy.contains("button", "Submit Screening").click();

      cy.contains("Health screening submitted successfully", { timeout: 10000 }).should("be.visible");

      // Verify member is flagged as high-risk
      cy.contains("span", "High Risk").should("be.visible");

      // Verify all identified risk areas are shown
      cy.contains("Respiratory issues").should("be.visible");
      cy.contains("Fainting or balance problems").should("be.visible");
      cy.contains("High blood pressure").should("be.visible");
      cy.contains("Current medications").should("be.visible");
    });
  });

  it("should prevent submission when required responses are missing", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      cy.visit(`${APP}/manage`);

      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      // Only select "No" for some questions, leaving others unanswered
      cy.get('input[name="cardiacConditions"][value="NO"]').click();
      cy.get('input[name="respiratoryIssues"][value="NO"]').click();
      // Leave remaining questions unanswered

      // Try to submit
      cy.contains("button", "Submit Screening").click();

      // Verify error message
      cy.contains("Please answer all required questionnaire responses", { timeout: 5000 }).should("be.visible");

      // Verify form is still visible for correction
      cy.contains("Health Screening").should("be.visible");
    });
  });

  it("should display previously saved health screening data for a member", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      // First, submit a health screening
      cy.visit(`${APP}/manage`);

      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      cy.get('input[name="cardiacConditions"][value="YES"]').click();
      cy.get('input[name="respiratoryIssues"][value="NO"]').click();
      cy.get('input[name="faintingOrBalanceProblems"][value="NO"]').click();
      cy.get('input[name="jointOrMuscleDisorders"][value="NO"]').click();
      cy.get('input[name="highBloodPressure"][value="NO"]').click();
      cy.get('input[name="cholesterolLevels"][value="NO"]').click();
      cy.get('input[name="currentMedications"][value="NO"]').click();
      cy.get('input[name="disabilitiesOrPhysicalLimitations"][value="NO"]').click();

      cy.get("textarea[placeholder='Optional notes about safety concerns']").type("Cardiac condition requires monitoring");

      cy.contains("button", "Submit Screening").click();

      cy.contains("Health screening submitted successfully", { timeout: 10000 }).should("be.visible");

      // Wait for modal to close
      cy.contains("Health Screening").should("not.be.visible", { timeout: 5000 });

      // Reopen the health screening modal to verify data persists
      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      // Verify saved data is loaded
      cy.contains("Last Screening").should("be.visible");
      cy.contains("Saved Risk Status: High Risk").should("be.visible");
      cy.contains("Cardiac conditions").should("be.visible");
      cy.contains("Cardiac condition requires monitoring").should("be.visible");

      // Verify previous selections are retained
      cy.get('input[name="cardiacConditions"][value="YES"]').should("be.checked");
      cy.get('input[name="respiratoryIssues"][value="NO"]').should("be.checked");
    });
  });

  it("should display current risk flag status in member profile", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      cy.visit(`${APP}/manage`);

      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      // Check current risk flag is visible
      cy.contains("Current Risk Flag").should("be.visible");

      // Close modal to check member list
      cy.get("button.modal-close").click();

      cy.contains(createdClient.firstName)
        .parent()
        .parent()
        .parent()
        .within(() => {
          // Risk badge should be visible in the member list row
          cy.contains("span", "Normal").should("be.visible");
        });
    });
  });

  it("should handle server error when health screening submission fails", () => {
    api.setupStaffClientAndLogin().then(({ staffTokens, createdClient }) => {
      const APP = "http://localhost:5173";

      cy.window().then((win) => {
        win.localStorage.setItem("accessToken", staffTokens.accessToken);
        win.localStorage.setItem("refreshToken", staffTokens.refreshToken);
      });

      cy.visit(`${APP}/manage`);

      // Intercept to force an error response
      cy.intercept("POST", "**/api/manage/clients/**/health-screening", {
        statusCode: 500,
        body: "Health screening submission failed.",
      });

      cy.contains(createdClient.firstName).parent().parent().parent().contains("button", "Health").click();

      cy.contains("Health Screening").should("be.visible");

      // Fill in all questions
      cy.get('input[name="cardiacConditions"][value="NO"]').click();
      cy.get('input[name="respiratoryIssues"][value="NO"]').click();
      cy.get('input[name="faintingOrBalanceProblems"][value="NO"]').click();
      cy.get('input[name="jointOrMuscleDisorders"][value="NO"]').click();
      cy.get('input[name="highBloodPressure"][value="NO"]').click();
      cy.get('input[name="cholesterolLevels"][value="NO"]').click();
      cy.get('input[name="currentMedications"][value="NO"]').click();
      cy.get('input[name="disabilitiesOrPhysicalLimitations"][value="NO"]').click();

      cy.contains("button", "Submit Screening").click();

      // Verify error message is displayed
      cy.contains("Health screening submission failed", { timeout: 5000 }).should("be.visible");
    });
  });
});
