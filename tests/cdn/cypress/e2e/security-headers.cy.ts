/**
 * security-headers.cy.ts — verify the strict header set helmet adds.
 * Helmet defaults plus our overrides:
 *   • Content-Security-Policy
 *   • X-Content-Type-Options: nosniff
 *   • X-Frame-Options: SAMEORIGIN (overridden by frame-ancestors)
 *   • Referrer-Policy: strict-origin-when-cross-origin
 *   • Strict-Transport-Security (HSTS) — set even on HTTP
 *   • Cross-Origin-Resource-Policy: cross-origin
 *   • No Server / X-Powered-By fingerprint
 */

describe('CDN — security headers', () => {
  let headers: Record<string, string>;

  before(() => {
    cy.cdnRequest('/').then((res) => {
      headers = Object.fromEntries(
        Object.entries(res.headers as Record<string, string | string[]>).map(([k, v]) => [
          k.toLowerCase(),
          Array.isArray(v) ? v.join(', ') : v,
        ]),
      );
    });
  });

  it('sets Content-Security-Policy', () => {
    expect(headers['content-security-policy']).to.exist;
    expect(headers['content-security-policy']).to.include("default-src 'self'");
    expect(headers['content-security-policy']).to.include("frame-ancestors 'none'");
    expect(headers['content-security-policy']).to.include("object-src 'none'");
  });

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(headers['x-content-type-options']).to.eq('nosniff');
  });

  it('sets a Referrer-Policy', () => {
    expect(headers['referrer-policy']).to.eq('strict-origin-when-cross-origin');
  });

  it('sets Strict-Transport-Security', () => {
    expect(headers['strict-transport-security']).to.exist;
    expect(headers['strict-transport-security']).to.include('max-age=');
  });

  it('sets Cross-Origin-Resource-Policy', () => {
    expect(headers['cross-origin-resource-policy']).to.eq('cross-origin');
  });

  it('does NOT leak the Server header', () => {
    expect(headers.server).to.be.undefined;
  });

  it('does NOT leak X-Powered-By', () => {
    expect(headers['x-powered-by']).to.be.undefined;
  });
});
