/**
 * Cypress configuration for the @ghostnet/cdn service.
 *
 * Prereq:
 *   npm run cdn:dev    # or  nx run cdn:serve
 * The CDN must be reachable at CDN_BASE_URL (default http://localhost:5500)
 * before this suite runs.
 */
import path from 'node:path';

import { defineConfig } from 'cypress';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: path.resolve(__dirname, '..', '..', '.env') });

const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export default defineConfig({
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: false,
    chromeWebSecurity: false,

    env: {
      CDN_BASE_URL: env('CDN_BASE_URL', 'http://localhost:5500'),
      // Known files that public/ ships with on first install.
      KNOWN_DIRECTORY: env('CDN_KNOWN_DIR', '/icons/'),
    },
  },
});
