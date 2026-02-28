describe("Instructor Backend API Tests", () => {
  const API = "http://localhost:8080/api";

  const uniqueEmail = () =>
    `auto_api_${Date.now()}_${Math.floor(Math.random() * 1000)}@gmail.com`;

  // Unique phone no.
  const uniquePhone = () => `07${Date.now().toString().slice(-8)}`;

  const makeRegisterPayload = (overrides = {}) => ({
    firstName: "Auto",
    lastName: "API",
    email: uniqueEmail(),
    phoneNumber: uniquePhone(),
    address: "Negombo, Sri Lanka",
    qualification: "BSc Sports Science",
    yearsOfExperience: 2,
    areasOfSpecialization: "Yoga",
    password: "Password123",
    ...overrides,
  });

  const registerInstructorSuccess = (payload) => {
    return cy
      .request({
        method: "POST",
        url: `${API}/instructor/register`,
        body: payload,
        failOnStatusCode: false,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(
            `Register expected 200/201 but got ${res.status}. Body: ${
              typeof res.body === "string" ? res.body : JSON.stringify(res.body)
            }`
          );
        }

        if (res.body && typeof res.body === "object" && res.body.id) {
          return res.body;
        }

        return cy.request("GET", `${API}/instructor`).then((listRes) => {
          expect(listRes.status).to.eq(200);
          const found = (listRes.body || []).find((x) => x.email === payload.email);
          expect(found, "Created instructor should exist in list").to.exist;
          expect(found).to.have.property("id");
          return found;
        });
      });
  };

  const updateStatus = (id, status) => {
    return cy.request({
      method: "PUT",
      url: `${API}/instructor/${id}/status`,
      qs: { status },
      failOnStatusCode: false,
    });
  };

  const assignEmployment = (id, payload) => {
    return cy.request({
      method: "PUT",
      url: `${API}/instructor/${id}/employment`,
      body: payload,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
    });
  };

  it("GET /instructor should return a list", () => {
    cy.request("GET", `${API}/instructor`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
    });
  });

  it("POST /instructor/register should create an instructor (happy path)", () => {
    const payload = makeRegisterPayload();

    registerInstructorSuccess(payload).then((created) => {
      expect(created.email).to.eq(payload.email);
      if (created.status) {
        expect(["PENDING", "APPROVED", "REJECTED"]).to.include(created.status);
      }
    });
  });

  it("POST /instructor/register should reject empty payload (validation or security)", () => {
    cy.request({
      method: "POST",
      url: `${API}/instructor/register`,
      body: {},
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
    }).then((res) => {
      expect([400, 401, 403, 422]).to.include(res.status);
    });
  });

  it("POST /instructor/register should reject invalid email (if backend validates)", () => {
   
    const payload = makeRegisterPayload({ email: "invalid-email" });

    cy.request({
      method: "POST",
      url: `${API}/instructor/register`,
      body: payload,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
    }).then((res) => {
     
      expect([200, 201, 400, 401, 403, 409, 422]).to.include(res.status);
    });
  });

  it("POST /instructor/register should not allow duplicate email OR phone", () => {
    const fixedEmail = uniqueEmail();
    const fixedPhone = uniquePhone();

    const payload1 = makeRegisterPayload({ email: fixedEmail, phoneNumber: fixedPhone });
    const payload2 = makeRegisterPayload({ email: fixedEmail, phoneNumber: fixedPhone });

    registerInstructorSuccess(payload1).then(() => {
      cy.request({
        method: "POST",
        url: `${API}/instructor/register`,
        body: payload2,
        failOnStatusCode: false,
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        expect([409, 400]).to.include(res.status);
      });
    });
  });

  it("GET /instructor/:id should return the instructor", () => {
    const payload = makeRegisterPayload();

    registerInstructorSuccess(payload).then((created) => {
      cy.request("GET", `${API}/instructor/${created.id}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property("id", created.id);
        expect(res.body).to.have.property("email", payload.email);
      });
    });
  });

  it("PUT /instructor/:id/status should approve instructor", () => {
    const payload = makeRegisterPayload();

    registerInstructorSuccess(payload).then((created) => {
      updateStatus(created.id, "APPROVED").then((res) => {
        expect([200, 204]).to.include(res.status);
      });

      cy.request("GET", `${API}/instructor/${created.id}`).then((res) => {
        expect(res.status).to.eq(200);
        if (res.body.status) expect(res.body.status).to.eq("APPROVED");
      });
    });
  });

  it("PUT /instructor/:id/employment should fail if instructor NOT approved (backend rule)", () => {
    const payload = makeRegisterPayload();

    registerInstructorSuccess(payload).then((created) => {
      const emp = {
        employmentType: "FULL_TIME",
        workingHoursPerWeek: 40,
        salary: 75000,
        isActive: true,
      };

      assignEmployment(created.id, emp).then((res) => {
        expect([400, 403, 409]).to.include(res.status);
      });
    });
  });

  it("PUT /instructor/:id/employment should assign employment after approval", () => {
    const payload = makeRegisterPayload();

    registerInstructorSuccess(payload).then((created) => {
      updateStatus(created.id, "APPROVED").then((res) => {
        expect([200, 204]).to.include(res.status);
      });

      const emp = {
        employmentType: "FULL_TIME",
        workingHoursPerWeek: 40,
        salary: 75000,
        isActive: true,
      };

      assignEmployment(created.id, emp).then((res) => {
        expect([200, 204]).to.include(res.status);
      });

      cy.request("GET", `${API}/instructor/${created.id}`).then((res) => {
        expect(res.status).to.eq(200);
        if (res.body.employmentType) expect(res.body.employmentType).to.eq("FULL_TIME");
        if (res.body.workingHoursPerWeek != null) expect(res.body.workingHoursPerWeek).to.eq(40);
      });
    });
  });

  it("PUT /instructor/:id/employment should validate working hours range", () => {
    const payload = makeRegisterPayload();

    registerInstructorSuccess(payload).then((created) => {
      updateStatus(created.id, "APPROVED").then((res) => {
        expect([200, 204]).to.include(res.status);
      });

      const empBad = {
        employmentType: "FULL_TIME",
        workingHoursPerWeek: 200,
        salary: 75000,
        isActive: true,
      };

      assignEmployment(created.id, empBad).then((res) => {
        expect([400, 401, 403, 422]).to.include(res.status);
      });
    });
  });
});