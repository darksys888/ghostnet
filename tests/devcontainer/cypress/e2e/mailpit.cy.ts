/**
 * mailpit.cy.ts — end-to-end mail flow.
 * Sends an email through the Mailpit SMTP intake (port 1025) and
 * verifies that it shows up via the Mailpit REST API + web UI.
 */

interface MailpitMessage {
  ID: string;
  Subject: string;
  From: { Address: string; Name?: string };
  To: { Address: string; Name?: string }[];
}

interface MailpitListResponse {
  total: number;
  messages: MailpitMessage[];
}

describe('Mailpit SMTP catcher', () => {
  beforeEach(() => {
    // Start each test with an empty inbox.
    cy.task('pruneMailpit');
  });

  it('captures an outbound email and exposes it via the REST API', () => {
    const subject = `cypress smoke ${Date.now()}`;
    cy.task('sendTestMail', {
      to: 'inbox@example.com',
      subject,
      body: 'sent from the cypress smoke suite',
    });

    const apiUrl = `${Cypress.env('MAILPIT_URL') as string}/api/v1/messages`;
    cy.request<MailpitListResponse>(apiUrl).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.total).to.be.greaterThan(0);
      const subjects = res.body.messages.map((m) => m.Subject);
      expect(subjects).to.include(subject);
    });
  });

  it('renders the captured email in the web UI', () => {
    const subject = `web-ui visible ${Date.now()}`;
    cy.task('sendTestMail', {
      to: 'view@example.com',
      subject,
      body: 'this should be visible in the Mailpit web UI',
    });

    cy.visit(Cypress.env('MAILPIT_URL') as string);
    cy.contains(subject, { timeout: 15_000 }).should('be.visible');
  });
});
