/**
 * path-traversal.cy.ts — escape-the-jail attempts must NEVER succeed.
 * Tries literal, encoded, double-encoded, and Windows-style traversals.
 */

describe('CDN — path traversal protection', () => {
  const payloads = [
    '/../etc/passwd',
    '/../../../../etc/passwd',
    '/..%2f..%2fetc%2fpasswd', // single-encoded
    '/..%252f..%252fetc%252fpasswd', // double-encoded
    '/icons/../../etc/passwd',
    '/icons/..%2f..%2f..%2fpackage.json',
    String.raw`/..\..\windows\system32\drivers\etc\hosts`, // Windows-style
    '/icons/../package.json',
    '//etc/passwd',
    '/%00/etc/passwd', // null byte injection
  ];

  for (const p of payloads) {
    it(`blocks ${JSON.stringify(p)}`, () => {
      cy.cdnRequest(p).then((res) => {
        // Must NOT return 200 with sensitive content.
        expect(res.status).to.not.eq(200);
        // Body must not contain telltale strings from common targets.
        const body = String(res.body ?? '');
        expect(body).to.not.match(/root:.*:0:0:/); // /etc/passwd
        expect(body).to.not.include('"name": "ghostnet"'); // root package.json
      });
    });
  }
});
