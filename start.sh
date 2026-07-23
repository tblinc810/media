#!/bin/sh
# Start the Next.js app in the background
npm run start &
# Start the Cloudflare tunnel
./tunnel.sh
