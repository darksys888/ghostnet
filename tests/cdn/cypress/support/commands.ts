// Custom commands for the CDN security suite.
declare global {
  namespace Cypress {
    interface Chainable {
      /** Make a request to the CDN base URL with the given path appended. */
      cdnRequest(
        pathOrOptions: string | Partial<Cypress.RequestOptions>,
      ): Chainable<Cypress.Response<unknown>>;
    }
  }
}

Cypress.Commands.add('cdnRequest', (pathOrOptions: string | Partial<Cypress.RequestOptions>) => {
  const base = Cypress.env('CDN_BASE_URL') as string;
  const opts: Partial<Cypress.RequestOptions> =
    typeof pathOrOptions === 'string'
      ? { url: `${base}${pathOrOptions}`, failOnStatusCode: false }
      : { failOnStatusCode: false, ...pathOrOptions, url: `${base}${pathOrOptions.url ?? ''}` };
  return cy.request(opts);
});

export {};
