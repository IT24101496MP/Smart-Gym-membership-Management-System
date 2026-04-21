describe("UI - Fitness Goals Self Manage", () => {
  const makeJwt = (payload) => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.signature`;
  };

  const selfProfile = {
    id: 321,
    firstName: "Client",
    lastName: "User",
    age: 26,
    dateOfBirth: "2000-01-01",
    gender: "MALE",
    email: "client@fat2fit.lk",
    phoneNumber: "0712345678",
    address: "Colombo",
    role: "CLIENT",
    isActive: true,
  };

  let goalState;

  const seedGoalState = () => {
    goalState = [
      {
        id: 1,
        clientId: 321,
        goal: "CARDIO_TRAINING",
        otherGoalSpecification: null,
        instructorRequirements: "Do 3 cardio sessions each week.",
        allowTargetWeightUpdate: true,
        allowTargetParametersUpdate: true,
        allowTargetDateUpdate: true,
        targetWeightKg: 72,
        targetParameters: "HR zone 2",
        targetCompletionDate: null,
        progressPercent: 20,
        progressNotes: "Steady progress",
        status: "ACTIVE",
        approvedByInstructor: true,
      },
    ];
  };

  beforeEach(() => {
    seedGoalState();

    cy.intercept("GET", "http://localhost:8080/api/manage/me", {
      statusCode: 200,
      body: selfProfile,
    }).as("getMe");

    cy.intercept("GET", "http://localhost:8080/api/manage/me/fitness-goals", () => {
      return { statusCode: 200, body: goalState };
    }).as("getGoals");

    cy.intercept("PUT", "http://localhost:8080/api/manage/me/fitness-goals/*", (req) => {
      const goalId = Number(req.url.split("/").pop());
      const existing = goalState.find((g) => g.id === goalId);
      goalState = goalState.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          ...req.body,
          status: req.body.status ?? g.status,
          targetWeightKg: req.body.targetWeightKg ?? g.targetWeightKg,
          targetParameters: req.body.targetParameters ?? g.targetParameters,
          targetCompletionDate: req.body.targetCompletionDate ?? g.targetCompletionDate,
          progressPercent: req.body.progressPercent ?? g.progressPercent,
          progressNotes: req.body.progressNotes ?? g.progressNotes,
        };
      });

      req.reply({ statusCode: 200, body: { ...existing, ...req.body } });
    }).as("updateGoal");

    const accessToken = makeJwt({ role: "CLIENT", sub: "client@fat2fit.lk" });
    const refreshToken = makeJwt({ sub: "client@fat2fit.lk" });

    cy.visit("/manage", {
      onBeforeLoad(win) {
        win.localStorage.setItem("accessToken", accessToken);
        win.localStorage.setItem("refreshToken", refreshToken);
      },
    });

    cy.wait("@getMe");
    cy.contains("button", "Manage Goals", { timeout: 10000 }).click();
    cy.wait("@getGoals");
    cy.contains("h2", "My Fitness Goals").should("be.visible");
  });

  it("prevents saving a past target completion date", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    cy.get(".fitness-goal-card").first().within(() => {
      cy.contains("label", "Target Completion Date")
        .parent()
        .find("input[type='date']")
        .should("not.be.disabled")
        .clear({ force: true })
        .type(yesterday, { force: true });

      cy.contains("button", "Save Goal Update").click();
      cy.contains("Target completion date cannot be in the past.").should("be.visible");
    });

    cy.get("@updateGoal.all").should("have.length", 0);
  });

  it("prevents saving invalid target weight", () => {
    cy.get(".fitness-goal-card").first().within(() => {
      cy.contains("label", "Target Weight")
        .parent()
        .find("input[type='number']")
        .should("not.be.disabled")
        .clear({ force: true })
        .type("0", { force: true });

      cy.contains("button", "Save Goal Update").click();
      cy.contains("Target weight must be a positive number.").should("be.visible");
    });

    cy.get("@updateGoal.all").should("have.length", 0);
  });

  it("allows member to mark goal as achieved", () => {
    cy.get(".fitness-goal-card").first().within(() => {
      cy.contains("label", "Status")
        .parent()
        .find("select")
        .select("Achieved");

      cy.contains("button", "Save Goal Update").click();
    });

    cy.wait("@updateGoal").its("request.body").then((body) => {
      expect(body.status).to.equal("ACHIEVED");
    });
  });
});