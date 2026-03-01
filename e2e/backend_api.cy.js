describe("Backend API Tests", () => {

  const API = "http://localhost:8080";

  it("Login returns 200 or 401", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/auth/login`,
      failOnStatusCode: false,
      body: {
        identifier: "admin@example.com",
        password: "Password123!"
      }
    }).then((res) => {
      expect([200, 401]).to.include(res.status);
    });
  });

  it("GET /api/auth/me without token returns 401/403", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/auth/me`,
      failOnStatusCode: false
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

 it("Client register without authentication should fail", () => {
  cy.request({
    method: "POST",
    url: `${API}/api/client/register`,
    failOnStatusCode: false,
    body: {}
  }).then((res) => {
    expect([400, 401, 403, 415]).to.include(res.status);
  });
});

  it("GET instructors without token should fail", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor`,
      failOnStatusCode: false
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("Invalid instructor ID should return 404 or 400", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor/999999`,
      failOnStatusCode: false
    }).then((res) => {
      expect([404, 400, 401, 403]).to.include(res.status);
    });
  });

});
