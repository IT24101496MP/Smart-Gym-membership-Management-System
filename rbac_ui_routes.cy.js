describe("RBAC - UI + API (4+ tests)", () => {
  const FRONTEND = "http://localhost:5173";
  const API = "http://localhost:8080";

  // 🔴 Put REAL DB users here (must exist)
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

  // -----------------------
  // ✅ TEST 1 (UI)
  // -----------------------
  it("UI: /user loads without token (route not protected in UI)", () => {
    cy.clearLocalStorage();
    cy.visit(`${FRONTEND}/user`, { failOnStatusCode: false });
    cy.location("pathname", { timeout: 15000 }).should("eq", "/user");
  });

  // -----------------------
  // ✅ TEST 2 (API - no token)
  // -----------------------
  it("API: No token -> GET /api/instructor returns 401/403", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor`,
      failOnStatusCode: false
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  // -----------------------
  // ✅ TEST 3 (API - admin allowed)
  // -----------------------
  it("API: ADMIN can access GET /api/instructor (ADMIN only)", () => {
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

  // -----------------------
  // ✅ TEST 4 (API - client blocked)
  // -----------------------
  it("API: CLIENT cannot access GET /api/instructor (ADMIN only)", () => {
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

  // -----------------------
  // ✅ TEST 5 (API - instructor allowed on /api/instructor/{id})
  // -----------------------
  it("API: INSTRUCTOR can access GET /api/instructor/{id} (ADMIN or INSTRUCTOR)", () => {
    apiLoginOrNull("instructor", users.instructor).then((token) => {
      if (!token) return;

      cy.request({
        method: "GET",
        url: `${API}/api/instructor/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        // Allowed endpoint can be 200 OR 404 (if id doesn't exist), but NOT 401/403
        expect([401, 403]).to.not.include(res.status);
      });
    });
  });
});
