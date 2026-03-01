describe("Instructor Module - Basic QA", () => {

  const FRONTEND = "http://localhost:5173";

  function loginAsAdmin() {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    const fakeToken = [
      "header",
      btoa(JSON.stringify({ role: "ADMIN", exp: futureExp })),
      "signature"
    ].join(".");

    // Mock login
    cy.intercept("POST", "http://localhost:8081/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: fakeToken,
        refreshToken: "fakeRefreshToken"
      }
    });

    // Mock instructor list
    cy.intercept("GET", "http://localhost:8081/api/instructor", {
      statusCode: 200,
      body: [
        {
          id: 1,
          firstName: "Test",
          lastName: "Instructor",
          email: "inst@example.com",
          phoneNumber: "0712345678",
          qualification: "BSc",
          yearsOfExperience: 5,
          areasOfSpecialization: "Yoga",
          status: "PENDING",
          createdAt: new Date().toISOString()
        }
      ]
    });

    // Mock instructor detail
    cy.intercept("GET", "http://localhost:8081/api/instructor/1", {
      statusCode: 200,
      body: {
        id: 1,
        firstName: "Test",
        lastName: "Instructor",
        email: "inst@example.com",
        phoneNumber: "0712345678",
        qualification: "BSc",
        yearsOfExperience: 5,
        areasOfSpecialization: "Yoga",
        status: "PENDING",
        isActive: false,
        createdAt: new Date().toISOString()
      }
    });

    // Mock approve
    cy.intercept("PUT", "http://localhost:8081/api/instructor/1/status?status=APPROVED", {
      statusCode: 200
    });

    // Mock reject
    cy.intercept("PUT", "http://localhost:8081/api/instructor/1/status?status=REJECTED", {
      statusCode: 200
    });

    cy.visit(`${FRONTEND}/login`);
    cy.get("input[name='identifier']").type("admin@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("button[type='submit']").click();
  }

  it("Admin can view instructor list", () => {
    loginAsAdmin();
    cy.visit(`${FRONTEND}/instructor`);
    cy.contains("Instructors").should("exist");
    cy.contains("Test Instructor").should("exist");
  });

  it("Admin can open instructor detail page", () => {
    loginAsAdmin();
    cy.visit(`${FRONTEND}/instructor/1`);
    cy.contains("Instructor Review").should("exist");
  });

  it("Admin can approve instructor", () => {
    loginAsAdmin();
    cy.visit(`${FRONTEND}/instructor/1`);
    cy.contains("Approve").click();
  });

  it("Admin can reject instructor", () => {
    loginAsAdmin();
    cy.visit(`${FRONTEND}/instructor/1`);
    cy.contains("Reject").click();
  });

});