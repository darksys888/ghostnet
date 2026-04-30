// Custom Cypress commands for the Retro suite.

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Open the Nitro client with the configured SSO ticket and wait for
       * the loader iframe / canvas / login prompt to appear.
       */
      visitNitro(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('visitNitro', () => {
  const url = `${Cypress.env('NITRO_URL') as string}?sso=${Cypress.env('NITRO_SSO') as string}`;
  cy.visit(url);
});

export {};
