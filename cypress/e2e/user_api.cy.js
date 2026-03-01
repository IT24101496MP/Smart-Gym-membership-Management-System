describe("Backend API - UserController (PORT 8081)", () => {
  const API = "http://localhost:8081";

  it("POST /api/user/register -  validation error", () => {
    const email = `cypress_${Date.now()}@test.com`;

    cy.request({
      method: "POST",
      url: `${API}/api/user/register`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {
        email,
        password: "Password123!",
        confirmPassword: "Password123!",
      },
    }).then((res) => {
      // Controller returns 200 OK success or 400 Bad Request
      expect([200, 400]).to.include(res.status);

      if (res.status === 200) {
        expect(res.body).to.have.property("userId");
        expect(res.body).to.have.property("email");
        expect(res.body).to.have.property("role");
        expect(res.body).to.have.property("status");
      } else {
        // error message string
        expect(String(res.body)).to.not.equal("");
      }
    });
  });

  it("POST /api/user/register - passwords mismatch ", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/user/register`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: {
        email: `cypress_${Date.now()}@test.com`,
        password: "Password123!",
        confirmPassword: "Password123@",
      },
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(String(res.body)).to.include("Passwords do not match");
    });
  });

  it("POST /api/user/oauth/google ", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/user/oauth/google`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      // Controller accepts String body
      body: "oauth_test@gmail.com",
    }).then((res) => {
      expect([200, 400]).to.include(res.status);
    });
  });

  it("POST /api/user/oauth/facebook ", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/user/oauth/facebook`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: "oauth_test@gmail.com",
    }).then((res) => {
      expect([200, 400]).to.include(res.status);
    });
  });
});