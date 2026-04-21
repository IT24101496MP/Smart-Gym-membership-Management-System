const api = require("../../support/apiHelpers");

function seedApprovedInstructor(adminTokens) {
  const password = "Password123!";
  const instructor = {
    firstName: "QA",
    lastName: `Instructor_${Date.now()}`,
    age: 32,
    dateOfBirth: "1993-01-01",
    gender: "MALE",
    phoneNumber: api.uniqueSriLankaMobile(),
    landPhone: "",
    email: api.uniqueEmail("instructor.qa"),
    address: "123 Instructor Road, Colombo",
    password,
    qualification: "Certified Personal Trainer",
    yearsOfExperience: 5,
    areasOfSpecialization: "Strength training",
  };

  return cy
    .request({
      method: "POST",
      url: `${api.API_BASE}/api/instructor/register`,
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      body: instructor,
    })
    .then((resp) => {
      expect(resp.status, resp.body?.toString?.() || "").to.eq(200);

      return cy
        .request({
          method: "GET",
          url: `${api.API_BASE}/api/instructor`,
          failOnStatusCode: false,
          headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
        })
        .then((listResp) => {
          expect(listResp.status).to.eq(200);
          const created = (listResp.body || []).find(
            (item) => item.email === instructor.email || item.phoneNumber === instructor.phoneNumber
          );
          expect(created, `created instructor ${instructor.email}`).to.exist;

          return cy
            .request({
              method: "PUT",
              url: `${api.API_BASE}/api/instructor/${created.id}/status?status=APPROVED`,
              failOnStatusCode: false,
              headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
            })
            .then((approveResp) => {
              expect(approveResp.status).to.eq(200);

              return api.loginJson({ identifier: instructor.email, password }).then((instructorTokens) => ({
                instructor,
                instructorId: created.id,
                instructorTokens,
              }));
            });
        });
    });
}

function visitManageWithTokens(tokens) {
  cy.visit("/manage", {
    onBeforeLoad(win) {
      win.localStorage.setItem("accessToken", tokens.accessToken);
      win.localStorage.setItem("refreshToken", tokens.refreshToken);
    },
  });
}

function openWorkoutModal(member) {
  cy.contains("table.manage-table tbody tr", `${member.firstName} ${member.lastName}`)
    .should("be.visible")
    .within(() => {
      cy.contains("button", "Workout").click();
    });

  cy.contains("h2", `Workout Schedule - ${member.firstName} ${member.lastName}`).should("be.visible");
}

function fillWorkoutScheduleForm({ trainingType, fitnessGoal, exercises, durationMinutes, frequencyPerWeek, specialInstructions }) {
  cy.get(".modal-card").within(() => {
    cy.contains("label", "Training Type").parent().find("input").clear().type(trainingType);
    cy.contains("label", "Fitness Goal").parent().find("select").select(fitnessGoal);
    cy.contains("label", "Exercises").parent().find("textarea").clear().type(exercises);
    cy.contains("label", "Duration (minutes)").parent().find('input[type="number"]').clear().type(String(durationMinutes));
    cy.contains("label", "Frequency (sessions/week)").parent().find('input[type="number"]').clear().type(String(frequencyPerWeek));
    cy.contains("label", "Special Instructions").parent().find("textarea").clear().type(specialInstructions);
  });
}

describe("UI - Workout Schedule", () => {
  it("lets an instructor assign and update a workout schedule for a member", () => {
    api.setupPlanAndClient().then(({ adminTokens, client }) => {
      seedApprovedInstructor(adminTokens).then(({ instructorTokens }) => {
        const firstPayload = {
          trainingType: "Strength Foundation",
          fitnessGoal: "FAT_BURNING",
          exercises: "Warm-up jog\nGoblet squats\nIncline push-ups",
          durationMinutes: 45,
          frequencyPerWeek: 4,
          specialInstructions: "Focus on form and controlled tempo.",
        };

        const updatedPayload = {
          trainingType: "Hypertrophy Split",
          fitnessGoal: "MUSCLE_GAIN",
          exercises: "Barbell squats\nBench press\nLat pulldown",
          durationMinutes: 60,
          frequencyPerWeek: 5,
          specialInstructions: "Increase load gradually each week.",
        };

        visitManageWithTokens(instructorTokens);
        cy.contains("h2", /All Clients/i).should("be.visible");

        openWorkoutModal(client);
        fillWorkoutScheduleForm(firstPayload);

        cy.get(".modal-card").within(() => {
          cy.contains("button", "Assign Schedule").click();
        });

        cy.contains("Workout schedule assigned successfully.", { timeout: 10000 }).should("be.visible");
        cy.contains(".measurement-summary-card", "Fat Burning").should("be.visible");
        cy.contains(".measurement-summary-card", "45 minutes").should("be.visible");
        cy.contains(".measurement-summary-card", "4 sessions per week").should("be.visible");

        cy.get(".modal-card").within(() => {
          cy.contains("button", "Edit Schedule").click();
        });

        fillWorkoutScheduleForm(updatedPayload);

        cy.get(".modal-card").within(() => {
          cy.contains("button", "Update Schedule").click();
        });

        cy.contains("Workout schedule updated successfully.", { timeout: 10000 }).should("be.visible");
        cy.contains(".measurement-summary-card", "Muscle Gain").should("be.visible");
        cy.contains(".measurement-summary-card", "60 minutes").should("be.visible");
        cy.contains(".measurement-summary-card", "5 sessions per week").should("be.visible");
      });
    });
  });

  it("rejects incomplete schedule submissions and missing members", () => {
    api.setupPlanAndClient().then(({ adminTokens, clientId }) => {
      seedApprovedInstructor(adminTokens).then(({ instructorTokens }) => {
        cy.request({
          method: "POST",
          url: `${api.API_BASE}/api/manage/clients/${clientId}/workout-schedule`,
          failOnStatusCode: false,
          headers: {
            Authorization: `Bearer ${instructorTokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: {
            trainingType: "",
            fitnessGoal: "",
            exercises: "",
            durationMinutes: null,
            frequencyPerWeek: null,
            specialInstructions: "",
          },
        }).then((resp) => {
          expect(resp.status).to.eq(400);
          expect(resp.body).to.eq("All required schedule details must be provided.");
        });

        cy.request({
          method: "POST",
          url: `${api.API_BASE}/api/manage/clients/999999/workout-schedule`,
          failOnStatusCode: false,
          headers: {
            Authorization: `Bearer ${instructorTokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: {
            trainingType: "Strength Foundation",
            fitnessGoal: "FAT_BURNING",
            exercises: "Squats",
            durationMinutes: 30,
            frequencyPerWeek: 3,
            specialInstructions: null,
          },
        }).then((resp) => {
          expect(resp.status).to.eq(404);
          expect(resp.body).to.eq("Client not found.");
        });
      });
    });
  });

  it("shows the assigned workout schedule to members in view-only mode and blocks edits", () => {
    api.setupPlanAndClient().then(({ adminTokens, client, clientId, clientTokens }) => {
      seedApprovedInstructor(adminTokens).then(({ instructorTokens }) => {
        const schedulePayload = {
          trainingType: "Endurance Circuit",
          fitnessGoal: "CARDIO_TRAINING",
          exercises: "Rowing machine\nBurpees\nBike intervals",
          durationMinutes: 40,
          frequencyPerWeek: 3,
          specialInstructions: "Keep heart rate in the target zone.",
        };

        cy.request({
          method: "POST",
          url: `${api.API_BASE}/api/manage/clients/${clientId}/workout-schedule`,
          failOnStatusCode: false,
          headers: {
            Authorization: `Bearer ${instructorTokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: schedulePayload,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });

        visitManageWithTokens(clientTokens);
        cy.contains("button", "Workout Schedule").click();

        cy.contains("h2", "My Workout Schedule").should("be.visible");
        cy.contains(".measurement-summary-card", "Cardio Training").should("be.visible");
        cy.contains(".measurement-summary-card", "40 minutes").should("be.visible");
        cy.contains(".measurement-summary-card", "3 sessions per week").should("be.visible");

        cy.get(".modal-card").within(() => {
          cy.get("input, textarea, select").should("have.length.greaterThan", 0).and("be.disabled");
          cy.contains("button", "Assign Schedule").should("not.exist");
          cy.contains("button", "Update Schedule").should("not.exist");
          cy.contains("button", "Edit Schedule").should("not.exist");
        });

        cy.request({
          method: "PUT",
          url: `${api.API_BASE}/api/manage/clients/${clientId}/workout-schedule`,
          failOnStatusCode: false,
          headers: {
            Authorization: `Bearer ${clientTokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: {
            trainingType: "Unauthorized Change",
            fitnessGoal: "MUSCLE_GAIN",
            exercises: "Should not save",
            durationMinutes: 99,
            frequencyPerWeek: 7,
            specialInstructions: "Attempted by member",
          },
        }).then((resp) => {
          expect(resp.status).to.eq(403);
          expect(resp.body).to.eq("Only instructors can update workout schedules.");
        });
      });
    });
  });
});