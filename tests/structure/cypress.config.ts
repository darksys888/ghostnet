/**
 * Cypress configuration for the structure-invariant suite.
 *
 * No HTTP backend needed — the specs read repo files via Node tasks
 * (cy.task) and assert their shape. Runs anywhere `npm install` works.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'cypress';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

export default defineConfig({
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: false,
    chromeWebSecurity: false,

    env: {
      REPO_ROOT,
    },

    setupNodeEvents(on) {
      on('task', {
        // Read a file relative to the repo root and return its contents.
        // `relativePath` comes from test code, not user input; joining it
        // under REPO_ROOT scopes any traversal to this repo.
        readRepoFile(relativePath: string): string | null {
          try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            return readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
          } catch {
            return null;
          }
        },

        // Test whether a file/dir exists relative to the repo root.
        async repoFileExists(relativePath: string): Promise<boolean> {
          const fs = await import('node:fs/promises');
          try {
            await fs.access(path.join(REPO_ROOT, relativePath));
            return true;
          } catch {
            return false;
          }
        },
      });
    },
  },
});
