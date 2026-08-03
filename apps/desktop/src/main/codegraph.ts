/**
 * CodeGraph manager for the Devil AI desktop app.
 *
 * Handles CodeGraph detection, installation, and MCP server management.
 * Provides code knowledge graph capabilities for AI agents.
 * Package: @colbymchenry/codegraph
 */

import { type ChildProcess, spawn, execSync, execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { createLogger } from "./logger"

const log = createLogger("codegraph")

// ============================================================
// Types
// ============================================================

export interface CodeGraphCheckResult {
	installed: boolean
	version?: string
	error?: string
}

export interface CodeGraphIndexResult {
	success: boolean
	indexedFiles?: number
	duration?: number
	error?: string
}

export interface CodeGraphQueryResult {
	success: boolean
	result?: string
	error?: string
}

// ============================================================
// CodeGraph detection
// ============================================================

export async function checkCodeGraph(): Promise<CodeGraphCheckResult> {
	try {
		const output = execSync("codegraph --version", { encoding: "utf-8", timeout: 10000 }).trim()
		const match = output.match(/codegraph[^\d]*(\d+)\.(\d+)\.?(\d*)/)
		if (!match) return { installed: true, version: output }
		return { installed: true, version: `${match[1]}.${match[2]}.${match[3] || "0"}` }
	} catch {
		return { installed: false }
	}
}

// ============================================================
// CodeGraph install
// ============================================================

let codegraphInstallProcess: ChildProcess | null = null

export async function installCodeGraph(): Promise<{ success: boolean; error?: string }> {
	if (codegraphInstallProcess) {
		return { success: false, error: "CodeGraph installation already in progress" }
	}

	return new Promise((resolve) => {
		log.info("Installing CodeGraph via npm (@colbymchenry/codegraph)...")
		codegraphInstallProcess = spawn("npm", ["install", "-g", "@colbymchenry/codegraph"], {
			cwd: homedir(),
			stdio: "pipe",
			env: process.env,
		})

		const proc = codegraphInstallProcess

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[codegraph-install:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[codegraph-install:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("CodeGraph install process error", err)
			codegraphInstallProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			codegraphInstallProcess = null
			if (code === 0) {
				log.info("CodeGraph install completed successfully")
				resolve({ success: true })
			} else {
				log.warn("CodeGraph install exited with code", code)
				resolve({ success: false, error: `Install exited with code ${code}` })
			}
		})
	})
}

// ============================================================
// CodeGraph index
// ============================================================

let codegraphIndexProcess: ChildProcess | null = null

export async function indexCodeGraph(cwd: string): Promise<{ success: boolean; result?: CodeGraphIndexResult; error?: string }> {
	if (codegraphIndexProcess) {
		return { success: false, error: "CodeGraph indexing already in progress" }
	}

	if (!existsSync(cwd)) {
		return { success: false, error: `Directory not found: ${cwd}` }
	}

	return new Promise((resolve) => {
		const startTime = Date.now()
		codegraphIndexProcess = spawn("codegraph", ["index"], {
			cwd,
			stdio: "pipe",
			env: process.env,
		})

		const proc = codegraphIndexProcess

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[codegraph-index:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[codegraph-index:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("CodeGraph index error", err)
			codegraphIndexProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			codegraphIndexProcess = null
			const duration = Date.now() - startTime
			if (code === 0) {
				log.info("CodeGraph index completed successfully")
				resolve({
					success: true,
					result: {
						success: true,
						duration,
					},
				})
			} else {
				log.warn("CodeGraph index exited with code", code)
				resolve({
					success: false,
					result: {
						success: false,
						duration,
						error: `Index exited with code ${code}`,
					},
				})
			}
		})
	})
}

// ============================================================
// CodeGraph query
// ============================================================

export async function queryCodeGraph(
	query: string,
	cwd: string,
): Promise<{ success: boolean; result?: CodeGraphQueryResult; error?: string }> {
	if (!existsSync(cwd)) {
		return { success: false, error: `Directory not found: ${cwd}` }
	}

	try {
		const output = execFileSync("codegraph", ["query", query], {
			encoding: "utf-8",
			timeout: 60_000,
			cwd,
			env: process.env,
		})
		return {
			success: true,
			result: {
				success: true,
				result: output,
			},
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		return {
			success: false,
			result: {
				success: false,
				error: msg,
			},
		}
	}
}

// ============================================================
// CodeGraph MCP server
// ============================================================

let codegraphMcpProcess: ChildProcess | null = null

export async function startCodeGraphMcp(cwd: string): Promise<{ success: boolean; error?: string }> {
	if (codegraphMcpProcess) {
		return { success: false, error: "CodeGraph MCP server already running" }
	}

	if (!existsSync(cwd)) {
		return { success: false, error: `Directory not found: ${cwd}` }
	}

	return new Promise((resolve) => {
		codegraphMcpProcess = spawn("codegraph", ["mcp"], {
			cwd,
			stdio: "pipe",
			env: process.env,
		})

		const proc = codegraphMcpProcess

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[codegraph-mcp:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			log.debug(`[codegraph-mcp:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("CodeGraph MCP server error", err)
			codegraphMcpProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			codegraphMcpProcess = null
			if (code === 0) {
				log.info("CodeGraph MCP server started successfully")
				resolve({ success: true })
			} else {
				log.warn("CodeGraph MCP server exited with code", code)
				resolve({ success: false, error: `MCP server exited with code ${code}` })
			}
		})
	})
}

export function stopCodeGraphMcp(): void {
	if (codegraphMcpProcess) {
		try {
			if (process.platform !== "win32") {
				codegraphMcpProcess.kill("SIGTERM")
			} else {
				codegraphMcpProcess.kill()
			}
		} catch { /* ignore */ }
		codegraphMcpProcess = null
	}
}

