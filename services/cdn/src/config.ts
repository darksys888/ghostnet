/**
 * Runtime configuration for the GHOSTNET CDN service.
 * Reads from `process.env` with safe defaults; explicit, no surprises.
 */
import 'dotenv/config';

export interface Config {
  host: string;
  port: number;
  publicDir: string;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  allowListing: boolean;
  trustProxy: boolean;
  corsOrigins: string[] | true | false;
  rateLimit: { max: number; windowMs: number };
}

// Deliberately polymorphic: returns true / false / string[] based on the
// configured wildcard, opt-out, or explicit allow-list.
// eslint-disable-next-line sonarjs/function-return-type
const parseCors = (raw: string): Config['corsOrigins'] => {
  if (raw === '*') return true;
  if (raw === 'false' || raw === '') return false;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const num = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const loadConfig = (): Config => {
  const e = process.env;
  return {
    host: e.CDN_HOST ?? '0.0.0.0',
    port: num(e.CDN_PORT, 5500),
    publicDir: e.CDN_PUBLIC_DIR ?? 'public',
    logLevel: (e.CDN_LOG_LEVEL ?? 'info') as Config['logLevel'],
    allowListing: e.CDN_ALLOW_LISTING === 'true',
    trustProxy: e.CDN_TRUST_PROXY === 'true',
    corsOrigins: parseCors(e.CDN_CORS_ORIGINS ?? '*'),
    rateLimit: {
      max: num(e.CDN_RATE_LIMIT_MAX, 200),
      windowMs: num(e.CDN_RATE_LIMIT_WINDOW_MS, 60_000),
    },
  };
};
