# Devil AI Agent Instructions

## Purpose of This File

This file is injected into every agent session for this project. Keep it short.
Only add entries here if an agent is likely to get stuck or repeat a mistake without them.
Do NOT add one-time setup notes, general knowledge, or things discoverable from config files.

## Project Structure

- **Monorepo**: Turborepo + Bun workspaces (Bun 1.3.8)
- **`packages/ui`**: Shared shadcn/ui component library (`@devil-ai/ui`)
- **`packages/configconv`**: Universal agent config converter library (`@devil-ai/configconv`) -- converts between Claude Code, OpenCode, and Cursor formats
- **`packages/configconv-cli`**: Thin CLI wrapper (`configconv`) for the converter library
- **`apps/desktop`**: Electron 40 + Vite + React 19 desktop app (via `electron-vite`)
- **`apps/server`**: Bun + Hono backend -- used only in browser-mode dev (`dev:web`), NOT bundled with Electron

### Desktop App Layout (`apps/desktop/src/`)

- **`main/`** -- Electron main process (Node.js): window management, IPC handlers, OpenCode server lifecycle, filesystem reads
- **`preload/`** -- Electron preload bridge: exposes `window.devilAi` API via `contextBridge`
- **`renderer/`** -- React app (browser context): components, hooks, services, atoms (Jotai)

## Deployment

### Release Upload
- **Server**: server.agribee.in (168.220.248.133)
- **SSH**: `ssh -i ~/.ssh/rootdevil_ed25519 root@168.220.248.133`
- **Path**: `/home/agribee/server.agribee.in/devil-ai/`
- **URL**: `https://server.agribee.in/devil-ai/`
- **Always remove old version files before uploading new builds**
- **Upload**: DMG, EXE, AppImage, latest-mac.yml, latest.yml
- **Always generate correct SHA512 hashes** (use `shasum -a 512`)
- **Always code sign builds** (never unsigned)

### Version History
- **v0.27.0** (July 7, 2026): 331 total skills with auto-detection, AI code review bot (GitHub/GitLab webhooks), self-healing workflows, cross-app controller, installation/update assistants, inline code actions, local RAG with IDF weighting, dark mode auto-switch, completion sounds
- **v0.26.0** (July 6, 2026): Initial release with Electron + React 19 + Jotai + Bun + Hono + SQLite stack

## Skills

Project-specific skills live in `.agents/skills/`. Load a skill before starting
work that matches its domain -- they contain patterns and footguns that override
generic knowledge.

| Skill | When to load |
|---|---|
| `react-best-practices` | Writing or reviewing renderer components, optimizing re-renders or bundle size |

## Help Commands

When user types any of these, show the full capabilities guide:
- `devil-ai help`
- `!!help`
- `devil-ai`
- `capabilities`
- `skills list`

Run: `/help` command or read `.opencode/command/help.md` and display the full guide showing all 334 skills, 42 MCP tools, and 3 references.

**IMPORTANT**: When user types `--help`, DO NOT show the default opencode help. Instead, show the Devil AI capabilities guide from `.opencode/command/help.md`.

## Commands

- **Electron dev**: `cd apps/desktop && bun run dev` (electron-vite, renderer on port 1420)
- **Browser-only dev**: `cd apps/desktop && bun run dev:web` (Vite only, needs `apps/server` running)
- **Backend server** (browser mode only): `cd apps/server && bun run dev` (port 3100)
- **Lint check**: `bun run lint` (from root)
- **Lint/format fix**: `bun run lint:fix` or `bunx biome check --write .` (from root)
- **Type check all**: `bun run check-types` (from root, via Turborepo)
- **Type check desktop**: `cd apps/desktop && bun run check-types` (uses `tsgo`)
- **Run all tests**: `cd packages/configconv && bun test`
- **Run single test file**: `cd packages/configconv && bun test test/converter/config.test.ts`
- **Run tests by name**: `cd packages/configconv && bun test --grep "converts model"`
- **Rebuild server types**: `cd apps/server && bun run build:types` (required after adding server routes)
- **Add UI component**: `cd packages/ui && bunx shadcn@latest add <component>`
- **Package**: `cd apps/desktop && bun run package` (or `package:linux`, `package:mac`, `package:win`, `package:all`)
- **Package without code signing (macOS)**: `CSC_IDENTITY_AUTO_DISCOVERY=false cd apps/desktop && bun run package:mac`
- **Changeset -- add**: `bun changeset` (interactive -- pick packages, bump type, write description)
- **Changeset -- version**: `bun run version-packages` (applies pending changesets, bumps versions, updates changelogs)
- **Changeset -- version**: `bun run version-packages` (applies pending changesets, bumps versions, updates changelogs)

## Code Style

### Formatting (enforced by Biome 2.3.14)

- Tabs for indentation (width 2), line width 100, LF line endings
- Double quotes, no semicolons, trailing commas everywhere
- Arrow functions always use parentheses: `(x) => x`
- Run `bunx biome check --write .` from root to auto-fix

### Imports

- `node:` protocol for all Node.js builtins: `import path from "node:path"`
- Use `import type { ... }` for type-only imports (Biome warns otherwise)
- Order: external packages first, then internal/relative imports (no blank line between)
- Main process: `node:` builtins first, then `electron`, then local
- Renderer: `@devil-ai/ui` -> `@tanstack/*` -> `lucide-react` -> `react` -> local atoms/hooks/services

### Naming Conventions

- **Files**: `kebab-case.ts` / `kebab-case.tsx` everywhere
- **Functions/variables**: `camelCase` -- `createLogger()`, `fetchDiscovery()`
- **Components**: `PascalCase` -- `ChatView`, `AppSidebar`, `CommandPalette`
- **Types/interfaces**: `PascalCase` -- `DiscoveredProject`, `AgentStatus`
- **Props**: `ComponentNameProps` -- `ChatViewProps`, `AppSidebarProps`
- **Module-level constants**: `UPPER_SNAKE_CASE` -- `FRAME_BUDGET_MS`, `OPENCODE_PORT`
- **Jotai atoms**: `camelCaseAtom` -- `sessionIdsAtom`, `serverUrlAtom`
- **Atom families**: `camelCaseFamily` -- `sessionFamily`, `partsFamily`

### Types

- Prefer `interface` for object shapes, `type` for unions/aliases
- Export types only when used across modules
- Props: named interface for complex props, inline destructured type for small sub-components
- UI library uses `React.ComponentProps<"element">` intersection pattern for wrapper components

### React Patterns

- Functional components only, no class components
- State: **Jotai atoms** (NOT Zustand -- codebase has migrated). Store in `renderer/atoms/`
- Thin hook wrappers around atoms (e.g., `useAgents()` returns `useAtomValue(agentsAtom)`)
- Use `memo()` with named function expressions for perf-critical sub-components
- Custom hooks return objects, not arrays
- Named exports everywhere -- no default exports (except Hono route modules and Bun server entry)

### Error Handling

- No custom error classes -- use `new Error("descriptive message")`
- Services: try/catch, log with tagged logger, then rethrow
- Hooks: try/catch, set error state (`err instanceof Error ? err.message : "fallback"`)
- Main process IPC: wrap handlers with `withLogging()` for structured error logging
- Filesystem: check `(err as NodeJS.ErrnoException).code === "ENOENT"` for missing files
- Parallel IO: use `Promise.allSettled()` for resilient partial success
- SSE reconnect: exponential backoff loop capped at 30s

### Comments and File Organization

- Module-level `/** ... */` JSDoc at top of files for documentation
- `// ============================================================` section dividers for major sections
- `// ---` sub-section dividers within long functions
- File order: imports -> constants -> types -> state -> helpers -> public API/components -> sub-components

### Accessibility

- Always add `aria-hidden="true"` to decorative inline SVGs

## Critical Footguns

### Electron -- Two Runtime Contexts

The main process runs in Node.js, the renderer runs in a Chromium sandbox. They communicate via IPC only. Never import Node.js modules (`fs`, `child_process`, `path`) in the renderer -- use the `window.devilAi` bridge or `services/backend.ts` instead.

### Backend Service Layer -- `services/backend.ts`

All hooks must import from `services/backend.ts`, NOT from `services/devil-ai-server.ts` directly. The backend module detects Electron (`"devilAi" in window`) and routes to IPC or HTTP automatically.

### Jotai + React 19

The codebase uses Jotai for state management. Derive data with `useMemo` from atom values -- do NOT create new objects inside selectors.

### Tailwind v4 Monorepo -- Missing Styles

`packages/ui/src/styles/globals.css` must have `@source "../components";` or utility classes used only in UI components won't generate CSS. Do NOT remove this line.

### Biome -- CSS Disabled

Biome v2 cannot parse Tailwind v4 syntax. CSS linting/formatting is disabled. Do not try to enable it.

### Changesets -- versioning workflow

All five workspace packages are **linked** (version together). When making user-facing changes, run `bun changeset` before opening a PR.

### Packaging -- macOS without code signing

Always set `CSC_IDENTITY_AUTO_DISCOVERY=false` when building locally without an Apple Developer certificate.

### Packaging -- Windows PFX Certificate

Windows code signing requires a PFX certificate with **AES-256-CBC encryption** (not RC2-40-CBC). OpenSSL 3.x does not support the legacy RC2 algorithm. If you see "not signed" errors:
1. Check PFX encryption: `openssl pkcs12 -info -in cert.pfx -nokeys -passin pass:PASSWORD`
2. If it shows "RC2-40-CBC", convert with: `openssl pkcs12 -export -out new.pfx -inkey old.pem -in old.pem -passout pass:PASSWORD -keypbe AES-256-CBC -certpbe AES-256-CBC`
3. Keep the old PFX as backup (`devil-ai-windows-old.pfx`)
4. Test signing works: `bun run package:win` and check for "signing" in logs

### Packaging -- macOS OTA Updates

macOS OTA updates require a **proper Apple Developer ID certificate**. Without it, `hardenedRuntime: true` will fail code signing. Current setup:
- `canAutoInstall` returns `false` on macOS → triggers `openReleasePage()` flow
- User downloads DMG manually from `https://server.agribee.in/devil-ai/`
- To enable OTA: get Apple Developer ID cert, set `CSC_LINK` and `CSC_KEY_PASSWORD` env vars

### Packaging -- ALWAYS Code Sign Builds

**NEVER build without code signing.** Every release build must be signed:
- **macOS**: Use `Developer ID Application` cert from keychain (`resources/devil-ai-apple.p12`)
- **Windows**: Use PFX cert (`resources/devil-ai-windows.pfx`)
- **Linux**: No signing required (AppImage)
- Always verify signing in build output: `signing identityName=Developer ID Application...`
- If signing fails, FIX IT before uploading. Unsigned builds = broken auto-update.

### OpenCode SSE -- directory scoping

Use `/global/event` (not `/event`) to stream events from ALL projects. The SDK exposes this as `client.global.event()`.

### OpenCode SDK -- Always use v2 types

The `@opencode-ai/sdk` package ships both v1 and v2 type definitions. Always import from `@opencode-ai/sdk/v2/client` and check types under `dist/v2/gen/types.gen.d.ts` (NOT `dist/gen/types.gen.d.ts`). The v2 types are more complete (e.g., `session.create` accepts `permission?: PermissionRuleset`, `Permission` class has `respond`/`reply`/`list` methods). The v1 types are missing many fields and namespaces.

Always prefer re-using types from the SDK rather than defining local copies. The `@opencode-ai/sdk/v2/client` entry point re-exports all types from `gen/types.gen.js`, so types like `PermissionRuleset`, `PermissionRule`, `Session`, `Event`, etc. can be imported directly:

```ts
import type { PermissionRuleset, Session } from "@opencode-ai/sdk/v2/client"
```

### OpenCode model resolution

Always pass the resolved model to `promptAsync`. The server has no single "current model" concept.

### Server type regeneration (browser mode only)

When adding routes to `apps/server`, run `cd apps/server && bun run build:types` to regenerate `.d.ts` files. Without this, new routes won't have type inference in the frontend RPC client.

### Electron -- Preload Timing

The `window.devilAi` bridge is not available until the preload script finishes. Early-running renderer code (e.g., module-level calls, top-of-file side effects) must guard with optional chaining: `window.devilAi?.someMethod()`.

### Electron -- External Links

Never open external URLs inside the Electron window. Use `setWindowOpenHandler` in the main process to deny and redirect to `shell.openExternal()`. This prevents navigation to untrusted content inside the app.

### Devil AI storage -- XDG Base Directory

Devil AI follows the XDG Base Directory Specification (same convention as OpenCode). Config at `~/.config/devil-ai/`, data at `~/.local/share/devil-ai/`. Automation configs live at `~/.config/devil-ai/automations/<id>/`, SQLite database at `~/.local/share/devil-ai/devil-ai.db`. See `main/automation/paths.ts` for the implementation. Do NOT use `~/.devil-ai/` (legacy) or Electron's `userData` path for automation storage.

### electron-vite -- Three Build Targets

`electron.vite.config.ts` has three sections: `main`, `preload`, `renderer`. Main and preload use `externalizeDepsPlugin()` to keep Node.js deps external.

## Testing

- **Framework**: Bun's built-in test runner (`bun:test`) -- no vitest/jest/playwright
- **Tests exist only in `packages/configconv`** -- desktop app, server, and UI have no tests
- Tests are NOT run in CI (only lint, type-check, and build are)
- Run all: `cd packages/configconv && bun test`
- Run one file: `cd packages/configconv && bun test test/converter/mcp.test.ts`
- Run by name: `cd packages/configconv && bun test --grep "pattern"`
