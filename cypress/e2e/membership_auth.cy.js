describe("Auth Validation for Notifications", () => {
  it("Prevents access without login", () => {
    cy.request({
      method: "GET",
      url: "/api/notifications/logs",
      failOnStatusCode: false
    }).then((res) => {
      // Spring Security returns 403 Forbidden when unauthenticated for secured routes
      expect(res.status).to.be.oneOf([401, 403]);
    });
  });
});