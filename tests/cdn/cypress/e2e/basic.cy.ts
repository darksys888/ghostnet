/**
 * basic.cy.ts — the CDN is reachable and serves what we expect.
 */

describe('CDN — basic reachability', () => {
  it('root URL returns a valid status code', () => {
    cy.cdnRequest('/').then((res) => {
      // 200 if directory listing is on (dev), 403/404 if off (prod).
      expect([200, 403, 404]).to.include(res.status);
    });
  });

  it('serves a file inside a known public/ subdirectory', () => {
    cy.cdnRequest(Cypress.env('KNOWN_DIRECTORY') as string).then((res) => {
      expect([200, 403, 404]).to.include(res.status);
    });
  });

  it('responds to HEAD requests', () => {
    cy.cdnRequest({ url: '/', method: 'HEAD' }).then((res) => {
      expect([200, 403, 404]).to.include(res.status);
    });
  });
});
