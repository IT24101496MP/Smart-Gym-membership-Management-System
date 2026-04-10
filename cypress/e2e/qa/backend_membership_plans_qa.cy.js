describe("QA Backend: Membership Plans Active API", () => {
  const apiBase = "http://localhost:8080";

  it("returns active membership plans without authentication", () => {
    cy.request({
      method: "GET",
      url: `${apiBase}/api/membership-plans/active`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an("array");
    });
  });

  it("returns records with pricing fields and non-negative amounts", () => {
    cy.request({
      method: "GET",
      url: `${apiBase}/api/membership-plans/active`,
    }).then((response) => {
      const plans = response.body;
      expect(plans).to.be.an("array");

      plans.forEach((plan) => {
        expect(plan).to.have.property("planName");
        expect(plan).to.have.property("durationDays");
        expect(plan).to.have.property("monthlyPrice");
        expect(plan).to.have.property("admissionFee");

        if (plan.monthlyPrice != null) {
          expect(Number(plan.monthlyPrice)).to.be.at.least(0);
        }

        if (plan.admissionFee != null) {
          expect(Number(plan.admissionFee)).to.be.at.least(0);
        }
      });
    });
  });

  it("returns plans sorted by duration, monthly price, and id", () => {
    cy.request({
      method: "GET",
      url: `${apiBase}/api/membership-plans/active`,
    }).then((response) => {
      const plans = response.body;
      expect(plans).to.be.an("array");

      const idsFromResponse = plans.map((p) => p.id);
      const idsFromSortedCopy = [...plans]
        .sort((a, b) => {
          const durationCompare = Number(a.durationDays) - Number(b.durationDays);
          if (durationCompare !== 0) return durationCompare;

          const priceCompare = Number(a.monthlyPrice) - Number(b.monthlyPrice);
          if (priceCompare !== 0) return priceCompare;

          return Number(a.id) - Number(b.id);
        })
        .map((p) => p.id);

      expect(idsFromResponse).to.deep.equal(idsFromSortedCopy);
    });
  });
});
