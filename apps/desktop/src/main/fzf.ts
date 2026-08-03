/**
 * fzf manager for the Devil AI desktop app.
 *
 * Handles fzf detection and provides fuzzy file search capabilities.
 */

import { type ChildProcess, spawn, execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { createLogger } from "./logger"

const log = createLogger("fzf")

// ============================================================
// Types
// ============================================================

export interface FzfCheckResult {
	installed: boolean
	version?: string
	error?: string
}

export interface FzfSearchResult {
	items: string[]
	query: string
}

// ============================================================
// fzf detection
// ============================================================

export async function checkFzf(): Promise<FzfCheckResult> {
	try {
		const output = execSync("fzf --version", { encoding: "utf-8", timeout: 10000 }).trim()
		const match = output.match(/(\d+)\.(\d+)\.?(\d*)/)
		if (!match) return { installed: true, version: output }
		return { installed: true, version: `${match[1]}.${match[2]}.${match[3] || "0"}` }
	} catch {
		return { installed: false }
	}
}

// ============================================================
// fzf install
// ============================================================

let fzfInstallProcess: ChildProcess | null = null

export async function installFzf(): Promise<{ success: boolean; error?: string }> {
	if (fzfInstallProcess) {
		return { success: false, error: "fzf installation already in progress" }
	}

	const isWindows = process.platform === "win32"
	const isMac = process.platform === "darwin"

	return new Promise((resolve) => {
		if (isMac) {
			log.info("Installing fzf via Homebrew...")
			fzfInstallProcess = spawn("brew", ["install", "fzf"], {
				cwd: homedir(),
				stdio: "pipe",
				env: process.env,
			})
		} else if (isWindows) {
			log.info("Installing fzf via winget...")
			fzfInstallProcess = spawn(
				"winget",
				["install", "--id", "junegunn.fzf", "--accept-source-agreements", "--accept-package-agreements"],
				{ cwd: homedir(), stdio: "pipe", env: process.env },
			)
		} else {
			log.info("Installing fzf via git...")
			fzfInstallProcess = spawn(
				"bash",
				["-c", "git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf && ~/.fzf/install --all"],
				{ cwd: homedir(), stdio: "pipe", env: process.env },
			)
		}

		const proc = fzfInstallProcess

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[fzf-install:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[fzf-install:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("fzf install process error", err)
			fzfInstallProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			fzfInstallProcess = null
			if (code === 0) {
				log.info("fzf install completed successfully")
				resolve({ success: true })
			} else {
				log.warn("fzf install exited with code", code)
				resolve({ success: false, error: `Install exited with code ${code}` })
			}
		})
	})
}

// ============================================================
// fzf search
// ============================================================

export async function fzfSearch(
	query: string,
	cwd: string,
	options?: {
		files?: boolean
		dirs?: boolean
		hidden?: boolean
		multi?: boolean
		preview?: string
	},
): Promise<{ success: boolean; result?: FzfSearchResult; error?: string }> {
	if (!existsSync(cwd)) {
		return { success: false, error: `Directory not found: ${cwd}` }
	}

	const args: string[] = []

	if (options?.files) args.push("--files")
	if (options?.dirs) args.push("--only-dirs")
	if (options?.hidden) args.push("--hidden")
	if (options?.multi) args.push("--multi")
	if (options?.preview) args.push("--preview", options.preview)

	if (query) args.push("--query", query)

	return new Promise((resolve) => {
		const proc = spawn("fzf", args, {
			cwd,
			stdio: "pipe",
			env: process.env,
		})

		let stdout = ""
		proc.stdout?.on("data", (data: Buffer) => {
			stdout += data.toString()
		})

		proc.on("error", (err) => {
			log.error("fzf search error", err)
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			if (code === 0 || stdout.trim()) {
				const items = stdout.trim().split("\n").filter(Boolean)
				resolve({ success: true, result: { items, query } })
			} else {
				resolve({ success: false, error: "No results or cancelled" })
			}
		})
	})
}

// ============================================================
// fzf files (quick file search)
// ============================================================

export async function fzfFiles(
	cwd: string,
	query?: string,
): Promise<{ success: boolean; result?: FzfSearchResult; error?: string }> {
	return fzfSearch(query || "", cwd, { files: true, hidden: true })
}

// ============================================================
// fzf processes
// ============================================================

export async function fzfProcesses(
	query?: string,
): Promise<{ success: boolean; result?: FzfSearchResult; error?: string }> {
	const args = ["--tac"]
	if (query) args.push("--query", query)

	return new Promise((resolve) => {
		const proc = spawn("bash", ["-c", "ps aux | tail -n +2"], {
			stdio: "pipe",
			env: process.env,
		})

		let stdout = ""
		proc.stdout?.on("data", (data: Buffer) => {
			stdout += data.toString()
		})

		proc.on("error", (err) => {
			log.error("fzf processes error", err)
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", () => {
			const fzfProc = spawn("fzf", args, {
				stdio: "pipe",
				env: process.env,
			})

			fzfProc.stdin?.write(stdout)
			fzfProc.stdin?.end()

			let fzfOutput = ""
			fzfProc.stdout?.on("data", (data: Buffer) => {
				fzfOutput += data.toString()
			})

			fzfProc.on("error", (err) => {
				log.error("fzf processes error", err)
				resolve({ success: false, error: err.message })
			})

			fzfProc.on("exit", (code) => {
				if (code === 0 || fzfOutput.trim()) {
					const items = fzfOutput.trim().split("\n").filter(Boolean)
					resolve({ success: true, result: { items, query: query || "" } })
				} else {
					resolve({ success: false, error: "No results or cancelled" })
				}
			})
		})
	})
}

// ============================================================
// Cleanup on quit
// ============================================================

export function shutdownFzf(): void {
	if (fzfInstallProcess) {
		try {
			if (process.platform !== "win32") {
				fzfInstallProcess.kill("SIGTERM")
			} else {
				fzfInstallProcess.kill()
			}
		} catch { /* ignore */ }
	}
}
