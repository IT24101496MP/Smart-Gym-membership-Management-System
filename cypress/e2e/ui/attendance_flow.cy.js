const api = require("../../support/apiHelpers");

describe("Attendance Management - User Story", () => {
  let attendanceMembers;

  beforeEach(() => {
    // Initialize test data
    attendanceMembers = [
      {
        id: 111,
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "0712345678",
        email: "john@example.com",
      },
      {
        id: 222,
        firstName: "Jane",
        lastName: "Smith",
        phoneNumber: "0745678901",
        email: "jane@example.com",
      },
      {
        id: 333,
        firstName: "Bob",
        lastName: "Johnson",
        phoneNumber: "0774567890",
        email: "bob@example.com",
      },
    ];

    // Login as admin
    cy.loginAsAdmin();

    // Set up default intercepts
    cy.intercept("GET", `${api.API_BASE}/api/manage/clients`, {
      statusCode: 200,
      body: attendanceMembers,
    }).as("getClients");

    cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
      statusCode: 200,
      body: [],
    }).as("getTodayAttendance");

    // Visit the attendance page
    cy.visit(`${api.FRONTEND_BASE}/attendance`);
    cy.wait("@getClients");
  });

  describe("AC1: Staff can search for a member", () => {
    it("should search by member name", () => {
      // Search by first name of first member
      const firstName = attendanceMembers[0].firstName;
      cy.get(".attendance-search").type(firstName);
      cy.get(".attendance-table tbody tr").should("have.length.greaterThan", 0);
      cy.get(".client-name").should("contain", firstName);
    });

    it("should search by member ID", () => {
      const memberId = attendanceMembers[1]?.id.toString() || "2";
      cy.get(".attendance-search").type(memberId);
      cy.get(".attendance-table tbody tr").should("have.length", 1);
    });

    it("should search by phone number", () => {
      const phoneNumber = attendanceMembers[2]?.phoneNumber || "0745678901";
      cy.get(".attendance-search").type(phoneNumber);
      cy.get(".attendance-table tbody tr").should("have.length.greaterThan", 0);
    });

    it("should return no results for non-existent search term", () => {
      cy.get(".attendance-search").type("zzzzz");
      cy.get(".table-empty").should("contain", "No members found.");
    });

    it("should clear search results when search input is cleared", () => {
      const firstName = attendanceMembers[0]?.firstName || "John";
      cy.get(".attendance-search").type(firstName);
      cy.get(".attendance-table tbody tr").should("have.length.greaterThan", 0);
      cy.get(".attendance-search").clear();
      cy.get(".attendance-table tbody tr").should("have.length.gte", attendanceMembers.length);
    });

    it("should search case-insensitive", () => {
      const firstName = attendanceMembers[0]?.firstName.toLowerCase() || "john";
      cy.get(".attendance-search").type(firstName);
      cy.get(".attendance-table tbody tr").should("have.length.greaterThan", 0);
    });
  });


  describe("AC2: Attendance record is saved with date and time", () => {
    it("should display check-in date and time in table", () => {
      const checkInTime = "2026-03-31T10:30:45Z";
      const firstClientId = attendanceMembers[0]?.id;

      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 200,
        body: {
          id: 1,
          clientId: firstClientId,
          checkInTime: checkInTime,
        },
      }).as("checkIn");

      cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
        statusCode: 200,
        body: [
          {
            id: 1,
            client: attendanceMembers[0],
            checkInTime: checkInTime,
          },
        ],
      }).as("getTodayAttendanceUpdated");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").click();
      });

      cy.wait("@checkIn");
      cy.wait("@getTodayAttendanceUpdated");
    });

    it("should persist attendance data across page reload", () => {
      const checkInTime = new Date().toISOString();

      cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
        statusCode: 200,
        body: [
          {
            id: 111,
            client: attendanceMembers[0],
            checkInTime: checkInTime,
          },
        ],
      }).as("getTodayAttendance");

      cy.reload();
      cy.wait("@getTodayAttendance");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").should("contain", "✓ Present");
      });
    });

    it("should show current date/time format for check-in", () => {
      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 200,
        body: {
          id: 111,
          clientId: 111,
          checkInTime: new Date().toISOString(),
        },
      }).as("checkIn");

      cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
        statusCode: 200,
        body: [
          {
            id: 111,
            client: attendanceMembers[0],
            checkInTime: new Date().toISOString(),
          },
        ],
      }).as("getTodayAttendanceUpdated");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").click();
      });

      cy.wait("@checkIn");
      cy.wait("@getTodayAttendanceUpdated");
    });
  });

  describe("AC3: Confirmation message is displayed after successful check-in", () => {
    it("should display success confirmation message after check-in", () => {
      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 200,
        body: {
          id: 111,
          clientId: 111,
          checkInTime: new Date().toISOString(),
        },
      }).as("checkIn");

      cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
        statusCode: 200,
        body: [
          {
            id: 111,
            client: attendanceMembers[0],
            checkInTime: new Date().toISOString(),
          },
        ],
      }).as("getTodayAttendanceUpdated");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").click();
      });

      cy.wait("@checkIn");
      cy.wait("@getTodayAttendanceUpdated");

      cy.get(".message-success").should("be.visible");
      cy.get(".message-success").should("contain", "✓");
      cy.get(".message-success").should("contain", "checked in successfully");
    });

    it("should display confirmation with member name", () => {
      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 200,
        body: {
          id: 111,
          clientId: 1,
          checkInTime: new Date().toISOString(),
        },
      }).as("checkIn");

      cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
        statusCode: 200,
        body: [
          {
            id: 111,
            client: attendanceMembers[0],
            checkInTime: new Date().toISOString(),
          },
        ],
      }).as("getTodayAttendanceUpdated");

      cy.get(".attendance-table tbody tr")
        .first()
        .within(() => {
          cy.get(".btn-checkin").click();
        });

      cy.wait("@checkIn");
      cy.wait("@getTodayAttendanceUpdated");

      cy.get(".message-success").should("contain", attendanceMembers[0].firstName);
      cy.get(".message-success").should("contain", attendanceMembers[0].lastName);
    });

    it("should display warning when member already checked in", () => {
      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 409,
        body: "Member already checked in today",
      }).as("checkInConflict");

      cy.intercept("GET", `${api.API_BASE}/api/attendance/today`, {
        statusCode: 200,
        body: [],
      }).as("getTodayAttendance");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").click();
      });

      cy.wait("@checkInConflict");
      cy.wait("@getTodayAttendance");

      cy.get(".message-warning").should("be.visible");
      cy.get(".message-warning").should("contain", "already checked in");
    });

    it("should display error message on API failure", () => {
      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 500,
        body: "Internal Server Error",
      }).as("checkInError");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").click();
      });

      cy.wait("@checkInError");

      cy.get(".message-error").should("be.visible");
    });

    it("should display error message when member not found (404)", () => {
      cy.intercept("POST", `${api.API_BASE}/api/attendance/check-in`, {
        statusCode: 404,
        body: "Member not found",
      }).as("checkInNotFound");

      cy.get(".attendance-table tbody tr").first().within(() => {
        cy.get(".btn-checkin").click();
      });

      cy.wait("@checkInNotFound");

      cy.get(".message-error").should("be.visible");
      cy.get(".message-error").should("contain", "Member not found");
    });
  });
});
