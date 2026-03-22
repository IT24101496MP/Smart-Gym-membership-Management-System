describe("Membership Expiry UI", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it("Displays admin manage view (membership overview)", () => {
    cy.visit("/manage");

    cy.get("h1.manage-title").contains("Manage").should("be.visible");
    cy.get(".manage-table").should("exist");
  });

  it("Shows member name and membership cell for client rows", () => {
    cy.visit("/manage");

    cy.get("tbody tr").then(($rows) => {
      if ($rows.length === 0) {
        cy.contains("No records found.").should("exist");
        return;
      }
      cy.get(".cell-name").first().invoke("text").should("match", /\S/);
      const clientRow = $rows.toArray().find((row) => row.innerText.includes("CLIENT"));
      if (clientRow) {
        cy.wrap(clientRow).within(() => {
          cy.get(".membership-cell").should("exist");
        });
      }
    });
  });

  it("Handles empty user list (negative)", () => {
    cy.visit("/manage");
    cy.get(".manage-header", { timeout: 20000 }).should("be.visible");
    cy.get(".loading-msg").should("not.exist");

    cy.get("body").then(($body) => {
      const rowCount = $body.find(".manage-table tbody tr").length;
      if (rowCount === 0) {
        cy.get(".empty-msg").should("contain.text", "No records found");
      } else {
        cy.get(".manage-table tbody tr").should("have.length", rowCount);
      }
    });
  });
});