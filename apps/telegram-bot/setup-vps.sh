#!/bin/bash
# ─────────────────────────────────────────────
# Devil-ai Telegram Bot — VPS Setup Script
# Run: bash setup-vps.sh
# ─────────────────────────────────────────────

set -e

BOT_DIR="$HOME/devil-ai-bot"
APP_NAME="devil-ai-telegram-bot"

echo "🔥 Devil-ai Telegram Bot — VPS Setup"
echo "======================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "✅ Node.js: $(node -v)"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi
echo "✅ PM2: $(pm2 -v)"

# Create bot directory
mkdir -p "$BOT_DIR/src"
echo "📁 Bot directory: $BOT_DIR"

# Copy files (if running locally via scp, files are already here)
if [ ! -f "$BOT_DIR/package.json" ]; then
    echo "❌ Bot files not found in $BOT_DIR"
    echo "   Copy files first: scp -r apps/telegram-bot/* backupvps:~/devil-ai-bot/"
    exit 1
fi

# Install dependencies
cd "$BOT_DIR"
echo "📦 Installing dependencies..."
npm install --production

# Create .env if not exists
if [ ! -f "$BOT_DIR/.env" ]; then
    cp "$BOT_DIR/.env.example" "$BOT_DIR/.env" 2>/dev/null || true
    echo ""
    echo "⚠️  .env file created. Edit it with your bot token:"
    echo "   nano $BOT_DIR/.env"
    echo ""
fi

# PM2 ecosystem file
cat > "$BOT_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: "devil-ai-telegram-bot",
    script: "src/index.js",
    cwd: process.env.HOME + "/devil-ai-bot",
    env: {
      NODE_ENV: "production"
    },
    watch: false,
    max_memory_restart: "200M",
    restart_delay: 5000,
    max_restarts: 10,
    autorestart: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
}
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Edit .env file:  nano $BOT_DIR/.env"
echo "  2. Set TELEGRAM_BOT_TOKEN and DEVIL_AI_SERVER_URL"
echo "  3. Start bot:  cd $BOT_DIR && pm2 start ecosystem.config.cjs"
echo "  4. Save PM2:   pm2 save"
echo "  5. Auto-start: pm2 startup"
echo ""
echo "📊 Manage:"
echo "  pm2 status          — Check status"
echo "  pm2 logs $APP_NAME  — View logs"
echo "  pm2 restart $APP_NAME — Restart"
echo "  pm2 stop $APP_NAME  — Stop"
