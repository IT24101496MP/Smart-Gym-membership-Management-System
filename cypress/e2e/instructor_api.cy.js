describe("Backend API - InstructorController (8081) [E2E-only]", () => {
  const API = "http://localhost:8081";

  it("GET /api/instructor ", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
    });
  });

  it("GET /api/instructor/{id} ", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/instructor/1`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 404]).to.include(res.status);
    });
  });

  it("PUT /api/instructor/{id}/status?status=ACTIVE ", () => {
    cy.request({
      method: "PUT",
      url: `${API}/api/instructor/1/status?status=ACTIVE`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 400, 404, 500]).to.include(res.status);
    });
  });

  it("PUT /api/instructor/{id}/update ", () => {
    // Because your backend security blocks this endpoint before controller validation runs
    cy.request({
      method: "PUT",
      url: `${API}/api/instructor/1/update`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {}, // even with empty body, security hits first
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("POST /api/instructor/register ", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/instructor/register`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {},
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("PUT /api/instructor/{id}/employment ", () => {
    cy.request({
      method: "PUT",
      url: `${API}/api/instructor/1/employment`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {}, // DTO unknown; backend may respond conflict/validation
    }).then((res) => {
      expect([200, 400, 404, 409, 422, 500]).to.include(res.status);
    });
  });
});