describe("Instructor Registration", () => {
  const FE_URL = "http://localhost:5173";

  it("should submit registration successfully", () => {
    const stamp = Date.now();
    const email = `test${stamp}@mail.com`;
    const phone = `07${String(stamp).slice(-8)}`; 

    cy.visit(`${FE_URL}/instructor/register`);

    cy.get("#firstName").type("Kamal");
    cy.get("#lastName").type("Perera");
    cy.get("#email").type(email);
    cy.get("#phoneNumber").type(phone);
    cy.get("#address").type("Colombo");

    cy.get("#qualification").type("BSc Sports Science");
    cy.get("#yearsOfExperience").clear().type("5");
    cy.get("#areasOfSpecialization").type("Yoga");

    cy.window().then((win) => cy.stub(win, "alert").as("alert"));

    cy.get("button[type='submit']").click();

    cy.get("@alert").should(
      "have.been.calledWithMatch",
      /Form submitted for review successfully!/i
    );
  });
});