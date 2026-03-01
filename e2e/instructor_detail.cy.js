describe("Instructor - Detail Page (Review + Employment)", () => {
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
      win.localStorage.setItem(
        "refreshToken",
        makeJwt({ type: "refresh", exp: now + 7 * 24 * 3600 })
      );
    });
  };

  it("approves a pending instructor and shows success toast", () => {
    const id = 101;

    cy.visit(`${APP}/login`);
    setAuth("ADMIN");

    const pendingInstructor = {
      id,
      firstName: "Sahan",
      lastName: "Fernando",
      age: 28,
      dateOfBirth: "1998-01-01",
      gender: "MALE",
      email: "sahan@example.com",
      phoneNumber: "0712345678",
      landPhone: "",
      address: "Negombo",
      qualification: "BSc",
      yearsOfExperience: 3,
      areasOfSpecialization: "Crossfit",
      status: "PENDING",
      isActive: true,
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-01T10:00:00Z",
      employment: null,
    };

    cy.intercept("GET", `**/api/instructor/${id}`, {
      statusCode: 200,
      body: pendingInstructor,
    }).as("getInstructor");

    cy.intercept("PUT", `**/api/instructor/${id}/status?status=APPROVED`, {
      statusCode: 200,
      body: {},
    }).as("approve");

    cy.visit(`${APP}/instructor/${id}`);
    cy.wait("@getInstructor");

    cy.contains("Instructor Review").should("be.visible");
    cy.contains("PENDING").should("be.visible");

    cy.contains("button", "Approve").click();
    cy.wait("@approve");

    cy.contains("approved successfully").should("be.visible");
  });

  it("after approved: validates employment form and submits successfully", () => {
    const id = 202;

    cy.visit(`${APP}/login`);
    setAuth("ADMIN");

    // IMPORTANT:
    // isActive is true -> empForm.isActive becomes "true" -> so "Employment status is required." will NOT appear.
    const approvedInstructor = {
      id,
      firstName: "Kasun",
      lastName: "Perera",
      age: 30,
      dateOfBirth: "1996-01-01",
      gender: "MALE",
      email: "kasun@example.com",
      phoneNumber: "0710000000",
      landPhone: "",
      address: "Colombo",
      qualification: "Diploma",
      yearsOfExperience: 6,
      areasOfSpecialization: "Strength",
      status: "APPROVED",
      isActive: true,
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-01T10:00:00Z",
      employment: null,
    };

    cy.intercept("GET", `**/api/instructor/${id}`, {
      statusCode: 200,
      body: approvedInstructor,
    }).as("getInstructor");

    const updatedInstructor = {
      ...approvedInstructor,
      employment: {
        employmentType: "FULL_TIME",
        workingHoursPerWeek: 40,
        salary: 75000,
      },
      isActive: true,
    };

    cy.intercept("PUT", `**/api/instructor/${id}/employment`, (req) => {
      expect(req.body).to.have.property("employmentType");
      expect(req.body).to.have.property("workingHoursPerWeek");
      expect(req.body).to.have.property("salary");
      expect(req.body).to.have.property("isActive");
      req.reply({ statusCode: 200, body: updatedInstructor });
    }).as("saveEmployment");

    cy.visit(`${APP}/instructor/${id}`);
    cy.wait("@getInstructor");

    cy.contains("Employment Assignment").should("be.visible");

    // Trigger validation
    cy.contains("button", "Assign Employment Details").click();

    // These 3 are guaranteed when empty
    cy.contains("Employment type is required.").should("be.visible");
    cy.contains("Enter hours between 1 and 168.").should("be.visible");
    cy.contains("Enter a valid non-negative salary.").should("be.visible");

    // DO NOT assert "Employment status is required." because isActive can already be pre-filled ("true"/"false")

    // Fill the form
    cy.get('select[name="employmentType"]').select("FULL_TIME");
    cy.get('input[name="workingHoursPerWeek"]').clear().type("40");
    cy.get('input[name="salary"]').clear().type("75000");

    // Only set status if dropdown exists (some UI states may disable/hide it)
    cy.get("body").then(($body) => {
      if ($body.find('select[name="isActive"]').length) {
        cy.get('select[name="isActive"]').select("Active");
      }
    });

    cy.contains("button", "Assign Employment Details").click();
    cy.wait("@saveEmployment");

    cy.contains("Employment details saved successfully.").should("be.visible");
  });
});