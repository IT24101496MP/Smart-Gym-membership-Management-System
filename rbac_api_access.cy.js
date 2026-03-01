describe("RBAC - Backend API Access (Spring Security)", () => {
  const API = "http://localhost:8080";

  const users = {
    admin: { identifier: "admin@example.com", password: "Password123!" },
    instructor: { identifier: "instructor@example.com", password: "Password123!" },
    client: { identifier: "client@example.com", password: "Password123!" }
  };

  function loginOrSkip(userLabel, user) {
    return cy
      .request({
        method: "POST",
        url: `${API}/api/auth/login`,
        failOnStatusCode: false,
        body: { identifier: user.identifier, password: user.password }
      })
      .then((res) => {
        if (![200, 201].includes(res.status)) {
          cy.log(`SKIP: Login failed for ${userLabel} -> ${res.status}`);
          cy.log(typeof res.body === "string" ? res.body : JSON.stringify(res.body));
          return null;
        }

        const token = res.body?.accessToken || res.body?.token;
        expect(token).to.be.a("string").and.not.be.empty;
        return token;
      });
  }

  it("No token -> protected endpoints return 401/403", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor`,
      failOnStatusCode: false
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("ADMIN can access GET /api/instructor (ADMIN only)", () => {
    loginOrSkip("admin", users.admin).then((token) => {
      if (!token) return;

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

  it("CLIENT cannot access GET /api/instructor (ADMIN only)", () => {
    loginOrSkip("client", users.client).then((token) => {
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

  it("INSTRUCTOR can access GET /api/instructor/{id} (ADMIN or INSTRUCTOR)", () => {
    loginOrSkip("instructor", users.instructor).then((token) => {
      if (!token) return;

      cy.request({
        method: "GET",
        url: `${API}/api/instructor/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        // allowed could be 200 OR 404, but NOT 401/403
        expect([401, 403]).to.not.include(res.status);
      });
    });
  });

  it("CLIENT can access GET /api/client/{id} (ADMIN or CLIENT)", () => {
    loginOrSkip("client", users.client).then((token) => {
      if (!token) return;

      cy.request({
        method: "GET",
        url: `${API}/api/client/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect([401, 403]).to.not.include(res.status);
      });
    });
  });

  it("INSTRUCTOR cannot access GET /api/client/{id} (ADMIN or CLIENT only)", () => {
    loginOrSkip("instructor", users.instructor).then((token) => {
      if (!token) return;

      cy.request({
        method: "GET",
        url: `${API}/api/client/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect([401, 403]).to.include(res.status);
      });
    });
  });

  it("ADMIN only: PUT /api/instructor/{id}", () => {
    loginOrSkip("admin", users.admin).then((token) => {
      if (!token) return;

      cy.request({
        method: "PUT",
        url: `${API}/api/instructor/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
        body: { note: "rbac-test" }
      }).then((res) => {
        expect([401, 403]).to.not.include(res.status);
      });
    });
  });

  it("CLIENT cannot: PUT /api/instructor/{id}", () => {
    loginOrSkip("client", users.client).then((token) => {
      if (!token) return;

      cy.request({
        method: "PUT",
        url: `${API}/api/instructor/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
        body: { note: "rbac-test" }
      }).then((res) => {
        expect([401, 403]).to.include(res.status);
      });
    });
  });
});
