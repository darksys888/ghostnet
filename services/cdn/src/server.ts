/**
 * Fastify CDN — serves the workspace public/ folder with paranoid defaults.
 *
 * Security stack (all hooks register early, before the static handler):
 *   • helmet               → CSP, HSTS, X-Content-Type-Options, X-Frame-Options, …
 *   • cors                 → configurable origin allow-list
 *   • rate-limit           → per-IP burst protection
 *   • compress             → gzip/br for text payloads only
 *   • etag                 → conditional GETs
 *   • method guard         → only GET / HEAD / OPTIONS
 *   • dot-file blocklist   → .env, .git, .htaccess never served
 *   • server-fingerprint   → Server / X-Powered-By stripped on every response
 *   • path-traversal       → handled by @fastify/static's resolution (relative root)
 */
import path from 'node:path';

import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyEtag from '@fastify/etag';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

import type { Config } from './config.js';

// Files / directories that must NEVER be served, regardless of where they
// appear in public/. Matched against the request URL.
const BLOCKED_PATTERNS = [
  /(?:^|\/)\.(env|git|hg|svn|htaccess|htpasswd|DS_Store|aws|ssh)/i,
  /(?:^|\/)(node_modules|dist|build|coverage|\.nx)\//i,
  /\.bak$/i,
  /\.swp$/i,
];

const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const buildServer = async (config: Config): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: { level: config.logLevel },
    bodyLimit: 1024, // we don't accept bodies; limit defends against malformed requests
    trustProxy: config.trustProxy,
    disableRequestLogging: false,
  });

  // ── Hide server fingerprint on every response ────────────────────
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.removeHeader('server');
    reply.removeHeader('x-powered-by');
    return payload;
  });

  // ── Block disallowed paths BEFORE any other handler ──────────────
  app.addHook('onRequest', async (req, reply) => {
    if (!ALLOWED_METHODS.has(req.method)) {
      return reply
        .code(405)
        .header('allow', 'GET, HEAD, OPTIONS')
        .send({ error: 'Method Not Allowed' });
    }
    for (const re of BLOCKED_PATTERNS) {
      if (re.test(req.url)) {
        return reply.code(404).send({ error: 'Not Found' });
      }
    }
  });

  // ── Helmet — strict security headers ─────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    // Off — would break cross-origin asset loading from app frontends.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
  });

  // ── CORS — configurable origin allow-list ────────────────────────
  await app.register(fastifyCors, {
    origin: config.corsOrigins,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range', 'If-None-Match', 'If-Modified-Since'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'ETag', 'Last-Modified'],
    maxAge: 86_400,
  });

  // ── Rate limiting per IP ─────────────────────────────────────────
  await app.register(fastifyRateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    cache: 10_000,
    skipOnError: true,
  });

  // ── ETag for conditional GETs ────────────────────────────────────
  await app.register(fastifyEtag);

  // ── Compression for text payloads ────────────────────────────────
  await app.register(fastifyCompress, {
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024,
    customTypes: /^text\/|application\/(json|xml|javascript|wasm|manifest\+json)$/,
  });

  // ── Static handler — serves the public/ directory ────────────────
  await app.register(fastifyStatic, {
    root: path.resolve(config.publicDir),
    prefix: '/',
    // `true` = JSON directory listing in dev; `false` = 404 in prod.
    // (HTML listing would require a custom `render` callback — JSON is plenty.)
    list: config.allowListing,
    serveDotFiles: false,
    index: ['index.html'],
    // Cache strategy keyed on file type.
    setHeaders: (reply, filepath) => {
      // Hashed/immutable assets — fonts, images, .nitro bundles.
      if (/\.(woff2?|ttf|eot|otf|nitro)$/i.test(filepath)) {
        reply.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }
      // Game data / JSON / XML / text — short cache so we can deploy config tweaks.
      if (/\.(json|xml|txt|csv|yaml|yml)$/i.test(filepath)) {
        reply.setHeader('Cache-Control', 'public, max-age=300');
        return;
      }
      // HTML / templates — no caching, always fresh.
      if (/\.(html|htm)$/i.test(filepath)) {
        reply.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return;
      }
      // Default: 1 hour.
      reply.setHeader('Cache-Control', 'public, max-age=3600');
    },
  });

  // ── Generic 404 — no path leakage ────────────────────────────────
  app.setNotFoundHandler(async (_req, reply) => {
    return reply.code(404).send({ error: 'Not Found' });
  });

  return app;
};

export const startServer = async (config: Config): Promise<FastifyInstance> => {
  const app = await buildServer(config);
  await app.listen({ host: config.host, port: config.port });
  return app;
};
