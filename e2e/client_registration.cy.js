describe("Client Registration", () => {
  const FRONTEND = "http://localhost:5173";

  const visitWithAuth = () => {
    cy.visit(`${FRONTEND}/client-registration`, {
      onBeforeLoad(win) {
        win.localStorage.setItem("userId", "101");
        win.localStorage.setItem("token", "fake-jwt-token");
      },
    });
  };

  it("shows error banner when required fields are missing", () => {
    visitWithAuth();

    cy.contains("button", "Register").click();
    cy.contains("Please fix the errors below").should("be.visible");
    cy.location("pathname").should("eq", "/client-registration");
    cy.contains("Client registered successfully!").should("not.exist");
  });

  it("submits form successfully and redirects to profile", () => {
    cy.intercept("POST", "http://localhost:8081/api/client/register", {
      statusCode: 200,
      body: { clientId: 101, token: "fake-jwt-token" },
    }).as("clientRegister");
    
    cy.intercept("GET", "http://localhost:8081/api/client/user/101", {
      statusCode: 200,
      body: {
        clientId: 101,
        firstName: "John",
        lastName: "Cena",
        age: 25,
        gender: "Male",
        mobileNumber: "0712345678",
        landPhone: "",
        address: "123 Main Street",
        bloodGroup: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactNumber: "",
        createdAt: "2026-03-01T10:00:00.000Z",
        profilePicture: null,
        digitalSignature: null,
      },
    }).as("getProfile");

    visitWithAuth();

    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Cena");
    cy.get('input[name="age"]').type("25");
    cy.get('select[name="gender"]').select("Male");
    cy.get('input[name="mobileNumber"]').type("0712345678");
    cy.get('textarea[name="address"]').type("123 Main Street");

    cy.contains("button", "Register").click();

    cy.wait("@clientRegister");

    cy.contains("Client registered successfully!").should("be.visible");

    cy.location("pathname", { timeout: 6000 }).should("eq", "/profile");

    cy.wait("@getProfile");
    cy.contains("John Cena").should("be.visible");
  });
});
