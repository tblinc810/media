@echo off
title tblinc Media Player
set PORT=2026
echo Starting tblinc Media Player on port 2026...
start "" http://localhost:2026
call npm run electron
