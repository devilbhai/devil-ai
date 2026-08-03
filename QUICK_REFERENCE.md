# Devil AI - Quick Reference

## Project Repositories

### 1. Aiden (AI Agent Engine)
- **Location**: `~/Documents/devil-ai/aiden/`
- **Purpose**: Autonomous AI agent for automation, file management, browser control
- **Tech**: TypeScript, Node.js, SQLite, Playwright
- **Index**: `aiden/INDEX.md`

### 2. Devil AI Desktop App
- **Location**: `~/Documents/devil-ai/` (main project)
- **Purpose**: Electron + React 19 desktop application
- **Tech**: Electron 40, Vite, React 19, Jotai, Bun, Hono
- **Status**: v0.27.0 (331 skills, AI code review, RAG)

## Key Commands

### Development
```bash
# Electron dev mode
cd apps/desktop && bun run dev

# Browser-only dev
cd apps/desktop && bun run dev:web
cd apps/server && bun run dev  # Backend (port 3100)

# Lint and format
bun run lint
bun run lint:fix

# Type checking
bun run check-types
```

### Building
```bash
# Package all platforms
cd apps/desktop && bun run package:all

# Package specific platform
cd apps/desktop && bun run package:mac
cd apps/desktop && bun run package:win
cd apps/desktop && bun run package:linux

# Without code signing (macOS)
CSC_IDENTITY_AUTO_DISCOVERY=false bun run package:mac
```

### Deployment
```bash
# Server: server.agribee.in
ssh -i ~/.ssh/rootdevil_ed25519 root@168.220.248.133
cd /home/agribee/server.agribee.in/devil-ai/

# Upload builds
scp -i ~/.ssh/rootdevil_ed25519 dist/* root@168.220.248.133:/home/agribee/server.agribee.in/devil-ai/
```

## Project Structure
```
devil-ai/
├── apps/
│   ├── desktop/          # Electron + React app
│   └── server/           # Hono backend (browser mode)
├── packages/
│   ├── ui/               # shadcn/ui components
│   ├── configconv/       # Config converter library
│   └── configconv-cli/   # CLI for converter
├── aiden/                # Aiden AI agent (cloned)
└── docs/                 # Documentation
```

## Important Notes
- **Code Signing**: Always sign builds before release
- **Windows PFX**: Must use AES-256-CBC encryption (not RC2)
- **macOS OTA**: Requires Apple Developer ID certificate
- **State Management**: Use Jotai (not Zustand)
- **Imports**: Use `node:` protocol for Node.js builtins
- **Formatting**: Biome 2.3.14 (tabs, double quotes, no semicolons)
