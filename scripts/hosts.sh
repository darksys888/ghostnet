#!/usr/bin/env bash
# Manage GHOSTNET dev hostnames in the system hosts file.
# Idempotent — install/remove/status can run repeatedly with no side effects.
#
# Source-of-truth: dev/caddy/hosts.local
#
# Usage:
#   bash scripts/hosts.sh install    # add the GHOSTNET block to /etc/hosts
#   bash scripts/hosts.sh remove     # remove the block
#   bash scripts/hosts.sh status     # show whether the block is present
#
# Requires sudo on Linux/macOS (and admin on WSL/Git Bash).
# Windows users: prefer scripts/hosts.ps1 (self-elevates via UAC).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HOSTS_LOCAL="${REPO_ROOT}/dev/caddy/hosts.local"

# Pretty logging.
log()  { printf '\033[1;36m[hosts]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[hosts]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[hosts]\033[0m %s\n' "$*" >&2; exit 1; }

# Detect the platform's hosts file.
case "$(uname -s)" in
  Darwin|Linux)
    HOSTS_FILE="/etc/hosts"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts"
    warn "Running on Windows under bash — for a smoother UAC flow, prefer scripts/hosts.ps1"
    ;;
  *)
    err "Unsupported OS: $(uname -s)"
    ;;
esac

START_MARKER="# === GHOSTNET HOSTS START ==="
END_MARKER="# === GHOSTNET HOSTS END ==="

[ -f "${HOSTS_LOCAL}" ] || err "Source hosts file missing: ${HOSTS_LOCAL}"
[ -f "${HOSTS_FILE}"  ] || err "System hosts file missing: ${HOSTS_FILE}"

# Run a command with elevated privs only if the hosts file is not writable.
maybe_sudo() {
  if [ -w "${HOSTS_FILE}" ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    err "${HOSTS_FILE} is not writable and sudo is unavailable. Re-run as root."
  fi
}

# Strip our marker block (and content between) from the hosts file.
strip_block() {
  local tmp
  tmp="$(mktemp)"
  awk -v start="${START_MARKER}" -v end="${END_MARKER}" '
    $0 == start { skip = 1; next }
    $0 == end   { skip = 0; next }
    !skip       { print }
  ' "${HOSTS_FILE}" > "${tmp}"
  maybe_sudo cp "${tmp}" "${HOSTS_FILE}"
  rm -f "${tmp}"
}

# Render the block we want to inject (markers + content from hosts.local).
render_block() {
  echo "${START_MARKER}"
  # Skip blank lines + lines that only contain comments.
  grep -E '^[[:space:]]*[^#[:space:]]' "${HOSTS_LOCAL}"
  echo "${END_MARKER}"
}

cmd_install() {
  log "Installing GHOSTNET hosts block into ${HOSTS_FILE}..."
  strip_block
  local tmp
  tmp="$(mktemp)"
  cat "${HOSTS_FILE}" > "${tmp}"
  # Ensure trailing newline before our block.
  if [ -n "$(tail -c1 "${tmp}")" ]; then
    echo "" >> "${tmp}"
  fi
  render_block >> "${tmp}"
  maybe_sudo cp "${tmp}" "${HOSTS_FILE}"
  rm -f "${tmp}"
  log "✓ Done. Added $(grep -cE '^[[:space:]]*[^#[:space:]]' "${HOSTS_LOCAL}") hostname(s)."
}

cmd_remove() {
  if ! grep -q "${START_MARKER}" "${HOSTS_FILE}"; then
    log "No GHOSTNET block found — nothing to remove."
    return
  fi
  log "Removing GHOSTNET hosts block from ${HOSTS_FILE}..."
  strip_block
  log "✓ Done."
}

cmd_status() {
  if grep -q "${START_MARKER}" "${HOSTS_FILE}"; then
    log "GHOSTNET hosts block IS installed in ${HOSTS_FILE}:"
    awk -v start="${START_MARKER}" -v end="${END_MARKER}" '
      $0 == start { in_block = 1 }
      in_block    { print "  " $0 }
      $0 == end   { in_block = 0 }
    ' "${HOSTS_FILE}"
  else
    log "GHOSTNET hosts block is NOT installed in ${HOSTS_FILE}."
    log "Source-of-truth (would be added):"
    grep -E '^[[:space:]]*[^#[:space:]]' "${HOSTS_LOCAL}" | sed 's/^/  /'
  fi
}

case "${1:-status}" in
  install) cmd_install ;;
  remove)  cmd_remove ;;
  status)  cmd_status ;;
  *)       err "Unknown command: ${1:-} (try install / remove / status)" ;;
esac
