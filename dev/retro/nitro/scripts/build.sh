supervisord -c /app/supervisor/supervisord.conf

# Holo5 originally placed configuration.json in src/, but the current
# nitro-converter reads it from the working directory at runtime.
# Copy to BOTH paths so either layout works.
cp /app/configuration/nitro-converter/configuration.json /app/nitro-converter/src/configuration.json
cp /app/configuration/nitro-converter/configuration.json /app/nitro-converter/configuration.json
cd /app/nitro-converter; yarn install;

cp /app/configuration/nitro-react/public/* /app/nitro-react/public/
cd /app/nitro-react; yarn install;

supervisorctl start swf-http-server
supervisorctl start assets-http-server
supervisorctl start nitro-dev-server

tail -f /dev/null