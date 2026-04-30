# AUDIT — agent session log

This file is the **single source of truth for cross-session context**.
AI agents read it BEFORE starting work and UPDATE it AFTER each
meaningful change. If you're picking up a thread from a prior session,
the **Resume here** block at the top tells you exactly where to start.

---

## 🎯 Resume here

**Last touched**: 2026-04-30 · `apps/coming-soon` Next.js launch page

**State of the world right now**:

- ✅ Repo is on GitHub: <https://github.com/darksys888/ghostnet>
- ✅ 7 Nx projects (added `coming-soon`)
- ✅ All 164 Cypress tests pass when their respective backends are up
- ✅ Pipeline (`npm run check`) green on 7 typecheck projects
- ✅ `apps/coming-soon` Next 15 + React 19 launch page live at
  `http://localhost:4000/coming-soon` (`/` → 307 redirect). 64-day
  countdown targeting **2026-07-03**. Verified HTTP 200, all
  expected text markers present.
- ✅ Journals (`CHANGELOG.md` + this file) wired into the AGENTS.md rules
- ✅ `tests/structure/` validates that `AGENTS.md` / `CHANGELOG.md` /
  `AUDIT.md` keep their invariants
- ✅ GitHub CI runs `npm run check` + `e2e-structure` + `e2e-cdn` on
  every push & PR
- ⚠️ Branch protection on `main` still needs to be enabled in the
  GitHub UI (Settings → Branches) — agents can't do that
- ⚠️ Dependabot will start opening grouped PRs on the next weekly scan

**If you're a new agent session**, read in this order:

1. `AGENTS.md` — the hard rules (commit attribution, journal upkeep)
2. The most recent entry in **Session log** below
3. Whatever per-area `connect.txt` is relevant to your task

---

## How to use this file

Each entry has the same shape:

```
### YYYY-MM-DD · short subject (newest first)

**Status**: ✅ shipped | 🟡 in progress | 🔴 blocked | 📝 deferred

**Done**:
- bullet
- bullet

**Open**:
- (none)  ← if everything wrapped up cleanly

**Next time**:
- bullet that helps a future agent pick up the thread
```

**Append a new entry on top** when you start a session. Update its
fields as work progresses. **Do not delete old entries** — the history
IS the audit.

---

## Session log

### 2026-04-30 · `apps/coming-soon` launch page

**Status**: ✅ shipped

**Done**:

- Created `apps/coming-soon/` — first Node-workspace app under
  `apps/*`. Next.js 15 + React 19, app router, port 4000 to avoid the
  Retro stack's :3000 binding.
- Routes: `/coming-soon/page.tsx` renders the page; `/page.tsx` is a
  stub since `next.config.mjs` redirects `/` → `/coming-soon` (307).
- Components:
  - `coming-soon/countdown.tsx` — `'use client'`, `setInterval` ticks
    every second, target `2026-07-03T00:00:00Z` (64 days from today),
    `useState<TimeLeft | null>` to dodge SSR/CSR hydration mismatch.
  - `coming-soon/page.tsx` — server component with brand + tagline +
    `<Countdown />` + footer.
- Styling: cyber/hacker theme matching the brand — radial gradient
  background, gradient brand text, monospace, neon-green countdown
  numerals. CSS-only (no Tailwind / styled-components).
- `next.config.mjs` redirects `/` → `/coming-soon`.
- `apps/coming-soon/project.json` — Nx targets: build / serve / start /
  typecheck. `serve` is `continuous: true`. Build outputs `.next/`.
- Added `src/globals.d.ts` with `declare module '*.css';` so `tsc
--noEmit` doesn't choke on CSS side-effect imports before Next has
  generated `.next/types/`.
- Root `.gitignore` extended with `.next/`.

**Verified live**:

- `curl http://localhost:4000/coming-soon` → HTTP 200, 13868 B
- `curl http://localhost:4000/` → HTTP 307 → `/coming-soon` → HTTP 200
- Page contains expected text markers: `GHOSTNET`, `Coming soon`,
  `countdown`, `July`
- `npm run check` → all 7 projects typecheck green

**Open**:

- (none)

**Next time**:

- If we ever want a dedicated lint config for React/JSX, add
  `eslint-plugin-react`, `eslint-plugin-react-hooks`, and
  `@next/eslint-plugin-next` to root and a per-app override block in
  `eslint.config.mjs`. Today the root flat config handles the TSX
  cleanly without Next-specific rules.

---

### 2026-04-30 · Journals + GitHub CI for Cypress

**Status**: ✅ shipped

**Done**:

- Created `CHANGELOG.md` (Keep-a-Changelog format) with `[Unreleased]`
  - `[0.0.1]` initial-bootstrap entry
- Created this `AUDIT.md` with the resume-friendly structure
- Extended `AGENTS.md` with a HARD RULE: every meaningful change
  updates both journals in the same commit
- Created `tests/structure/` Cypress workspace with 5 specs that
  validate the journal + AGENTS.md invariants
- Extended `.github/workflows/ci.yml` with `e2e-structure` (no service
  needed) and `e2e-cdn` (starts the CDN, waits, runs Cypress) jobs
- Added npm script `e2e:structure` + Make target `e2e-structure`
- Updated `package.json.md` with the new section

**Open**:

- (none)

**Next time**:

- If we add `e2e-retro` to CI, will need GitHub Actions docker-compose
  steps to bring up the Holo5 stack (Maven build + Nitro yarn install)
  — non-trivial, deferred until needed
- Branch protection rules still pending in the GitHub UI

---

### 2026-04-30 · GitHub repo bootstrap + AGENTS.md hard rule

**Status**: ✅ shipped

**Done**:

- Populated `AGENTS.md` with the no-Claude-attribution commit rule
- Persisted the rule to `~/.claude/.../memory/feedback_no_claude_commit_attribution.md`
  so future sessions inherit it automatically
- `git init -b main`, made initial commit (158 files, author
  `darksys888 <darksys888@outlook.com>`, no agent trailer)
- Pushed to <https://github.com/darksys888/ghostnet>
- Added `.github/` scaffold: `workflows/ci.yml`, `PULL_REQUEST_TEMPLATE.md`,
  `ISSUE_TEMPLATE/{bug_report,feature_request,config}.{md,yml}`,
  `CODEOWNERS`, `dependabot.yml`, `SECURITY.md`

**Bug found and fixed during prep**:

- `.gitignore` had inline `#` comments on every pattern. `.gitignore`
  does not support trailing inline comments — patterns ended up matching
  literal "filename + spaces + # comment text", which doesn't exist.
  Effect: every ignore rule was silently broken. Without the fix,
  `git add .` would have staged `node_modules/`, `.env`, `.nx/cache/`,
  every Holo5 vendored tree, and crashed git trying to fetch
  recursively. Fixed by moving every comment to its own line and
  adding explicit ignores for the vendored Holo5 trees.

**Open**:

- (none)

**Next time**:

- Branch protection on `main` (manual GitHub UI step)
- Dependabot first scan will open grouped PRs

---

### 2026-04-30 · Local DNS + Caddy reverse proxy

**Status**: ✅ shipped

**Done**:

- `dev/caddy/Caddyfile` — reverse proxy for 10 services, HTTP-only by
  default to avoid cert prompts; HTTPS-with-local-CA via one toggle
- `dev/caddy/hosts.local` — source-of-truth list of `*.ghostnetw.test`
  hostnames (RFC 6761 reserved TLD)
- `scripts/hosts.sh` (bash, Linux/macOS/WSL/Git Bash) +
  `scripts/hosts.ps1` (Windows, **self-elevates via UAC**) — both
  idempotent, marker-delimited blocks
- `tests/hostnames/` Cypress suite — 17 tests: DNS resolution + Caddy
  routing parity (verified hostname response matches direct
  `localhost:port` response)
- 9 npm scripts + 9 Make targets

**Open**:

- HTTPS variant Caddyfile (offered, user didn't request)

---

### 2026-04-30 · Public CDN + `public/` static-asset root

**Status**: ✅ shipped

**Done**:

- `services/cdn/` Fastify webserver (TypeScript ESM) with paranoid
  defaults: helmet (CSP / HSTS / X-CTO / Referrer-Policy / CORP), CORS
  allow-list, rate-limit (200/min default), gzip+br compression, ETag,
  GET/HEAD/OPTIONS only, dot-file blocklist (`.env`, `.git`, etc.),
  type-aware `Cache-Control`, server fingerprint stripped
- `public/` workspace-wide static asset root (8 sub-namespaces:
  fonts, icons, images, javascripts, stylesheets, templates, uploads,
  videos) — namespace for `retro/` (auto-populated by extract) and
  `shared/` (committed)
- `tests/cdn/` — 50 Cypress security tests: basic, security headers,
  methods, path-traversal (10 payloads incl. encoded + Windows-style),
  disallowed-files, CORS, caching, rate-limit. **All 50 passing live**.
- `scripts/cdn-push.sh` — provider-agnostic via rclone. Supports AWS
  S3, Cloudflare R2, BunnyCDN, GCS, Azure. Three modes: push / dry-run
  / check. Optional CloudFront invalidation + Cloudflare cache purge.

**Open**:

- (none)

---

### 2026-04-30 · Nx native commands + workspace polish

**Status**: ✅ shipped

**Done**:

- Comprehensive `nx.json` — `namedInputs` (default / production /
  sharedGlobals incl. tsconfig.base + eslint + prettier + editorconfig +
  package.json), 6 `targetDefaults` (build / lint / test / typecheck /
  e2e / serve), `parallel: 3`, `defaultBase: main`, `defaultProject: ghostnet`
- Root `project.json` — workspace-level Nx targets: check / lint /
  lint-fix / format / format-check / docker-check / docker-build / graph
- Full rewrite of `nx.json.md` — every field documented + ops guide
- `affected` / `graph` scripts at root

---

### 2026-04-30 · Versioned dev → prod retro promotion

**Status**: ✅ shipped

**Done**:

- `scripts/retro-release.sh` — semver bump (patch / minor / major) +
  submodule SHA snapshot to `deploy/retro/MANIFEST.json` + tagged image
  rebuild + optional registry push
- `Dockerfile` (root) — 5-stage workspace builder (base / source /
  check / build / runtime)
- `.gitattributes` (root) — repo-wide LF/CRLF + binary handling
- `.editorconfig` extended with max_line_length + per-language rules

---

### 2026-04-30 · Retro production stack

**Status**: ✅ shipped

**Done**:

- `deploy/retro/` — 4 multi-stage Dockerfiles (mariadb / arcturus /
  nitro / assets) producing thin runtime images, no source bind-mounts,
  env-file secrets, ports 127.0.0.1-only

---

### 2026-04-30 · Cross-stack MariaDB wiring + phpMyAdmin

**Status**: ✅ shipped

**Done**:

- Removed dedicated MySQL from `dev/retro/`; arcturus joins the
  external `devcontainer_default` network and connects to `.devcontainer`
  MariaDB at `mysql:3306`
- `01-bootstrap-arcturus.sh` in `.devcontainer/mysql-init/` creates the
  `arcturus` DB + `arcturus_user` and loads Holo5 dumps on first boot
- phpMyAdmin moved from port 8081 → 8083 to free :8081 for the Retro
  SWF server (and updated everywhere)
- Verified live: 122 tables in arcturus DB, 10,124 .nitro bundles
  served, Arcturus emulator boots with "Database -> Connected!"

---

### 2026-04-30 · Holo5 retro stack live

**Status**: ✅ shipped (with one known issue from project memory)

**Done**:

- Cloned Holo5/nitro-docker with all 5 submodules
- Promoted to `dev/retro/` (replaced earlier hand-rolled scaffold)
- Fixed CRLF line-endings on every `.sh` / `.conf` (Git on Windows
  auto-converts; broken Linux scripts inside containers)
- Patched `wget` for `NitroWebsockets-3.1.jar` to spoof a browser UA
  (Cloudflare in front of `git.krews.org` rejects default wget)
- Built JAR via Maven, ran asset converter (10,124 `.nitro` bundles,
  233 MB), synced converter output → `nitro-assets/bundled` so the
  asset HTTP server actually serves them

**Open / known**:

- 80%-loading-bar renderer hang documented in
  `~/.claude/.../memory/project_ghostnet_retro_server.md` (schema drift
  between converter output and `@nitrots/nitro-renderer` 1.6.6) —
  **same bug as the remote install**, not a setup problem here

---

### Earlier sessions

For pre-2026-04-30 history (initial Nx scaffold, Prettier/ESLint setup,
.devcontainer build-out, .vscode integration, Cypress devcontainer
suite), see git log: `git log --oneline --reverse`.

---

## TODO carry-over

Everything below is **not yet started** but has been mentioned and may
become work for a future session.

- [ ] **Branch protection on `main`** — Settings → Branches in GitHub
      UI; require PR + status checks (`CI / format · lint · typecheck`,
      `CI / build · @ghostnet/cdn`, `CI / e2e · structure`,
      `CI / e2e · cdn`) + CODEOWNERS approval
- [ ] **HTTPS Caddyfile variant** — separate file at
      `dev/caddy/Caddyfile.https` with `auto_https on` for testing
      prod-like flows locally
- [ ] **Retro asset pipeline migration** — currently
      `retro:assets:extract` outputs to `dev/retro/nitro/nitro-assets/`;
      should also mirror to `public/retro/` so the central CDN can
      serve them and apps can migrate at their own pace
- [ ] **Flutter app skeleton** — `apps/__ghostnet-retro-app__/` is an
      empty placeholder; run `flutter create .` once a Flutter
      toolchain is on the user's machine
- [ ] **Next.js client skeleton** — `apps/__ghostnet-retro-client__/`
      is empty; scaffold via `nx g @nx/next:app` when ready
- [ ] **Java backend skeleton** — `apps/__ghostnet-retro-server__/` is
      empty; Maven init for the Arcturus plugin + socket dispatcher
- [ ] **`e2e-retro` in CI** — needs GitHub Actions to bring up the
      Holo5 stack (Maven build + Nitro yarn install) before the
      Cypress run; complex, deferred
- [ ] **Production CDN provider** — `services/cdn/.env` ships with
      `CDN_PROVIDER=cloudflare-r2` as the default but no real bucket;
      run `npm run cdn:push:check` once credentials are configured
