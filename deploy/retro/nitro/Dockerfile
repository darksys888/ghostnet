# Nitro client — production multi-stage build.
# Produces an nginx image serving the Vite-built static bundle.

# ── Stage 1: Build the static bundle ─────────────────────────────
FROM node:25-alpine AS builder
WORKDIR /build

# Install deps first for layer caching.
COPY dev/retro/nitro/nitro-react/package.json dev/retro/nitro/nitro-react/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# Source + build-time configuration overrides (renderer-config.json, ui-config.json).
COPY dev/retro/nitro/nitro-react/ ./
COPY dev/retro/nitro/configuration/nitro-react/public/ ./public/

# Vite build → ./dist
RUN yarn build

# ── Stage 2: nginx static serve ──────────────────────────────────
FROM nginx:alpine
COPY deploy/retro/nitro/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html
EXPOSE 80
