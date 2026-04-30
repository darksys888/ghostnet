/**
 * Cypress configuration for the dev/retro Habbo stack.
 *
 * URLs and DB creds come from the workspace-root `.env`; sane localhost
 * defaults baked in so the suite still runs without one.
 *
 * Prereqs (otherwise tests will fail loudly with connection errors):
 *   • npm run dev:up      ← .devcontainer (gives us mariadb on :3306)
 *   • npm run retro:up    ← Holo5 stack (arcturus, nitro, asset/SWF servers)
 */
import path from 'node:path';

import { defineConfig } from 'cypress';
import { config as loadDotenv } from 'dotenv';
import { createConnection as createMysqlConnection, type RowDataPacket } from 'mysql2/promise';

loadDotenv({ path: path.resolve(__dirname, '..', '..', '.env') });

const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export default defineConfig({
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: false,
    chromeWebSecurity: false,

    env: {
      // Holo5 Retro stack — host-side URLs.
      NITRO_URL: env('NITRO_URL', 'http://localhost:1080'),
      NITRO_SSO: env('NITRO_SSO', '123'),
      ASSETS_URL: env('RETRO_ASSETS_URL', 'http://localhost:8080'),
      SWF_URL: env('RETRO_SWF_URL', 'http://localhost:8081'),
      ARCTURUS_GAME_HOST: env('ARCTURUS_GAME_HOST', 'localhost'),
      ARCTURUS_GAME_PORT: env('ARCTURUS_GAME_PORT', '3000'),
      ARCTURUS_CAMERA_URL: env('ARCTURUS_CAMERA_URL', 'http://localhost:2096'),

      // Cross-stack: arcturus DB lives in the .devcontainer mariadb on :3306.
      PHPMYADMIN_URL: env('PHPMYADMIN_URL', 'http://localhost:8083'),
      ARCTURUS_DB_HOST: env('ARCTURUS_DB_HOST', 'localhost'),
      ARCTURUS_DB_PORT: env('ARCTURUS_DB_PORT', '3306'),
      ARCTURUS_DB_NAME: env('ARCTURUS_DB_NAME', 'arcturus'),
      ARCTURUS_DB_USER: env('ARCTURUS_DB_USER', 'arcturus_user'),
      ARCTURUS_DB_PASSWORD: env('ARCTURUS_DB_PASSWORD', 'arcturus_pw'),
    },

    setupNodeEvents(on) {
      on('task', {
        // ── Open a TCP connection to verify the Arcturus game socket ───
        async tcpProbe(args: { host: string; port: number; timeoutMs?: number }): Promise<boolean> {
          const net = await import('node:net');
          return new Promise<boolean>((resolve) => {
            const socket = new net.Socket();
            const timeout = args.timeoutMs ?? 3000;
            const cleanup = (open: boolean): void => {
              socket.destroy();
              resolve(open);
            };
            socket.setTimeout(timeout);
            socket.once('connect', () => cleanup(true));
            socket.once('timeout', () => cleanup(false));
            socket.once('error', () => cleanup(false));
            socket.connect(args.port, args.host);
          });
        },

        // ── Run a SELECT against the arcturus DB ──────────────────────
        async arcturusQuery<T extends RowDataPacket = RowDataPacket>(args: {
          sql: string;
          params?: unknown[];
        }): Promise<T[]> {
          const conn = await createMysqlConnection({
            host: env('ARCTURUS_DB_HOST', 'localhost'),
            port: Number(env('ARCTURUS_DB_PORT', '3306')),
            user: env('ARCTURUS_DB_USER', 'arcturus_user'),
            password: env('ARCTURUS_DB_PASSWORD', 'arcturus_pw'),
            database: env('ARCTURUS_DB_NAME', 'arcturus'),
          });
          try {
            const [rows] = await conn.query<T[]>(args.sql, args.params ?? []);
            return rows;
          } finally {
            await conn.end();
          }
        },
      });
    },
  },
});
