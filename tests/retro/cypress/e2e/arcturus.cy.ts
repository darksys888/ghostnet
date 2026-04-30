/**
 * arcturus.cy.ts — emulator socket + camera webserver smoke tests.
 * Cypress runs in the browser, so the TCP probe is delegated to a
 * Node-side `cy.task('tcpProbe')` defined in cypress.config.ts.
 */

describe('Arcturus emulator', () => {
  it('game socket TCP port is open', () => {
    cy.task<boolean>('tcpProbe', {
      host: Cypress.env('ARCTURUS_GAME_HOST') as string,
      port: Number(Cypress.env('ARCTURUS_GAME_PORT')),
    }).should('eq', true);
  });

  it('camera webserver responds on its HTTP port', () => {
    // The Arcturus webserver may return 404 for `/`; accept anything <500
    // (a connection-level failure / 5xx would indicate the JVM is down).
    cy.request({
      url: Cypress.env('ARCTURUS_CAMERA_URL') as string,
      failOnStatusCode: false,
    })
      .its('status')
      .should('be.lt', 500);
  });
});
