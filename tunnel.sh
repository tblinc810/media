#!/bin/sh
TARGET_URL="${TUNNEL_URL:-http://172.16.50.7}"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

CLOUDFLARED_CMD="cloudflared"
if [ -x "./cloudflared" ]; then
  CLOUDFLARED_CMD="./cloudflared"
fi

if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  echo "Starting Cloudflare Named Tunnel using token from .env..."
  $CLOUDFLARED_CMD tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN"
else
  echo "Starting Cloudflare Quick Tunnel for ${TARGET_URL}..."
  $CLOUDFLARED_CMD tunnel --url "${TARGET_URL}"
fi
