describe("Landing page contact section - implemented behavior", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("button", "Contact").click();
  });

  it("shows location map and phone numbers", () => {
    cy.contains("h3", "Location").should("be.visible");
    cy.get('iframe[title="Fat2Fit Wellness Studio location"]').should("be.visible");

    cy.contains("h3", "Call Us").should("be.visible");
    cy.get('a[href="tel:0112273830"]').should("be.visible");
    cy.get('a[href="tel:0765670060"]').should("be.visible");
  });

  it("requires mandatory form fields before submit", () => {
    cy.get(".contact-form-panel").within(() => {
      cy.contains("button", "Send").click();
      cy.get('input[name="firstName"]').then(($input) => {
        expect($input[0].checkValidity()).to.eq(false);
      });
    });
  });

  it("shows success message after valid submission", () => {
    cy.intercept("POST", "http://localhost:8080/api/contact/send", {
      statusCode: 200,
      body: { message: "Your message was submitted successfully." },
    }).as("sendContact");

    cy.get('input[name="firstName"]').type("Alex");
    cy.get('input[name="lastName"]').type("Perera");
    cy.get('input[name="email"]').type("alex@example.com");
    cy.get('input[name="phoneNumber"]').type("0771234567");
    cy.get('textarea[name="message"]').type("I need details about membership plans.");
    cy.contains("button", "Send").click();

    cy.wait("@sendContact");
    cy.contains("p.contact-status.success", "Your message was submitted successfully.").should("be.visible");
    cy.get('input[name="firstName"]').should("have.value", "");
    cy.get('textarea[name="message"]').should("have.value", "");
  });

  it("shows error message when submit fails", () => {
    cy.intercept("POST", "http://localhost:8080/api/contact/send", {
      statusCode: 500,
      body: { message: "Unable to process request at the moment." },
    }).as("sendContactFail");

    cy.get('input[name="firstName"]').type("Alex");
    cy.get('input[name="lastName"]').type("Perera");
    cy.get('input[name="email"]').type("alex@example.com");
    cy.get('input[name="phoneNumber"]').type("0771234567");
    cy.get('textarea[name="message"]').type("Please call me back.");
    cy.contains("button", "Send").click();

    cy.wait("@sendContactFail");
    cy.contains("p.contact-status.error", "Unable to process request at the moment.").should("be.visible");
  });
});