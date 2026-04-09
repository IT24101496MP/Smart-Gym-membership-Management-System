const api = require("../../support/apiHelpers");

describe("Attendance History Tab - User Story", () => {
  const attendanceHistoryData = [
    {
      id: 1,
      clientId: 111,
      clientName: "John Doe",
      checkInDate: "2026-04-03",
      checkInTime: "09:30:00",
      timestamp: "2026-04-03T09:30:00",
    },
    {
      id: 2,
      clientId: 222,
      clientName: "Jane Smith",
      checkInDate: "2026-04-03",
      checkInTime: "10:15:00",
      timestamp: "2026-04-03T10:15:00",
    },
    {
      id: 3,
      clientId: 333,
      clientName: "Bob Johnson",
      checkInDate: "2026-04-02",
      checkInTime: "08:45:00",
      timestamp: "2026-04-02T08:45:00",
    },
    {
      id: 4,
      clientId: 111,
      clientName: "John Doe",
      checkInDate: "2026-04-02",
      checkInTime: "09:20:00",
      timestamp: "2026-04-02T09:20:00",
    },
    {
      id: 5,
      clientId: 444,
      clientName: "Alice Williams",
      checkInDate: "2026-04-01",
      checkInTime: "07:00:00",
      timestamp: "2026-04-01T07:00:00",
    },
  ];

  beforeEach(() => {
    // Login as admin
    cy.loginAsAdmin();

    // Set up intercept for filtered date range
    cy.intercept(
      "GET",
      `${api.API_BASE}/api/attendance/history?startDate=2026-04-01T00:00:00&endDate=2026-04-03T23:59:59**`,
      {
        statusCode: 200,
        body: attendanceHistoryData,
      }
    ).as("getHistoryFiltered");

    // Set up intercept for single day
    cy.intercept(
      "GET",
      `${api.API_BASE}/api/attendance/history?startDate=2026-04-03T00:00:00&endDate=2026-04-03T23:59:59**`,
      {
        statusCode: 200,
        body: attendanceHistoryData.slice(0, 2),
      }
    ).as("getHistorySingleDay");

    // Set up intercept for sorted results
    cy.intercept(
      "GET",
      `${api.API_BASE}/api/attendance/history?**sort=earliest**`,
      {
        statusCode: 200,
        body: attendanceHistoryData.reverse(),
      }
    ).as("getHistorySorted");

    // Navigate to attendance tab
    cy.visit(`${api.FRONTEND_BASE}/attendance`);
    cy.get(".tab-button").contains("Attendance History").click();
  });

  describe("AC1: Admin can select start and end date", () => {
    it("should display date picker inputs for start and end date", () => {
      cy.get("#start-date").should("exist");
      cy.get("#end-date").should("exist");
      cy.get(".btn-filter").should("exist");

    });

    it("should accept and display selected start date", () => {
      cy.get("#start-date")
        .type("2026-04-01")
        .should("have.value", "2026-04-01");
    });

    it("should accept and display selected end date", () => {
      cy.get("#end-date")
        .type("2026-04-03")
        .should("have.value", "2026-04-03");
    });

  describe("AC2: System displays attendance records within range", () => {

    it("should display records for selected date range", () => {
      cy.get("#start-date").type("2026-04-01");
      cy.get("#end-date").type("2026-04-03");
      cy.get(".btn-filter").click();

      cy.wait("@getHistoryFiltered");
      cy.get(".history-table tbody tr").should(
        "have.length",
        5
      );
    });

    it("should display records for single day", () => {
      cy.get("#start-date").clear().type("2026-04-03");
      cy.get("#end-date").clear().type("2026-04-03");
      cy.get(".btn-filter").click();

      cy.wait("@getHistorySingleDay");

      cy.get(".history-table tbody tr").should(
        "have.length",
        2
      );
    });

    it("Should display records sorted by earliest check-in time", () => {
      cy.get("#start-date").clear().type("2026-04-01");
      cy.get("#end-date").clear().type("2026-04-03");
      cy.get("#filter-mode").select("Oldest First");
      cy.get(".btn-filter").click();
    });
    
    it("Should display records sorted by latest check-in time", () => {
      cy.get("#start-date").clear().type("2026-04-01");
      cy.get("#end-date").clear().type("2026-04-03");
      cy.get("#filter-mode").select("Latest First");
      cy.get(".btn-filter").click();
    });
});
});
});
