# Arcturus emulator — production multi-stage build.
# Produces a thin JRE image with Habbo.jar + the NitroWebsockets plugin
# baked in. No source code in the runtime image.

# ── Stage 1: Maven build ─────────────────────────────────────────
FROM maven:3-eclipse-temurin-26 AS builder
WORKDIR /build
# Pre-fetch dependencies for layer caching — POM-only first.
COPY dev/retro/emulator/arcturus/pom.xml ./pom.xml
RUN mvn -B dependency:go-offline || true
# Now the rest of the source.
COPY dev/retro/emulator/arcturus/ ./
RUN mvn -B package -DskipTests \
  && ls -la target/

# ── Stage 2: NitroWebsockets plugin fetch ────────────────────────
# Cloudflare in front of git.krews.org rejects the default wget UA.
FROM alpine:3.20 AS plugin-fetcher
RUN apk add --no-cache wget ca-certificates
WORKDIR /plugin
RUN wget --user-agent="Mozilla/5.0 (X11; Linux x86_64)" -q \
  https://git.krews.org/morningstar/nitrowebsockets-for-ms/-/raw/aff34551b54527199401b343a35f16076d1befd5/target/NitroWebsockets-3.1.jar \
  || echo "WARN: NitroWebsockets-3.1.jar download failed — emulator will start without it."

# ── Stage 3: Slim runtime ────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache bash netcat-openbsd gettext
WORKDIR /app
RUN mkdir -p plugins logs camera

# Bake in the JAR + plugin.
COPY --from=builder /build/target/Habbo-*-jar-with-dependencies.jar /app/Habbo.jar
COPY --from=plugin-fetcher /plugin/NitroWebsockets-3.1.jar /app/plugins/NitroWebsockets-3.1.jar

# Config template + entrypoint.
COPY deploy/retro/arcturus/config.ini /app/config.ini.template
COPY deploy/retro/arcturus/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000 3001 2096
ENTRYPOINT ["/entrypoint.sh"]
