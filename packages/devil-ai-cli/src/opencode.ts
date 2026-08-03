import { type ChildProcess, spawn } from "node:child_process"
import { homedir } from "node:os"
import path from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import { findFreePort } from "./find-free-port.js"
import { createLogger } from "./logger.js"
import { getSettings } from "./settings.js"
import { waitForEnv } from "./shell-env.js"
import type { OpenCodeServer } from "./types.js"

const log = createLogger("opencode-manager")

const MAX_SPAWN_RETRIES = 3
const RETRY_BASE_DELAY_MS = 2000
const DEFAULT_PORT = 4101
const DEFAULT_HOSTNAME = "127.0.0.1"

let singleServer: {
	server: OpenCodeServer
	process: ChildProcess | null
} | null = null

let ensureServerPromise: Promise<OpenCodeServer> | null = null

export async function ensureServer(): Promise<OpenCodeServer> {
	if (singleServer) {
		return singleServer.server
	}
	if (ensureServerPromise) {
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
	await waitForEnv()

	const settings = getSettings()
	const local = settings.servers.servers.find((s) => s.id === "local")
	const hostname = local?.hostname || DEFAULT_HOSTNAME
	const port = local?.port || DEFAULT_PORT

	// Probe existing server
	const isRunning = await probeServer(`http://${hostname}:${port}`)
	if (isRunning) {
		log.info("Found existing server", { url: `http://${hostname}:${port}` })
		const server: OpenCodeServer = { url: `http://${hostname}:${port}`, pid: null, managed: false }
		singleServer = { server, process: null }
		return server
	}

	return spawnServerWithRetry(hostname, port)
}

async function spawnServerWithRetry(
	hostname: string,
	port: number,
	attempt = 1,
): Promise<OpenCodeServer> {
	try {
		log.info("Spawning server", { attempt, port })
		return await spawnServer(hostname, port)
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err)
		log.warn("Spawn failed", { attempt, error: errorMsg })

		if (attempt >= MAX_SPAWN_RETRIES) {
			throw new Error(
				`Failed to start DevilCode/OpenCode server after ${attempt} attempts: ${errorMsg}`,
			)
		}

		const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
		await sleep(delay)

		let nextPort = port
		if (attempt > 1) {
			try {
				nextPort = await findFreePort(hostname)
			} catch {
				/* ignore */
			}
		}

		return spawnServerWithRetry(hostname, nextPort, attempt + 1)
	}
}

async function spawnServer(hostname: string, port: number): Promise<OpenCodeServer> {
	const devilcodeBinDir = path.join(homedir(), ".devilcode", "bin")
	const opencodeBinDir = path.join(homedir(), ".opencode", "bin")
	const sep = process.platform === "win32" ? ";" : ":"
	const augmentedPath = `${devilcodeBinDir}${sep}${opencodeBinDir}${sep}${process.env.PATH ?? ""}`

	const args = ["serve", `--hostname=${hostname}`, `--port=${port}`]

	log.info("Spawning devilcode/opencode", { hostname, port })

	// Try devilcode first, then fallback to opencode
	let binaryName = "devilcode"
	try {
		const { execSync } = await import("node:child_process")
		const whichCmd = process.platform === "win32" ? "where" : "which"
		execSync(`${whichCmd} devilcode`, { stdio: "pipe" })
	} catch {
		binaryName = "opencode"
	}

	const proc = spawn(binaryName, args, {
		cwd: homedir(),
		stdio: "pipe",
		env: { ...process.env, PATH: augmentedPath },
	})

	const url = `http://${hostname}:${port}`
	const server: OpenCodeServer = { url, pid: proc.pid ?? null, managed: true }
	singleServer = { server, process: proc }

	proc.stdout?.on("data", (data: Buffer) => {
		const text = data.toString().trim()
		if (text) log.debug(`[stdout] ${text}`)
	})

	proc.stderr?.on("data", (data: Buffer) => {
		const text = data.toString().trim()
		if (text) log.warn(`[stderr] ${text}`)
	})

	proc.on("error", (err) => {
		log.error("Failed to spawn devilcode/opencode", err)
		if (singleServer?.process === proc) {
			singleServer = null
		}
	})

	proc.on("exit", (code, signal) => {
		if (singleServer?.process === proc) {
			log.warn("Server process exited", { pid: proc.pid, code, signal })
			singleServer = null
		}
	})

	await waitForReady(url, 15_000)
	log.info("Server started", { url, pid: proc.pid })
	return server
}

export function getServerUrl(): string | null {
	return singleServer?.server.url ?? null
}

export function stopServer(): boolean {
	if (!singleServer?.process) {
		return false
	}
	log.info("Stopping server", { pid: singleServer.process.pid })
	singleServer.process.kill()
	singleServer = null
	return true
}

export async function restartServer(): Promise<OpenCodeServer> {
	stopServer()
	return ensureServer()
}

async function probeServer(url: string): Promise<boolean> {
	try {
		const res = await fetch(`${url}/session`, { signal: AbortSignal.timeout(800) })
		return res.ok
	} catch {
		return false
	}
}

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
	const start = Date.now()
	let _attempts = 0
	let delay = 50
	while (Date.now() - start < timeoutMs) {
		_attempts++
		try {
			const res = await fetch(`${url}/session`, { signal: AbortSignal.timeout(300) })
			if (res.ok) return
		} catch {
			/* not ready */
		}
		await sleep(delay)
		if (delay < 200) delay += 25
	}
	throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}
