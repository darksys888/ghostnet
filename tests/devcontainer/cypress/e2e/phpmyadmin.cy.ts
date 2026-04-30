/**
 * phpmyadmin.cy.ts — functional login flow.
 * Verifies that phpMyAdmin can authenticate against the MySQL service
 * and that the `retro` database is visible in the navigation tree.
 */

describe('phpMyAdmin', () => {
  it('logs in as the retro user and shows the retro database', () => {
    cy.visit(Cypress.env('PHPMYADMIN_URL') as string);

    // Log in. phpMyAdmin's selectors are stable across recent versions.
    cy.get('input[name="pma_username"]').clear().type('retro');
    cy.get('input[name="pma_password"]').clear().type('retro', { log: false });
    cy.get('input[name="pma_username"]').closest('form').submit();

    // After login, the home page lists databases in the left navigation.
    // We don't assert exact markup — `retro` appearing somewhere is enough.
    cy.contains('retro', { timeout: 15_000 }).should('be.visible');
  });

  it('rejects an invalid password', () => {
    cy.visit(Cypress.env('PHPMYADMIN_URL') as string);
    cy.get('input[name="pma_username"]').clear().type('retro');
    cy.get('input[name="pma_password"]')
      .clear()
      .type('definitely-not-the-password', { log: false });
    cy.get('input[name="pma_username"]').closest('form').submit();
    // phpMyAdmin re-renders the login form with an error class — assert the
    // field is still present (i.e. we did NOT navigate to the dashboard).
    cy.get('input[name="pma_username"]', { timeout: 10_000 }).should('exist');
  });

  it('retro user can ALSO see the arcturus database (dual-DB grants)', () => {
    // We grant retro@% access to both `retro` AND `arcturus` in
    // .devcontainer/mysql-init/01-bootstrap-arcturus.sh — verify the side
    // effect is visible in the phpMyAdmin sidebar.
    cy.visit(Cypress.env('PHPMYADMIN_URL') as string);
    cy.get('input[name="pma_username"]').clear().type('retro');
    cy.get('input[name="pma_password"]').clear().type('retro', { log: false });
    cy.get('input[name="pma_username"]').closest('form').submit();
    cy.contains('arcturus', { timeout: 15_000 }).should('be.visible');
  });
});
