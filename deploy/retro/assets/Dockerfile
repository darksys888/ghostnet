# Asset server — bakes the .nitro bundles + gamedata directly into nginx.
# The bundles are produced in dev by `npm run retro:assets:extract` and
# copied here at build time. After running extract once you can rebuild
# this image without re-converting (huge time savings).

FROM nginx:alpine
COPY deploy/retro/assets/nginx.conf /etc/nginx/conf.d/default.conf

# dev/retro/nitro/nitro-assets/ is the post-extract tree:
#   ├── bundled/    ~10k .nitro files (~233 MB)
#   ├── gamedata/   figuredata.json, productdata.json, …
#   ├── images/
#   ├── logos/
#   └── sounds/
COPY dev/retro/nitro/nitro-assets/ /usr/share/nginx/html/

EXPOSE 80
