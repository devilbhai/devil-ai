# Devil AI Desktop

This is the Electron-based GUI for Devil AI. It is built using React 19, Jotai (for state management), Tailwind CSS v4, and Shadcn UI. It interfaces directly with the local OpenCode server.

## 🛠️ Tech Stack

- **Electron 40:** Main process manages filesystem, desktop notifications, and spawning the OpenCode Server.
- **React 19:** Renderer process for the UI.
- **Vite (via electron-vite):** Fast HMR and bundling.
- **Jotai:** Atomic state management (we have migrated away from Zustand).
- **Tailwind v4:** For lightning-fast atomic CSS.

## 🚀 Running Locally

You have two ways to run the desktop app locally during development:

### 1. Full Electron Mode (Recommended)
This mode gives you access to native filesystem commands, IPC, and native Web Speech APIs.
```bash
cd apps/desktop
bun run dev
```

### 2. Browser-Only Mode (Web)
If you just want to work on the UI components without Electron overhead:
*(Requires running `apps/server` first)*
```bash
# In terminal 1
cd apps/server
bun run dev

# In terminal 2
cd apps/desktop
bun run dev:web
```

## 📦 Packaging and Distribution

To build the executable application for your platform:

```bash
cd apps/desktop

# Package for all platforms
bun run package:all

# Package for Mac only
bun run package:mac

# Note for macOS without Apple Developer Certificate:
# Set the following environment variable before packaging:
CSC_IDENTITY_AUTO_DISCOVERY=false bun run package:mac
```

## 🔒 Security Architecture

- **Context Isolation:** The renderer process runs in a sandboxed Chromium environment.
- **Bridge:** We expose a highly restricted `window.devilAi` API via the `contextBridge` in the preload script.
- **IPC Handlers:** Main process handles all dangerous actions (file I/O, process spawning) securely.
