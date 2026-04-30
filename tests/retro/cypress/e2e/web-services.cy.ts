/**
 * web-services.cy.ts — HTTP smoke for the Retro stack's web tier.
 * Verifies that Nitro, the asset server, and the SWF server are reachable
 * and serving the expected content.
 */

describe('Retro web services', () => {
  it('Nitro client root returns 200', () => {
    cy.request(Cypress.env('NITRO_URL') as string)
      .its('status')
      .should('eq', 200);
  });

  it('Nitro client with SSO ticket loads', () => {
    const url = `${Cypress.env('NITRO_URL') as string}?sso=${Cypress.env('NITRO_SSO') as string}`;
    cy.request(url).its('status').should('eq', 200);
  });

  it('asset server responds with directory listing', () => {
    cy.request(Cypress.env('ASSETS_URL') as string)
      .its('status')
      .should('eq', 200);
  });

  it('asset server serves a known .nitro bundle', () => {
    const url = `${Cypress.env('ASSETS_URL') as string}/bundled/figure/acc_chest_U_fruitbag.nitro`;
    cy.request(url).then((res) => {
      expect(res.status).to.eq(200);
      // .nitro files are zipped binary blobs — should be at least 1 KB.
      expect(Number(res.headers['content-length'])).to.be.greaterThan(1000);
    });
  });

  it('asset server serves figuredata.json (gamedata)', () => {
    const url = `${Cypress.env('ASSETS_URL') as string}/gamedata/figuredata.json`;
    cy.request(url).then((res) => {
      expect(res.status).to.eq(200);
      // figuredata is the avatar palette/parts JSON — typically > 100 KB.
      expect(Number(res.headers['content-length'])).to.be.greaterThan(100_000);
    });
  });

  it('asset server is CORS-permissive', () => {
    const url = `${Cypress.env('ASSETS_URL') as string}/bundled/figure/acc_chest_U_fruitbag.nitro`;
    cy.request(url).then((res) => {
      expect(res.headers['access-control-allow-origin']).to.eq('*');
    });
  });

  it('SWF server returns directory listing', () => {
    cy.request(Cypress.env('SWF_URL') as string)
      .its('status')
      .should('eq', 200);
  });

  it('SWF server has the gordon SWF tree', () => {
    const url = `${Cypress.env('SWF_URL') as string}/gordon/PRODUCTION/`;
    cy.request(url).its('status').should('eq', 200);
  });
});
