#!/usr/bin/env bash
# retro-release.sh — promote dev/retro/ submodule state into a versioned
# deploy/retro/ release.
#
# Workflow:
#   1. dev/retro/ submodules track upstream commits (Arcturus, Nitro, …).
#   2. When you're ready to ship, this script:
#        • bumps RETRO_VERSION in deploy/retro/.env
#        • snapshots the current submodule SHAs into deploy/retro/MANIFEST.json
#        • rebuilds the four production images with the new version tag
#        • (optionally) tags the git commit and pushes images to a registry
#
# Usage:
#   bash scripts/retro-release.sh patch                # 0.1.0 → 0.1.1
#   bash scripts/retro-release.sh minor                # 0.1.0 → 0.2.0
#   bash scripts/retro-release.sh major                # 0.1.0 → 1.0.0
#   bash scripts/retro-release.sh set 1.2.3            # explicit version
#   bash scripts/retro-release.sh current              # print current version
#   bash scripts/retro-release.sh diff                 # what's changed since last release
#   bash scripts/retro-release.sh push <registry-host> # push images to a registry

set -euo pipefail

# ─── Resolve repo paths (independent of where you invoke from) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/deploy/retro/.env"
MANIFEST="${REPO_ROOT}/deploy/retro/MANIFEST.json"
ENV_EXAMPLE="${REPO_ROOT}/deploy/retro/.env.example"

# ─── Pretty logging ─────────────────────────────────────────────
log()  { printf '\033[1;36m[release]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[release]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[release]\033[0m %s\n' "$*" >&2; exit 1; }

# ─── Read the current version (.env > .env.example > 0.0.0) ─────
current_version() {
  local file
  for file in "$ENV_FILE" "$ENV_EXAMPLE"; do
    if [ -f "$file" ]; then
      local v
      v=$(grep -E '^RETRO_VERSION=' "$file" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
      if [ -n "$v" ]; then echo "$v"; return; fi
    fi
  done
  echo "0.0.0"
}

# ─── Compute the next version from a bump kind ──────────────────
bump_version() {
  local current="$1"
  local kind="$2"
  IFS='.' read -r major minor patch <<< "$current"
  case "$kind" in
    major) major=$((major+1)); minor=0; patch=0 ;;
    minor) minor=$((minor+1)); patch=0 ;;
    patch) patch=$((patch+1)) ;;
    *)     err "Unknown bump kind: $kind (expected major/minor/patch)" ;;
  esac
  echo "${major}.${minor}.${patch}"
}

# ─── Read the commit SHA of a submodule directory ───────────────
submodule_sha() {
  local path="$1"
  if [ -d "$path/.git" ] || [ -f "$path/.git" ]; then
    git -C "$path" rev-parse HEAD 2>/dev/null || echo "unknown"
  else
    echo "missing"
  fi
}

# ─── Write deploy/retro/MANIFEST.json describing this release ───
write_manifest() {
  local version="$1"
  local released_at
  released_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  mkdir -p "$(dirname "$MANIFEST")"
  cat > "$MANIFEST" <<EOF
{
  "version": "${version}",
  "released": "${released_at}",
  "components": {
    "arcturus":        "$(submodule_sha "${REPO_ROOT}/dev/retro/emulator/arcturus")",
    "nitro-react":     "$(submodule_sha "${REPO_ROOT}/dev/retro/nitro/nitro-react")",
    "nitro-converter": "$(submodule_sha "${REPO_ROOT}/dev/retro/nitro/nitro-converter")",
    "nitro-assets":    "$(submodule_sha "${REPO_ROOT}/dev/retro/nitro/nitro-assets")",
    "nitro-swf":       "$(submodule_sha "${REPO_ROOT}/dev/retro/nitro/nitro-swf")"
  },
  "images": [
    "ghostnet-retro/mariadb:${version}",
    "ghostnet-retro/arcturus:${version}",
    "ghostnet-retro/nitro:${version}",
    "ghostnet-retro/assets:${version}"
  ]
}
EOF
  log "Wrote ${MANIFEST}"
}

# ─── Update RETRO_VERSION line inside deploy/retro/.env ─────────
update_env_version() {
  local new_version="$1"
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
      log "deploy/retro/.env not found — copying from .env.example."
      cp "$ENV_EXAMPLE" "$ENV_FILE"
    else
      log "Creating fresh deploy/retro/.env."
      echo "RETRO_VERSION=${new_version}" > "$ENV_FILE"
      return
    fi
  fi

  # Portable in-place edit (works on GNU + BSD sed via temp file).
  local tmp
  tmp="$(mktemp)"
  if grep -qE '^RETRO_VERSION=' "$ENV_FILE"; then
    sed "s|^RETRO_VERSION=.*|RETRO_VERSION=${new_version}|" "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    cat "$ENV_FILE" > "$tmp"
    echo "RETRO_VERSION=${new_version}" >> "$tmp"
    mv "$tmp" "$ENV_FILE"
  fi
  log "Updated RETRO_VERSION → ${new_version} in deploy/retro/.env"
}

# ─── Build the four production images at the new version tag ────
build_images() {
  log "Building production images..."
  (cd "$REPO_ROOT" && \
   docker compose -f deploy/retro/docker-compose.yaml --env-file deploy/retro/.env build)
  log "Images built. Listing..."
  docker images --filter "reference=ghostnet-retro/*" \
    --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# ─── Run a release end-to-end ───────────────────────────────────
run_release() {
  local target_version="$1"
  log "Releasing version ${target_version}"
  update_env_version "$target_version"
  write_manifest "$target_version"
  build_images
  log "Done. Tag this commit with: git tag retro-v${target_version}"
}

# ─── Show what's changed in submodule SHAs since last release ───
do_diff() {
  if [ ! -f "$MANIFEST" ]; then
    log "No previous MANIFEST.json — this would be the first release."
    return
  fi
  log "Submodule SHA comparison (manifest → current):"
  local components=(arcturus nitro-react nitro-converter nitro-assets nitro-swf)
  local paths=(
    "${REPO_ROOT}/dev/retro/emulator/arcturus"
    "${REPO_ROOT}/dev/retro/nitro/nitro-react"
    "${REPO_ROOT}/dev/retro/nitro/nitro-converter"
    "${REPO_ROOT}/dev/retro/nitro/nitro-assets"
    "${REPO_ROOT}/dev/retro/nitro/nitro-swf"
  )
  for i in "${!components[@]}"; do
    local name="${components[$i]}"
    local path="${paths[$i]}"
    local manifest_sha
    manifest_sha="$(grep -oE "\"${name}\":\s*\"[a-f0-9]+\"" "$MANIFEST" | grep -oE '[a-f0-9]+' | tail -1)"
    local current_sha
    current_sha="$(submodule_sha "$path")"
    if [ "${manifest_sha:-?}" = "${current_sha:-?}" ]; then
      printf '  ✓ %-18s unchanged (%s)\n' "$name" "${current_sha:0:8}"
    else
      printf '  ↑ %-18s %s → %s\n' "$name" "${manifest_sha:0:8}" "${current_sha:0:8}"
    fi
  done
}

# ─── Push images to a registry ──────────────────────────────────
do_push() {
  local registry="$1"
  local version
  version="$(current_version)"
  [ -n "$registry" ] || err "push requires a registry host (e.g. ghcr.io/<org>)"
  log "Pushing images at version ${version} to ${registry}..."
  local services=(mariadb arcturus nitro assets)
  for svc in "${services[@]}"; do
    local local_tag="ghostnet-retro/${svc}:${version}"
    local remote_tag="${registry}/ghostnet-retro/${svc}:${version}"
    log "  ${local_tag} → ${remote_tag}"
    docker tag  "$local_tag"  "$remote_tag"
    docker push "$remote_tag"
  done
  log "All four images pushed."
}

# ─── Dispatch ───────────────────────────────────────────────────
cmd="${1:-}"
case "$cmd" in
  current)
    echo "$(current_version)"
    ;;
  diff)
    do_diff
    ;;
  patch|minor|major)
    next="$(bump_version "$(current_version)" "$cmd")"
    run_release "$next"
    ;;
  set)
    [ -n "${2:-}" ] || err "Usage: retro-release.sh set <version>"
    run_release "$2"
    ;;
  push)
    do_push "${2:-}"
    ;;
  ""|help|-h|--help)
    cat <<USAGE
retro-release.sh — versioned dev → prod promotion for the Retro stack.

Commands:
  current               Print the current RETRO_VERSION.
  diff                  Show submodule SHAs that drifted since the last release.
  patch | minor | major Bump version (semver), update env, write manifest, build.
  set <version>         Pin to an explicit version + build.
  push <registry>       Tag + push the four images at the current version.

State of play:
  Current version : $(current_version)
  Manifest exists : $([ -f "$MANIFEST" ] && echo yes || echo no)
USAGE
    ;;
  *)
    err "Unknown command: $cmd (run with --help for usage)"
    ;;
esac
