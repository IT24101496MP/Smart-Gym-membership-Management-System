describe("Auth - Login", () => {
  const APP = "http://localhost:5173";

  const makeJwt = (payload) => {
    const b64 = (obj) =>
      btoa(JSON.stringify(obj))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    const header = { alg: "none", typ: "JWT" };
    return `${b64(header)}.${b64(payload)}.`; // no signature
  };

  const clearAuth = () => {
    cy.window().then((win) => {
      win.localStorage.removeItem("accessToken");
      win.localStorage.removeItem("refreshToken");
    });
  };

  beforeEach(() => {
    cy.visit(`${APP}/login`);
    clearAuth();
  });

  it("shows validation when fields are empty", () => {
    cy.contains("button", "Sign In").click();
    cy.contains("Email or username is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");
  });

  it("shows server error on invalid login", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 401,
      body: "Invalid credentials",
    }).as("login");

    cy.get('input[name="identifier"]').type("wrong@example.com");
    cy.get('input[name="password"]').type("wrongpass");
    cy.contains("button", "Sign In").click();

    cy.wait("@login");
    cy.contains("Invalid credentials").should("be.visible");
  });

  it("logs in successfully and redirects to /profile", () => {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = makeJwt({ role: "CLIENT", exp: now + 3600 });
    const refreshToken = makeJwt({ type: "refresh", exp: now + 7 * 24 * 3600 });

    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 200,
      body: { accessToken, refreshToken },
    }).as("login");

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        id: 1,
        firstName: "John",
        lastName: "Cena",
        email: "john@example.com",
        role: "CLIENT",
      },
    }).as("me");

    cy.get('input[name="identifier"]').type("john@example.com");
    cy.get('input[name="password"]').type("Aa1@aaaa");
    cy.contains("button", "Sign In").click();

    cy.wait("@login");
    cy.location("pathname").should("eq", "/profile");
    cy.wait("@me");
    cy.contains("Logout").should("be.visible");
  });
});