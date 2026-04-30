#!/usr/bin/env bash
# cdn-push.sh — sync the workspace public/ directory to a cloud CDN.
#
# Provider-agnostic via rclone (https://rclone.org). Supported providers:
#   • cloudflare-r2  — S3-compatible
#   • aws-s3         — S3 + optional CloudFront invalidation
#   • bunny-storage  — BunnyCDN Storage Zone
#   • gcs            — Google Cloud Storage
#   • azure-blob     — Azure Blob Storage
#
# Reads config from deploy/cdn/.env or services/cdn/.env (in that order),
# falling back to environment variables.
#
# Usage:
#   bash scripts/cdn-push.sh                # uses env, full sync
#   bash scripts/cdn-push.sh --dry-run      # show what would change
#   bash scripts/cdn-push.sh --check        # verify config + connectivity, no upload

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PUBLIC_DIR="${REPO_ROOT}/public"

# ── Pretty logging ───────────────────────────────────────────────
log()  { printf '\033[1;36m[cdn-push]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[cdn-push]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[cdn-push]\033[0m %s\n' "$*" >&2; exit 1; }

# ── Load env ─────────────────────────────────────────────────────
for env_file in "${REPO_ROOT}/deploy/cdn/.env" "${REPO_ROOT}/services/cdn/.env" "${REPO_ROOT}/.env"; do
  if [ -f "${env_file}" ]; then
    log "Loading env from ${env_file}"
    set -a; . "${env_file}"; set +a
    break
  fi
done

# ── Required ─────────────────────────────────────────────────────
require() { [ -n "${!1:-}" ] || err "Missing required env var: $1"; }

# ── Pre-flight checks ────────────────────────────────────────────
command -v rclone >/dev/null 2>&1 || err "rclone is not installed. See https://rclone.org/install/"
[ -d "${PUBLIC_DIR}" ] || err "public/ directory not found at ${PUBLIC_DIR}"

require CDN_PROVIDER
require CDN_BUCKET

# ── Build the rclone remote spec from env ────────────────────────
RCLONE_CONFIG_FILE="$(mktemp)"
trap 'rm -f "${RCLONE_CONFIG_FILE}"' EXIT

case "${CDN_PROVIDER}" in
  cloudflare-r2|aws-s3)
    require S3_ACCESS_KEY
    require S3_SECRET_KEY
    cat > "${RCLONE_CONFIG_FILE}" <<EOF
[ghostnet-cdn]
type = s3
provider = ${CDN_PROVIDER#aws-}
access_key_id = ${S3_ACCESS_KEY}
secret_access_key = ${S3_SECRET_KEY}
region = ${S3_REGION:-auto}
endpoint = ${S3_ENDPOINT:-}
acl = public-read
EOF
    ;;
  bunny-storage)
    require BUNNY_STORAGE_ZONE
    require BUNNY_API_KEY
    cat > "${RCLONE_CONFIG_FILE}" <<EOF
[ghostnet-cdn]
type = sftp
host = storage.bunnycdn.com
user = ${BUNNY_STORAGE_ZONE}
pass = $(rclone obscure "${BUNNY_API_KEY}")
EOF
    ;;
  gcs)
    require GCS_SERVICE_ACCOUNT_JSON
    cat > "${RCLONE_CONFIG_FILE}" <<EOF
[ghostnet-cdn]
type = google cloud storage
service_account_credentials = ${GCS_SERVICE_ACCOUNT_JSON}
EOF
    ;;
  azure-blob)
    require AZURE_ACCOUNT
    require AZURE_KEY
    cat > "${RCLONE_CONFIG_FILE}" <<EOF
[ghostnet-cdn]
type = azureblob
account = ${AZURE_ACCOUNT}
key = ${AZURE_KEY}
EOF
    ;;
  *)
    err "Unsupported CDN_PROVIDER: ${CDN_PROVIDER}"
    ;;
esac

REMOTE="ghostnet-cdn:${CDN_BUCKET}/${CDN_REMOTE_PREFIX:-}"

# ── Dispatch ─────────────────────────────────────────────────────
case "${1:-}" in
  --check)
    log "Provider: ${CDN_PROVIDER}, bucket: ${CDN_BUCKET}"
    rclone --config "${RCLONE_CONFIG_FILE}" lsd "${REMOTE}" >/dev/null
    log "✓ Remote reachable."
    ;;
  --dry-run)
    log "Dry run: showing diffs only, no uploads."
    rclone --config "${RCLONE_CONFIG_FILE}" sync "${PUBLIC_DIR}" "${REMOTE}" \
      --progress --dry-run --transfers=8 --checkers=16
    ;;
  ""|--push)
    log "Syncing ${PUBLIC_DIR} → ${REMOTE} ..."
    rclone --config "${RCLONE_CONFIG_FILE}" sync "${PUBLIC_DIR}" "${REMOTE}" \
      --progress --transfers=8 --checkers=16
    log "✓ Sync complete."

    # ── Optional: invalidate caches downstream of the bucket ───────
    if [ -n "${CDN_INVALIDATION_ID:-}" ] && command -v aws >/dev/null 2>&1; then
      log "Invalidating CloudFront distribution ${CDN_INVALIDATION_ID}..."
      aws cloudfront create-invalidation --distribution-id "${CDN_INVALIDATION_ID}" --paths '/*' >/dev/null
      log "✓ CloudFront invalidation queued."
    fi
    if [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
      log "Purging Cloudflare zone ${CLOUDFLARE_ZONE_ID} cache..."
      curl -fsS -X POST \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' >/dev/null
      log "✓ Cloudflare cache purged."
    fi
    ;;
  --help|-h)
    sed -n '2,/^$/p' "$0" | sed 's/^# \?//'
    ;;
  *)
    err "Unknown flag: $1 (try --help)"
    ;;
esac
