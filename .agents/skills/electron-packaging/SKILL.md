---
name: electron-packaging
description: Electron build configuration, code signing, notarization, platform-specific packaging, and distribution for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Electron Packaging Patterns

Packaging and distribution patterns for the Devil AI Electron app.

## When to Apply

- Building the app for distribution
- Configuring code signing
- Setting up notarization
- Creating platform-specific builds
- Managing release workflows

---

## 1. Package Configuration

### electron-builder.yml

```yaml
# ✅ electron-builder.yml
appId: com.devil-ai.desktop
productName: Devil AI
copyright: Copyright © 2025 Devil AI

directories:
  output: release
  buildResources: resources

files:
  - "dist/**/*"
  - "dist-electron/**/*"

asar: true
asarUnpack:
  - "node_modules/**/*"

win:
  target:
    - target: nsis
      arch: [x64]
  icon: resources/icon.ico

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
    - target: zip
      arch: [x64, arm64]
  icon: resources/icon.icns
  category: public.app-category.developer-tools
  hardenedRuntime: true
  entitlements: entitlements.mac.plist
  entitlementsInherit: entitlements.mac.plist

linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: resources/icon.png
  category: Development

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico

dmg:
  sign: false
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

### Package Scripts

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder",
    "package:win": "electron-builder --win",
    "package:mac": "electron-builder --mac",
    "package:linux": "electron-builder --linux",
    "package:all": "electron-builder -wml",
    "postinstall": "electron-builder install-app-deps"
  }
}
```

---

## 2. Code Signing

### macOS Code Signing

```yaml
# ✅ electron-builder.yml
mac:
  hardenedRuntime: true
  entitlements: entitlements.mac.plist
  entitlementsInherit: entitlements.mac.plist
  notarize: true
```

### Entitlements

```xml
<!-- ✅ entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
```

### Windows Code Signing

```yaml
# ✅ electron-builder.yml
win:
  target: nsis
  signAndEditExecutable: true
  sign: true
  certificateFile: certificate.pfx
  certificatePassword: ${CSC_KEY_PASSWORD}
```

---

## 3. Notarization

### macOS Notarization

```yaml
# ✅ electron-builder.yml
mac:
  notarize: true
  notarytool:
    appleId: ${APPLE_ID}
    appleIdPassword: ${APPLE_ID_PASSWORD}
    teamId: ${APPLE_TEAM_ID}
```

### Environment Variables

```bash
# ✅ Set these in your CI/CD
APPLE_ID="your-apple-id@example.com"
APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"
APPLE_TEAM_ID="XXXXXXXXXX"

# ✅ For Windows
CSC_LINK="path/to/certificate.pfx"
CSC_KEY_PASSWORD="certificate-password"
```

---

## 4. Platform-Specific Builds

### Windows

```yaml
# ✅ Windows configuration
win:
  target:
    - target: nsis
      arch: [x64]
  icon: resources/icon.ico
  artifactName: "${productName}-${version}-win-${arch}.exe"

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "Devil AI"
  uninstallDisplayName: "Devil AI"
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico
  installerHeaderIcon: resources/icon.ico
```

### macOS

```yaml
# ✅ macOS configuration
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: resources/icon.icns
  category: public.app-category.developer-tools
  artifactName: "${productName}-${version}-mac-${arch}.${ext}"

dmg:
  sign: false
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

### Linux

```yaml
# ✅ Linux configuration
linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: resources/icon.png
  category: Development
  artifactName: "${productName}-${version}-linux-${arch}.${ext}"

appImage:
  artifactName: "${productName}-${version}-linux-${arch}.${ext}"
```

---

## 5. Resources

### App Icons

```
resources/
├── icon.ico          # Windows (256x256)
├── icon.icns         # macOS (1024x1024)
└── icon.png          # Linux (512x516)
```

### Generate Icons

```bash
# ✅ Generate icons from PNG
npx electron-icon-builder --input=resources/icon.png --output=resources

# ✅ Or use online tools
# https://icon.kitchen
# https://www.iconfinder.com
```

---

## 6. CI/CD

### GitHub Actions

```yaml
# ✅ .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          bun-version: latest
      
      - run: bun install --frozen-lockfile
      
      - run: bun run build
      
      - name: Build Electron App
        run: bun run package:${{ matrix.os == 'macos-latest' && 'mac' || matrix.os == 'windows-latest' && 'win' || 'linux' }}
        env:
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: release/*
```

---

## 7. Auto-Update

### electron-updater

```typescript
// ✅ main/updater.ts
import { autoUpdater } from "electron-updater"
import { app } from "electron"

export function setupAutoUpdater(): void {
  // ✅ Check for updates
  autoUpdater.checkForUpdatesAndNotify()
  
  // ✅ Handle events
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...")
  })
  
  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version)
  })
  
  autoUpdater.on("update-not-available", () => {
    console.log("No updates available")
  })
  
  autoUpdater.on("download-progress", (progress) => {
    console.log(`Download progress: ${progress.percent}%`)
  })
  
  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info.version)
    // Prompt user to install
  })
  
  autoUpdater.on("error", (error) => {
    console.error("Auto-update error:", error)
  })
}
```

### Update Configuration

```yaml
# ✅ electron-builder.yml
publish:
  provider: github
  owner: devil-ai
  repo: desktop
  releaseType: release
```

---

## 8. Best Practices

1. **Use electron-builder** — Industry standard packaging
2. **Sign everything** — Code signing builds trust
3. **Notarize for macOS** — Required for distribution
4. **Test all platforms** — Windows, macOS, Linux
5. **Use CI/CD** — Automated builds and releases
6. **Version properly** — Semantic versioning
7. **Auto-update** — Keep users on latest version
8. **Monitor crashes** — Use Sentry or similar
9. **Test installers** — Don't just test the app
10. **Document build process** — Keep README updated
