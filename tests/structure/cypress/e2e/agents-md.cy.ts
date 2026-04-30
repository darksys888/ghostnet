/**
 * agents-md.cy.ts — AGENTS.md must contain the hard rules.
 *
 * Guards against accidental deletion or watering-down of:
 *   1. The commit-attribution rule
 *   2. The session-journaling rule (CHANGELOG + AUDIT)
 */

describe('AGENTS.md — hard rules are present', () => {
  let agents: string;

  before(() => {
    cy.task<string | null>('readRepoFile', 'AGENTS.md').then((content) => {
      expect(content, 'AGENTS.md must exist').to.be.a('string');
      agents = content!;
    });
  });

  it('forbids Co-Authored-By Claude trailers', () => {
    expect(agents).to.match(/Co-Authored-By/);
    expect(agents).to.match(/MUST NOT/i);
    expect(agents).to.match(/Claude/);
  });

  it('forbids "Generated with…" footers', () => {
    expect(agents.toLowerCase()).to.include('generated with');
  });

  it('mandates use of git config user.name / user.email', () => {
    expect(agents).to.match(/user\.name/);
    expect(agents).to.match(/user\.email/);
  });

  it('declares the rule supersedes default agent boilerplate', () => {
    expect(agents.toLowerCase()).to.include('supersedes');
  });

  it('mandates updating CHANGELOG.md on meaningful changes', () => {
    expect(agents).to.match(/CHANGELOG\.md/);
    expect(agents.toLowerCase()).to.include('unreleased');
  });

  it('mandates updating AUDIT.md on meaningful changes', () => {
    expect(agents).to.match(/AUDIT\.md/);
  });

  it('lists exclusions where journals can be skipped', () => {
    expect(agents.toLowerCase()).to.include('typo');
    expect(agents.toLowerCase()).to.match(/lockfile|format/);
  });
});
