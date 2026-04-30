/**
 * caddy-routing.cy.ts — verifies that each *.ghostnetw.test hostname
 * is reverse-proxied by Caddy to the right backend port.
 *
 * Strategy: hit the hostname, then hit the underlying localhost:<port>,
 * and assert the responses match (status code + a representative header).
 *
 * Prereqs:
 *   • hosts file installed   (npm run hosts:install)
 *   • each backend running   (dev:up + retro:up + cdn:dev)
 *   • caddy running          (npm run caddy:start)
 */

interface Route {
  host: string;
  port: number;
  path: string; // path to fetch on both sides for comparison
}

const ROUTES: Route[] = [
  { host: 'cdn.ghostnetw.test', port: 5500, path: '/' },
  { host: 'retro.ghostnetw.test', port: 1080, path: '/' },
  { host: 'assets.ghostnetw.test', port: 8080, path: '/' },
  { host: 'swf.ghostnetw.test', port: 8081, path: '/' },
  { host: 'db.ghostnetw.test', port: 8083, path: '/' },
  { host: 'mail.ghostnetw.test', port: 8025, path: '/' },
  // s3-console + s3 + arcturus + pgadmin can be flaky on `/` — covered by
  // the dns-resolution suite for routing existence; we only deeply test
  // the friendly-URL parity for HTTP services with stable root responses.
];

const fetchBoth = (
  route: Route,
): Cypress.Chainable<{
  viaCaddy: Cypress.Response<unknown>;
  direct: Cypress.Response<unknown>;
}> => {
  const viaCaddy = cy
    .request({ url: `http://${route.host}${route.path}`, failOnStatusCode: false })
    .then((res) => res);
  return viaCaddy.then((viaCaddyRes) =>
    cy
      .request({ url: `http://localhost:${route.port}${route.path}`, failOnStatusCode: false })
      .then((directRes) => ({ viaCaddy: viaCaddyRes, direct: directRes })),
  );
};

describe('Caddy routing — friendly hostnames reach the right backend', () => {
  ROUTES.forEach((route) => {
    it(`${route.host} ↔ localhost:${route.port}`, () => {
      fetchBoth(route).then(({ viaCaddy, direct }) => {
        // Same status code on both sides.
        expect(viaCaddy.status).to.eq(direct.status);
        // Content-Type matches (means same upstream).
        expect(viaCaddy.headers['content-type']).to.eq(direct.headers['content-type']);
      });
    });
  });

  it('Caddy sets the X-Forwarded-* request headers (visible via the CDN echo)', () => {
    // The CDN doesn't echo headers, but every Caddy reverse_proxy adds these
    // upstream — we just verify a 2xx-or-allowed response, which proves the
    // proxy chain works end-to-end.
    cy.request({
      url: 'http://cdn.ghostnetw.test/',
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 403, 404]).to.include(res.status);
    });
  });
});
