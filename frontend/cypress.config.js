import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: [
      "../cypress/e2e/ui/**/*.cy.js",
      "../cypress/e2e/api/**/*.cy.js",
      "../cypress/e2e/full_membership_flow.cy.js",
    ],

    supportFile: "../cypress/support/e2e.js",

    setupNodeEvents(on, config) {
    },
  },
});