# Devil AI Server

This is the Bun + Hono backend server for Devil AI. 

> **Note:** This server is **only used when running the app in Browser Mode (`dev:web`)**. It is completely bypassed and **not bundled** when compiling the Electron Desktop App. In Electron, all IPC handlers in the main process take over these duties.

## 🛠️ Tech Stack

- **Bun:** For lightning fast HTTP serving.
- **Hono:** A lightweight, ultrafast web framework.

## 🚀 Running Locally

To start the local development server (on port 3100):

```bash
cd apps/server
bun run dev
```

## 🔄 Type Generation

We use RPC to maintain full type-safety between the Hono backend and the React frontend. If you add or modify any routes in this server, you **MUST** regenerate the TypeScript types.

```bash
bun run build:types
```

Without this, the new routes will not have type inference in the frontend RPC client (`services/devil-ai-server.ts`).
