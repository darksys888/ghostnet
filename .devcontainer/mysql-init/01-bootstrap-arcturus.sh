#!/usr/bin/env bash
# Seed the `arcturus` database for the Retro (Habbo) stack.
# Runs once, on first MySQL/MariaDB boot, when the data volume is empty.
#
# After this:
#   • DB `arcturus` exists with the Holo5 base schema + 3.5 migration applied
#   • User `arcturus_user`@`%` has full grants on it
#   • phpMyAdmin (the sibling service) can browse it via login retro/retro,
#     arcturus_user/arcturus_pw, or root/root.

set -euo pipefail

ARCTURUS_DB="arcturus"
ARCTURUS_USER="arcturus_user"
ARCTURUS_PASSWORD="arcturus_pw"
DUMPS_DIR="/arcturus-dumps"

mysql_root() {
  mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "$@"
}

echo "[arcturus-bootstrap] Creating database + user..."
mysql_root <<SQL
CREATE DATABASE IF NOT EXISTS \`${ARCTURUS_DB}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${ARCTURUS_USER}'@'%'
  IDENTIFIED BY '${ARCTURUS_PASSWORD}';

GRANT ALL PRIVILEGES ON \`${ARCTURUS_DB}\`.* TO '${ARCTURUS_USER}'@'%';

-- Also grant the default 'retro' user access to the arcturus DB so existing
-- libraries that use the retro/retro creds keep working.
GRANT ALL PRIVILEGES ON \`${ARCTURUS_DB}\`.* TO 'retro'@'%';

FLUSH PRIVILEGES;
SQL

# Holo5 ships two SQL files: a 3.0.0 base + a 3.0.0→3.5.0 migration. Apply both.
for dump in \
  "${DUMPS_DIR}/arcturus_3.0.0-stable_base_database--compact.sql" \
  "${DUMPS_DIR}/arcturus_migration_3.0.0_to_3.5.0.sql"; do
  if [ -f "${dump}" ]; then
    echo "[arcturus-bootstrap] Loading $(basename "${dump}")..."
    mysql_root "${ARCTURUS_DB}" < "${dump}"
  else
    echo "[arcturus-bootstrap] WARNING: ${dump} not found — skipping."
  fi
done

echo "[arcturus-bootstrap] Done. Tables in arcturus:"
mysql_root -e "USE \`${ARCTURUS_DB}\`; SHOW TABLES;" | tail -10 || true
