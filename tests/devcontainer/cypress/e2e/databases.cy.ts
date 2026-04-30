/**
 * databases.cy.ts — connectivity smoke tests for non-HTTP services.
 * Cypress runs in the browser, so we delegate the actual TCP connection
 * to Node-side `cy.task(...)` handlers defined in cypress.config.ts.
 */

describe('database connectivity (via cy.task)', () => {
  it('PostgreSQL responds to SELECT 1', () => {
    cy.task<number>('pgPing').should('eq', 1);
  });

  it('MySQL (Retro) responds to SELECT 1', () => {
    cy.task<number>('mysqlPing').should('eq', 1);
  });

  it('Redis responds to PING with PONG', () => {
    cy.task<string>('redisPing').should('eq', 'PONG');
  });
});
