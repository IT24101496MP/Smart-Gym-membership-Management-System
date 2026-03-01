const API = "http://localhost:8080";
const FRONTEND = "http://localhost:5173";

function getEnv(keys) {
  return cy.env(keys).then((env) => env || {});
}

function uniqueEmail(prefix = "client.ok") {
  return `${prefix}+${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

function uniqueSriLankaMobile() {
  const n = Math.floor(100000000 + Math.random() * 900000000); // 9 digits
  return `0${n}`;
}

function formRegisterClient(overrides = {}) {
  const data = {
    firstName: "John",
    lastName: "Cena",
    age: "25",
    dateOfBirth: "2000-01-01",
    gender: "MALE",
    phoneNumber: uniqueSriLankaMobile(),
    email: uniqueEmail(),
    address: "123 Main Street, Colombo",
    password: "Password123!",
    landPhone: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    bloodGroup: "",
    ...overrides,
  };

  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === null || v === undefined) return;

    if (
      typeof v === "string" &&
      v.trim() === "" &&
      ![
        "firstName",
        "lastName",
        "age",
        "dateOfBirth",
        "gender",
        "phoneNumber",
        "email",
        "address",
      ].includes(k)
    ) {
      return;
    }

    fd.append(k, v);
  });

  return fd;
}

function postMultipart(url, formData, token) {
  return cy.visit(`${FRONTEND}/login`, { failOnStatusCode: false }).then(() => {
    return cy.window().then((win) => {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      return win.fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
    });
  });
}

function adminLogin() {
  return getEnv(["ADMIN_IDENTIFIER", "ADMIN_PASSWORD"]).then((env) => {
    const identifier = env.ADMIN_IDENTIFIER;
    const password = env.ADMIN_PASSWORD;
    if (!identifier || !password) return null;

    return cy
      .request({
        method: "POST",
        url: `${API}/api/auth/login`,
        failOnStatusCode: false,
        headers: { "Content-Type": "application/json" },
        body: { identifier, password },
      })
      .then((resp) => {
        if (resp.status !== 200) {
          throw new Error(
            `ADMIN login failed (status ${resp.status}). Body: ${JSON.stringify(resp.body)}`
          );
        }
        const accessToken = resp.body?.accessToken;
        if (!accessToken) {
          throw new Error(
            `ADMIN login success but accessToken missing. Body: ${JSON.stringify(resp.body)}`
          );
        }
        return { accessToken, refreshToken: resp.body?.refreshToken };
      });
  });
}

describe("Backend API", () => {
  it("POST /api/auth/login - invalid credentials should fail (usually 401)", () => {
    cy.request({
      method: "POST",
      url: `${API}/api/auth/login`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: { identifier: "not-a-user@example.com", password: "wrongpass" },
    }).then((resp) => {
      expect([400, 401]).to.include(resp.status);
    });
  });

  it("POST /api/client/register - invalid phone should return 400 ", () => {
    const fd = formRegisterClient({ phoneNumber: "777777" });

    postMultipart(`${API}/api/client/register`, fd).then(async (resp) => {
      const text = await resp.text();
      expect(resp.status).to.eq(400);
      expect(text).to.contain("Invalid phone number");
    });
  });

  it("POST /api/client/register - invalid gender should return 400 ", () => {
    const fd = formRegisterClient({ gender: "MALEE" });

    postMultipart(`${API}/api/client/register`, fd).then(async (resp) => {
      const text = await resp.text();
      expect(resp.status).to.eq(400);
      expect(text).to.contain("Invalid gender");
    });
  });

  it("POST /api/client/register - success should return 200/201 ", () => {
    const fd = formRegisterClient({
      email: uniqueEmail("client.ok"),
      phoneNumber: uniqueSriLankaMobile(),
      gender: "MALE",
    });

    postMultipart(`${API}/api/client/register`, fd).then(async (resp) => {
      const text = await resp.text();
      if (resp.status === 409) {
        throw new Error(
          `Expected success but got 409 Conflict. Backend response: ${text}`
        );
      }

      expect([200, 201]).to.include(resp.status);

      try {
        const json = JSON.parse(text);
        expect(json).to.be.an("object");
      } catch {
      }
    });
  });

  it("GET /api/auth/me - works with admin token ", () => {
    adminLogin().then((tokens) => {
      if (!tokens) {
        cy.log("Skipping: ADMIN_IDENTIFIER / ADMIN_PASSWORD not set.");
        return;
      }

      cy.request({
        method: "GET",
        url: `${API}/api/auth/me`,
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("object");
        expect(resp.body).to.have.property("role");
        expect(resp.body).to.have.property("email");
      });
    });
  });

  it("ADMIN: approve instructor + assign employment ", () => {
    adminLogin().then((tokens) => {
      if (!tokens) {
        cy.log("Skipping: ADMIN_IDENTIFIER / ADMIN_PASSWORD not set.");
        return;
      }

      getEnv(["TEST_INSTRUCTOR_ID"]).then((env) => {
        const instructorId = env.TEST_INSTRUCTOR_ID;
        if (!instructorId) {
          cy.log("Skipping: TEST_INSTRUCTOR_ID not set.");
          return;
        }

        cy.request({
          method: "PUT",
          url: `${API}/api/instructor/${instructorId}/status?status=APPROVED`,
          failOnStatusCode: false,
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }).then((resp) => {
          expect([200, 204]).to.include(resp.status);
        });

        cy.request({
          method: "PUT",
          url: `${API}/api/instructor/${instructorId}/employment`,
          failOnStatusCode: false,
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: {
            employmentType: "FULL_TIME",
            workingHoursPerWeek: 40,
            salary: 75000,
            isActive: true,
          },
        }).then((resp) => {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.be.an("object");
        });
      });
    });
  });
});
