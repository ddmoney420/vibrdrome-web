#!/bin/sh
# Replace config placeholder with env var value (or empty string)
sed -i "s|__VIBRDROME_DEFAULT_SERVER__|${VIBRDROME_DEFAULT_SERVER:-}|g" /usr/share/nginx/html/index.html
exec nginx -g 'daemon off;'
