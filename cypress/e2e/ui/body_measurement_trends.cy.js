describe("Body measurement trends - implemented behavior", () => {
  const makeJwt = (payload) => {
    const encode = (obj) => btoa(JSON.stringify(obj));

    return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
  };

  const adminUser = {
    id: 1,
    firstName: "System",
    lastName: "Admin",
    email: "admin@fat2fit.lk",
    role: "ADMIN",
    isActive: true,
    phoneNumber: "0700000000",
  };

  const clientRow = {
    id: 101,
    firstName: "Asha",
    lastName: "Fernando",
    email: "asha@example.com",
    role: "CLIENT",
    isActive: true,
    phoneNumber: "0771234567",
    membershipStatus: "ACTIVE",
    membershipPlanName: "Standard Plan",
  };

  const historyRows = [
    {
      measurementId: 2001,
      clientId: 101,
      measurementDate: "2026-01-01",
      heightCm: 170,
      weightKg: 80,
      bmi: 27.68,
      waistCm: 95,
      hipCm: 102,
      armCm: 32,
      shoulderCm: 45,
      breastCm: 98,
      buttocksCm: 104,
      recordedAt: "2026-01-01T08:00:00",
    },
    {
      measurementId: 2002,
      clientId: 101,
      measurementDate: "2026-02-01",
      heightCm: 170,
      weightKg: 77,
      bmi: 26.64,
      waistCm: 91,
      hipCm: 100,
      armCm: 31,
      shoulderCm: 44,
      breastCm: 96,
      buttocksCm: 102,
      recordedAt: "2026-02-01T08:00:00",
    },
    {
      measurementId: 2003,
      clientId: 101,
      measurementDate: "2026-03-01",
      heightCm: 170,
      weightKg: 74,
      bmi: 25.61,
      waistCm: 88,
      hipCm: 98,
      armCm: 30,
      shoulderCm: 43,
      breastCm: 94,
      buttocksCm: 100,
      recordedAt: "2026-03-01T08:00:00",
    },
  ];

  const bootstrapManagePage = () => {
    cy.intercept("GET", "http://localhost:8080/api/manage/users", {
      statusCode: 200,
      body: [clientRow],
    }).as("getUsers");

    cy.intercept("GET", "http://localhost:8080/api/membership-plans/active", {
      statusCode: 200,
      body: [],
    }).as("getPlans");

    cy.intercept("GET", "http://localhost:8080/api/payments/approvals/pending", {
      statusCode: 200,
      body: [],
    }).as("getPending");

    cy.intercept("GET", "http://localhost:8080/api/payments/email-failures", {
      statusCode: 200,
      body: [],
    }).as("getEmailFailures");

    cy.visit("/manage", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "accessToken",
          makeJwt({ role: "ADMIN", exp: Math.floor(Date.now() / 1000) + 3600 }),
        );
        win.localStorage.setItem("refreshToken", "test-refresh-token");
      },
    });

    cy.wait(["@getUsers", "@getPlans", "@getPending", "@getEmailFailures"]);
  };

  it("shows trend charts and comparison after clicking View Trends", () => {
    cy.intercept("GET", "http://localhost:8080/api/manage/clients/101/metrics/history", {
      statusCode: 200,
      body: historyRows,
    }).as("getMetricsHistory");

    bootstrapManagePage();

    cy.contains("tr", "Asha Fernando").within(() => {
      cy.contains("button", "View Trends").click();
    });

    cy.wait("@getMetricsHistory");
    cy.contains("h2", "Body Metrics & Trends").should("be.visible");
    cy.contains("div", "View Trends").should("be.visible");

    cy.get('svg[aria-label="BMI Trend trend chart"]').should("exist");
    cy.get('svg[aria-label="Weight Trend trend chart"]').should("exist");

    cy.contains("div", "Compare Two Dates").should("exist");
    cy.contains("th", "Change").should("exist");
  });

  it("filters measurement history by selected date range", () => {
    cy.intercept("GET", "http://localhost:8080/api/manage/clients/101/metrics/history", {
      statusCode: 200,
      body: historyRows,
    }).as("getMetricsHistory");

    bootstrapManagePage();

    cy.contains("tr", "Asha Fernando").within(() => {
      cy.contains("button", "View Trends").click();
    });

    cy.wait("@getMetricsHistory");

    cy.contains("label", "From Date")
      .parent()
      .find('input[type="date"]')
      .clear({ force: true })
      .type("2026-02-01", { force: true });

    cy.contains("label", "To Date")
      .parent()
      .find('input[type="date"]')
      .clear({ force: true })
      .type("2026-02-28", { force: true });

    cy.contains("button", "Apply Filter").click();

    cy.contains("div", "Measurement History (Chronological)")
      .next(".table-scroll")
      .find("tbody tr")
      .should("have.length", 1)
      .first()
      .should("contain", "2026-02-01");
  });

  it("shows empty-state text when no measurement history exists", () => {
    cy.intercept("GET", "http://localhost:8080/api/manage/clients/101/metrics/history", {
      statusCode: 200,
      body: [],
    }).as("getEmptyMetricsHistory");

    bootstrapManagePage();

    cy.contains("tr", "Asha Fernando").within(() => {
      cy.contains("button", "View Trends").click();
    });

    cy.wait("@getEmptyMetricsHistory");
    cy.contains("No measurement data available.").should("exist");
  });
});