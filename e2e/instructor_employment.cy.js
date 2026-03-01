describe("Instructor Employment Assignment", () => {

  const FRONTEND = "http://localhost:5173";

  function loginApprovedAdmin() {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    const fakeToken = [
      "header",
      btoa(JSON.stringify({ role: "ADMIN", exp: futureExp })),
      "signature"
    ].join(".");

    cy.intercept("POST", "http://localhost:8081/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: fakeToken,
        refreshToken: "fakeRefreshToken"
      }
    });

    cy.intercept("GET", "http://localhost:8081/api/instructor/1", {
      statusCode: 200,
      body: {
        id: 1,
        firstName: "Test",
        lastName: "Instructor",
        email: "inst@example.com",
        phoneNumber: "0712345678",
        status: "APPROVED",
        isActive: true,
        employment: null,
        createdAt: new Date().toISOString()
      }
    });

    // Return FULL instructor object after employment update
    cy.intercept("PUT", "http://localhost:8081/api/instructor/1/employment", {
      statusCode: 200,
      body: {
        id: 1,
        firstName: "Test",
        lastName: "Instructor",
        email: "inst@example.com",
        phoneNumber: "0712345678",
        status: "APPROVED",
        isActive: true,
        employment: {
          employmentType: "FULL_TIME",
          workingHoursPerWeek: 40,
          salary: 75000
        },
        createdAt: new Date().toISOString()
      }
    }).as("saveEmployment");

    cy.visit(`${FRONTEND}/login`);
    cy.get("input[name='identifier']").type("admin@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("button[type='submit']").click();
  }

  it("Admin can assign employment successfully", () => {
    loginApprovedAdmin();

    cy.visit(`${FRONTEND}/instructor/1`);

    cy.get("select[name='employmentType']").select("FULL_TIME");
    cy.get("input[name='workingHoursPerWeek']").clear().type("40");
    cy.get("input[name='salary']").clear().type("75000");
    cy.get("select[name='isActive']").select("Active");

    cy.contains("Assign Employment Details").click();

    cy.wait("@saveEmployment");

    cy.contains("Employment details saved successfully").should("exist");
  });

});
