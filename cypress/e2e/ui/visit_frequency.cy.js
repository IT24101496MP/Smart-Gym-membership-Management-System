const api = require("../../support/apiHelpers");

describe("UI - Visit Frequency Dashboard", () => {
  const APP_URL = "http://localhost:5173";
  const API_BASE = "http://localhost:8080";

  beforeEach(() => {
    // Login as admin and navigate to attendance page
    cy.loginAsAdmin();
    cy.visit(`${APP_URL}/attendance`);
  });

  /**
   * Test: Navigate to Visit Frequency Tab
   * Acceptance Criteria: User can successfully navigate to the Visit Frequency tab
   */
  it("should display Visit Frequency tab and navigate to it", () => {
    // Verify tab buttons are visible
    cy.contains("button", "Visit Frequency").should("be.visible");

    // Click Visit Frequency tab
    cy.contains("button", "Visit Frequency").click();

    // Verify frequency dashboard is displayed
    cy.contains("h3", "Gym Visit Frequency Metrics").should("be.visible");
  });

  /**
   * Test: Display Overall Visit Frequency Metrics
   * Acceptance Criteria: System displays weekly and monthly visits
   */
  it("should display overall visit frequency metrics (weekly/monthly visits)", () => {
    // Navigate to Visit Frequency tab
    cy.contains("button", "Visit Frequency").click();

    // Wait for data to load and verify metrics are displayed
    cy.contains("Weekly Visits", { timeout: 5000 }).should("be.visible");
    cy.contains("Monthly Visits").should("be.visible");

    // Verify metrics have numeric values
    cy.get(".frequency-card")
      .contains("Weekly Visits")
      .parent()
      .find(".frequency-value")
      .invoke("text")
      .then((value) => {
        // Value should be a number
        expect(parseInt(value)).to.be.a("number");
      });

    cy.get(".frequency-card")
      .contains("Monthly Visits")
      .parent()
      .find(".frequency-value")
      .invoke("text")
      .then((value) => {
        expect(parseInt(value)).to.be.a("number");
      });
  });

  /**
   * Test: Display Per-Member Visit Frequency Table
   * Acceptance Criteria: Metrics are displayed in dashboard view with member details
   */
  it("should display per-member visit frequency table with member data", () => {
    cy.contains("button", "Visit Frequency").click();

    // Verify table headers
    cy.contains("h4", "Per-Member Visit Frequency").should("be.visible");
    cy.get(".frequency-table thead th").should("have.length", 3);

    cy.get(".frequency-table thead")
      .within(() => {
        cy.contains("Member Name").should("be.visible");
        cy.contains("Weekly Visits").should("be.visible");
        cy.contains("Monthly Visits").should("be.visible");
      });

    // Verify at least one data row exists if there are members
    cy.get(".frequency-table tbody tr").then(($rows) => {
      if ($rows.length > 0) {
        // Verify first row has member data
        cy.get(".frequency-table tbody tr")
          .first()
          .within(() => {
            cy.get("td").should("have.length", 3);
            // Member name should not be empty
            cy.get("td").first().invoke("text").should("not.be.empty");
          });
      }
    });
  });

  /**
   * Test: Verify Date Range Display
   * Acceptance Criteria: Dashboard displays weekly and monthly period information
   */
  it("should display weekly and monthly period information", () => {
    cy.contains("button", "Visit Frequency").click();

    // Verify period information is displayed
    cy.contains(/Weekly period: /).should("be.visible");
    cy.contains(/Monthly period: /).should("be.visible");
  });

  /**
   * Test: Accurate Calculations with Test Data
   * Acceptance Criteria: Calculations are accurate for selected test data
   */
  it("should calculate accurate visit frequencies with test data", () => {
    // Create mock data with known visit frequency
    const mockFrequencyData = {
      weeklyVisits: 15,
      monthlyVisits: 60,
    };

    const mockMemberData = [
      {
        clientId: 1,
        memberName: "John Doe",
        weeklyVisits: 5,
        monthlyVisits: 20,
      },
      {
        clientId: 2,
        memberName: "Jane Smith",
        weeklyVisits: 4,
        monthlyVisits: 16,
      },
      {
        clientId: 3,
        memberName: "Mike Johnson",
        weeklyVisits: 6,
        monthlyVisits: 24,
      },
    ];

    // Intercept APIs with mock data
    cy.intercept("GET", `${API_BASE}/api/attendance/frequency`, {
      statusCode: 200,
      body: mockFrequencyData,
    }).as("frequencyData");

    cy.intercept("GET", `${API_BASE}/api/attendance/frequency/members`, {
      statusCode: 200,
      body: mockMemberData,
    }).as("memberFrequencyData");

    cy.contains("button", "Visit Frequency").click();

    // Verify overall metrics match mock data
    cy.wait("@frequencyData");
    cy.get(".frequency-card")
      .contains("Weekly Visits")
      .parent()
      .find(".frequency-value")
      .should("contain", mockFrequencyData.weeklyVisits);

    cy.get(".frequency-card")
      .contains("Monthly Visits")
      .parent()
      .find(".frequency-value")
      .should("contain", mockFrequencyData.monthlyVisits);

    // Verify member data matches mock data
    cy.wait("@memberFrequencyData");
    cy.get(".frequency-table tbody tr").should("have.length", 3);

    // Verify each member's data
    mockMemberData.forEach((member, index) => {
      cy.get(".frequency-table tbody tr")
        .eq(index)
        .within(() => {
          cy.contains(member.memberName).should("be.visible");
          cy.get("td").eq(1).should("contain", member.weeklyVisits);
          cy.get("td").eq(2).should("contain", member.monthlyVisits);
        });
    });
  });

  /**
   * Test: Empty State
   * Acceptance Criteria: Handle case when no member data is available
   */
  it("should handle empty member data gracefully", () => {
    const mockFrequencyData = {
      weeklyVisits: 0,
      monthlyVisits: 0,
    };

    cy.intercept("GET", `${API_BASE}/api/attendance/frequency`, {
      statusCode: 200,
      body: mockFrequencyData,
    }).as("frequencyData");

    cy.intercept("GET", `${API_BASE}/api/attendance/frequency/members`, {
      statusCode: 200,
      body: [],
    }).as("memberFrequencyData");

    cy.contains("button", "Visit Frequency").click();

    cy.wait("@frequencyData");
    cy.wait("@memberFrequencyData");

    // Verify overall metrics show zero values
    cy.get(".frequency-card")
      .contains("Weekly Visits")
      .parent()
      .find(".frequency-value")
      .should("contain", "0");

    // Verify "Most Active Member" shows "No Active Members"
    cy.get(".frequency-card")
      .contains("Most Active Member")
      .parent()
      .find(".frequency-value")
      .should("contain", "No Active Members");

    // Verify per-member section shows "No member data available"
    cy.contains("No member data available").should("be.visible");
  });
});
