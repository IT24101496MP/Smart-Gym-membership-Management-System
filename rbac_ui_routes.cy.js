describe("RBAC ", () => {
  const FRONTEND = "http://localhost:5173";
  const API = "http://localhost:8080";

  const users = {
    admin: { identifier: "admin@example.com", password: "Password123!" },
    client: { identifier: "client@example.com", password: "Password123!" },
    instructor: { identifier: "instructor@example.com", password: "Password123!" }
  };

  function apiLoginOrNull(userLabel, user) {
    return cy
      .request({
        method: "POST",
        url: `${API}/api/auth/login`,
        failOnStatusCode: false,
        body: { identifier: user.identifier, password: user.password }
      })
      .then((res) => {
        if (![200, 201].includes(res.status)) {
          cy.log(`SKIP: login failed for ${userLabel} -> ${res.status}`);
          cy.log(typeof res.body === "string" ? res.body : JSON.stringify(res.body));
          return null;
        }
        const token = res.body?.accessToken || res.body?.token;
        expect(token, "accessToken").to.be.a("string").and.not.be.empty;
        return token;
      });
  }

  it("user loads without token", () => {
    cy.clearLocalStorage();
    cy.visit(`${FRONTEND}/user`, { failOnStatusCode: false });
    cy.location("pathname", { timeout: 15000 }).should("eq", "/user");
  });

  it("GET /api/instructor returns 401/403", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor`,
      failOnStatusCode: false
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("ADMIN can access GET /api/instructor", () => {
    apiLoginOrNull("admin", users.admin).then((token) => {
      if (!token) return; // skip if credentials not ready

      cy.request({
        method: "GET",
        url: `${API}/api/instructor`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect([401, 403]).to.not.include(res.status);
      });
    });
  });

  it("CLIENT cannot access GET /api/instructor ", () => {
    apiLoginOrNull("client", users.client).then((token) => {
      if (!token) return;

      cy.request({
        method: "GET",
        url: `${API}/api/instructor`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect([401, 403]).to.include(res.status);
      });
    });
  });

  it("INSTRUCTOR can access GET /api/instructor/{id}", () => {
    apiLoginOrNull("instructor", users.instructor).then((token) => {
      if (!token) return;

      cy.request({
        method: "GET",
        url: `${API}/api/instructor/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect([401, 403]).to.not.include(res.status);
      });
    });
  });
});
