describe("Client Registration UI", () => {

  const FE_URL = "http://localhost:5173";
  const ROUTE = "/client/register";
  const API_URL = "http://localhost:8080/api/client/register";

  // Should NOT submit empty form
  it("should not submit empty form", () => {

    cy.visit(FE_URL + ROUTE);

    cy.intercept("POST", API_URL).as("register");

    cy.get("button[type='submit']").click();

    cy.wait(800);

    // Ensure no API call happened
    cy.get("@register.all").should("have.length", 0);
  });


  // Should NOT allow duplicate email
  it("should not allow duplicate email", () => {

    const email = "duplicate@mail.com";

    // Mock backend to return 409 for duplicate
    cy.intercept("POST", API_URL, {
      statusCode: 409,
      body: "Email already exists"
    }).as("register");

    cy.visit(FE_URL + ROUTE);

    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Cena");
    cy.get('input[name="age"]').type("25");
    cy.get('select[name="gender"]').select("Male");
    cy.get('input[name="mobileNumber"]').type("0771234567");
    cy.get('input[name="email"]').type(email);
    cy.get('textarea[name="address"]').type("Colombo");

    cy.window().then((win) => cy.stub(win, "alert").as("alert"));

    cy.get('button[type="submit"]').click();

    cy.wait("@register");

    cy.get("@alert").should("have.been.calledWithMatch", /Registration failed/i);
  });


  // 3. Should register successfully
  it("should register client successfully", () => {

    const stamp = Date.now();
    const email = `client${stamp}@mail.com`;
    const mobile = `07${String(stamp).slice(-8)}`;

    cy.intercept("POST", API_URL, {
      statusCode: 200,
      body: "OK"
    }).as("register");

    cy.visit(FE_URL + ROUTE);

    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Cena");
    cy.get('input[name="age"]').type("25");
    cy.get('select[name="gender"]').select("Male");
    cy.get('input[name="mobileNumber"]').type(mobile);
    cy.get('input[name="landPhone"]').type("0112345678");
    cy.get('input[name="email"]').type(email);
    cy.get('textarea[name="address"]').type("Colombo");

    cy.window().then((win) => cy.stub(win, "alert").as("alert"));

    cy.get('button[type="submit"]').click();

    cy.wait("@register");

    cy.get("@alert").should("have.been.calledWithMatch", /Client registered successfully/i);
  });

});
