/**
 * pgadmin.cy.ts — functional login flow.
 * pgAdmin 4 is a heavy React SPA, so we use generous timeouts and
 * resilient selectors.
 */

describe('pgAdmin 4', () => {
  it('logs in successfully and shows the main dashboard', () => {
    cy.visit(Cypress.env('PGADMIN_URL') as string);

    // The login form may take a moment to render after the SPA bootstraps.
    cy.get('input#email, input[name="email"]', { timeout: 20_000 })
      .should('be.visible')
      .clear()
      .type(Cypress.env('PGADMIN_EMAIL') as string);

    cy.get('input#password, input[name="password"]')
      .clear()
      .type(Cypress.env('PGADMIN_PASSWORD') as string, { log: false });

    cy.get('button[type="submit"], input[type="submit"]').first().click();

    // Post-login, pgAdmin renders the main shell. Look for any of the
    // common landmarks — text varies slightly between versions.
    cy.contains(/(dashboard|servers|browse|object explorer)/i, {
      timeout: 30_000,
    }).should('be.visible');
  });

  it('shows the pre-registered GHOSTNET server in the sidebar', () => {
    cy.visit(Cypress.env('PGADMIN_URL') as string);
    cy.get('input#email, input[name="email"]', { timeout: 20_000 })
      .clear()
      .type(Cypress.env('PGADMIN_EMAIL') as string);
    cy.get('input#password, input[name="password"]')
      .clear()
      .type(Cypress.env('PGADMIN_PASSWORD') as string, { log: false });
    cy.get('button[type="submit"], input[type="submit"]').first().click();

    // The connection name from servers.json — should appear in the left tree.
    cy.contains('GHOSTNET (dev)', { timeout: 30_000 }).should('be.visible');
  });
});
