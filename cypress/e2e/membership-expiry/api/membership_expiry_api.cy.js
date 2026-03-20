describe('Membership Expiry API Tests (Admin)', () => {
  let authToken = '';

  before(() => {
    cy.request('POST', 'http://localhost:8080/api/auth/login', {
      identifier: 'admin@fat2fit.lk',
      password: 'Admin@1234'
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.accessToken;
    });
  });

  beforeEach(function () {
    cy.fixture('membershipExpiry.json').as('members');
  });

  it('Active member should have status Active', function () {
    const member = this.members.activeMember;
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/members/${member.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.membershipStatus).to.eq('Active');
      expect(new Date(res.body.expiryDate)).to.be.greaterThan(new Date());
    });
  });

  it('Expired member should have status Expired', function () {
    const member = this.members.expiredMember;
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/members/${member.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.membershipStatus).to.eq('Expired');
      expect(new Date(res.body.expiryDate)).to.be.lessThan(new Date());
    });
  });

  it('Invalid member returns 404', function () {
    const member = this.members.invalidMember;
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/members/${member.id}/status`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(404);
      expect(res.body).to.eq('Member not found.');
    });
  });
});