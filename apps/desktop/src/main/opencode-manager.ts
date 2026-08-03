import { type ChildProcess, spawn } from "node:child_process"
import { homedir } from "node:os"
import path from "node:path"
import fs from "node:fs"
import { setTimeout as sleep } from "node:timers/promises"
import { dialog } from "electron"
import type { LocalServerConfig } from "../preload/api"
import { getCredential } from "./credential-store"
import { findFreePort, isPortAvailable } from "./find-free-port"
import { createLogger } from "./logger"
import { startNotificationWatcher, stopNotificationWatcher } from "./notification-watcher"
import { getListeningProcessOwner, isCurrentUser, isProcessAlive } from "./process-owner"
import { readLockfile, removeLockfile, writeLockfile } from "./server-lockfile"
import { getSettings } from "./settings-store"
import { waitForEnv } from "./shell-env"
import { checkOpenCode } from "./compatibility"
import { installOpenCode } from "./onboarding"
import { getConnectorCredential } from "./services/connector-manager"

const log = createLogger("engine-manager")

// ============================================================
// Types
// ============================================================

export interface OpenCodeServer {
	url: string
	pid: number | null
	managed: boolean
}

/** Maximum number of server spawn retries before giving up. */
const MAX_SPAWN_RETRIES = 3

/** Base delay between retries (ms). Doubles on each retry. */
const RETRY_BASE_DELAY_MS = 2000

/** Result of detecting an existing server on the target port. */
type DetectionResult =
	| { kind: "found"; server: OpenCodeServer }
	| { kind: "conflict"; url: string; ownerUid: number | null }
	| { kind: "none" }

// ============================================================
// State -- single server + binary path cache
// ============================================================

let singleServer: {
	server: OpenCodeServer
	process: ChildProcess | null
} | null = null

/**
 * Cached path to the engine binary, detected once and reused.
 * Invalidated when install runs so the new binary is found.
 */
let cachedBinaryPath: string | null = null

import { DEFAULT_PORT } from "../shared/server-config"
const DEFAULT_HOSTNAME = "127.0.0.1"
const getLocalServerName = () => {
	if (process.platform === "darwin") return "This Mac"
	if (process.platform === "win32") return "This PC"
	return "This Machine"
}

// ============================================================
// Public API
// ============================================================

/** Reads the local server config from persisted settings. */
function getLocalServerConfig(): LocalServerConfig {
	const settings = getSettings()
	const local = settings.servers.servers.find((s) => s.id === "local")
	const name = getLocalServerName()
	if (local) {
		const config = local as LocalServerConfig
		if (config.name !== name) config.name = name
		return config
	}
	return { id: "local", name, type: "local" }
}

/**
 * Ensures the single OpenCode server is running.
 * Starts it if not already running. Returns the server info.
 *
 * Performs ownership checks to prevent connecting to a server owned by a
 * different OS user. If a conflict is detected, prompts the user with a
 * dialog offering to start on a different port or connect anyway.
 */
let ensureServerPromise: Promise<OpenCodeServer> | null = null

export async function ensureServer(): Promise<OpenCodeServer> {
	if (singleServer) {
		log.debug("Server already running", {
			url: singleServer.server.url,
			pid: singleServer.server.pid,
		})
		return singleServer.server
	}

	if (ensureServerPromise) {
		log.debug("Server spawn already in progress, awaiting existing promise")
		return ensureServerPromise
	}

	ensureServerPromise = (async () => {
		try {
			return await _ensureServer()
		} finally {
			ensureServerPromise = null
		}
	})()
	return ensureServerPromise
}

async function _ensureServer(): Promise<OpenCodeServer> {
	// Ensure the full shell environment is available before spawning the server.
	// startEnvResolution() fires early in app startup; by the time the renderer
	// triggers ensureServer() the promise is usually already resolved.
	await waitForEnv()

	const config = getLocalServerConfig()
	const hostname = config.hostname || DEFAULT_HOSTNAME
	const port = config.port || DEFAULT_PORT

	// --- Fast-path: check our own lockfile first ---
	const lockfile = readLockfile()
	if (lockfile) {
		const lockResult = await handleLockfile(lockfile, hostname)
		if (lockResult) return lockResult
	}

	// --- Probe the target port for an existing server ---
	log.info("Checking for existing server on port", port)
	const detection = await detectExistingServer(hostname, port)

	if (detection.kind === "found") {
		log.info("Detected existing same-user server", { url: detection.server.url })
		singleServer = { server: detection.server, process: null }
		startNotificationWatcher(detection.server.url)
		return detection.server
	}

	if (detection.kind === "conflict") {
		return handleConflict(detection, hostname, port, config)
	}

	// --- Auto-install engine if missing ---
	const check = await checkOpenCode()
	if (!check.installed) {
		log.info("Engine not installed. Auto-installing before spawn...")
		// Invalidate cache before install so new binary is detected
		cachedBinaryPath = null
		const installResult = await installOpenCode()
		if (!installResult.success) {
			throw new Error(
				`Failed to auto-install engine: ${installResult.error}. ` +
				`Please install the engine manually or check your internet connection.`,
			)
		}
		// Re-check after install to confirm binary is now available
		const recheck = await checkOpenCode()
		if (!recheck.installed) {
			throw new Error(
				"Engine installation completed but binary was not found. " +
				"Please ensure the engine is installed to ~/.opencode/bin/ or is on your PATH.",
			)
		}
		// Cache the detected path for future spawns
		if (recheck.path) {
			cachedBinaryPath = recheck.path
		}
		log.info("Auto-install successful, proceeding to spawn.", { path: recheck.path })
	} else {
		// Cache the detected path
		if (check.path) {
			cachedBinaryPath = check.path
		}
		log.info("Engine found", { path: check.path })
	}

	// --- No existing server: spawn one with retry logic ---
	return spawnServerWithRetry(hostname, port, config)
}

/**
 * Spawns the server with automatic retry on failure.
 * Retries up to MAX_SPAWN_RETRIES times with exponential backoff.
 * If configured port is in use, tries port+1, port+2, etc.
 * Does NOT retry on "binary not found" errors — port change won't help.
 */
async function spawnServerWithRetry(
	hostname: string,
	port: number,
	config: LocalServerConfig,
	attempt = 1,
): Promise<OpenCodeServer> {
	try {
		log.info("Spawning server", { attempt, maxRetries: MAX_SPAWN_RETRIES, port })
		return await spawnServer(hostname, port, config)
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err)
		log.warn("Server spawn failed", { attempt, error: errorMsg })

		// Don't retry on "binary not found" errors — changing ports won't help
		if (errorMsg.includes("Engine binary not found")) {
			log.error("Engine binary not found, retrying on different ports will not help")
			throw err
		}

		if (attempt >= MAX_SPAWN_RETRIES) {
			log.error("Max spawn retries reached, giving up", { attempts: attempt })
			throw new Error(`Failed to start engine after ${attempt} attempts on ports ${port - attempt + 1}-${port}: ${errorMsg}`)
		}

		// Force-kill any stale process holding the port before retrying
		try {
			const owner = await getListeningProcessOwner(port)
			if (owner && isCurrentUser(owner.uid)) {
				log.warn("Killing stale process on port before retry", { port, pid: owner.pid })
				process.kill(owner.pid, "SIGKILL")
				await new Promise((resolve) => setTimeout(resolve, 500))
			}
		} catch {
			// Ignore — cleanup is best-effort
		}

		// Wait with exponential backoff before retrying
		const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
		log.info("Retrying server spawn", { delayMs: delay, attempt: attempt + 1 })
		await new Promise((resolve) => setTimeout(resolve, delay))

		// On retry, try next port (port+1, port+2, etc.)
		let nextPort = port + 1
		const maxPortScan = port + 10 // Don't scan beyond 10 ports
		
		while (nextPort <= maxPortScan) {
			const available = await isPortAvailable(nextPort, hostname)
			if (available) {
				log.info("Using next available port for retry", { port: nextPort })
				break
			}
			log.debug("Port in use, trying next", { port: nextPort })
			nextPort++
		}

		return spawnServerWithRetry(hostname, nextPort, config, attempt + 1)
	}
}

/**
 * Gets the single server URL, or null if not running.
 */
export function getServerUrl(): string | null {
	return singleServer?.server.url ?? null
}

/**
 * Stops the single server if we manage it and removes the lockfile.
 */
export function stopServer(): boolean {
	stopNotificationWatcher()
	if (!singleServer?.process) {
		log.debug("No managed server to stop")
		singleServer = null
		removeLockfile()
		return false
	}
	log.info("Stopping managed server", { pid: singleServer.process.pid })
	singleServer.process.kill()
	singleServer = null
	removeLockfile()
	return true
}

/**
 * Restarts the managed server (stop + start). Used when local server
 * settings (hostname, port, password) change.
 */
export async function restartServer(): Promise<OpenCodeServer> {
	log.info("Restarting server due to settings change")
	await forceKillLocalServer()
	// Wait a bit to ensure the OS releases the port
	await new Promise(resolve => setTimeout(resolve, 500))
	return ensureServer()
}

/**
 * Forcefully kills the local server process if it is running on the configured port.
 * This is used to recover from a "stuck" background process that is holding the port
 * but failing health checks.
 */
export async function forceKillLocalServer(): Promise<boolean> {
	log.info("Force kill local server requested")
	stopServer()
	
	const config = getLocalServerConfig()
	const basePort = config.port || DEFAULT_PORT
	let killed = false
	
	// Kill processes on the configured port AND a few ports up (retry might have used them)
	for (let port = basePort; port <= basePort + 10; port++) {
		try {
			const owner = await getListeningProcessOwner(port)
			if (owner && isCurrentUser(owner.uid)) {
				log.warn("Forcefully killing stuck process on port", { port, pid: owner.pid })
				process.kill(owner.pid, "SIGKILL")
				await new Promise((resolve) => setTimeout(resolve, 300))
				killed = true
			}
		} catch {
			// Ignore — cleanup is best-effort
		}
	}
	
	return killed
}


// ============================================================
// Internal -- lockfile handling
// ============================================================

/**
 * Attempts to reconnect to a server described by an existing lockfile.
 * Returns an OpenCodeServer if successful, null if the lockfile is stale
 * or the server belongs to a different user (lockfile is cleaned up and
 * the caller should fall through to normal detection).
 */
async function handleLockfile(
	lockfile: { port: number; pid: number; startedAt: string },
	hostname: string,
): Promise<OpenCodeServer | null> {
	if (!isProcessAlive(lockfile.pid)) {
		log.info("Stale lockfile detected (PID dead), cleaning up", {
			pid: lockfile.pid,
			port: lockfile.port,
		})
		removeLockfile()
		return null
	}

	// PID is alive -- verify it's ours
	const owner = await getListeningProcessOwner(lockfile.port)
	if (owner && !isCurrentUser(owner.uid)) {
		log.warn("Lockfile PID is alive but owned by different user", {
			pid: lockfile.pid,
			uid: owner.uid,
		})
		removeLockfile()
		return null // Fall through to normal detection, which will trigger the conflict dialog
	}

	// PID alive + same user: probe to confirm it's actually an opencode server
	const url = `http://${hostname}:${lockfile.port}`
	if (await probeServer(url)) {
		log.info("Reconnecting to server from lockfile", { url, pid: lockfile.pid })
		const server: OpenCodeServer = { url, pid: lockfile.pid, managed: false }
		singleServer = { server, process: null }
		startNotificationWatcher(url)
		return server
	}

	// PID alive but not responding on the expected port -- stale lockfile
	log.info("Lockfile PID alive but server not responding, cleaning up", {
		pid: lockfile.pid,
		port: lockfile.port,
	})
	removeLockfile()
	return null
}

// ============================================================
// Internal -- detection with ownership check
// ============================================================

/**
 * Probes the target port for an existing OpenCode server and checks
 * whether the listening process belongs to the current OS user.
 */
async function detectExistingServer(
	hostname: string,
	port: number,
): Promise<DetectionResult> {
	const url = `http://${hostname}:${port}`
	const isResponding = await probeServer(url)
	if (!isResponding) {
		return { kind: "none" }
	}

	// Something is listening -- check who owns it
	const owner = await getListeningProcessOwner(port)

	if (!owner) {
		// Can't determine ownership (Windows, or lsof failed). On Windows this
		// is expected; on macOS/Linux treat as a soft conflict with a less
		// alarming prompt.
		if (process.platform === "win32") {
			log.debug("Existing server responded OK (ownership check skipped on Windows)", { url })
			return { kind: "found", server: { url, pid: null, managed: false } }
		}
		log.warn("Existing server found but could not determine owner", { url })
		return { kind: "conflict", url, ownerUid: null }
	}

	if (isCurrentUser(owner.uid)) {
		log.debug("Existing server belongs to current user", { url, pid: owner.pid, uid: owner.uid })
		return { kind: "found", server: { url, pid: owner.pid, managed: false } }
	}

	log.warn("Existing server belongs to a DIFFERENT user", { url, pid: owner.pid, uid: owner.uid })
	return { kind: "conflict", url, ownerUid: owner.uid }
}

// ============================================================
// Internal -- conflict resolution
// ============================================================

/**
 * Shows a dialog when the server on the target port belongs to a different
 * user. Offers three choices: start on a different port, connect anyway,
 * or cancel.
 */
async function handleConflict(
	conflict: { url: string; ownerUid: number | null },
	hostname: string,
	_configuredPort: number,
	config: LocalServerConfig,
): Promise<OpenCodeServer> {
	const ownerText =
		conflict.ownerUid !== null
			? `It appears to belong to a different user account (UID ${conflict.ownerUid}).`
			: "Its owner could not be determined."

	const { response } = await dialog.showMessageBox({
		type: "warning",
		title: "Server Ownership Conflict",
		message: "A Devil AI server is already running on the configured port.",
		detail:
			`${ownerText}\n\n` +
			"Connecting to a server owned by another user is a security risk: " +
			"they could access your sessions and files.\n\n" +
			"You can start your own server on a different port, or connect anyway " +
			"if you trust this server.",
		buttons: ["Start My Own Server", "Connect Anyway", "Cancel"],
		defaultId: 0,
		cancelId: 2,
	})

	if (response === 0) {
		// Start on a free port
		log.info("User chose to start own server on a different port")
		const freePort = await findFreePort(hostname)
		log.info("Found free port", { freePort })
		return spawnServer(hostname, freePort, config)
	}

	if (response === 1) {
		// Connect anyway (user accepts the risk)
		log.warn("User chose to connect to foreign server anyway", { url: conflict.url })
		const server: OpenCodeServer = { url: conflict.url, pid: null, managed: false }
		singleServer = { server, process: null }
		startNotificationWatcher(conflict.url)
		return server
	}

	// Cancel
	throw new Error("Server connection cancelled by user due to ownership conflict")
}

// ============================================================
// Internal -- server spawning
// ============================================================

/**
 * Finds the engine binary by checking known paths and PATH.
 * Uses cached path if available, otherwise searches and caches.
 */
async function findEngineBinary(): Promise<string> {
	// Use cached path if it still exists
	if (cachedBinaryPath && fs.existsSync(cachedBinaryPath)) {
		return cachedBinaryPath
	}

	const devilcodeBinDir = path.join(homedir(), ".devilcode", "bin")
	const sep = process.platform === "win32" ? ";" : ":"
	const augmentedPath = `${devilcodeBinDir}${sep}${process.env.PATH ?? ""}`

	// Check known candidate paths
	const candidates = process.platform === "win32"
		? [
				path.join(devilcodeBinDir, "devilcode.exe"),
				path.join(devilcodeBinDir, "devilcode"),
				path.join(homedir(), ".devilcode", "devilcode.exe"),
				path.join(homedir(), ".devilcode", "devilcode"),
				// Fallback to OpenCode paths for backwards compatibility
				path.join(homedir(), ".opencode", "bin", "opencode.exe"),
				path.join(homedir(), ".opencode", "bin", "opencode"),
			]
		: [
				path.join(devilcodeBinDir, "devilcode"),
				// Fallback to OpenCode paths for backwards compatibility
				path.join(homedir(), ".opencode", "bin", "opencode"),
			]

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			cachedBinaryPath = candidate
			log.debug("Found engine binary at candidate path", { path: candidate })
			return candidate
		}
	}

	// Fall back to which/where — try devilcode first, then opencode
	const whichCmd = process.platform === "win32" ? "where" : "which"
	try {
		const { execSync } = await import("node:child_process")
		// Try devilcode first
		try {
			const found = execSync(`${whichCmd} devilcode`, {
				env: { ...process.env, PATH: augmentedPath },
				timeout: 5000,
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
			}).trim()
			const firstLine = found.split("\n")[0]?.trim()
			if (firstLine && fs.existsSync(firstLine)) {
				cachedBinaryPath = firstLine
				log.debug("Found engine binary via which/where (devilcode)", { path: firstLine })
				return firstLine
			}
		} catch {
			// devilcode not found, try opencode
		}
		const found = execSync(`${whichCmd} opencode`, {
			env: { ...process.env, PATH: augmentedPath },
			timeout: 5000,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim()
		const firstLine = found.split("\n")[0]?.trim()
		if (firstLine && fs.existsSync(firstLine)) {
			cachedBinaryPath = firstLine
			log.debug("Found engine binary via which/where (opencode fallback)", { path: firstLine })
			return firstLine
		}
	} catch {
		// which/where failed
	}

	const checked = candidates.join(", ")
	throw new Error(
		`Engine binary not found. Checked: ${checked}. ` +
		`Ensure the engine is installed or the path is correct.`,
	)
}

/**
 * Spawns a new server process on the given hostname:port.
 * Writes a lockfile on success.
 */
async function spawnServer(
	hostname: string,
	port: number,
	config: LocalServerConfig,
): Promise<OpenCodeServer> {
	// Build PATH with ~/.devilcode/bin prepended so we find the engine binary
	const devilcodeBinDir = path.join(homedir(), ".devilcode", "bin")
	const opencodeBinDir = path.join(homedir(), ".opencode", "bin")
	const sep = process.platform === "win32" ? ";" : ":"
	const augmentedPath = `${devilcodeBinDir}${sep}${opencodeBinDir}${sep}${process.env.PATH ?? ""}`

	// Build CLI args
	const args = ["serve", `--hostname=${hostname}`, `--port=${port}`]

	// Add password if configured
	if (config.hasPassword) {
		const password = getCredential("local")
		if (password) {
			args.push(`--password=${password}`)
		}
	}

	// Add mDNS flags if enabled
	if (config.mdns) {
		args.push("--mdns")
		if (config.mdnsDomain) {
			args.push(`--mdns-domain=${config.mdnsDomain}`)
		}
	}

	// Find the engine binary (uses cache, then searches)
	const opencodeBin = await findEngineBinary()

	log.info("Spawning engine server", {
		hostname,
		port,
		hasPassword: !!config.hasPassword,
		mdns: !!config.mdns,
		binaryPath: opencodeBin,
		augmentedPath: augmentedPath.substring(0, 200) + "...",
	})

	const envVars: Record<string, string | undefined> = { ...process.env, PATH: augmentedPath }

	try {
		
		const gmailCreds = getConnectorCredential("gmail")
		if (gmailCreds?.accessToken || gmailCreds?.apiToken) {
			envVars.GOOGLE_ACCESS_TOKEN = gmailCreds.accessToken || gmailCreds.apiToken
		}
		
		const googleCalendarCreds = getConnectorCredential("google-calendar")
		const calendarToken = googleCalendarCreds?.accessToken || googleCalendarCreds?.apiToken
		if (calendarToken) {
			envVars.GOOGLE_CALENDAR_ACCESS_TOKEN = calendarToken
			if (!envVars.GOOGLE_ACCESS_TOKEN) {
				envVars.GOOGLE_ACCESS_TOKEN = calendarToken
			}
		}
		
		const githubCreds = getConnectorCredential("github")
		if (githubCreds?.accessToken || githubCreds?.apiToken) {
			envVars.GITHUB_TOKEN = githubCreds.accessToken || githubCreds.apiToken
			envVars.GITHUB_PERSONAL_ACCESS_TOKEN = githubCreds.accessToken || githubCreds.apiToken
		}

		const slackCreds = getConnectorCredential("slack")
		if (slackCreds?.accessToken || slackCreds?.apiToken) {
			envVars.SLACK_TOKEN = slackCreds.accessToken || slackCreds.apiToken
		}

		const telegramCreds = getConnectorCredential("telegram")
		if (telegramCreds?.botToken) {
			envVars.TELEGRAM_BOT_TOKEN = telegramCreds.botToken
		}

		const discordCreds = getConnectorCredential("discord")
		if (discordCreds?.botToken) {
			envVars.DISCORD_BOT_TOKEN = discordCreds.botToken
		}

		const whatsappCreds = getConnectorCredential("whatsapp")
		if (whatsappCreds?.accessToken && whatsappCreds?.phoneNumberId) {
			envVars.WHATSAPP_TOKEN = whatsappCreds.accessToken
			envVars.WHATSAPP_PHONE_ID = whatsappCreds.phoneNumberId
		}

		// New MCP Connectors
		const braveCreds = getConnectorCredential("brave-search")
		if (braveCreds?.apiKey) {
			envVars.BRAVE_API_KEY = braveCreds.apiKey
		}

		const postgresCreds = getConnectorCredential("postgres")
		if (postgresCreds?.databaseUrl) {
			envVars.POSTGRES_URL = postgresCreds.databaseUrl
		}

		const sentryCreds = getConnectorCredential("sentry")
		if (sentryCreds?.authToken) {
			envVars.SENTRY_AUTH_TOKEN = sentryCreds.authToken
		}

		const notionCreds = getConnectorCredential("notion")
		if (notionCreds?.accessToken || notionCreds?.apiToken) {
			envVars.NOTION_API_TOKEN = notionCreds.accessToken || notionCreds.apiToken
		}

		// Map SLACK_BOT_TOKEN for official MCP server
		if (envVars.SLACK_TOKEN) {
			envVars.SLACK_BOT_TOKEN = envVars.SLACK_TOKEN
		}
	} catch (e) {
		log.error("Failed to inject connector credentials into engine env", e)
	}

	const proc = spawn(opencodeBin, args, {
		cwd: homedir(),
		stdio: "pipe",
		env: envVars,
	})

	const url = `http://${hostname}:${port}`
	const server: OpenCodeServer = {
		url,
		pid: proc.pid ?? null,
		managed: true,
	}

	singleServer = { server, process: proc }

	// Capture stdout/stderr for diagnostics
	proc.stdout?.on("data", (data: Buffer) => {
		const text = data.toString().trim()
		if (text) log.debug(`[stdout] ${text}`)
	})

	proc.stderr?.on("data", (data: Buffer) => {
		const text = data.toString().trim()
		if (text) log.warn(`[stderr] ${text}`)
	})

	const abortController = new AbortController()

	// Handle spawn errors (e.g. binary not found)
	proc.on("error", (err) => {
		log.error("Failed to spawn engine process", err)
		abortController.abort(err)
		if (singleServer?.process === proc) {
			singleServer = null
			removeLockfile()
		}
	})

	// Clean up on exit -- allow lazy restart on next request
	proc.on("exit", (code, signal) => {
		abortController.abort(new Error(`Process exited early with code ${code} signal ${signal}`))
		if (singleServer?.process === proc) {
			log.warn("Server process exited", { pid: proc.pid, code, signal })
			singleServer = null
			removeLockfile()
			
			// If server exits with error, try to restart after a delay
			if (code && code !== 0) {
				log.info("Server exited with error code, will retry on next request", { code })
			}
		}
	})

	// Wait for the server to be ready
	await waitForReady(url, 15_000, abortController.signal)

	// Write lockfile after successful start
	if (proc.pid) {
		writeLockfile(port, proc.pid)
	}

	log.info("Server started successfully", { url, pid: proc.pid })
	startNotificationWatcher(url)
	
	// Inject DevilRoute defaults
	import("./provider-fix").then(m => m.applyDevilRouteSetup()).catch(e => log.error("Error calling applyDevilRouteSetup:", e))
	
	return server
}

// ============================================================
// Internal -- HTTP probe & readiness
// ============================================================

/** Quick probe to check if a server responds on the given URL. */
async function probeServer(url: string): Promise<boolean> {
	try {
		const res = await fetch(`${url}/config`, {
			signal: AbortSignal.timeout(5000),
		})
		log.debug("Server probe responded", { url, status: res.status })
		// Any HTTP response means the server is listening
		return true
	} catch (err) {
		log.debug("Server probe failed", { url, reason: String(err) })
	}
	return false
}

async function waitForReady(url: string, timeoutMs: number, signal?: AbortSignal): Promise<void> {
	const start = Date.now()
	let attempts = 0
	let delay = 50
	while (Date.now() - start < timeoutMs) {
		if (signal?.aborted) throw signal.reason
		attempts++
		try {
			const res = await fetch(`${url}/config`, {
				signal: AbortSignal.timeout(300),
			})
			log.debug("Server ready", { url, status: res.status, attempts, elapsed: Date.now() - start })
			return
		} catch (err) {
			log.debug("Server not ready yet", { url, reason: String(err), attempts })
		}
		await sleep(delay)
		if (delay < 200) delay += 25
	}
	const error = new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
	log.error(error.message, { attempts })
	throw error
}
