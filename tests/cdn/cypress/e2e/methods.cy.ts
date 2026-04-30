/**
 * methods.cy.ts — only GET / HEAD / OPTIONS are accepted.
 * Anything else returns 405 with an Allow header.
 */

describe('CDN — HTTP method guard', () => {
  const methodsThatShouldFail = ['POST', 'PUT', 'DELETE', 'PATCH'] as const;

  for (const method of methodsThatShouldFail) {
    it(`${method} returns 405`, () => {
      cy.cdnRequest({ url: '/', method }).then((res) => {
        expect(res.status).to.eq(405);
      });
    });
  }

  it('GET succeeds', () => {
    cy.cdnRequest({ url: '/', method: 'GET' }).then((res) => {
      expect([200, 403, 404]).to.include(res.status);
      expect(res.status).to.not.eq(405);
    });
  });

  it('HEAD succeeds', () => {
    cy.cdnRequest({ url: '/', method: 'HEAD' }).then((res) => {
      expect(res.status).to.not.eq(405);
    });
  });

  it('OPTIONS succeeds (CORS preflight)', () => {
    // OPTIONS is meaningful only as a CORS preflight — must include the
    // request headers a browser would send.
    cy.cdnRequest({
      url: '/',
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
    });
  });
});
