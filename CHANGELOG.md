# Changelog

All notable user-facing changes to the GHOSTNET monorepo are documented
here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning: [SemVer](https://semver.org/spec/v2.0.0.html) for the
workspace as a whole. Per-stack versions (Retro releases) are tracked
independently in `deploy/retro/MANIFEST.json`.

**AI agents:** every meaningful change MUST add an entry under
`[Unreleased]` in the same commit. See `AGENTS.md` for the categories
and exclusion list (typos / format-only fixes don't need an entry).

## [Unreleased]

### Added

- `CHANGELOG.md` (this file) and `AUDIT.md` for cross-session journaling
- Hard rule in `AGENTS.md`: every meaningful change updates both journals
- `tests/structure/` Cypress suite validating the journal + agent-rule
  invariants (5 specs)
- GitHub Actions: extended `.github/workflows/ci.yml` with `e2e-cdn` and
  `e2e-structure` jobs that run on every push + PR
- npm + Make scripts: `e2e:structure` / `make e2e-structure`

## [0.0.1] — 2026-04-30

Initial bootstrap. Pushed to `https://github.com/darksys888/ghostnet`.

### Added

- Nx + npm workspaces with strict TS, ESLint flat config (UHQ rules),
  Prettier, EditorConfig
- `.devcontainer/` — 8 services (mariadb, postgres, redis, mailpit,
  minio, phpmyadmin at :8083, pgadmin, workspace); phpMyAdmin browses
  both `retro` + `arcturus` DBs via dual-DB grants
- `dev/retro/` — Holo5 Habbo emulator dev stack (Arcturus + Nitro +
  asset/SWF servers + cross-stack MariaDB sharing)
- `deploy/retro/` — production multi-stage Dockerfiles + versioned
  release pipeline (`scripts/retro-release.sh` + `MANIFEST.json`)
- `services/cdn/` — Fastify ultra-secure static-asset CDN serving
  `public/` with helmet / rate-limit / CORS / compression / dot-file
  blocklist / method-guard / path-traversal protection
- `dev/caddy/` — reverse proxy fronting every service via
  `*.ghostnetw.test` (RFC 6761 reserved TLD)
- `scripts/` — `retro-release.sh`, `cdn-push.sh` (rclone-based,
  provider-agnostic), `hosts.sh` + `hosts.ps1` (self-elevates UAC)
- 4 Cypress suites (devcontainer 17 / retro 19 / cdn 50 /
  hostnames 17) — 103 tests total
- Root `Dockerfile` (5 stages: base / source / check / build / runtime)
- `AGENTS.md` hard-rule: every commit authored by the human owner with
  NO `Co-Authored-By` trailer / agent attribution
- `.github/` — CI workflow, PR template, issue templates, CODEOWNERS,
  Dependabot config, SECURITY policy

### Fixed

- `.gitignore` had inline `#` comments on every pattern — `.gitignore`
  doesn't support inline comments, so every ignore rule was silently
  broken. Without the fix, `git add .` would have committed
  `node_modules/`, `.env`, `.nx/cache/`, the entire Holo5 vendored tree,
  and crashed git trying to recursively fetch submodule remotes.

[Unreleased]: https://github.com/darksys888/ghostnet/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/darksys888/ghostnet/releases/tag/v0.0.1
