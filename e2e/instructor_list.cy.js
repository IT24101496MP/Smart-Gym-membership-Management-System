describe("Instructor - List Page", () => {
  const APP = "http://localhost:5173";

  const makeJwt = (payload) => {
    const b64 = (obj) =>
      btoa(JSON.stringify(obj))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    const header = { alg: "none", typ: "JWT" };
    return `${b64(header)}.${b64(payload)}.`;
  };

  const setAuth = (role = "ADMIN") => {
    const now = Math.floor(Date.now() / 1000);
    cy.window().then((win) => {
      win.localStorage.setItem("accessToken", makeJwt({ role, exp: now + 3600 }));
      win.localStorage.setItem("refreshToken", makeJwt({ type: "refresh", exp: now + 7 * 24 * 3600 }));
    });
  };

  it("shows instructors list and allows searching + filtering", () => {
    // Visit once so window exists
    cy.visit(`${APP}/login`);
    setAuth("ADMIN");

    const instructors = [
      {
        id: 10,
        firstName: "Nimal",
        lastName: "Perera",
        email: "nimal@example.com",
        phoneNumber: "0711111111",
        landPhone: "",
        address: "Colombo",
        qualification: "BSc",
        yearsOfExperience: 5,
        areasOfSpecialization: "Yoga",
        status: "PENDING",
        createdAt: "2026-03-01T10:00:00Z",
      },
      {
        id: 11,
        firstName: "Kamal",
        lastName: "Silva",
        email: "kamal@example.com",
        phoneNumber: "0722222222",
        landPhone: "",
        address: "Gampaha",
        qualification: "Diploma",
        yearsOfExperience: 2,
        areasOfSpecialization: "Weights",
        status: "APPROVED",
        createdAt: "2026-03-01T10:00:00Z",
      },
    ];

    cy.intercept("GET", "**/api/instructor", {
      statusCode: 200,
      body: instructors,
    }).as("getInstructors");

    cy.visit(`${APP}/instructor`);
    cy.wait("@getInstructors");

    cy.contains("Instructors").should("be.visible");
    cy.contains("Nimal Perera").should("be.visible");
    cy.contains("Kamal Silva").should("be.visible");

    // Search
    cy.get('input[placeholder*="Search"]').type("nimal");
    cy.contains("Nimal Perera").should("be.visible");
    cy.contains("Kamal Silva").should("not.exist");

    // Clear search + filter APPROVED
    cy.get('input[placeholder*="Search"]').clear();
    cy.contains("button", "APPROVED").click();
    cy.contains("Kamal Silva").should("be.visible");
    cy.contains("Nimal Perera").should("not.exist");

    // Clicking Review navigates to /instructor/:id
    cy.contains("a", "Review").first().click();
    cy.location("pathname").should("match", /^\/instructor\/\d+$/);
  });
});