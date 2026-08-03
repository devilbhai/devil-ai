#!/usr/bin/env bash
set -euo pipefail

# Devil AI CLI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/devilbhai/devil-ai/main/packages/devil-ai-cli/install.sh | bash

INSTALL_DIR="${DEVIL_AI_DIR:-$HOME/.devil-ai-cli}"
REPO_URL="https://github.com/devilbhai/devil-ai.git"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }

echo ""
echo "  ██████╗ ██╗ ███████╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗"
echo "  ██╔══██╗██║ ██╔════╝██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║"
echo "  ██║  ██║██║ █████╗  ██║ █╗ ██║███████║   ██║   ██║     ███████║"
echo "  ██║  ██║██║ ██╔══╝  ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║"
echo "  ██████╔╝██║ ███████╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║"
echo "  ╚═════╝ ╚═╝ ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝"
echo ""
echo "  AI Coding Assistant via Telegram"
echo "  Installer v0.1.0"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# Detect platform
# ============================================================
PLATFORM="$(uname -s)"
ARCH="$(uname -m)"

detect_os() {
    case "$PLATFORM" in
        Linux*)  OS="linux" ;;
        Darwin*) OS="macos" ;;
        MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
        *)       OS="unknown" ;;
    esac
}
detect_os

echo "Platform: $OS ($ARCH)"
echo ""

# ============================================================
# 1. Node.js — auto-install if missing
# ============================================================
echo "── Node.js ──"
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        ok "Node.js $(node -v) already installed"
    else
        warn "Node.js $(node -v) found but 18+ required. Upgrading..."
        if [ "$OS" = "macos" ]; then
            if command -v brew &>/dev/null; then
                brew install node@22 && brew link --overwrite node@22 2>/dev/null
            else
                curl -fsSL https://nodejs.org/dist/v22.16.0/node-v22.16.0-darwin-${ARCH}.tar.gz | tar -xz -C /usr/local --strip-components=1
            fi
        elif [ "$OS" = "linux" ]; then
            curl -fsSL https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-${ARCH}.tar.gz | sudo tar -xz -C /usr/local --strip-components=1
        fi
        ok "Node.js upgraded to $(node -v)"
    fi
else
    warn "Node.js not found. Installing..."
    if [ "$OS" = "macos" ]; then
        if command -v brew &>/dev/null; then
            brew install node@22 && brew link --overwrite node@22 2>/dev/null
        else
            curl -fsSL https://nodejs.org/dist/v22.16.0/node-v22.16.0-darwin-${ARCH}.tar.gz | sudo tar -xz -C /usr/local --strip-components=1
        fi
    elif [ "$OS" = "linux" ]; then
        curl -fsSL https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-${ARCH}.tar.gz | sudo tar -xz -C /usr/local --strip-components=1
    elif [ "$OS" = "windows" ]; then
        fail "Please install Node.js 18+ manually: https://nodejs.org/"
        exit 1
    fi
    ok "Node.js $(node -v) installed"
fi

# ============================================================
# 2. git — check
# ============================================================
echo "── git ──"
if command -v git &>/dev/null; then
    ok "git $(git --version | cut -d' ' -f3) already installed"
else
    warn "git not found. Installing..."
    if [ "$OS" = "macos" ]; then
        xcode-select --install 2>/dev/null || true
    elif [ "$OS" = "linux" ]; then
        sudo apt-get update -qq && sudo apt-get install -y -qq git 2>/dev/null || \
        sudo yum install -y git 2>/dev/null || \
        sudo pacman -S --noconfirm git 2>/dev/null || true
    fi
    ok "git installed"
fi

# ============================================================
# 3. OpenCode (Devil AI backend) — auto-install
# ============================================================
echo "── OpenCode (Devil AI backend) ──"
if command -v opencode &>/dev/null; then
    ok "OpenCode $(opencode --version 2>/dev/null || echo 'installed') already installed"
else
    warn "OpenCode not found. Installing..."
    curl -fsSL https://opencode.ai/install | bash 2>/dev/null
    
    # Add to PATH for current session
    export PATH="$HOME/.opencode/bin:$PATH"
    
    if command -v opencode &>/dev/null; then
        ok "OpenCode installed"
    else
        fail "OpenCode installation failed. Please install manually:"
        echo "  curl -fsSL https://opencode.ai/install | bash"
        exit 1
    fi
fi

# ============================================================
# 4. cloudflared — auto-install
# ============================================================
echo "── cloudflared (tunnel) ──"
if command -v cloudflared &>/dev/null; then
    ok "cloudflared $(cloudflared --version 2>/dev/null | head -1 || echo 'installed') already installed"
else
    warn "cloudflared not found. Installing..."
    if [ "$OS" = "macos" ]; then
        if command -v brew &>/dev/null; then
            brew install cloudflare/cloudflare/cloudflared 2>/dev/null
        else
            curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-${ARCH}.tgz -o /tmp/cloudflared.tgz && \
            tar -xzf /tmp/cloudflared.tgz -C /tmp && \
            sudo mv /tmp/cloudflared /usr/local/bin/cloudflared && \
            chmod +x /usr/local/bin/cloudflared && \
            rm -f /tmp/cloudflared.tgz
        fi
    elif [ "$OS" = "linux" ]; then
        ARCH_ALT="$ARCH"
        [ "$ARCH" = "x86_64" ] && ARCH_ALT="amd64"
        [ "$ARCH" = "aarch64" ] && ARCH_ALT="arm64"
        curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH_ALT}" -o /usr/local/bin/cloudflared && \
        chmod +x /usr/local/bin/cloudflared
    elif [ "$OS" = "windows" ]; then
        fail "Please install cloudflared manually:"
        echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
        exit 1
    fi
    
    if command -v cloudflared &>/dev/null; then
        ok "cloudflared installed"
    else
        fail "cloudflared installation failed"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "All dependencies installed!"
echo ""

# ============================================================
# 5. Install Devil AI CLI
# ============================================================
echo "Installing Devil AI CLI..."

if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
fi

echo "Cloning repository..."
git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$INSTALL_DIR" 2>/dev/null
cd "$INSTALL_DIR"
git sparse-checkout set packages/devil-ai-cli 2>/dev/null

mv packages/devil-ai-cli/* .
mv packages/devil-ai-cli/.* . 2>/dev/null || true
rm -rf packages .git

echo "Installing dependencies..."
npm install --omit=dev 2>/dev/null

echo "Building..."
npm run build 2>/dev/null

echo "Linking globally..."
npm link 2>/dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Installation complete!${NC}"
echo ""
echo "  devil-ai CLI is ready to use."
echo ""
echo "  Quick start:"
echo "    devil-ai config --token YOUR_TELEGRAM_BOT_TOKEN"
echo "    devil-ai start"
echo ""
echo "  Commands:"
echo "    devil-ai --help       Show all commands"
echo "    devil-ai setup        Verify all dependencies"
echo "    devil-ai config       Configure settings"
echo "    devil-ai start        Start the assistant"
echo "    devil-ai stop         Stop the assistant"
echo "    devil-ai status       Show running status"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
