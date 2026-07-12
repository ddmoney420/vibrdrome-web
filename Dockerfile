FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

LABEL org.opencontainers.image.title="Vibrdrome Web" \
      org.opencontainers.image.description="Self-hosted web music player for Subsonic/Navidrome servers" \
      org.opencontainers.image.source="https://github.com/ddmoney420/vibrdrome-web" \
      org.opencontainers.image.license="MIT"

# Pull in latest Alpine security patches so the image isn't pinned to whatever
# nginx:alpine shipped with (e.g. CVE-2026-27135 in nghttp2-libs).
# Explicit floors for packages Trivy flags HIGH, both fixed in the Alpine 3.23
# main repo already configured in the base image:
#   libexpat >= 2.8.2-r0 — CVE-2026-56131 (missing handler call depth tracking),
#                          CVE-2026-56407 and CVE-2026-56408 (integer overflows)
#   c-ares   >= 1.34.8-r0 — CVE-2026-33630 (use-after-free / double-free in
#                          query-completion handling)
# The explicit floors also bust stale CI build cache so the upgrade re-runs.
RUN apk upgrade --no-cache && \
    apk add --no-cache "libexpat>=2.8.2-r0" "c-ares>=1.34.8-r0"

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
