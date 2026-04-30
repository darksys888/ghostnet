/**
 * GHOSTNET CDN entry point.
 * Loads config, starts the Fastify server, wires graceful shutdown.
 *
 * This file IS a CLI / process entry point — `process.exit()` is the right
 * primitive after `server.close()` resolves. Disabling the eslint rules
 * that conflate libraries with services.
 */
/* eslint-disable n/no-process-exit, unicorn/no-process-exit */
import { loadConfig } from './config.js';
import { startServer } from './server.js';

const config = loadConfig();
const server = await startServer(config);

server.log.info(
  {
    publicDir: config.publicDir,
    host: config.host,
    port: config.port,
    rateLimit: config.rateLimit,
    listing: config.allowListing,
  },
  'CDN ready',
);

const shutdown = async (signal: string): Promise<void> => {
  server.log.info({ signal }, 'shutting down');
  try {
    await server.close();
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
