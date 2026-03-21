describe('Expiry Calculation Tests', () => {

  it('Expiry date should be correctly calculated', () => {

    const startDate = new Date();
    const duration = 30;

    const expectedExpiry = new Date();
    expectedExpiry.setDate(startDate.getDate() + duration);

    cy.request('/api/members/1001/status').then((res) => {
      const actualExpiry = new Date(res.body.expiryDate);

      expect(actualExpiry.toDateString()).to.eq(expectedExpiry.toDateString());
    });
  });

});