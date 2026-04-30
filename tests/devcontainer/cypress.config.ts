/**
 * Cypress configuration for the .devcontainer smoke + functional tests.
 *
 * Most service URLs are read from the root `.env` so the same suite can
 * run from the host machine OR inside the dev container — only the
 * .env hostnames change.
 */
import path from 'node:path';

import { defineConfig } from 'cypress';
import { config as loadDotenv } from 'dotenv';
import Redis from 'ioredis';
import { createConnection as createMysqlConnection, type RowDataPacket } from 'mysql2/promise';
import { createTransport } from 'nodemailer';
import pg from 'pg';

// Load the workspace-root .env BEFORE we define defaults below.
loadDotenv({ path: path.resolve(__dirname, '..', '..', '.env') });

// Helper: env-var-with-fallback.
const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export default defineConfig({
  // No global baseUrl — each test names its target URL explicitly via Cypress.env(...).
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: false,
    // Allow visiting more than one origin in a single suite (phpMyAdmin → pgAdmin → …).
    chromeWebSecurity: false,

    // Surface .env values to spec files via Cypress.env('FOO').
    env: {
      PHPMYADMIN_URL: env('PHPMYADMIN_URL', 'http://localhost:8083'),
      PGADMIN_URL: env('PGADMIN_URL', 'http://localhost:8082'),
      MAILPIT_URL: env('MAILPIT_URL', 'http://localhost:8025'),
      MINIO_CONSOLE_URL: env('MINIO_CONSOLE_URL', 'http://localhost:9001'),
      MINIO_S3_URL: env('MINIO_S3_URL', 'http://localhost:9000'),
      PGADMIN_EMAIL: env('PGADMIN_EMAIL', 'admin@ghostnet.local'),
      PGADMIN_PASSWORD: env('PGADMIN_PASSWORD', 'admin'),
    },

    setupNodeEvents(on) {
      on('task', {
        // ── Postgres: connect + SELECT 1 ─────────────────────────
        async pgPing(): Promise<number> {
          const client = new pg.Client({
            connectionString: env(
              'DATABASE_URL',
              'postgres://ghostnet:ghostnet@localhost:5432/ghostnet',
            ),
          });
          await client.connect();
          try {
            const r = await client.query<{ one: number }>('SELECT 1 AS one');
            return r.rows[0]?.one ?? 0;
          } finally {
            await client.end();
          }
        },

        // ── MySQL: connect + SELECT 1 ────────────────────────────
        async mysqlPing(): Promise<number> {
          const conn = await createMysqlConnection({
            host: env('RETRO_DB_HOST', 'localhost'),
            port: Number(env('RETRO_DB_PORT', '3306')),
            user: env('RETRO_DB_USER', 'retro'),
            password: env('RETRO_DB_PASSWORD', 'retro'),
            database: env('RETRO_DB_NAME', 'retro'),
          });
          try {
            interface SelectOneRow extends RowDataPacket {
              one: number;
            }
            const [rows] = await conn.query<SelectOneRow[]>('SELECT 1 AS one');
            return rows[0]?.one ?? 0;
          } finally {
            await conn.end();
          }
        },

        // ── Redis: PING → expect "PONG" ──────────────────────────
        async redisPing(): Promise<string> {
          const client = new Redis(env('REDIS_URL', 'redis://localhost:6379'));
          try {
            return await client.ping();
          } finally {
            await client.quit();
          }
        },

        // ── Mailpit: send a test mail via SMTP ───────────────────
        async sendTestMail(args: { to: string; subject: string; body: string }): Promise<string> {
          const transport = createTransport({
            host: env('SMTP_HOST', 'localhost'),
            port: Number(env('SMTP_PORT', '1025')),
            secure: false,
          });
          const info = await transport.sendMail({
            from: env('SMTP_FROM', 'noreply@ghostnet.local'),
            to: args.to,
            subject: args.subject,
            text: args.body,
          });
          return info.messageId;
        },

        // ── Mailpit: clear the inbox via REST API ────────────────
        async pruneMailpit(): Promise<null> {
          const url = `${env('MAILPIT_URL', 'http://localhost:8025')}/api/v1/messages`;
          await fetch(url, { method: 'DELETE' });
          return null;
        },
      });
    },
  },
});
