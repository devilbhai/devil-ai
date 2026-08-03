// ============================================================
// Types
// ============================================================

export interface EngineServer {
	url: string
	pid: number | null
	managed: boolean
}

// ============================================================
// State — single server
// ============================================================

let singleServer: {
	server: EngineServer
	process: ReturnType<typeof Bun.spawn> | null
} | null = null

const ENGINE_PORT = 4101
const ENGINE_HOSTNAME = "127.0.0.1"

// ============================================================
// Public API
// ============================================================

/**
 * Ensures the single engine server is running.
 * Starts it if not already running. Returns the server info.
 *
 * The server is started without a specific cwd — it serves ALL projects.
 * Each API request uses the `directory` query param to scope to a project.
 */
export async function ensureSingleServer(): Promise<EngineServer> {
	if (singleServer) return singleServer.server

	// Check if there's already a server running on our port
	const existing = await detectExistingServer()
	if (existing) {
		singleServer = { server: existing, process: null }
		return existing
	}

	// Start a new one
	const proc = Bun.spawn({
		cmd: ["devilcode", "serve", `--hostname=${ENGINE_HOSTNAME}`, `--port=${ENGINE_PORT}`],
		cwd: process.env.HOME,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			PATH: `${process.env.HOME}/.devilcode/bin:${process.env.HOME}/.opencode/bin:${process.env.PATH}`,
		},
	})

	const url = `http://${ENGINE_HOSTNAME}:${ENGINE_PORT}`
	const server: EngineServer = {
		url,
		pid: proc.pid,
		managed: true,
	}

	singleServer = { server, process: proc }

	// Clean up on exit
	proc.exited.then(() => {
		if (singleServer?.process === proc) {
			console.log(`Engine server (pid ${proc.pid}) exited — will restart on next request`)
			singleServer = null
		}
	})

	// Wait for the server to be ready
	await waitForReady(url, 15_000)

	console.log(`Engine server started at ${url} (pid ${proc.pid})`)
	return server
}

/**
 * Gets the single server URL, or null if not running.
 */
export function getServerUrl(): string | null {
	return singleServer?.server.url ?? null
}

/**
 * Stops the single server if we manage it.
 */
export function stopServer(): boolean {
	if (!singleServer?.process) return false
	singleServer.process.kill()
	singleServer = null
	return true
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Detects an existing server running on the expected port.
 */
async function detectExistingServer(): Promise<EngineServer | null> {
	const url = `http://${ENGINE_HOSTNAME}:${ENGINE_PORT}`
	try {
		const res = await fetch(`${url}/session`, {
			signal: AbortSignal.timeout(2000),
		})
		if (res.ok) {
			return { url, pid: null, managed: false }
		}
	} catch {
		// Not running
	}
	return null
}

/**
 * Polls the session endpoint until the server responds.
 */
async function waitForReady(url: string, timeoutMs: number): Promise<void> {
	const start = Date.now()
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(`${url}/session`, {
				signal: AbortSignal.timeout(1000),
			})
			if (res.ok) return
		} catch {
			// Not ready yet
		}
		await Bun.sleep(250)
	}
	throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}
