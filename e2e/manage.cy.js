describe("Manage Page", () => {

  const FRONTEND = "http://localhost:5173";

  function loginMock(role) {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    const fakeToken = [
      "header",
      btoa(JSON.stringify({ role, exp: futureExp })),
      "signature"
    ].join(".");

    cy.intercept("POST", "http://localhost:8080/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: fakeToken,
        refreshToken: "fakeRefreshToken"
      }
    });

    if (role === "ADMIN") {
      cy.intercept("GET", "http://localhost:8080/api/manage/users", {
        statusCode: 200,
        body: [
          { id: 1, firstName: "John", lastName: "Doe", email: "john@example.com", phoneNumber: "0712345678", role: "CLIENT", isActive: true }
        ]
      });
    }

    if (role === "INSTRUCTOR") {
      cy.intercept("GET", "http://localhost:8080/api/manage/clients", {
        statusCode: 200,
        body: [
          { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@example.com", phoneNumber: "0771234567", role: "CLIENT", isActive: true }
        ]
      });
    }

    if (role === "CLIENT") {
      cy.intercept("GET", "http://localhost:8080/api/manage/me", {
        statusCode: 200,
        body: {
          id: 3,
          firstName: "Client",
          lastName: "User",
          email: "client@example.com",
          role: "CLIENT"
        }
      });
    }

    cy.visit(`${FRONTEND}/login`);
    cy.get("input[name='identifier']").type("test@example.com");
    cy.get("input[name='password']").type("Password123!");
    cy.get("button[type='submit']").click();
  }

  it("ADMIN sees user table", () => {
    loginMock("ADMIN");
    cy.visit(`${FRONTEND}/manage`);
    cy.contains("All Users").should("exist");
  });

  it("INSTRUCTOR sees clients table", () => {
    loginMock("INSTRUCTOR");
    cy.visit(`${FRONTEND}/manage`);
    cy.contains("All Clients").should("exist");
  });

  it("CLIENT sees self edit form", () => {
    loginMock("CLIENT");
    cy.visit(`${FRONTEND}/manage`);
    cy.contains("Edit Your Profile").should("exist");
  });

});
