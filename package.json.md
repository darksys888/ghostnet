# `package.json` — Field Reference

The npm spec forbids comments in `package.json` (strict JSON, not JSONC), so
this companion document explains every field. Keep them in sync when one
changes.

---

## Identity

### `name`

```json
"name": "ghostnet"
```

The package name. Because the workspace is `private`, this is purely a
human-readable identifier — npm never publishes it.

### `version`

```json
"version": "0.0.0"
```

Placeholder. The root workspace itself is never published; per-package
versions live in their own `package.json` under `apps/*`, `libs/*`,
`packages/*`.

### `private`

```json
"private": true
```

Hard-stops `npm publish` from accidentally pushing the root workspace to a
registry. Required for a monorepo root.

---

## Runtime requirements

### `engines`

```json
"engines": {
  "node": ">=22.16.0",
  "npm": ">=10.0.0"
}
```

Declares the minimum runtime versions. Two reasons we pin:

1. The ESLint flat config uses `import.meta.dirname`, supported only on
   Node ≥ 22.16 / 21.2 / 20.11. Older Node would silently produce `undefined`.
2. `eslint-plugin-n` reads this field to decide which Node features to flag
   as unsupported.

`npm ci` will warn (not error) if the local environment doesn't match;
add `engine-strict=true` to `.npmrc` if you want hard enforcement.

---

## Workspaces

### `workspaces`

```json
"workspaces": [
  "apps/*",
  "bots/*",
  "libs/*",
  "packages/*",
  "services/*",
  "tests/*",
  "__ghostnet-retro-client__",
  "__ghostnet-retro-server__"
]
```

Tells npm to treat any `package.json` under these paths as part of the
same install. Hoists shared dependencies into the root `node_modules` and
creates symlinks for cross-workspace `import` resolution.

| Path                        | Convention                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/*`                    | runnable applications (web, mobile, CLI, front-ends)                                                                                                                                                                            |
| `bots/*`                    | bot processes (Discord, Telegram, scheduled workers)                                                                                                                                                                            |
| `libs/*`                    | shared libraries (Nx-style: feature, ui, util, data-access)                                                                                                                                                                     |
| `packages/*`                | publishable packages (separate from the closed `libs/`)                                                                                                                                                                         |
| `services/*`                | backend services (HTTP/gRPC APIs, background workers)                                                                                                                                                                           |
| `tests/*`                   | cross-project end-to-end suites — each suite is its own pkg                                                                                                                                                                     |
| `__ghostnet-retro-client__` | GHOSTNET Retro web client — custom Next.js (Node workspace)                                                                                                                                                                     |
| `__ghostnet-retro-server__` | GHOSTNET Retro backend — Java plugins inside Arcturus + a socket dispatcher for clients. Listed here for filesystem grouping; npm itself ignores it once it sees no `package.json` (the actual build is Maven/Gradle, not npm). |

#### Note on `__ghostnet-retro-*__/` folders (Retro **products**)

Distinct from `dev/retro/` (Holo5 emulator dev stack) and `deploy/retro/`
(prod images) — those are **infrastructure layers**. The dunder folders
hold the **products** that ship to users:

| Folder                               | Stack          | Workspace?                                         |
| ------------------------------------ | -------------- | -------------------------------------------------- |
| `__ghostnet-retro-client__/`         | Next.js (TS)   | yes — Node workspace                               |
| `__ghostnet-retro-server__/`         | Java + Maven   | listed for grouping; not actually a Node workspace |
| `__ghostnet-retro-app__/` _(future)_ | Flutter (Dart) | **no** — won't be added (different toolchain)      |

The server provides Arcturus plugins on one side and a socket protocol
on the other; the web + Flutter clients connect to that socket, not to
the emulator directly.

#### Folders NOT in `workspaces`

These directories exist at the repo root for organisational purposes but
are **not** npm workspaces — they hold non-package artefacts.

| Folder    | Purpose                                                     |
| --------- | ----------------------------------------------------------- |
| `db/`     | Database schema, migrations, seed data                      |
| `deploy/` | Deployment manifests (Dockerfiles, k8s YAML, compose files) |
| `dev/`    | Local-development tooling and scripts                       |
| `docs/`   | Project documentation (markdown, diagrams, ADRs)            |
| `infra/`  | Infrastructure-as-code (Terraform, Pulumi, Ansible)         |

These folders are still tracked by git, linted by ESLint when they contain
JS/TS, and formatted by Prettier — they just don't host npm packages.

---

## Scripts

All scripts are run as `npm run <name>`. The `setup`/`check`/`clean`/`build`/`start`
scripts are also exposed as `make` targets in the root `Makefile`.

### `setup`

```json
"setup": "npm install"
```

Idempotent first-run command after a fresh clone. Installs every dependency
across every workspace.

### `check`

```json
"check": "npm run format:check && npm run lint && nx run-many --targets=typecheck,test --parallel"
```

The full quality gate. Runs in order:

1. **`format:check`** — Prettier verification (no writes).
2. **`lint`** — ESLint with `--max-warnings=0` (zero-tolerance).
3. **`typecheck` + `test`** — every project, in parallel.

CI should run `npm run check`. Local users typically run it before committing.

### `clean`

```json
"clean": "nx reset && rimraf node_modules dist .nx"
```

Wipes Nx caches, then removes `node_modules`, `dist`, and `.nx` directories.
After this, run `npm run setup` to reinstall.

### `build`, `build:dev`, `build:prod`

```json
"build":      "nx run-many --target=build --parallel",
"build:dev":  "nx run-many --target=build --configuration=development --parallel",
"build:prod": "nx run-many --target=build --configuration=production --parallel"
```

Builds every project that defines a `build` target.

| Script       | When to use                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| `build`      | Project's default configuration (usually production for libs, dev for apps).  |
| `build:dev`  | Dev build — fast, unminified, source maps, no tree-shaking aggressive passes. |
| `build:prod` | Production build — minified, optimised, ready to deploy.                      |

### `start`, `start:dev`, `start:prod`

```json
"start":      "nx run-many --target=serve --configuration=development --parallel",
"start:dev":  "nx run-many --target=serve --configuration=development --parallel",
"start:prod": "nx run-many --target=serve --configuration=production --parallel"
```

Serves every project that defines a `serve` target.

| Script                | Mode                                                                                |
| --------------------- | ----------------------------------------------------------------------------------- |
| `start` / `start:dev` | **Development** — hot reload, source maps, dev-server middleware.                   |
| `start:prod`          | **Production preview** — runs the optimised bundle locally to verify before deploy. |

> Each project picks how `development` vs `production` is implemented inside
> its own `project.json` `targets.serve.configurations` block. The script
> here only chooses _which_ configuration Nx hands to the executor.

### `lint` and `lint:fix`

```json
"lint":     "eslint . --max-warnings=0",
"lint:fix": "eslint . --fix"
```

Runs the ESLint flat config. `--max-warnings=0` ensures every warning
becomes a failing exit code; this is a deliberate UHQ choice — warnings rot
unless they cause pain.

### `format` and `format:check`

```json
"format":       "prettier --write   \"**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,yml,yaml,css,scss,html}\"",
"format:check": "prettier --check   \"**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,yml,yaml,css,scss,html}\""
```

Prettier covers every common source file type. `format` rewrites in place;
`format:check` returns a non-zero exit code if anything is not formatted —
suitable for CI gates.

### `e2e` and `e2e:open`

```json
"e2e":      "nx run-many --target=e2e --parallel=1",
"e2e:open": "nx run tests-devcontainer:e2e:open"
```

Runs every project's `e2e` target. Today only `tests-devcontainer` defines
one (Cypress smoke + functional tests for the dev-container stack).

| Script     | Mode                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `e2e`      | Headless run — suitable for CI. `--parallel=1` is intentional (Cypress browsers don't share well). |
| `e2e:open` | Opens the interactive Cypress runner for the dev-container suite.                                  |

> Prereq: services must be up. Run `npm run dev:up` first (or open the
> dev container, which boots them automatically).

---

## Dev container management

These scripts are thin wrappers around `docker compose -f .devcontainer/docker-compose.yml`.
Each is also exposed as a `make dev-*` target.

### Service lifecycle

```json
"dev:up":         "docker compose -f .devcontainer/docker-compose.yml up -d",
"dev:up:build":   "docker compose -f .devcontainer/docker-compose.yml up -d --build",
"dev:down":       "docker compose -f .devcontainer/docker-compose.yml down",
"dev:down:clean": "docker compose -f .devcontainer/docker-compose.yml down -v",
"dev:restart":    "docker compose -f .devcontainer/docker-compose.yml restart"
```

| Script           | What it does                                                                       |
| ---------------- | ---------------------------------------------------------------------------------- |
| `dev:up`         | Start every service in the background. Named volumes preserve data across runs.    |
| `dev:up:build`   | Rebuild the workspace image (after editing `.devcontainer/Dockerfile`) then start. |
| `dev:down`       | Stop containers; named volumes (postgres-data, mysql-data, …) are kept.            |
| `dev:down:clean` | Stop containers AND wipe every named volume. Use for a guaranteed-clean state.     |
| `dev:restart`    | Restart every running service in place. Useful after editing `docker-compose.yml`. |

### Inspection

```json
"dev:ps":   "docker compose -f .devcontainer/docker-compose.yml ps",
"dev:logs": "docker compose -f .devcontainer/docker-compose.yml logs -f"
```

| Script     | What it does                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `dev:ps`   | List every compose service with its current status.                                                |
| `dev:logs` | Tail logs of every service (follow). Pass a service name via `npm run dev:logs -- mysql` to scope. |

### Database shells

```json
"dev:psql":  "docker compose -f .devcontainer/docker-compose.yml exec postgres psql -U ghostnet -d ghostnet",
"dev:mysql": "docker compose -f .devcontainer/docker-compose.yml exec mysql mysql -uretro -pretro retro",
"dev:redis": "docker compose -f .devcontainer/docker-compose.yml exec redis redis-cli"
```

| Script      | Drops you into…                                                      |
| ----------- | -------------------------------------------------------------------- |
| `dev:psql`  | An interactive `psql` session against the GHOSTNET database.         |
| `dev:mysql` | An interactive `mysql` session against the `retro` (Habbo) database. |
| `dev:redis` | A `redis-cli` session against the redis service.                     |

> All three skip the password prompt because the credentials are pre-seeded
> on the command line. Dev-only credentials by design.

---

## Retro Habbo stack (`dev/retro/`)

Dedicated compose stack for the Habbo emulator. Self-contained: brings its
own MySQL on host port **3307** so it can run alongside `.devcontainer`'s
MySQL on 3306. Each script is also exposed as a `make retro-*` target.

### Service lifecycle

```json
"retro:up":         "docker compose -f dev/retro/docker-compose.yml up -d",
"retro:up:build":   "docker compose -f dev/retro/docker-compose.yml up -d --build",
"retro:down":       "docker compose -f dev/retro/docker-compose.yml down",
"retro:down:clean": "docker compose -f dev/retro/docker-compose.yml down -v",
"retro:restart":    "docker compose -f dev/retro/docker-compose.yml restart"
```

| Script             | What it does                                                           |
| ------------------ | ---------------------------------------------------------------------- |
| `retro:up`         | Start MySQL + Arcturus + CMS + Nitro + asset-server in the background. |
| `retro:up:build`   | Rebuild images (after editing a Dockerfile / template) then start.     |
| `retro:down`       | Stop containers; named volumes (mysql-data, logs, camera) preserved.   |
| `retro:down:clean` | Stop AND wipe every Retro named volume — full reset.                   |
| `retro:restart`    | Restart every running Retro service.                                   |

### Inspection + shells

```json
"retro:ps":             "docker compose -f dev/retro/docker-compose.yml ps",
"retro:logs":           "docker compose -f dev/retro/docker-compose.yml logs -f",
"retro:mysql":          "docker compose -f dev/retro/docker-compose.yml exec mysql mysql -uretro -pretro retro",
"retro:emulator:logs":  "docker compose -f dev/retro/docker-compose.yml logs -f arcturus"
```

| Script                | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `retro:ps`            | List every Retro service and its current status.                          |
| `retro:logs`          | Tail logs from every service. Pass `-- arcturus` (etc.) to scope.         |
| `retro:mysql`         | mysql shell into the Retro DB (separate from `.devcontainer`'s instance). |
| `retro:emulator:logs` | Tail just the Arcturus emulator logs — the most-watched stream.           |

> **Prereqs to actually run a hotel:** Arcturus JAR in
> `dev/retro/arcturus/jars/`, schema dump in `dev/retro/mysql-init/`, CMS
> source in `dev/retro/cms/public/`, Nitro build in
> `dev/retro/nitro/public/`, and game assets in `dev/retro/assets/public/`.
> See `dev/retro/connect.txt` for the full per-service breakdown.

---

## Retro production deployment (`deploy/retro/`)

Production-style stack with multi-stage Dockerfiles that bake artifacts
into thin runtime images. Distinct from `dev/retro/` — no source bind
mounts, secrets in `deploy/retro/.env` (gitignored), ports loopback-only.

### Build pipeline

```json
"retro:build":          "docker compose -f deploy/retro/docker-compose.yaml --env-file deploy/retro/.env build",
"retro:build:nocache":  "docker compose -f deploy/retro/docker-compose.yaml --env-file deploy/retro/.env build --no-cache"
```

| Script                | What it does                                                                 |
| --------------------- | ---------------------------------------------------------------------------- |
| `retro:build`         | Builds 4 images (`mariadb`, `arcturus`, `nitro`, `assets`). ~10-15 min cold. |
| `retro:build:nocache` | Same, `--no-cache` — forces every Dockerfile layer to rebuild.               |

Each Dockerfile pulls source from `dev/retro/` submodules and runs the
build inside its own builder stage:

| Image                     | Builder stage          | Runtime stage           | What's baked in                                   |
| ------------------------- | ---------------------- | ----------------------- | ------------------------------------------------- |
| `ghostnet-retro/mariadb`  | (n/a)                  | `mariadb:10.6`          | Holo5 SQL dumps in `/docker-entrypoint-initdb.d/` |
| `ghostnet-retro/arcturus` | `maven:3.9-temurin-17` | `temurin:17-jre-alpine` | `Habbo.jar` + `NitroWebsockets-3.1.jar`           |
| `ghostnet-retro/nitro`    | `node:20-alpine`       | `nginx:alpine`          | Vite-built static `dist/` from `nitro-react`      |
| `ghostnet-retro/assets`   | (n/a)                  | `nginx:alpine`          | `dev/retro/nitro/nitro-assets/` (~10k .nitro)     |

> **Asset prereq:** `dev/retro/nitro/nitro-assets/bundled/` must already
> contain the converted bundles before building the `assets` image.
> Run `npm run retro:assets:extract` once in dev to populate it.

### Lifecycle

```json
"retro:deploy:up":         "docker compose ... --env-file deploy/retro/.env up -d",
"retro:deploy:down":       "docker compose ... down",
"retro:deploy:down:clean": "docker compose ... down -v",
"retro:deploy:restart":    "docker compose ... restart",
"retro:deploy:ps":         "docker compose ... ps",
"retro:deploy:logs":       "docker compose ... logs -f",
"retro:deploy:mysql":      "docker compose ... exec mariadb mariadb -uroot -p"
```

| Script                    | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `retro:deploy:up`         | Start the production stack. Reads `deploy/retro/.env`.                 |
| `retro:deploy:down`       | Stop containers, **keep** `mariadb-data` volume.                       |
| `retro:deploy:down:clean` | Stop AND wipe every prod volume — **destroys prod data**, total reset. |
| `retro:deploy:restart`    | Restart every running prod service.                                    |
| `retro:deploy:ps`         | Show prod service status.                                              |
| `retro:deploy:logs`       | Tail every prod service.                                               |
| `retro:deploy:mysql`      | `mariadb` shell into the prod DB (prompts for root password).          |

### First-time setup

```bash
cp deploy/retro/.env.example deploy/retro/.env   # 1. template
$EDITOR deploy/retro/.env                         # 2. replace every replace-me-*
npm run retro:assets:extract                     # 3. produce .nitro bundles in dev/
npm run retro:build                              # 4. build all 4 images
npm run retro:deploy:up                          # 5. start
npm run retro:deploy:logs                        # 6. watch first boot
```

### Port layout (all 127.0.0.1-only)

| Bound port | Service                         |
| ---------- | ------------------------------- |
| `3306`     | MariaDB                         |
| `3000`     | Arcturus game socket / Nitro WS |
| `3001`     | Arcturus RCON                   |
| `2096`     | Arcturus camera + REST          |
| `1080`     | Nitro client (open in browser)  |
| `8080`     | Asset server                    |

Front the loopback ports with a host reverse proxy (nginx, Caddy,
Traefik, …) for TLS termination and public exposure. See
`deploy/retro/connect.txt` for the full deployment + backup/restore guide.

---

## Retro release / dev → prod promotion

Versioned promotion of the dev submodule state into the deploy stack.
Each release captures the current submodule SHAs, bumps the version,
rewrites `deploy/retro/.env`, writes `deploy/retro/MANIFEST.json`, and
rebuilds the four production images at the new tag.

```json
"retro:release:current": "bash scripts/retro-release.sh current",
"retro:release:diff":    "bash scripts/retro-release.sh diff",
"retro:release:patch":   "bash scripts/retro-release.sh patch",
"retro:release:minor":   "bash scripts/retro-release.sh minor",
"retro:release:major":   "bash scripts/retro-release.sh major",
"retro:release:push":    "bash scripts/retro-release.sh push"
```

| Script                  | What it does                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `retro:release:current` | Print the current `RETRO_VERSION`.                                                                                                                          |
| `retro:release:diff`    | Compare submodule SHAs in `dev/retro/` to those in `MANIFEST.json` — shows what's new since the last release.                                               |
| `retro:release:patch`   | Bump `0.1.0 → 0.1.1`, snapshot SHAs, rebuild all 4 prod images.                                                                                             |
| `retro:release:minor`   | Bump `0.1.0 → 0.2.0`, ditto.                                                                                                                                |
| `retro:release:major`   | Bump `0.1.0 → 1.0.0`, ditto.                                                                                                                                |
| `retro:release:push`    | Tag and push the four images at the current version to a registry. Pass the registry as a positional arg via `npm run retro:release:push -- ghcr.io/<org>`. |

### What ends up in `deploy/retro/MANIFEST.json`

```json
{
  "version": "0.1.1",
  "released": "2026-04-30T20:00:00Z",
  "components": {
    "arcturus": "<git-sha>",
    "nitro-react": "<git-sha>",
    "nitro-converter": "<git-sha>",
    "nitro-assets": "<git-sha>",
    "nitro-swf": "<git-sha>"
  },
  "images": [
    "ghostnet-retro/mariadb:0.1.1",
    "ghostnet-retro/arcturus:0.1.1",
    "ghostnet-retro/nitro:0.1.1",
    "ghostnet-retro/assets:0.1.1"
  ]
}
```

The manifest is the single source of truth for "which submodule
commits are in production right now". `retro:release:diff` reads it.
Tag the git commit after each release: `git tag retro-v0.1.1`.

### Typical release flow

```bash
# 1. See what's new in dev/ since the last release.
npm run retro:release:diff

# 2. Pick a bump.
npm run retro:release:patch        # or :minor / :major

# 3. Sanity-check the new images locally.
npm run retro:deploy:up
npm run retro:deploy:logs

# 4. (Optional) push to a registry.
npm run retro:release:push -- ghcr.io/<org>

# 5. Tag the commit so the version trail lives in git history.
git add deploy/retro/.env deploy/retro/MANIFEST.json
git commit -m "retro: release v0.1.1"
git tag retro-v0.1.1
```

---

## Root `Dockerfile` (monorepo CI / runtime base)

Multi-stage Dockerfile at the repo root, separate from the per-service
Dockerfiles in `deploy/retro/`. Five build targets:

```bash
docker build --target base    -t ghostnet/base    .   # Node 22 + workspace deps
docker build --target check   -t ghostnet/ci      .   # full quality gate
docker build --target build   -t ghostnet/build   .   # nx run-many build
docker build --target runtime -t ghostnet/app --build-arg TARGET=apps/web .
```

| Stage     | Purpose                                                                                 |
| --------- | --------------------------------------------------------------------------------------- |
| `base`    | Node 22 + every workspace `package.json` + `npm ci`. Cached layer for everything below. |
| `source`  | Adds the rest of the source on top of `base`.                                           |
| `check`   | Runs `npm run check` (format / lint / typecheck / test).                                |
| `build`   | Runs `npm run build` (Nx build of every project).                                       |
| `runtime` | Thin Node + tini image. Pass `TARGET=path/to/package` to ship a single workspace.       |

Two convenience scripts:

```json
"docker:check": "docker build --target check -t ghostnet/ci .",
"docker:build": "docker build --target build -t ghostnet/build ."
```

| Script         | When to use                                                       |
| -------------- | ----------------------------------------------------------------- |
| `docker:check` | CI pre-merge — same `npm run check` as locally, but inside Docker |
| `docker:build` | Builds every project's dist artifacts inside Docker               |

---

## Dependencies

### `devDependencies`

Tooling needed at development time only — never shipped to production.

| Package                             | Role                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `nx`                                | Workspace orchestration + task runner + cache.                                      |
| `@nx/eslint-plugin`                 | Module boundary enforcement (`@nx/enforce-module-boundaries`).                      |
| `typescript`                        | Language compiler and type checker.                                                 |
| `eslint`                            | Linter core.                                                                        |
| `@eslint/js`                        | Built-in JS rule set, peer dep of `@nx/eslint-plugin`.                              |
| `typescript-eslint`                 | Strict + stylistic TypeScript rules.                                                |
| `eslint-config-prettier`            | Disables ESLint formatting rules that conflict with Prettier.                       |
| `eslint-plugin-import-x`            | Maintained `eslint-plugin-import` fork with native flat-config and faster resolver. |
| `eslint-import-resolver-typescript` | Lets `import-x` resolve TS path aliases.                                            |
| `eslint-plugin-unicorn`             | Modern JS idioms and best practices.                                                |
| `eslint-plugin-sonarjs`             | Code smells and cognitive complexity.                                               |
| `eslint-plugin-promise`             | Promise correctness rules.                                                          |
| `eslint-plugin-n`                   | Node platform rules.                                                                |
| `eslint-plugin-security`            | Common security anti-patterns.                                                      |
| `eslint-plugin-unused-imports`      | More aggressive dead-code rules than the built-in.                                  |
| `globals`                           | Pre-defined env globals for flat config.                                            |
| `prettier`                          | Code formatter.                                                                     |
| `rimraf`                            | Cross-platform `rm -rf` for the `clean` script.                                     |

> **`dependencies` is intentionally absent.** The root workspace produces
> nothing at runtime — it only holds tooling. Each app/lib declares its own
> runtime dependencies in its own `package.json`.
