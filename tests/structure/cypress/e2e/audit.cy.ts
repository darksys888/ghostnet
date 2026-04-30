/**
 * audit.cy.ts — AUDIT.md must keep its session-journal shape.
 *
 * The "Resume here" block is the most important invariant: future
 * agents read it first to rebuild context.
 */

describe('AUDIT.md — session-journal invariants', () => {
  let audit: string;

  before(() => {
    cy.task<string | null>('readRepoFile', 'AUDIT.md').then((content) => {
      expect(content, 'AUDIT.md must exist').to.be.a('string');
      audit = content!;
    });
  });

  it('has a "Resume here" block at the top', () => {
    // The block uses a 🎯 marker — the structure depends on it being
    // findable from a fresh agent session.
    expect(audit).to.include('🎯 Resume here');
  });

  it('records when it was last touched', () => {
    expect(audit.toLowerCase()).to.include('last touched');
  });

  it('has a Session log heading', () => {
    expect(audit).to.match(/^##\s+Session log\b/m);
  });

  it('has at least one dated session entry', () => {
    // Format: ### YYYY-MM-DD · subject
    expect(audit).to.match(/###\s+\d{4}-\d{2}-\d{2}\s+·/);
  });

  it('uses the Status / Done / Open / Next time fields', () => {
    expect(audit).to.include('**Status**:');
    expect(audit).to.include('**Done**:');
    expect(audit).to.include('**Open**:');
    expect(audit).to.include('**Next time**:');
  });

  it('has a TODO carry-over section for parked work', () => {
    expect(audit.toLowerCase()).to.include('todo carry-over');
  });
});
