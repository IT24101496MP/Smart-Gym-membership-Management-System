const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
    },
  },
  env: {
    apiUrl: "http://localhost:8080/api/membership-plans"
  }
});