describe('Renew Expiry Calculation', () => {

  it('Expiry extends from current expiry for active member', () => {
    const currentExpiry = new Date('2026-03-30');
    const duration = 30;

    const expected = new Date(currentExpiry);
    expected.setDate(expected.getDate() + duration);

    cy.request('/api/members/1001/status').then(res => {
      const actual = new Date(res.body.expiryDate);
      expect(actual.toDateString()).to.eq(expected.toDateString());
    });
  });

});