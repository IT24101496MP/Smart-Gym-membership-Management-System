describe("Auth_Signup", () => {
  const FRONTEND = "http://localhost:5173";

  const clearAuth = () => {
    cy.window().then((win) => {
      win.localStorage.removeItem("userId");
      win.localStorage.removeItem("token");
    });
  };

  beforeEach(() => {
    cy.visit(`${FRONTEND}/login`);
    clearAuth();
  });

  it("shows validation when fields are empty", () => {
    cy.contains("button", "Sign Up").click();
    cy.contains("Please fill in all fields").should("be.visible");
  });

  it("shows error when passwords do not match", () => {
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("Aa1@aaaa");
    cy.get('input[name="confirmPassword"]').type("Aa1@aaab");

    cy.contains("button", "Sign Up").click();
    cy.contains("Passwords do not match").should("be.visible");
  });

  it("shows error when password is weak", () => {
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("12345678");
    cy.get('input[name="confirmPassword"]').type("12345678");

    cy.contains("button", "Sign Up").click();
    cy.contains("Password must be at least 8 chars").should("be.visible");
  });

  it("signs up successfully and redirects to client registration", () => {
    cy.intercept("POST", "http://localhost:8081/api/user/register", {
      statusCode: 200,
      body: { userId: 101, token: "fake-jwt-token" },
    }).as("registerUser");

    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="password"]').type("Aa1@aaaa");
    cy.get('input[name="confirmPassword"]').type("Aa1@aaaa");

    cy.contains("button", "Sign Up").click();

    cy.wait("@registerUser");

    cy.contains("Account created successfully").should("be.visible");
    cy.location("pathname", { timeout: 6000 }).should("eq", "/client-registration");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.eq("fake-jwt-token");
      expect(win.localStorage.getItem("userId")).to.eq("101");
    });
  });
});
