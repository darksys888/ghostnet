/**
 * codeowners.cy.ts — CODEOWNERS must default to the repo owner and
 * lock down the "agent-rule" files (so a malicious or careless PR
 * can't bypass the journal/attribution rules without owner approval).
 */

describe('CODEOWNERS — coverage of critical files', () => {
  let codeowners: string;

  before(() => {
    cy.task<string | null>('readRepoFile', '.github/CODEOWNERS').then((content) => {
      expect(content, '.github/CODEOWNERS must exist').to.be.a('string');
      codeowners = content!;
    });
  });

  it('has a global default rule', () => {
    expect(codeowners).to.match(/^\*\s+@/m);
  });

  it('lists @darksys888 as the default owner', () => {
    expect(codeowners).to.include('@darksys888');
  });

  it('owns AGENTS.md (the rules file itself)', () => {
    expect(codeowners).to.include('AGENTS.md');
  });

  it('owns the .github/ directory', () => {
    expect(codeowners).to.match(/\/\.github\//);
  });

  it('owns the production deploy directory', () => {
    expect(codeowners).to.match(/\/deploy\//);
  });
});
