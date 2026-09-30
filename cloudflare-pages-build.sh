#!/usr/bin/env sh
set -eu

rm -rf dist
mkdir -p dist
cp -R www/. dist/
cat > dist/_headers <<'HEADERS'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=3600
HEADERS

 test -f dist/index.html
printf '%s\n' "Cloudflare Pages build ready: dist"
