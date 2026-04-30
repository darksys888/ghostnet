# GHOSTNET monorepo — top-level convenience targets.
# Each target is a thin wrapper around the matching npm script so the two stay in sync.
# Recipe lines MUST start with a TAB (Make requirement) — .editorconfig enforces this.

# Declare phony targets so Make never confuses them with files of the same name.
.PHONY: setup check clean build build-dev build-prod start start-dev start-prod \
        lint lint-fix format format-check e2e e2e-open \
        e2e-retro e2e-retro-open e2e-devcontainer e2e-devcontainer-open \
        e2e-cdn e2e-cdn-open e2e-hostnames e2e-hostnames-open \
        cdn-dev cdn-start cdn-build cdn-push cdn-push-dry cdn-push-check \
        hosts-install hosts-remove hosts-status \
        caddy-start caddy-reload caddy-fmt caddy-validate \
        dev-up dev-up-build dev-down dev-down-clean dev-restart dev-ps dev-logs \
        dev-psql dev-mysql dev-redis \
        retro-up retro-up-build retro-down retro-down-clean retro-restart \
        retro-ps retro-logs retro-mysql retro-emulator-logs retro-nitro-logs \
        retro-recompile retro-assets-extract \
        retro-build retro-build-nocache retro-deploy-up retro-deploy-down \
        retro-deploy-down-clean retro-deploy-restart retro-deploy-ps \
        retro-deploy-logs retro-deploy-mysql \
        retro-release-current retro-release-diff retro-release-patch \
        retro-release-minor retro-release-major retro-release-push \
        docker-check docker-build \
        graph affected affected-lint affected-test affected-build help

# Compose CLI shortcuts — every target reuses these so paths live in one place.
COMPOSE        := docker compose -f .devcontainer/docker-compose.yml
COMPOSE_RETRO  := docker compose -f dev/retro/docker-compose.yaml
COMPOSE_DEPLOY := docker compose -f deploy/retro/docker-compose.yaml --env-file deploy/retro/.env

# Default target when running bare `make` — prints help.
.DEFAULT_GOAL := help

# Show the available targets and what each one does.
help:
	@echo "GHOSTNET monorepo — available targets:"
	@echo ""
	@echo "  Setup / quality"
	@echo "    make setup       - install dependencies (npm install)"
	@echo "    make check       - format-check + lint + typecheck + test (full quality gate)"
	@echo "    make lint        - run ESLint across the workspace"
	@echo "    make lint-fix    - run ESLint with --fix"
	@echo "    make format      - run Prettier --write across the workspace"
	@echo "    make format-check - run Prettier --check (CI-friendly, no writes)"
	@echo "    make clean       - reset Nx cache and remove node_modules + build output"
	@echo ""
	@echo "  Build (per environment)"
	@echo "    make build       - build every project, project default configuration"
	@echo "    make build-dev   - build every project for DEVELOPMENT (fast, source maps)"
	@echo "    make build-prod  - build every project for PRODUCTION (optimised, minified)"
	@echo ""
	@echo "  Start (per environment)"
	@echo "    make start       - serve every project (development mode)"
	@echo "    make start-dev   - serve every project for DEVELOPMENT (hot reload)"
	@echo "    make start-prod  - serve every project for PRODUCTION preview (built bundle)"
	@echo ""
	@echo "  End-to-end tests"
	@echo "    make e2e                     - run every project's e2e target headlessly"
	@echo "    make e2e-open                - open the interactive Cypress runner (devcontainer suite)"
	@echo "    make e2e-devcontainer        - run only the devcontainer Cypress suite"
	@echo "    make e2e-devcontainer-open   - open the devcontainer Cypress UI"
	@echo "    make e2e-retro               - run only the Retro stack Cypress suite"
	@echo "    make e2e-retro-open          - open the Retro Cypress UI"
	@echo "    make e2e-cdn                 - run the CDN security Cypress suite"
	@echo "    make e2e-cdn-open            - open the CDN Cypress UI"
	@echo "    make e2e-hostnames           - run the hosts file + Caddy routing suite"
	@echo "    make e2e-hostnames-open      - open the hostnames Cypress UI"
	@echo ""
	@echo "  Hosts file + Caddy reverse proxy"
	@echo "    make hosts-install           - inject *.ghostnetw.test into the system hosts file"
	@echo "    make hosts-remove            - remove the GHOSTNET hosts block"
	@echo "    make hosts-status            - show whether the block is installed"
	@echo "    make caddy-start             - run Caddy with dev/caddy/Caddyfile"
	@echo "    make caddy-reload            - reload Caddy after editing the Caddyfile"
	@echo "    make caddy-fmt               - format the Caddyfile in place"
	@echo "    make caddy-validate          - validate the Caddyfile syntax"
	@echo ""
	@echo "  Public CDN (services/cdn/) — serves public/ with strict security"
	@echo "    make cdn-dev                 - watch-mode Fastify (tsx)"
	@echo "    make cdn-start               - compiled production server (tsc → dist → node)"
	@echo "    make cdn-build               - tsc compile to dist/"
	@echo "    make cdn-push                - rclone sync public/ → cloud bucket"
	@echo "    make cdn-push-dry            - show what would change, no upload"
	@echo "    make cdn-push-check          - verify provider creds + connectivity"
	@echo ""
	@echo "  Dev container — service lifecycle"
	@echo "    make dev-up         - start every .devcontainer service in the background"
	@echo "    make dev-up-build   - rebuild the workspace image, then start (after Dockerfile changes)"
	@echo "    make dev-down       - stop services (named volumes are preserved)"
	@echo "    make dev-down-clean - stop services AND wipe named volumes (clean slate)"
	@echo "    make dev-restart    - restart all running services"
	@echo "    make dev-ps         - show the status of every compose service"
	@echo "    make dev-logs       - tail logs of every service (follow)"
	@echo ""
	@echo "  Dev container — database shells"
	@echo "    make dev-psql       - psql shell into the postgres service"
	@echo "    make dev-mysql      - mysql shell into the retro database"
	@echo "    make dev-redis      - redis-cli shell into the redis service"
	@echo ""
	@echo "  Retro Habbo (dev/retro/, Holo5/nitro-docker base) — full stack"
	@echo "    make retro-up              - start MariaDB + Arcturus + Nitro (first build ~5-10 min)"
	@echo "    make retro-up-build        - rebuild images, then start"
	@echo "    make retro-down            - stop services (data preserved)"
	@echo "    make retro-down-clean      - stop AND wipe Retro named volumes"
	@echo "    make retro-restart         - restart every Retro service"
	@echo "    make retro-ps              - show Retro service status"
	@echo "    make retro-logs            - tail logs of every Retro service"
	@echo "    make retro-mysql           - mysql shell (arcturus DB)"
	@echo "    make retro-emulator-logs   - tail just the Arcturus emulator logs"
	@echo "    make retro-nitro-logs      - tail just the Nitro dev-server logs"
	@echo "    make retro-recompile       - rebuild + restart the emulator after Java edits"
	@echo "    make retro-assets-extract  - convert SWFs to .nitro bundles (run once after first up)"
	@echo ""
	@echo "  Retro PRODUCTION (deploy/retro/) — pre-baked images"
	@echo "    make retro-build              - build all 4 prod images (~10-15 min cold)"
	@echo "    make retro-build-nocache      - same, --no-cache (clean rebuild)"
	@echo "    make retro-deploy-up          - start the production stack"
	@echo "    make retro-deploy-down        - stop, KEEP data volume"
	@echo "    make retro-deploy-down-clean  - stop AND wipe MariaDB volume"
	@echo "    make retro-deploy-restart     - restart all prod services"
	@echo "    make retro-deploy-ps          - status of prod services"
	@echo "    make retro-deploy-logs        - tail every prod service"
	@echo "    make retro-deploy-mysql       - mysql shell into the prod MariaDB"
	@echo ""
	@echo "  Retro RELEASE — versioned dev → prod promotion"
	@echo "    make retro-release-current   - print current RETRO_VERSION"
	@echo "    make retro-release-diff      - submodule SHAs drifted since last release"
	@echo "    make retro-release-patch     - bump patch (0.1.0 → 0.1.1) + build"
	@echo "    make retro-release-minor     - bump minor (0.1.0 → 0.2.0) + build"
	@echo "    make retro-release-major     - bump major (0.1.0 → 1.0.0) + build"
	@echo "    make retro-release-push REGISTRY=ghcr.io/<org>"
	@echo "                                 - tag + push images to a registry"
	@echo ""
	@echo "  Root Dockerfile (monorepo CI / runtime base)"
	@echo "    make docker-check            - build the 'check' stage (full quality gate)"
	@echo "    make docker-build            - build the 'build' stage (nx run-many build)"
	@echo ""
	@echo "  Nx-native commands (project graph, affected projects)"
	@echo "    make graph                   - open the interactive Nx project graph"
	@echo "    make affected                - run lint+typecheck+test on affected projects"
	@echo "    make affected-lint           - lint only affected projects"
	@echo "    make affected-test           - test only affected projects"
	@echo "    make affected-build          - build only affected projects"

# Install dependencies — first thing to run after a fresh clone.
setup:
	npm install

# Full quality gate. CI should run this; matches what `npm run check` does locally.
check:
	npm run check

# ESLint only — useful while iterating on a single file/feature.
lint:
	npm run lint

# ESLint --fix — auto-correct fixable issues in place.
lint-fix:
	npm run lint:fix

# Prettier --write — auto-format every supported file in place.
format:
	npm run format

# Prettier --check — verify formatting without writing (use this in CI).
format-check:
	npm run format:check

# Wipe caches and node_modules. After this, run `make setup` to reinstall.
clean:
	npm run clean

# ── Build ────────────────────────────────────────────────────────
# Default build: each project's default configuration (usually prod for libs, dev for apps).
build:
	npm run build

# Development build: fast, unminified, source maps for debugging.
build-dev:
	npm run build:dev

# Production build: minified, optimised, ready to deploy.
build-prod:
	npm run build:prod

# ── Start (serve) ────────────────────────────────────────────────
# Default start: development mode (hot reload, dev server, source maps).
start:
	npm run start

# Explicit development serve — alias of `start` for clarity.
start-dev:
	npm run start:dev

# Production preview: runs the optimised bundle locally so you can sanity-check before deploy.
start-prod:
	npm run start:prod

# ── End-to-end tests ─────────────────────────────────────────────
# Headless Cypress run for every project that defines an `e2e` target.
e2e:
	npm run e2e

# Interactive Cypress runner for the dev-container suite.
e2e-open:
	npm run e2e:open

# Retro stack tests (requires `npm run dev:up && npm run retro:up`).
e2e-retro:
	npm run e2e:retro

e2e-retro-open:
	npm run e2e:retro:open

# Dev-container suite (alias of `e2e` + `e2e-open` for clarity).
e2e-devcontainer:
	npm run e2e:devcontainer

e2e-devcontainer-open:
	npm run e2e:devcontainer:open

# CDN security suite (requires the CDN to be running — see `cdn-dev`).
e2e-cdn:
	npm run e2e:cdn

e2e-cdn-open:
	npm run e2e:cdn:open

# Hosts file + Caddy routing suite.
e2e-hostnames:
	npm run e2e:hostnames

e2e-hostnames-open:
	npm run e2e:hostnames:open

# ── Public CDN (services/cdn/) ──────────────────────────────────
# Watch-mode dev server (Fastify via tsx), serves repo public/.
cdn-dev:
	npm run cdn:dev

# Compiled production server.
cdn-start:
	npm run cdn:start

# Compile TypeScript to dist/.
cdn-build:
	npm run cdn:build

# Sync public/ to a real cloud CDN (rclone-based — provider in .env).
cdn-push:
	npm run cdn:push

# Show what would change without uploading.
cdn-push-dry:
	npm run cdn:push:dry

# Verify provider credentials + remote bucket reachability.
cdn-push-check:
	npm run cdn:push:check

# ── Hosts file + Caddy reverse proxy ────────────────────────────
# Inject *.ghostnetw.test entries into the system hosts file. Requires
# admin/sudo. On Windows, prefer scripts/hosts.ps1 (self-elevates).
hosts-install:
	npm run hosts:install

hosts-remove:
	npm run hosts:remove

hosts-status:
	npm run hosts:status

# Caddy reverse proxy fronting every local service. Run AFTER bringing up
# the backends + installing the hosts file. Caddy must be on PATH —
# winget install CaddyServer.Caddy / brew install caddy / apt install caddy.
caddy-start:
	npm run caddy:start

caddy-reload:
	npm run caddy:reload

caddy-fmt:
	npm run caddy:fmt

caddy-validate:
	npm run caddy:validate

# ── Dev container — service lifecycle ────────────────────────────
# Start every service in the background. Named volumes mean data persists across restarts.
dev-up:
	$(COMPOSE) up -d

# Rebuild the workspace image (after editing .devcontainer/Dockerfile), then start.
dev-up-build:
	$(COMPOSE) up -d --build

# Stop services. Named volumes are preserved — `dev-up` will resume right where you left off.
dev-down:
	$(COMPOSE) down

# Stop AND wipe every named volume — postgres data, mysql data, redis AOF, minio buckets, npm cache.
# Use this when you need a guaranteed-clean state.
dev-down-clean:
	$(COMPOSE) down -v

# Restart every running service in place. Useful after editing docker-compose.yml.
dev-restart:
	$(COMPOSE) restart

# Show the status of every compose service.
dev-ps:
	$(COMPOSE) ps

# Tail logs of every service. Append a service name to scope: `make dev-logs SERVICE=postgres`.
dev-logs:
	$(COMPOSE) logs -f $(SERVICE)

# ── Dev container — database shells ──────────────────────────────
# Open an interactive psql session against the GHOSTNET database.
dev-psql:
	$(COMPOSE) exec postgres psql -U ghostnet -d ghostnet

# Open an interactive mysql session against the retro (Habbo) database.
dev-mysql:
	$(COMPOSE) exec mysql mysql -uretro -pretro retro

# Open redis-cli against the redis service.
dev-redis:
	$(COMPOSE) exec redis redis-cli

# ── Retro Habbo (dev/retro/) — service lifecycle ─────────────────
# Start the full Retro stack (MySQL + Arcturus + CMS + Nitro + assets).
retro-up:
	$(COMPOSE_RETRO) up -d

# Rebuild images (after editing Dockerfiles or templates), then start.
retro-up-build:
	$(COMPOSE_RETRO) up -d --build

# Stop services. Named volumes (mysql data, emulator logs, camera) preserved.
retro-down:
	$(COMPOSE_RETRO) down

# Stop AND wipe every Retro-stack named volume — full reset.
retro-down-clean:
	$(COMPOSE_RETRO) down -v

# Restart every running Retro service.
retro-restart:
	$(COMPOSE_RETRO) restart

# Show the status of every Retro compose service.
retro-ps:
	$(COMPOSE_RETRO) ps

# Tail logs of every Retro service. Append `SERVICE=arcturus` to scope.
retro-logs:
	$(COMPOSE_RETRO) logs -f $(SERVICE)

# ── Retro Habbo — convenience shells ─────────────────────────────
# mysql shell into the Retro DB (lives inside the .devcontainer mysql now).
retro-mysql:
	$(COMPOSE) exec mysql mysql -uarcturus_user -parcturus_pw arcturus

# Tail just the Arcturus emulator logs — the most-watched stream.
retro-emulator-logs:
	$(COMPOSE_RETRO) logs -f arcturus

# Tail just the Nitro dev-server logs.
retro-nitro-logs:
	$(COMPOSE_RETRO) logs -f nitro

# Rebuild the JAR after editing Arcturus source, then restart the emulator
# inside the running container (no full container restart needed).
retro-recompile:
	$(COMPOSE_RETRO) exec arcturus bash -c "cd /app/arcturus && mvn package && cp /app/config.ini /app/arcturus/target/config.ini"
	$(COMPOSE_RETRO) exec arcturus supervisorctl restart arcturus-emulator

# Convert the bundled SWFs into Nitro .nitro bundles + sync to the asset
# server's serving directory. Takes ~5-15 min on first run.
# Pipeline:
#   1. yarn build  → compiles the converter (tsc → dist/)
#   2. node Main.js → downloads SWFs, runs all converters, produces ~10k bundles
#   3. cp -rT       → syncs converter output into /app/nitro-assets/{bundled,gamedata}
#                    (Holo5's asset HTTP server on :8080 serves from there)
retro-assets-extract:
	$(COMPOSE_RETRO) exec nitro bash -c "cd /app/nitro-converter && yarn build && node ./dist/Main.js && cp -rT /app/nitro-converter/assets/bundled /app/nitro-assets/bundled && cp -rT /app/nitro-converter/assets/gamedata /app/nitro-assets/gamedata"

# ── Retro PRODUCTION (deploy/retro/) ─────────────────────────────
# Build all 4 production images (mariadb, arcturus, nitro, assets).
# Reads source from dev/retro/ submodules; produces thin runtime images.
retro-build:
	$(COMPOSE_DEPLOY) build

# --no-cache variant — forces every layer to rebuild.
retro-build-nocache:
	$(COMPOSE_DEPLOY) build --no-cache

# Start the production stack. Reads secrets from deploy/retro/.env.
# All ports bind to 127.0.0.1 — front with a host reverse proxy.
retro-deploy-up:
	$(COMPOSE_DEPLOY) up -d

# Stop, keep the mariadb-data volume.
retro-deploy-down:
	$(COMPOSE_DEPLOY) down

# Stop AND wipe every named volume — full reset (DESTROYS PROD DATA).
retro-deploy-down-clean:
	$(COMPOSE_DEPLOY) down -v

# Restart every running prod service.
retro-deploy-restart:
	$(COMPOSE_DEPLOY) restart

# Show prod service status.
retro-deploy-ps:
	$(COMPOSE_DEPLOY) ps

# Tail prod service logs.
retro-deploy-logs:
	$(COMPOSE_DEPLOY) logs -f

# mysql shell into the prod MariaDB. Prompts for the root password.
retro-deploy-mysql:
	$(COMPOSE_DEPLOY) exec mariadb mariadb -uroot -p

# ── Retro RELEASE — versioned dev → prod promotion ───────────────
# Each target wraps scripts/retro-release.sh. See `bash scripts/retro-release.sh --help`.
retro-release-current:
	bash scripts/retro-release.sh current

retro-release-diff:
	bash scripts/retro-release.sh diff

retro-release-patch:
	bash scripts/retro-release.sh patch

retro-release-minor:
	bash scripts/retro-release.sh minor

retro-release-major:
	bash scripts/retro-release.sh major

# Push the four images at the CURRENT version to a registry.
# Usage: make retro-release-push REGISTRY=ghcr.io/<org>
retro-release-push:
	bash scripts/retro-release.sh push $(REGISTRY)

# ── Root Dockerfile — monorepo CI / runtime base ─────────────────
# `check` stage runs the full quality gate inside Docker (CI use).
docker-check:
	docker build --target check -t ghostnet/ci .

# `build` stage runs `nx run-many --target=build`.
docker-build:
	docker build --target build -t ghostnet/build .

# ── Nx-native commands ──────────────────────────────────────────
# Open the interactive Nx project graph in a browser tab.
graph:
	npx nx graph

# Run lint+typecheck+test only on projects affected by changes since defaultBase.
affected:
	npx nx affected --targets=lint,typecheck,test

# Affected only — single target each.
affected-lint:
	npx nx affected --target=lint

affected-test:
	npx nx affected --target=test

affected-build:
	npx nx affected --target=build
