/**
 * web-uis.cy.ts — HTTP smoke tests.
 * Verifies that every web UI exposed by the .devcontainer is reachable
 * and serves something resembling its expected entry page.
 */

describe('dev-container web UIs (HTTP smoke)', () => {
  it('phpMyAdmin login page loads', () => {
    const url = Cypress.env('PHPMYADMIN_URL') as string;
    cy.request(url).its('status').should('eq', 200);
    cy.visit(url);
    cy.get('input[name="pma_username"]').should('exist');
    cy.get('input[name="pma_password"]').should('exist');
  });

  it('pgAdmin 4 login page loads', () => {
    const url = Cypress.env('PGADMIN_URL') as string;
    cy.request({ url, followRedirect: true }).its('status').should('eq', 200);
    cy.visit(url);
    // pgAdmin's React shell renders the email field with id="email".
    cy.get('input#email, input[name="email"]', { timeout: 15_000 }).should('exist');
  });

  it('Mailpit web UI loads', () => {
    const url = Cypress.env('MAILPIT_URL') as string;
    cy.request(url).its('status').should('eq', 200);
    cy.visit(url);
    // The header bar and brand text are reliable markers regardless of theme.
    cy.contains(/mailpit/i, { timeout: 10_000 });
  });

  it('Mailpit API responds', () => {
    const apiUrl = `${Cypress.env('MAILPIT_URL') as string}/api/v1/info`;
    cy.request(apiUrl).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('Version');
    });
  });

  it('MinIO console login page loads', () => {
    const url = Cypress.env('MINIO_CONSOLE_URL') as string;
    cy.request({ url, followRedirect: true, failOnStatusCode: false })
      .its('status')
      .should('be.lt', 500);
    cy.visit(url);
    cy.get('input', { timeout: 15_000 }).should('exist');
  });

  it('MinIO S3 health endpoint returns 200', () => {
    const url = `${Cypress.env('MINIO_S3_URL') as string}/minio/health/live`;
    cy.request(url).its('status').should('eq', 200);
  });
});
