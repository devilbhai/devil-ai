/**
 * DevilRoute manager — lifecycle for the local AI gateway.
 *
 * DevilRoute (rebranded OmniRoute) is the local gateway that powers the
 * "devil-ai" provider: it listens on 127.0.0.1:20128 and exposes an
 * OpenAI-compatible `/v1/*` API plus a web console at `/login`.
 *
 * Responsibilities:
 *   - Health-check the gateway (`GET /v1/models`) so we never double-spawn.
 *   - Find the `devilroute` binary (falls back to `omniroute` until the
 *     rebranded package is published).
 *   - Auto-install it via npm when missing (macOS / Windows / Linux).
 *   - Spawn it as a managed child process and stop it on app quit.
 *
 * Mirrors the proven `opencode-manager.ts` patterns (spawn + probe + stop).
 * Unlike the engine server, this is a single fixed port with no conflict
 * dialog — it is a local helper, not a user-facing server.
 */

import { type ChildProcess, execSync, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import { createLogger } from "./logger"

const log = createLogger("devilroute-manager")

// ============================================================
// Constants
// ============================================================

export const DEVILROUTE_PORT = 20128
export const DEVILROUTE_HOST = "127.0.0.1"
export const DEVILROUTE_BASE_URL = `http://${DEVILROUTE_HOST}:${DEVILROUTE_PORT}`
export const DEVILROUTE_MODELS_URL = `${DEVILROUTE_BASE_URL}/v1/models`
/** Web console the "configure devil-ai" settings button opens. */
export const DEVILROUTE_LOGIN_URL = `${DEVILROUTE_BASE_URL}/login`

/** npm install timeout — the package is huge (~830MB unpacked). */
const INSTALL_TIMEOUT_MS = 15 * 60 * 1000
/** How long to wait for the gateway to become healthy after spawn. */
const SPAWN_READY_TIMEOUT_MS = 90 * 1000

/**
 * npm 11+ gates packages whose install/lifecycle scripts run code behind an
 * allow-list. These native modules MUST run their build script (node-gyp
 * rebuild / binary fetch) so user-platform binaries replace the bundled
 * linux-x64 ones inside `dist/`. Passed as `--allow-scripts <list>`.
 * Harmless on older npm (treated as an unused config key).
 */
const NPM_ALLOW_SCRIPTS = [
	"better-sqlite3",
	"esbuild",
	"@swc/core",
	"fsevents",
	"keytar",
	"koffi",
	"onnxruntime-node",
	"protobufjs",
	"tls-client-node",
	"@parcel/watcher",
	"core-js",
].join(",")

// ============================================================
// State — the managed child process we spawned (if any)
// ============================================================

let managedProcess: ChildProcess | null = null

// ============================================================
// Public API
// ============================================================

export interface DevilRouteStatus {
	installed: boolean
	running: boolean
	binary: string | null
}

/**
 * Health-check the gateway. True when `/v1/models` responds.
 * Used everywhere to decide whether to spawn or install.
 */
export async function isDevilRouteHealthy(timeoutMs = 2000): Promise<boolean> {
	try {
		const res = await fetch(DEVILROUTE_MODELS_URL, {
			signal: AbortSignal.timeout(timeoutMs),
		})
		return res.ok
	} catch {
		return false
	}
}

/**
 * Check whether the gateway binary is installed and/or running.
 * Used by the onboarding DevilRoute step to render its state.
 */
export async function checkDevilRoute(): Promise<DevilRouteStatus> {
	const binary = findDevilRouteBinary()
	const running = await isDevilRouteHealthy()
	return { installed: binary !== null, running, binary }
}

/**
 * Ensure the gateway is running:
 *   1. Already healthy → no-op.
 *   2. Binary missing   → npm-install it (devilroute, falling back to omniroute).
 *   3. Spawn it and wait until `/v1/models` responds.
 *
 * `onOutput` streams install output lines to the caller (used by onboarding).
 */
export async function ensureDevilRoute(
	onOutput?: (text: string) => void,
): Promise<{ success: boolean; error?: string }> {
	// Already running — never double-spawn.
	if (await isDevilRouteHealthy()) {
		log.info("DevilRoute gateway already running", { url: DEVILROUTE_BASE_URL })
		return { success: true }
	}

	// Binary missing → install the package first.
	let binary = findDevilRouteBinary()
	if (!binary) {
		const installed = await installDevilRoutePackage(onOutput)
		if (!installed.success) {
			return { success: false, error: installed.error ?? "Failed to install devilroute" }
		}
		binary = findDevilRouteBinary()
		if (!binary) {
			return {
				success: false,
				error: "devilroute installed but the binary could not be found on PATH",
			}
		}
	}

	return spawnDevilRoute(binary)
}

/**
 * Stop the gateway if we spawned it. Idempotent.
 * Never kills processes we did not spawn (e.g. an omniroute started manually).
 */
export function stopDevilRoute(): boolean {
	if (!managedProcess || managedProcess.pid === undefined) {
		log.debug("No managed DevilRoute process to stop")
		return false
	}
	const pid = managedProcess.pid
	log.info("Stopping managed DevilRoute gateway", { pid })
	try {
		managedProcess.kill("SIGTERM")
	} catch {
		// Already dead
	}
	// SIGKILL fallback if SIGTERM did not take within 3s.
	const timer = setTimeout(() => {
		try {
			process.kill(pid, "SIGKILL")
		} catch {
			// Process already gone
		}
	}, 3000)
	timer.unref()
	managedProcess = null
	return true
}

// ============================================================
// Internal — binary discovery
// ============================================================

/**
 * Locate the `devilroute` binary, falling back to `omniroute`.
 * Checks npm's global bin dirs plus `which`/`where` on PATH.
 */
function findDevilRouteBinary(): string | null {
	const names = ["devilroute", "omniroute"]
	const candidates: string[] = []

	// npm global bin dirs (platform-specific).
	if (process.platform === "win32") {
		const appData = process.env.APPDATA ?? ""
		for (const name of names) {
			candidates.push(path.join(appData, "npm", `${name}.cmd`))
			candidates.push(path.join(appData, "npm", name))
		}
	} else {
		for (const name of names) {
			candidates.push(path.join(homedir(), ".npm-global", "bin", name))
			candidates.push(`/usr/local/bin/${name}`)
			candidates.push(`/opt/homebrew/bin/${name}`)
		}
	}

	// which/where fallback — this resolves the actual npm prefix location
	// (nvm, fnm, volta, etc.) that the fixed paths above may miss.
	try {
		const whichCmd = process.platform === "win32" ? "where" : "which"
		const out = execSync(
			`${whichCmd} ${names.join(" ")} 2>/dev/null | head -1`,
			{ timeout: 5000, encoding: "utf-8" },
		).trim()
		if (out) candidates.unshift(out)
	} catch {
		// neither binary on PATH
	}

	for (const candidate of candidates) {
		if (candidate && existsSync(candidate)) {
			log.debug("Found gateway binary", { path: candidate })
			return candidate
		}
	}
	return null
}

// ============================================================
// Internal — npm install
// ============================================================

/**
 * Install the gateway via npm globally. Tries `devilroute` first; if that
 * package does not exist on the registry yet (404), falls back to `omniroute`
 * so nothing breaks. Streams output lines to the renderer via `onOutput`.
 */
function installDevilRoutePackage(
	onOutput?: (text: string) => void,
): Promise<{ success: boolean; error?: string }> {
	const packageName = "devilroute"
	const shell = process.platform === "win32" ? "cmd.exe" : "bash"
	const shellFlag = process.platform === "win32" ? "/c" : "-c"
	// --legacy-peer-deps is required: upstream CLI tooling has peer-dep conflicts
	// that fail strict npm resolution.
	// --allow-scripts is required on npm 11+: without it native-module build
	// scripts (better-sqlite3, esbuild, keytar, …) are skipped and the gateway
	// cannot boot with user-platform binaries.
	const command = `npm install -g --legacy-peer-deps --allow-scripts ${NPM_ALLOW_SCRIPTS} ${packageName}`

	onOutput?.(
		`Installing ${packageName} (local AI gateway, port ${DEVILROUTE_PORT}). This downloads ~830MB — please wait.\n`,
	)

	return new Promise((resolve) => {
		const proc = spawn(shell, [shellFlag, command], {
			cwd: homedir(),
			stdio: "pipe",
			env: process.env,
		})

		const send = (text: string) => onOutput?.(text)
		proc.stdout?.on("data", (data: Buffer) => send(data.toString()))
		proc.stderr?.on("data", (data: Buffer) => send(data.toString()))

		// Hard timeout — kill a hung install so the UI can report & retry.
		const timer = setTimeout(() => {
			log.warn("DevilRoute install timed out, killing", { packageName })
			try {
				proc.kill("SIGKILL")
			} catch {
				// already dead
			}
		}, INSTALL_TIMEOUT_MS)

		proc.on("error", (err) => {
			clearTimeout(timer)
			log.error("DevilRoute install process error", err)
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			clearTimeout(timer)
			if (code === 0) {
				onOutput?.("\nDevilRoute installed successfully.\n")
				log.info("DevilRoute package installed", { packageName })
				resolve({ success: true })
				return
			}
			// devilroute not published yet → retry with omniroute once.
			if (packageName === "devilroute") {
				log.warn("devilroute install failed, falling back to omniroute", { code })
				onOutput?.("\n`devilroute` not on npm yet — falling back to `omniroute`.\n")
				installOmnirouteFallback(onOutput).then(resolve)
				return
			}
			onOutput?.(`\nInstallation failed with exit code ${code}.\n`)
			resolve({ success: false, error: `npm install exited with code ${code}` })
		})
	})
}

/** Fallback path: `npm install -g --legacy-peer-deps omniroute`. */
function installOmnirouteFallback(
	onOutput?: (text: string) => void,
): Promise<{ success: boolean; error?: string }> {
	const shell = process.platform === "win32" ? "cmd.exe" : "bash"
	const shellFlag = process.platform === "win32" ? "/c" : "-c"
	const command = `npm install -g --legacy-peer-deps --allow-scripts ${NPM_ALLOW_SCRIPTS} omniroute`
	return new Promise((resolve) => {
		const proc = spawn(shell, [shellFlag, command], {
			cwd: homedir(),
			stdio: "pipe",
			env: process.env,
		})
		const send = (text: string) => onOutput?.(text)
		proc.stdout?.on("data", (data: Buffer) => send(data.toString()))
		proc.stderr?.on("data", (data: Buffer) => send(data.toString()))
		const timer = setTimeout(() => {
			try {
				proc.kill("SIGKILL")
			} catch {
				// already dead
			}
		}, INSTALL_TIMEOUT_MS)
		proc.on("error", (err) => {
			clearTimeout(timer)
			resolve({ success: false, error: err.message })
		})
		proc.on("exit", (code) => {
			clearTimeout(timer)
			if (code === 0) {
				onOutput?.("\nOmniRoute (fallback) installed successfully.\n")
				resolve({ success: true })
			} else {
				onOutput?.(`\nFallback install failed with exit code ${code}.\n`)
				resolve({ success: false, error: `npm install exited with code ${code}` })
			}
		})
	})
}

// ============================================================
// Internal — spawn + readiness
// ============================================================

/**
 * Spawn the gateway binary and wait until `/v1/models` responds.
 * If a previous managed child died, this starts a fresh one.
 */
async function spawnDevilRoute(
	binary: string,
): Promise<{ success: boolean; error?: string }> {
	// Clear any stale reference before spawning a new child.
	if (managedProcess && managedProcess.exitCode === null) {
		log.info("A managed DevilRoute process is already running", {
			pid: managedProcess.pid,
		})
		return { success: true }
	}

	log.info("Spawning DevilRoute gateway", { binary, url: DEVILROUTE_BASE_URL })
	const proc = spawn(binary, ["serve", "--port", String(DEVILROUTE_PORT)], {
		cwd: homedir(),
		stdio: ["ignore", "pipe", "pipe"],
		env: process.env,
	})
	managedProcess = proc

	proc.stdout?.on("data", (data: Buffer) => {
		const text = data.toString().trim()
		if (text) log.debug(`[devilroute:stdout] ${text.slice(0, 400)}`)
	})
	proc.stderr?.on("data", (data: Buffer) => {
		const text = data.toString().trim()
		if (text) log.warn(`[devilroute:stderr] ${text.slice(0, 400)}`)
	})

	proc.on("error", (err) => {
		log.error("Failed to spawn DevilRoute gateway", err)
		if (managedProcess === proc) managedProcess = null
	})
	proc.on("exit", (code, signal) => {
		log.warn("DevilRoute gateway exited", { pid: proc.pid, code, signal })
		if (managedProcess === proc) managedProcess = null
	})

	// Wait until healthy (Next.js boot can take 20-60s on first run).
	const started = Date.now()
	while (Date.now() - started < SPAWN_READY_TIMEOUT_MS) {
		if (proc.exitCode !== null) {
			return {
				success: false,
				error: `DevilRoute gateway exited early with code ${proc.exitCode}`,
			}
		}
		if (await isDevilRouteHealthy(1000)) {
			log.info("DevilRoute gateway healthy", { url: DEVILROUTE_BASE_URL, pid: proc.pid })
			return { success: true }
		}
		await sleep(1000)
	}

	log.error("DevilRoute gateway did not become healthy in time")
	return { success: false, error: "DevilRoute gateway did not become ready in time" }
}
