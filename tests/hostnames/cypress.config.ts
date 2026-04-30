/**
 * Cypress configuration for the hosts + Caddy verification suite.
 *
 * Prereqs:
 *   1. npm run hosts:install      ← /etc/hosts entries deployed
 *   2. npm run dev:up && retro:up ← backends Caddy proxies to
 *   3. npm run cdn:dev            ← public CDN
 *   4. npm run caddy:start        ← reverse proxy
 *
 * The suite hits each *.ghostnetw.test hostname and verifies that the
 * response originated from the expected backend (matches a direct
 * localhost:<port> hit).
 */
import os from 'node:os';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: false,
    chromeWebSecurity: false,

    setupNodeEvents(on) {
      on('task', {
        // Resolve a hostname via the OS resolver — confirms /etc/hosts
        // injection actually happened. Returns null on resolution failure.
        async resolveHost(host: string): Promise<string | null> {
          const dns = await import('node:dns/promises');
          try {
            const result = await dns.lookup(host, { family: 4 });
            return result.address;
          } catch {
            return null;
          }
        },

        // Surface platform info so specs can adapt (e.g. Windows hosts file
        // path differs).
        platform(): { type: string; release: string } {
          return { type: os.type(), release: os.release() };
        },
      });
    },
  },
});
