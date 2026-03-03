describe("Protected Routes", () => {
  const APP = "http://localhost:5173";

  const makeJwt = (payload) => {
    const b64 = (obj) =>
      btoa(JSON.stringify(obj))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    const header = { alg: "none", typ: "JWT" };
    return `${b64(header)}.${b64(payload)}.`;
  };

  const setAuth = (role) => {
    const now = Math.floor(Date.now() / 1000);
    cy.window().then((win) => {
      win.localStorage.setItem("accessToken", makeJwt({ role, exp: now + 3600 }));
      win.localStorage.setItem("refreshToken", makeJwt({ type: "refresh", exp: now + 7 * 24 * 3600 }));
    });
  };

  it("redirects to /login when not authenticated", () => {
    cy.visit(`${APP}/profile`);
    cy.location("pathname").should("eq", "/login");
  });

  it("redirects to /unauthorized when role not allowed", () => {
    cy.visit(`${APP}/login`);
    setAuth("CLIENT");

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: { id: 1, firstName: "John", lastName: "Cena", email: "john@example.com", role: "CLIENT" },
    });

    cy.visit(`${APP}/instructor`);
    cy.location("pathname").should("eq", "/unauthorized");
    cy.contains("Access Denied").should("be.visible");
  });
});
