describe("Instructor Detail - Approve + Employment Assignment", () => {
  const UI_BASE = "http://localhost:5173";
  const API_BASE = "http://localhost:8080/api";

  const uniqueEmail = () =>
    `auto_e2e_${Date.now()}_${Math.floor(Math.random() * 1000)}@gmail.com`;

  const uniquePhone = () => `07${Date.now().toString().slice(-8)}`;

  const makePayload = () => ({
    firstName: "Auto",
    lastName: "E2E",
    email: uniqueEmail(),
    phoneNumber: uniquePhone(),
    address: "Negombo, Sri Lanka",
    qualification: "BSc Sports Science",
    yearsOfExperience: 2,
    areasOfSpecialization: "Yoga",
    password: "Password123",
  });

  const registerAndGetId = () => {
    const payload = makePayload();

    return cy
      .request({
        method: "POST",
        url: `${API_BASE}/instructor/register`,
        body: payload,
        failOnStatusCode: false,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        expect([200, 201]).to.include(res.status);

        return cy.request("GET", `${API_BASE}/instructor`).then((listRes) => {
          expect(listRes.status).to.eq(200);
          const found = (listRes.body || []).find((x) => x.email === payload.email);
          expect(found, "Created instructor should exist in list").to.exist;
          return found.id;
        });
      });
  };

  it("Should approve and assign employment", () => {
    registerAndGetId().then((id) => {
      cy.visit(`${UI_BASE}/instructor/${id}`);
      cy.contains("Instructor Review").should("exist");
      cy.get(".profile-banner .badge").should("contain.text", "PENDING");
      cy.intercept("PUT", "**/api/instructor/**/status**").as("approve");
      cy.get("button.btn--approve")
        .should("be.visible")
        .should("not.be.disabled")
        .click({ force: true });
      cy.wait("@approve", { timeout: 30000 }).then((i) => {
        expect(i.response, "Approve response should exist").to.exist;
        expect([200, 204]).to.include(i.response.statusCode);
      });

      // Employment section should appear
      cy.contains("Employment Assignment", { timeout: 30000 }).should("exist");

      cy.intercept("PUT", "**/api/instructor/**/employment**").as("employment");

      cy.get("select[name='employmentType']").select("FULL_TIME");
      cy.get("input[name='workingHoursPerWeek']").clear().type("40");
      cy.get("input[name='salary']").clear().type("75000");
      cy.get("select[name='isActive']").select("true");

      cy.contains(/Assign Employment Details|Save Changes/)
        .should("be.visible")
        .click({ force: true });

      cy.wait("@employment", { timeout: 30000 }).then((i) => {
        expect(i.response, "Employment response should exist").to.exist;
        expect([200, 204]).to.include(i.response.statusCode);
      });

      cy.contains("Employment details saved successfully", { timeout: 30000 }).should(
        "exist"
      );
    });
  });
});
