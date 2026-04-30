/**
 * file-presence.cy.ts — files that MUST exist for the workflow to make
 * sense at all. Catches accidental deletions in PRs.
 */

const REQUIRED_FILES: string[] = [
  // Root governance
  'AGENTS.md',
  'CLAUDE.md',
  'CHANGELOG.md',
  'AUDIT.md',
  'README.md',

  // Tooling
  'package.json',
  'package.json.md',
  'nx.json',
  'nx.json.md',
  'project.json',
  'tsconfig.base.json',
  'eslint.config.mjs',
  '.prettierrc.cjs',
  '.prettierignore',
  '.editorconfig',
  '.gitignore',
  '.gitattributes',
  '.dockerignore',
  'Dockerfile',
  'Makefile',

  // GitHub
  '.github/workflows/ci.yml',
  '.github/CODEOWNERS',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/dependabot.yml',
  '.github/SECURITY.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md',

  // Stack docs
  '.devcontainer/connect.txt',
  'dev/retro/connect.txt',
  'deploy/retro/connect.txt',
  'dev/caddy/connect.txt',

  // Scripts
  'scripts/retro-release.sh',
  'scripts/cdn-push.sh',
  'scripts/hosts.sh',
  'scripts/hosts.ps1',

  // Public CDN entrypoint
  'services/cdn/src/index.ts',
  'services/cdn/src/server.ts',
  'public/.gitignore',
];

describe('repo file presence', () => {
  REQUIRED_FILES.forEach((p) => {
    it(`${p} exists`, () => {
      cy.task<boolean>('repoFileExists', p).then((exists) => {
        expect(exists, `${p} must exist`).to.eq(true);
      });
    });
  });
});
