describe("Login Render Debug", () => {
  const FRONTEND = "http://localhost:5173";

  function visitWithCapture() {
    cy.visit(`${FRONTEND}/login`, {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        win.__cypressConsoleErrors = [];
        const origError = win.console.error;
        win.console.error = (...args) => {
          win.__cypressConsoleErrors.push(args.map(String).join(" "));
          origError.apply(win.console, args);
        };
        win.__cypressRejections = [];
        win.addEventListener("unhandledrejection", (e) => {
          win.__cypressRejections.push(String(e.reason || e));
        });
        win.__cypressWindowErrors = [];
        win.addEventListener("error", (e) => {
          win.__cypressWindowErrors.push(String(e.message || e.error || e));
        });
      }
    });

    cy.wait(1500);
  }

  it("Should stay on /login", () => {
    visitWithCapture();
    cy.location("pathname", { timeout: 20000 }).should("eq", "/login");
  });

  it("Should render something", () => {
    visitWithCapture();

    cy.document().then((doc) => {
      const bodyText = (doc.body?.innerText || "").trim();
      const htmlLen = (doc.documentElement?.outerHTML || "").length;

      const overlayEl = doc.querySelector("vite-error-overlay");
      const overlayText = overlayEl ? (overlayEl.textContent || "").trim() : "";

      cy.log(`HTML length: ${htmlLen}`);
      cy.log(`Body text length: ${bodyText.length}`);

      if (overlayText) {
        throw new Error(
          "Vite error overlay detected on /login. Overlay text:\n" +
            overlayText.slice(0, 1200)
        );
      }

      // If body is still blank, fail clearly
      if (!bodyText) {
        throw new Error(
          "Body is blank on /login in Cypress."
        );
      }
    });
  });

  it("Should have login form elements OR report captured console errors", () => {
    visitWithCapture();

    cy.window().then((win) => {
      const errs = win.__cypressConsoleErrors || [];
      const rej = win.__cypressRejections || [];
      const winErrs = win.__cypressWindowErrors || [];

      if (errs.length || rej.length || winErrs.length) {
        cy.log("Captured errors (showing first few):");
        errs.slice(0, 5).forEach((e) => cy.log(`console.error: ${e}`));
        rej.slice(0, 5).forEach((e) => cy.log(`unhandledrejection: ${e}`));
        winErrs.slice(0, 5).forEach((e) => cy.log(`window.error: ${e}`));

        throw new Error("Errors detected while loading /login");
      }
    });

    cy.get('input[name="identifier"]', { timeout: 20000 }).should("exist");
    cy.get('input[name="password"]', { timeout: 20000 }).should("exist");
    cy.get('button[type="submit"]', { timeout: 20000 }).should("exist");
  });
});
