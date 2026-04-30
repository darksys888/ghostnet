/**
 * rate-limit.cy.ts — verify rate-limit headers + behaviour.
 * The middleware emits X-RateLimit-Limit and X-RateLimit-Remaining on every
 * response. We don't try to actually trip the limit (default is 200/min,
 * making this test slow). Existence of the headers proves the layer is
 * wired in.
 */

describe('CDN — rate limiting', () => {
  it('exposes X-RateLimit-Limit on responses', () => {
    cy.cdnRequest('/').then((res) => {
      const limit = res.headers['x-ratelimit-limit'];
      expect(limit, 'X-RateLimit-Limit header').to.exist;
      expect(Number(limit)).to.be.greaterThan(0);
    });
  });

  it('exposes X-RateLimit-Remaining on responses', () => {
    cy.cdnRequest('/').then((res) => {
      const remaining = res.headers['x-ratelimit-remaining'];
      expect(remaining, 'X-RateLimit-Remaining header').to.exist;
      expect(Number(remaining)).to.be.gte(0);
    });
  });

  it('exposes X-RateLimit-Reset on responses', () => {
    cy.cdnRequest('/').then((res) => {
      const reset = res.headers['x-ratelimit-reset'];
      expect(reset, 'X-RateLimit-Reset header').to.exist;
    });
  });
});
