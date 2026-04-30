#!/usr/bin/env bash
# Production Arcturus entrypoint.
# 1) Wait for the DB to accept TCP.
# 2) Render config.ini from env vars.
# 3) Exec the JVM as PID 1 so signals propagate.
set -euo pipefail

echo "[arcturus] Waiting for ${DB_HOST}:${DB_PORT}..."
until nc -z "${DB_HOST}" "${DB_PORT}" 2>/dev/null; do sleep 1; done
echo "[arcturus] DB reachable."

envsubst < /app/config.ini.template > /app/config.ini

echo "[arcturus] Launching emulator (Habbo.jar)..."
exec java -Dfile.encoding=UTF-8 -jar /app/Habbo.jar
