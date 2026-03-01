describe("Manage Page ", () => {
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

  it("ADMIN sees All Users table", () => {
    cy.visit(`${APP}/login`);
    setAuth("ADMIN");

    cy.intercept("GET", "**/api/manage/users", {
      statusCode: 200,
      body: [
        { id: 1, firstName: "Admin", lastName: "One", email: "admin1@example.com", phoneNumber: "0711111111", role: "ADMIN", isActive: true },
      ],
    }).as("users");

    cy.visit(`${APP}/manage`);
    cy.wait("@users");
    cy.contains("All Users").should("be.visible");
    cy.contains("admin1@example.com").should("be.visible");
  });
});
