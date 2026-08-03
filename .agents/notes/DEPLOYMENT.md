# Devil AI - Deployment Notes

## Server Details
- **Server**: server.agribee.in
- **IP**: 168.220.248.133
- **SSH**: `ssh -i ~/.ssh/rootdevil_ed25519 root@168.220.248.133`
- **Upload Path**: `/home/agribee/server.agribee.in/devil-ai/`
- **Download URL**: `https://server.agribee.in/devil-ai/`

## Release Deployment Steps
1. Build all platforms: `cd apps/desktop && bun run package:mac && bun run package:win && bun run package:linux`
2. Remove old version files from server
3. Upload new builds via SCP
4. Upload latest-mac.yml and latest.yml for auto-updates

## Files to Upload
- `Devil-ai-{version}-mac-arm64.dmg` (macOS)
- `Devil-ai-{version}-win-x64.exe` (Windows)
- `Devil-ai-{version}-linux-x86_64.AppImage` (Linux)
- `latest-mac.yml` (auto-update config)
- `latest.yml` (auto-update config)

## Current Version
- **Last uploaded**: v0.26.0 (July 6, 2026)
- **Previous**: v0.24.0 (removed)

## Notes
- Always use `CSC_IDENTITY_AUTO_DISCOVERY=false` for macOS builds without code signing
- Server also has: wp.agribee.in (Laravel app), wpqr.agribee.in (WhatsApp QR)
