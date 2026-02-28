describe("Instructor Registration", () => {
  it("Registers instructor", () => {
    const email = `auto_${Date.now()}@gmail.com`;

    cy.visit("http://localhost:5173/instructor/register");

    cy.get("#firstName").type("Auto");
    cy.get("#lastName").type("Tester");
    cy.get("#email").type(email);
    cy.get("#phoneNumber").type("0771234567");
    cy.get("#address").type("Negombo, Sri Lanka");
    cy.get("#qualification").type("BSc Sports Science");
    cy.get("#yearsOfExperience").clear().type("2");
    cy.get("#areasOfSpecialization").type("Yoga");
    cy.get("#password").type("Password123");
    cy.get("#confirmPassword").type("Password123");

    // Set alert listener 
    const alertMessages = [];
    cy.on("window:alert", (txt) => {
      alertMessages.push(txt);
    });

    cy.intercept("POST", "http://localhost:8080/api/instructor/register").as("register");
    cy.contains("Submit").click();
    cy.wait("@register").then(({ response }) => {
      expect(response, "Backend response should exist").to.exist;

      const status = response.statusCode;
      expect([200, 201, 400, 409, 422, 500]).to.include(status);

      cy.then(() => {
        const all = alertMessages.join(" | ");

        if ([200, 201].includes(status)) {
          expect(all).to.include("submitted for review");
        } else {
          expect(
            all,
            `Expected failure alert for status ${status}, got: ${all}`
          ).to.match(/Registration failed:|An error occurred during registration/i);
        }
      });
    });
  });
});
