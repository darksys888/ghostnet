/**
 * changelog.cy.ts — CHANGELOG.md must follow Keep-a-Changelog shape.
 */

describe('CHANGELOG.md — Keep-a-Changelog invariants', () => {
  let changelog: string;

  before(() => {
    cy.task<string | null>('readRepoFile', 'CHANGELOG.md').then((content) => {
      expect(content, 'CHANGELOG.md must exist').to.be.a('string');
      changelog = content!;
    });
  });

  it('starts with the # Changelog title', () => {
    expect(changelog).to.match(/^# Changelog/m);
  });

  it('has a [Unreleased] section ready for new entries', () => {
    expect(changelog).to.include('## [Unreleased]');
  });

  it('mentions Keep a Changelog as the format reference', () => {
    expect(changelog.toLowerCase()).to.include('keep a changelog');
  });

  it('uses SemVer-style version markers somewhere', () => {
    // Either an [x.y.z] label or a v-prefixed tag link.
    expect(changelog).to.match(/\[\d+\.\d+\.\d+\]|v\d+\.\d+\.\d+/);
  });

  it('points to the GitHub repo for the comparison URLs', () => {
    expect(changelog).to.include('darksys888/ghostnet');
  });
});
