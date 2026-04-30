# GHOSTNET dev container image.
# Microsoft's TypeScript-Node devcontainer image already ships:
#   - Node 22 + npm
#   - git, curl, jq, ssh
#   - non-root `node` user with sudo
# We only add the CLI clients useful for talking to sibling services.

FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

# Switch to root so apt-get can install system packages.
USER root

# Install client utilities for the docker-compose services:
#   - postgresql-client    → `psql`
#   - default-mysql-client → `mysql` (MariaDB build, fully MySQL-compatible)
#   - redis-tools          → `redis-cli`
#   - netcat-openbsd       → `nc` (handy for waiting on ports)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       postgresql-client \
       default-mysql-client \
       redis-tools \
       netcat-openbsd \
  && rm -rf /var/lib/apt/lists/*

# Drop privileges before VS Code attaches.
USER node
