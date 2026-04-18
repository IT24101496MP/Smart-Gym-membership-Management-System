const buildFakeJwt = (win, role = "ADMIN") => {
  const header = win.btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = win.btoa(
    JSON.stringify({
      sub: "admin@fat2fit.lk",
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })
  );

  return `${header}.${payload}.signature`;
};

const seedAdminSession = (win) => {
  win.localStorage.setItem("accessToken", buildFakeJwt(win, "ADMIN"));
  win.localStorage.setItem("refreshToken", "dummy-refresh-token");
};

const clientRow = {
  id: 101,
  firstName: "Nimal",
  lastName: "Perera",
  email: "nimal@example.com",
  phoneNumber: "0712345678",
  role: "CLIENT",
  isActive: true,
  membershipStatus: "ACTIVE",
  membershipPlanName: "Monthly",
};

const latestMeasurement = {
  measurementId: 9003,
  clientId: 101,
  measurementDate: "2026-04-15",
  heightCm: 171,
  weightKg: 72.1,
  waistCm: 82,
  hipCm: 96,
  armCm: 33,
  shoulderCm: 44,
  breastCm: 93,
  buttocksCm: 98,
  bmi: 24.66,
  recordedAt: "2026-04-15T09:30:00",
};

const historyMeasurements = [
  {
    measurementId: 9003,
    clientId: 101,
    measurementDate: "2026-04-15",
    heightCm: 171,
    weightKg: 72.1,
    bmi: 24.66,
    recordedAt: "2026-04-15T09:30:00",
  },
  {
    measurementId: 9002,
    clientId: 101,
    measurementDate: "2026-03-10",
    heightCm: 171,
    weightKg: 73.4,
    bmi: 25.1,
    recordedAt: "2026-03-10T08:15:00",
  },
  {
    measurementId: 9001,
    clientId: 101,
    measurementDate: "2026-02-01",
    heightCm: 171,
    weightKg: 75.0,
    bmi: 25.65,
    recordedAt: "2026-02-01T07:10:00",
  },
];

describe("Body Measurement History (implemented behavior)", () => {
  const openMetricsModal = () => {
    cy.visit("/manage", {
      onBeforeLoad(win) {
        seedAdminSession(win);
      },
    });

    cy.wait("@getUsers");
    cy.wait("@getPlans");

    cy.contains("td", String(clientRow.id))
      .closest("tr")
      .within(() => {
        cy.contains("button", "Metrics").click();
      });

    cy.wait("@getLatestMetrics");
    cy.wait("@getMetricsHistory");
    cy.contains("h2", "Body Metrics").should("be.visible");
  };

  it("shows existing historical records in the order provided by the history API", () => {
    cy.intercept("GET", "**/api/manage/users", {
      statusCode: 200,
      body: [clientRow],
    }).as("getUsers");

    cy.intercept("GET", "**/api/membership-plans/active", {
      statusCode: 200,
      body: [],
    }).as("getPlans");

    cy.intercept("GET", "**/api/manage/clients/101/metrics", {
      statusCode: 200,
      body: latestMeasurement,
    }).as("getLatestMetrics");

    cy.intercept("GET", "**/api/manage/clients/101/metrics/history", {
      statusCode: 200,
      body: historyMeasurements,
    }).as("getMetricsHistory");

    openMetricsModal();

    cy.get(".measurement-history-table tbody tr").should("have.length", 3);
    cy.get(".measurement-history-table tbody tr").eq(0).find("td").eq(0).should("contain", "2026-04-15");
    cy.get(".measurement-history-table tbody tr").eq(1).find("td").eq(0).should("contain", "2026-03-10");
    cy.get(".measurement-history-table tbody tr").eq(2).find("td").eq(0).should("contain", "2026-02-01");
  });

  it("shows the implemented empty-state text when no measurement history exists", () => {
    cy.intercept("GET", "**/api/manage/users", {
      statusCode: 200,
      body: [clientRow],
    }).as("getUsers");

    cy.intercept("GET", "**/api/membership-plans/active", {
      statusCode: 200,
      body: [],
    }).as("getPlans");

    cy.intercept("GET", "**/api/manage/clients/101/metrics", {
      statusCode: 200,
      body: {},
    }).as("getLatestMetrics");

    cy.intercept("GET", "**/api/manage/clients/101/metrics/history", {
      statusCode: 200,
      body: [],
    }).as("getMetricsHistory");

    openMetricsModal();

    cy.contains("No measurements recorded yet.").should("exist");
  });

  it("appends a newly saved measurement to the top of history", () => {
    const newlySavedMeasurement = {
      measurementId: 9010,
      clientId: 101,
      measurementDate: "2026-04-20",
      heightCm: 171,
      weightKg: 71.2,
      waistCm: 81,
      hipCm: 95,
      armCm: 33,
      shoulderCm: 44,
      breastCm: 93,
      buttocksCm: 97,
      bmi: 24.35,
      recordedAt: "2026-04-20T06:40:00",
    };

    cy.intercept("GET", "**/api/manage/users", {
      statusCode: 200,
      body: [clientRow],
    }).as("getUsers");

    cy.intercept("GET", "**/api/membership-plans/active", {
      statusCode: 200,
      body: [],
    }).as("getPlans");

    cy.intercept("GET", "**/api/manage/clients/101/metrics", {
      statusCode: 200,
      body: latestMeasurement,
    }).as("getLatestMetrics");

    cy.intercept("GET", "**/api/manage/clients/101/metrics/history", {
      statusCode: 200,
      body: historyMeasurements,
    }).as("getMetricsHistory");

    cy.intercept("POST", "**/api/manage/clients/101/metrics", {
      statusCode: 200,
      body: newlySavedMeasurement,
    }).as("saveMeasurement");

    openMetricsModal();

    cy.get(".measurement-history-table tbody tr").should("have.length", 3);

    cy.get('.modal-card input[type="date"]').first().clear().type("2026-04-20");
    cy.get('.modal-card input[type="number"]').eq(0).clear().type("171");
    cy.get('.modal-card input[type="number"]').eq(1).clear().type("71.2");
    cy.get('.modal-card input[type="number"]').eq(2).clear().type("81");
    cy.get('.modal-card input[type="number"]').eq(3).clear().type("95");
    cy.get('.modal-card input[type="number"]').eq(4).clear().type("33");
    cy.get('.modal-card input[type="number"]').eq(5).clear().type("44");
    cy.get('.modal-card input[type="number"]').eq(6).clear().type("93");
    cy.get('.modal-card input[type="number"]').eq(7).clear().type("97");

    cy.contains("button", "Save Measurement").click();
    cy.wait("@saveMeasurement");

    cy.get(".measurement-history-table tbody tr").should("have.length", 4);
    cy.get(".measurement-history-table tbody tr").eq(0).find("td").eq(0).should("contain", "2026-04-20");
  });
});
