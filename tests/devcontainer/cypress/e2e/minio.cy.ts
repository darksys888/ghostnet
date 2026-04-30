/**
 * minio.cy.ts — MinIO S3 + console smoke tests.
 * The S3 API uses signed requests so we don't fully exercise it from
 * Cypress; we just verify the health endpoints + that the console
 * login screen renders.
 */

describe('MinIO', () => {
  it('S3 live health endpoint returns 200', () => {
    const url = `${Cypress.env('MINIO_S3_URL') as string}/minio/health/live`;
    cy.request(url).its('status').should('eq', 200);
  });

  it('S3 ready health endpoint returns 200', () => {
    const url = `${Cypress.env('MINIO_S3_URL') as string}/minio/health/ready`;
    cy.request(url).its('status').should('eq', 200);
  });

  it('console login page exposes the credential fields', () => {
    cy.visit(Cypress.env('MINIO_CONSOLE_URL') as string);
    // MinIO's console login form has labelled inputs; selectors vary by
    // release, so we accept either the explicit name= or id= attribute.
    cy.get('input[name="accessKey"], input#accessKey, input[placeholder*="access" i]', {
      timeout: 15_000,
    }).should('exist');
    cy.get('input[name="secretKey"], input#secretKey, input[type="password"]', {
      timeout: 15_000,
    }).should('exist');
  });
});
