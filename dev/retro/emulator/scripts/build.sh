#!/bin/bash

supervisord -c /app/supervisor/supervisord.conf

cd /app/arcturus
mvn package
cp /app/config.ini /app/arcturus/target/config.ini
mkdir -p /app/arcturus/target/plugins
cd /app/arcturus/target/plugins
# Cloudflare in front of git.krews.org rejects the default wget UA → spoof a browser.
# Skip download if we already grabbed the JAR (idempotent on `compose restart`).
if [ ! -f NitroWebsockets-3.1.jar ]; then
  wget --user-agent="Mozilla/5.0 (X11; Linux x86_64)" -q \
    https://git.krews.org/morningstar/nitrowebsockets-for-ms/-/raw/aff34551b54527199401b343a35f16076d1befd5/target/NitroWebsockets-3.1.jar \
    || echo "[build.sh] WARNING: NitroWebsockets-3.1.jar download failed — emulator will still start without it."
fi

supervisorctl start arcturus-emulator

tail -f /dev/null