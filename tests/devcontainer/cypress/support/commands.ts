/**
 * Custom Cypress commands shared across the .devcontainer suites.
 * Add new commands here via `Cypress.Commands.add(...)`.
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Sign in to phpMyAdmin with the given credentials.
       * Leaves the browser on the post-login dashboard page.
       */
      loginPhpMyAdmin(user: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginPhpMyAdmin', (user: string, password: string) => {
  cy.visit(Cypress.env('PHPMYADMIN_URL') as string);
  cy.get('input[name="pma_username"]').clear().type(user);
  cy.get('input[name="pma_password"]').clear().type(password, { log: false });
  cy.get('input[name="pma_username"]').closest('form').submit();
});

export {};
