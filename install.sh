#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  tblinc v1 — Linux Installer
#  Usage: sudo bash install.sh
# ─────────────────────────────────────────────

APP_NAME="tblincv1"
INSTALL_DIR="/opt/$APP_NAME"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"
ENV_FILE="$INSTALL_DIR/.env"

# Must run as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo bash install.sh"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      tblinc v1 — Linux Installer     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Detect node (system or nvm)
NODE_BIN=$(which node 2>/dev/null || ls /home/*/.nvm/versions/node/*/bin/node 2>/dev/null | tail -1 || echo "")
if [ -z "$NODE_BIN" ]; then
  echo "❌ Node.js not found. Please install Node.js 18+ first."
  exit 1
fi
echo "✅ Node.js found: $NODE_BIN ($($NODE_BIN --version))"

# Patch service file with actual node path
sed -i "s|^ExecStart=.*|ExecStart=$NODE_BIN /opt/tblincv1/server.js|" tblincv1.service
NODE_DIR=$(dirname "$NODE_BIN")
sed -i "s|^Environment=PATH=.*|Environment=PATH=$NODE_DIR:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin|" tblincv1.service

# 2. Create install directory
echo "📁 Installing to $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"

# 3. Copy standalone build
cp -r .next/standalone/. "$INSTALL_DIR/"
cp -r .next/static "$INSTALL_DIR/.next/static"
cp -r public "$INSTALL_DIR/public"

# 4. Copy .env if it exists
if [ -f ".env" ]; then
  cp .env "$ENV_FILE"
  echo "📄 Copied .env to $ENV_FILE"
else
  touch "$ENV_FILE"
  echo "⚠️  No .env found — created empty $ENV_FILE (edit it before starting)"
fi

# 5. Set ownership
chown -R "$SUDO_USER":"$SUDO_USER" "$INSTALL_DIR" 2>/dev/null || true

# 6. Install systemd service
echo "⚙️  Installing systemd service ..."
cp tblincv1.service "$SERVICE_FILE"

# Patch User= in service to match the invoking user
REAL_USER="${SUDO_USER:-v1}"
sed -i "s/^User=.*/User=$REAL_USER/" "$SERVICE_FILE"

# 7. Reload systemd & enable service
systemctl daemon-reload
systemctl enable "$APP_NAME"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Installation complete!                   ║"
echo "║                                              ║"
echo "║  Start:   systemctl start tblincv1           ║"
echo "║  Stop:    systemctl stop tblincv1            ║"
echo "║  Status:  systemctl status tblincv1          ║"
echo "║  Logs:    journalctl -u tblincv1 -f          ║"
echo "║                                              ║"
echo "║  App runs on http://localhost:3000           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
