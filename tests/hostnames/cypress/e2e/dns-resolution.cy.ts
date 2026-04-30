/**
 * dns-resolution.cy.ts — verifies that every hostname declared in
 * dev/caddy/hosts.local resolves to 127.0.0.1 via the OS resolver.
 *
 * Will FAIL if `npm run hosts:install` hasn't been run on the machine.
 */

const HOSTNAMES = [
  'cdn.ghostnetw.test',
  'retro.ghostnetw.test',
  'assets.ghostnetw.test',
  'swf.ghostnetw.test',
  'arcturus.ghostnetw.test',
  'db.ghostnetw.test',
  'pgadmin.ghostnetw.test',
  'mail.ghostnetw.test',
  's3-console.ghostnetw.test',
  's3.ghostnetw.test',
] as const;

describe('hosts file — every dev hostname resolves to 127.0.0.1', () => {
  HOSTNAMES.forEach((host) => {
    it(`${host} → 127.0.0.1`, () => {
      cy.task<string | null>('resolveHost', host).then((addr) => {
        expect(addr, `${host} should resolve via /etc/hosts`).to.not.be.null;
        expect(addr).to.eq('127.0.0.1');
      });
    });
  });
});
