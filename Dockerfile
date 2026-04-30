# GHOSTNET monorepo — multi-stage Dockerfile.
# Single image, multiple build targets:
#
#   • base    → Node 22 + workspace deps (cached layer for everything below)
#   • check   → runs the full quality gate (CI use: format + lint + typecheck)
#   • build   → runs `nx run-many --target=build` (produces dist artifacts)
#   • runtime → minimal image to ship a single workspace package
#
# Build a specific stage:
#   docker build --target check   -t ghostnet/ci .
#   docker build --target build   -t ghostnet/build .
#   docker build --target runtime -t ghostnet/app --build-arg TARGET=apps/web .
#
# This Dockerfile is intentionally separate from the per-service Dockerfiles
# in deploy/retro/ — those bake game artifacts; this one is for the JS/TS
# workspace that lives under apps/, libs/, packages/, services/, etc.

# ─── Stage 1: base (deps cached) ─────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /workspace

# `libc6-compat` covers the few Node native modules that need glibc
# shims on Alpine (better-sqlite3, sharp, …). Skipped on most workspaces.
RUN apk add --no-cache libc6-compat tini

# Copy lockfile + every workspace package.json before source — installs
# regenerate only when a package.json or the lockfile changes.
COPY package.json package-lock.json ./
COPY apps/ apps/
COPY bots/ bots/
COPY libs/ libs/
COPY packages/ packages/
COPY services/ services/
COPY tests/ tests/

# Install every workspace + their dev deps. `--include-workspace-root`
# pulls the root devDependencies (nx, eslint, prettier, …).
RUN npm ci --include=dev --workspaces --include-workspace-root

# ─── Stage 2: full source (everything below uses this) ───────────
FROM base AS source
COPY . .

# ─── Stage 3: check — full quality gate ──────────────────────────
# CI image. `docker build --target check .` returns non-zero if anything
# fails: format / lint / typecheck / unit tests.
FROM source AS check
RUN npm run check

# ─── Stage 4: build — Nx build of every project ──────────────────
# Produces dist/ output for every workspace project.
FROM source AS build
RUN npm run build

# ─── Stage 5: runtime — thin shippable image for one package ─────
# Pass TARGET=path/to/package (e.g. TARGET=apps/web) at build time. The
# runtime image only contains node_modules + the built dist for that
# single package, with `tini` as PID 1.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

ARG TARGET=
RUN apk add --no-cache tini

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/package.json ./package.json
# The TARGET workspace's full directory (including its own dist/).
COPY --from=build /workspace/${TARGET}/ ./

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "."]
