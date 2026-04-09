const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    specPattern: [
      "cypress/e2e/ui/**/*.cy.js",
      "cypress/e2e/api/**/*.cy.js",
      "cypress/e2e/full_membership_flow.cy.js",
    ],
    setupNodeEvents(on, config) {
    },
  },
  env: {
    apiUrl: "http://localhost:8080/api/membership-plans"
  }
});