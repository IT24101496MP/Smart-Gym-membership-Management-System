describe("User Sign Up (UserLoginRegistration) on /login", () => {
  const APP_URL = "http://localhost:5173";

  beforeEach(() => {
    cy.visit(`${APP_URL}/login`);
  });

  const getEmail = () => cy.get('input[name="email"]');
  const getPassword = () => cy.get('input[name="password"]');
  const getConfirmPassword = () => cy.get('input[name="confirmPassword"]');
  const getSubmitBtn = () => cy.get("button.submit-button");

  it("renders the sign up page basics", () => {
    cy.contains("h1", /sign up/i).should("be.visible");
    cy.contains(/your fitness journey starts here/i).should("be.visible");

    getEmail().should("be.visible");
    getPassword().should("be.visible");
    getConfirmPassword().should("be.visible");

    getSubmitBtn().should("be.visible").and("be.enabled");
    cy.contains(/or sign up using/i).should("be.visible");
  });

  it("shows validation error when submitting empty form", () => {
    getSubmitBtn().click();
    cy.contains(".error-message", "Please fill in all fields").should("be.visible");
  });

  it("shows validation error when passwords do not match", () => {
    getEmail().type("testuser@example.com");
    getPassword().type("Password123!");
    getConfirmPassword().type("Password1234!");
    getSubmitBtn().click();

    cy.contains(".error-message", "Passwords do not match").should("be.visible");
  });

  it("clears error when user edits an input after error", () => {
    getSubmitBtn().click();
    cy.contains(".error-message", "Please fill in all fields").should("be.visible");

    getEmail().type("a@b.com");
    cy.get(".error-message").should("not.exist");
  });

  it("toggles password visibility ", () => {
    getPassword().should("have.attr", "type", "password");

    // first eye icon = password
    cy.get(".password-group .eye-icon").first().click();
    getPassword().should("have.attr", "type", "text");

    cy.get(".password-group .eye-icon").first().click();
    getPassword().should("have.attr", "type", "password");
  });

  it("toggles password visibility", () => {
    getConfirmPassword().should("have.attr", "type", "password");
    cy.get(".password-group .eye-icon").eq(1).click();
    getConfirmPassword().should("have.attr", "type", "text");

    cy.get(".password-group .eye-icon").eq(1).click();
    getConfirmPassword().should("have.attr", "type", "password");
  });

  it("submits registration successfully and shows success + clears inputs", () => {
    cy.intercept("POST", "/api/user/register", (req) => {
      expect(req.body).to.have.property("email", "newuser@example.com");
      expect(req.body).to.have.property("password");
      expect(req.body).to.have.property("confirmPassword");

      req.reply({ statusCode: 200, body: "Registration successful" });
    }).as("register");

    getEmail().type("newuser@example.com");
    getPassword().type("Password123!");
    getConfirmPassword().type("Password123!");
    getSubmitBtn().click();

    cy.wait("@register").its("response.statusCode").should("eq", 200);
    cy.contains(".success-message", "Registration successful").should("be.visible");
    getEmail().should("have.value", "");
    getPassword().should("have.value", "");
    getConfirmPassword().should("have.value", "");
  });

  it("shows backend error message if registration fails", () => {
    cy.intercept("POST", "/api/user/register", {
      statusCode: 409,
      body: "Email already exists",
    }).as("registerFail");

    getEmail().type("dup@example.com");
    getPassword().type("Password123!");
    getConfirmPassword().type("Password123!");
    getSubmitBtn().click();

    cy.wait("@registerFail").its("response.statusCode").should("eq", 409);
    cy.contains(".error-message", "Email already exists").should("be.visible");
    cy.get(".success-message").should("not.exist");
  });

  it("disables button while request is pending (loading state)", () => {
    cy.intercept("POST", "/api/user/register", (req) => {
      req.reply((res) => {
        res.setDelay(1500);
        res.send({ statusCode: 200, body: "OK" });
      });
    }).as("slowRegister");

    getEmail().type("slow@example.com");
    getPassword().type("Password123!");
    getConfirmPassword().type("Password123!");
    getSubmitBtn().click();

    // button becomes disabled while loading=true
    getSubmitBtn().should("be.disabled");

    //  if the label changes, assert it 
    getSubmitBtn().invoke("text").then((txt) => {
      const t = (txt || "").trim();
      if (/signing up/i.test(t)) {
        expect(t).to.match(/signing up/i);
      }
    });

    cy.wait("@slowRegister");
    getSubmitBtn().should("be.enabled");
  });

  it("login link exists (it may link to /login)", () => {
    cy.contains("a", /login/i).should("be.visible");
  });

  it("facebook icon click does not crash (smoke)", () => {
    cy.get(".icon-wrapper.facebook").click({ force: true });
    cy.contains("h1", /sign up/i).should("be.visible");
  });
});
