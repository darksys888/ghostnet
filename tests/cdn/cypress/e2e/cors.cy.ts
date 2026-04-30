/**
 * cors.cy.ts — verify the CORS layer.
 * Default config (CDN_CORS_ORIGINS=*) allows any origin for GET/HEAD.
 */

describe('CDN — CORS', () => {
  it('responds to a cross-origin GET with ACAO', () => {
    cy.cdnRequest({
      url: '/',
      method: 'GET',
      headers: { Origin: 'https://example.com' },
    }).then((res) => {
      const allowed = res.headers['access-control-allow-origin'];
      expect(allowed).to.exist;
      // Either echoes the origin or wildcards.
      expect(['*', 'https://example.com']).to.include(String(allowed));
    });
  });

  it('handles a preflight OPTIONS request', () => {
    cy.cdnRequest({
      url: '/',
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.headers['access-control-allow-methods']).to.exist;
    });
  });

  it('exposes useful response headers', () => {
    cy.cdnRequest({
      url: '/',
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    }).then((res) => {
      const exposed = String(res.headers['access-control-expose-headers'] ?? '').toLowerCase();
      // We expose Content-Length / Content-Range / ETag for byte-range + caching.
      expect(exposed).to.satisfy((s: string) => s.includes('etag') || s.includes('content-length'));
    });
  });
});
