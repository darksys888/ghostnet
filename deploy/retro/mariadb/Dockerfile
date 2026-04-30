# MariaDB image with the Arcturus schema baked in.
# On first run with an empty data volume, MariaDB auto-runs every
# *.sql in /docker-entrypoint-initdb.d/.

FROM mariadb:10.6

# Holo5/Arcturus base + 3.0→3.5 migration. These run in alphabetical
# order against the database named in MYSQL_DATABASE (set via env).
COPY dev/retro/mysql/dumps/ /docker-entrypoint-initdb.d/

# `mysql_native_password` keeps older Arcturus / Plus EMU JDBC clients
# happy. utf8mb4 covers emoji + non-Latin nicknames.
CMD ["--default-authentication-plugin=mysql_native_password", \
     "--character-set-server=utf8mb4", \
     "--collation-server=utf8mb4_unicode_ci", \
     "--skip-name-resolve"]

EXPOSE 3306
