/**
 * disallowed-files.cy.ts — even if these files end up under public/,
 * the server's blocklist must hide them.
 */

describe('CDN — disallowed file blocklist', () => {
  const forbidden = [
    '/.env',
    '/.env.production',
    '/.git/HEAD',
    '/.git/config',
    '/.htaccess',
    '/.htpasswd',
    '/.DS_Store',
    '/.aws/credentials',
    '/.ssh/id_rsa',
    '/icons/.env',
    '/templates/.git/config',
    '/something.bak',
    '/page.swp',
    '/node_modules/anything.js',
  ];

  for (const p of forbidden) {
    it(`blocks ${p}`, () => {
      cy.cdnRequest(p).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  }
});
