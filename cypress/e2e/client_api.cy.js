describe("Backend API - ClientController (8081) [E2E-only]", () => {
  const API = "http://localhost:8081";

  it("GET /api/client/{id} ", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/client/1`,
      failOnStatusCode: false,
    }).then((res) => {
      // If secured: 401/403
      // If not secured and not found: 404
      // If exists: 200
      expect([200, 401, 403, 404]).to.include(res.status);
    });
  });

  it("GET /api/client/user/{id} ", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/client/user/1`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 401, 403, 404]).to.include(res.status);
    });
  });

  it("POST /api/client/register ", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/client/register`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {
        firstName: "John",
        lastName: "Cena",
        age: 24,
        gender: "Male",
        mobileNumber: "0712345678",
        address: "123 Main Street",
      },
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("PUT /api/client/{id}/update ", () => {
    cy.request({
      method: "PUT",
      url: `${API}/api/client/1/update?updatedBy=1`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {
        firstName: "Updated",
        lastName: "User",
        age: 25,
        gender: "Male",
        mobileNumber: "0712345678",
        address: "New Address",
      },
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });
});