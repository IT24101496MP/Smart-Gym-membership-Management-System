describe("Client Registration", () => {
  const APP = "http://localhost:5173";

  beforeEach(() => {
    cy.visit(`${APP}/client/register`);
  });

  it("does not call API when required fields are missing", () => {
    cy.intercept("POST", "**/api/client/register").as("reg");

    cy.contains("button", "Register").click();

    // If validation prevents submit, request should NOT happen
    cy.wait(800);
    cy.get("@reg.all").then((calls) => {
      expect(calls || []).to.have.length(0);
    });
  });

  it("submits successfully (stubs alert only)", () => {
    cy.intercept("POST", "**/api/client/register", {
      statusCode: 200,
      body: { ok: true },
    }).as("reg");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
      // ❌ don't stub win.location.reload (not configurable)
    });

    // Fill required fields per validateForm()
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Cena");
    cy.get('input[name="age"]').type("25");
    cy.get('input[name="dateOfBirth"]').type("2000-01-01");
    cy.get('select[name="gender"]').select("MALE");
    cy.get('input[name="phoneNumber"]').type("0712345678");
    cy.get('input[name="email"]').type(`qa_${Date.now()}@example.com`);
    cy.get('textarea[name="address"]').type("123 Main Street");
    cy.get('input[name="password"]').type("Aa1@aaaa");
    cy.get('input[name="confirmPassword"]').type("Aa1@aaaa");

    cy.contains("button", "Register").click();

    // ✅ confirm request happened
    cy.wait("@reg").its("response.statusCode").should("eq", 200);

    // ✅ confirm alert happened (this is your success indicator)
    cy.get("@alert").should("have.been.called");
  });
});