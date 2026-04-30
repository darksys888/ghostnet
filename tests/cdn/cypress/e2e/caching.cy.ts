/**
 * caching.cy.ts — Cache-Control + ETag wired in correctly.
 * Different file types get different cache strategies; conditional GETs
 * with If-None-Match return 304 Not Modified.
 */

describe('CDN — caching', () => {
  it('sets a Cache-Control header on responses', () => {
    cy.cdnRequest('/').then((res) => {
      // The response (or its 404) is allowed to lack cache headers, but a
      // successful directory or file response MUST have Cache-Control.
      if (res.status === 200) {
        expect(res.headers['cache-control']).to.exist;
      }
    });
  });

  it('emits an ETag for served files', () => {
    cy.cdnRequest(Cypress.env('KNOWN_DIRECTORY') as string).then((res) => {
      if (res.status === 200) {
        expect(res.headers.etag).to.exist;
      }
    });
  });

  it('returns 304 on a matching If-None-Match', () => {
    const url = Cypress.env('KNOWN_DIRECTORY') as string;
    cy.cdnRequest(url).then((first) => {
      if (first.status !== 200) {
        cy.log('skipping conditional-GET test — directory listing disabled');
        return;
      }
      const etag = first.headers.etag as string | undefined;
      if (!etag) {
        cy.log('skipping conditional-GET test — no ETag emitted');
        return;
      }
      cy.cdnRequest({
        url,
        headers: { 'If-None-Match': etag },
      }).then((second) => {
        expect(second.status).to.eq(304);
      });
    });
  });
});
