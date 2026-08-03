#!/bin/bash
set -e

# Configuration (same as build-and-deploy.sh)
SSH_KEY="$HOME/.ssh/rootdevil_ed25519"
SERVER="root@168.220.248.133"
DEST_PATH="/home/agribee/server.agribee.in/devil-ai"

echo "📤 Devil AI - Upload Only"

# Check release/ folder
if [ ! -d "release" ]; then
    echo "❌ release/ folder nahi mili! Pehle ./build-and-deploy.sh chalao."
    exit 1
fi

# Remove old files from server (same as build-and-deploy.sh)
echo "🗑️  Server se purani files hata raha hoon..."
ssh -i "$SSH_KEY" -o ServerAliveInterval=30 -o ServerAliveCountMax=20 "$SERVER" \
    "cd $DEST_PATH && rm -f *.pkg *.exe *.AppImage *.deb *.blockmap latest.yml latest-mac.yml latest-linux.yml" \
    2>/dev/null || true

# Upload — EXACT same rsync as build-and-deploy.sh, just with keepalive added
echo "📤 Upload shuru..."
rsync -avzP --delete \
    -e "ssh -i \"$SSH_KEY\" -o ServerAliveInterval=30 -o ServerAliveCountMax=20" \
    --exclude="*-unpacked/" \
    --exclude="mac/" \
    --exclude="mac-arm64/" \
    --exclude="builder-effective-config.yaml" \
    --exclude=".icon-icns" \
    --exclude=".icon-ico" \
    release/ "$SERVER":"$DEST_PATH/"

# Verify
echo ""
echo "🔍 Server par files:"
ssh -i "$SSH_KEY" "$SERVER" "ls -lh $DEST_PATH/ | grep -E '\.(pkg|exe|AppImage|deb|blockmap|yml)$'" 2>/dev/null || true

echo ""
echo "✅ Upload complete!"
echo "🔗 https://server.agribee.in/devil-ai/"
