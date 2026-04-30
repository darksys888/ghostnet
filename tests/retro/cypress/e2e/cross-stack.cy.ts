/**
 * cross-stack.cy.ts — the .devcontainer MariaDB hosts the arcturus DB,
 * so phpMyAdmin (in .devcontainer) should be able to browse it.
 * This proves the wiring between dev/retro and .devcontainer.
 */

describe('cross-stack: phpMyAdmin can browse the arcturus DB', () => {
  it('phpMyAdmin login page is reachable', () => {
    cy.request(Cypress.env('PHPMYADMIN_URL') as string)
      .its('status')
      .should('eq', 200);
  });

  it('logs in as arcturus_user and lands on the arcturus DB', () => {
    cy.visit(Cypress.env('PHPMYADMIN_URL') as string);

    cy.get('input[name="pma_username"]')
      .clear()
      .type(Cypress.env('ARCTURUS_DB_USER') as string);
    cy.get('input[name="pma_password"]')
      .clear()
      .type(Cypress.env('ARCTURUS_DB_PASSWORD') as string, { log: false });
    cy.get('input[name="pma_username"]').closest('form').submit();

    // Once logged in, phpMyAdmin renders the DB list in the left navigation.
    // The arcturus user only sees `arcturus` (+ information_schema in some
    // versions) — assert the database name appears.
    cy.contains('arcturus', { timeout: 15_000 }).should('be.visible');
  });

  it('logs in as root and sees both retro + arcturus DBs', () => {
    cy.visit(Cypress.env('PHPMYADMIN_URL') as string);

    cy.get('input[name="pma_username"]').clear().type('root');
    cy.get('input[name="pma_password"]').clear().type('root', { log: false });
    cy.get('input[name="pma_username"]').closest('form').submit();

    // Root sees every DB. We only check the two we care about.
    cy.contains('arcturus', { timeout: 15_000 }).should('be.visible');
    cy.contains('retro', { timeout: 15_000 }).should('be.visible');
  });
});
