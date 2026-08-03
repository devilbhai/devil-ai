#!/bin/bash
set -e

# Configuration (override any of these via env vars to keep secrets out of git)
MAC_P12="resources/devil-ai-clean-new.p12"

# Signing password from environment — NEVER hardcode credentials in this script.
# Set CSC_KEY_PASSWORD in your shell / CI secrets before running a signed build.
export CSC_KEY_PASSWORD="${CSC_KEY_PASSWORD:-}"

# Releases are published to GitHub Releases (electron-updater provider: github),
# so a token is required. GITHUB_TOKEN is what Actions provides; GH_TOKEN is the
# classic GitHub token name — accept either.
export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
if [ -z "$GH_TOKEN" ]; then
    echo "❌ GH_TOKEN (or GITHUB_TOKEN) is not set — publishing to GitHub Releases needs it."
    echo "   Set it before running: e.g. GH_TOKEN=ghp_xxx ./build-and-deploy.sh"
    exit 1
fi

echo "=========================================================="
echo "🚀 Devil AI - Build & Deploy Orchestrator"
echo "=========================================================="

# --- Network Detection ---
echo -e "\n🌐 Checking network connectivity..."
HAS_INTERNET=false
HAS_TIMESTAMP=false

if curl -s --connect-timeout 5 https://github.com >/dev/null 2>&1; then
    HAS_INTERNET=true
    echo "✅ Internet: Available"
else
    echo "⚠️  Internet: Unavailable (Windows/Linux builds will be skipped)"
fi

if curl -s --connect-timeout 5 http://timestamp.apple.com:3128 >/dev/null 2>&1; then
    HAS_TIMESTAMP=true
    echo "✅ Apple Timestamp: Available (Mac signing will work)"
else
    echo "⚠️  Apple Timestamp: Unavailable (Mac will build unsigned)"
fi

echo -e "\n📈 [1/7] Bumping Version (Minor)..."
NEW_VERSION=$(node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const parts = pkg.version.split('.');
parts[1] = parseInt(parts[1], 10) + 1;
parts[2] = 0;
pkg.version = parts.join('.');
fs.writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');
console.log(pkg.version);
")
echo "✅ Version bumped to: v$NEW_VERSION"

echo -e "\n🧹 [2/7] Cleaning previous builds..."
rm -rf release/ out/ dist/

echo -e "\n🔨 [3/7] Building TypeScript..."
bun run build

# --- Mac Build ---
echo -e "\n📦 [4/7] Building Mac..."
MAC_BUILD_OK=false
if [ "$HAS_TIMESTAMP" = true ]; then
    echo "  → Signing with Apple timestamp..."
    export CSC_LINK="$MAC_P12"
    bun run eb:mac --arm64 --x64 && MAC_BUILD_OK=true || echo "⚠️  Mac signed build failed"
else
    echo "  → Building unsigned (timestamp unavailable)..."
    unset CSC_LINK
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    bun run eb:mac --arm64 --x64 && MAC_BUILD_OK=true || echo "⚠️  Mac unsigned build failed"
    unset CSC_IDENTITY_AUTO_DISCOVERY
fi

# --- Windows Build ---
echo -e "\n📦 [5/7] Building Windows..."
WIN_BUILD_OK=false
if [ "$HAS_INTERNET" = true ]; then
    unset CSC_LINK
    bun run eb:win && WIN_BUILD_OK=true || echo "⚠️  Windows build failed"
else
    echo "  → Skipped (no internet for NSIS download)"
fi

# --- Linux Build ---
echo -e "\n📦 [6/7] Building Linux..."
LINUX_BUILD_OK=false
if [ "$HAS_INTERNET" = true ]; then
    bun run eb:linux && LINUX_BUILD_OK=true || echo "⚠️  Linux build failed"
else
    echo "  → Skipped (no internet for AppImage download)"
fi

# --- Publish ---
# Each eb:* script above already runs electron-builder with `--publish always`,
# which uploads the artifacts + latest*.yml manifests to the GitHub release for
# this version (electron-updater provider: github — free CDN, no VPS bandwidth).
# This step just reports what ended up in release/.
echo -e "\n📦 [7/7] Publishing to GitHub Releases (done via --publish always)..."
if [ "$MAC_BUILD_OK" = false ] && [ "$WIN_BUILD_OK" = false ] && [ "$LINUX_BUILD_OK" = false ]; then
    echo "❌ No builds succeeded. Nothing published."
    # Show what was built
    if [ -d "release" ]; then
        echo -e "\n📁 Build artifacts:"
        ls -la release/*.dmg release/*.exe release/*.AppImage release/*.deb 2>/dev/null || echo "  (none)"
    fi
    exit 1
fi

echo -e "\n✅ Build & Publish Complete!"
echo "📁 Artifacts:"
ls -la release/*.dmg release/*.exe release/*.AppImage release/*.deb 2>/dev/null
echo -e "\n📋 Update Manifests (served from GitHub Releases):"
ls -la release/latest*.yml 2>/dev/null
