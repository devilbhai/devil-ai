/**
 * Engine version compatibility definitions for Devil AI.
 *
 * Updated with each Devil AI release to reflect tested engine versions.
 * The environment check in the onboarding flow uses these ranges to
 * decide whether to pass, warn, or block.
 *
 * Also provides Git and Python detection for onboarding.
 */

import { execFile } from "node:child_process"
import { homedir } from "node:os"
import path from "node:path"
import { coerce, satisfies, valid } from "semver"
import { createLogger } from "./logger"

const log = createLogger("compatibility")

// ============================================================
// Compatibility ranges (standard semver range syntax)
// ============================================================

export const OPENCODE_COMPAT = {
	/** Supported range -- versions that should work. Below this: hard block. */
	supported: ">=1.2.0",
	/** Tested range -- versions actively tested against. Subset of supported. */
	tested: "~1.2.0",
	/** Known-broken versions. These are hard-blocked with a specific message. */
	blocked: [] as string[],
}

// ============================================================
// Types
// ============================================================

export interface OpenCodeCheckResult {
	installed: boolean
	version: string | null
	path: string | null
	compatible: boolean
	compatibility: "ok" | "too-old" | "too-new" | "blocked" | "unknown"
	message: string | null
}

export interface GitCheckResult {
	installed: boolean
	version: string | null
	path: string | null
	message: string | null
}

export interface PythonCheckResult {
	installed: boolean
	version: string | null
	path: string | null
	message: string | null
}

// ============================================================
// Binary detection
// ============================================================

/** Build the augmented PATH that includes ~/.devilcode/bin and ~/.opencode/bin. */
function getAugmentedPath(): string {
	const devilcodeBinDir = path.join(homedir(), ".devilcode", "bin")
	const opencodeBinDir = path.join(homedir(), ".opencode", "bin")
	const sep = process.platform === "win32" ? ";" : ":"
	return `${devilcodeBinDir}${sep}${opencodeBinDir}${sep}${process.env.PATH ?? ""}`
}

/** Run a command and return stdout, or null on failure. */
function execAsync(
	cmd: string,
	args: string[],
	env: Record<string, string | undefined>,
): Promise<string | null> {
	return new Promise((resolve) => {
		execFile(cmd, args, { env, timeout: 5000 }, (err, stdout) => {
			if (err) {
				resolve(null)
				return
			}
			resolve(stdout.trim())
		})
	})
}

/** Try to find the devilcode/opencode binary and get its version. */
async function detectOpenCode(): Promise<{ version: string | null; path: string | null }> {
	const augmentedPath = getAugmentedPath()
	const env = { ...process.env, PATH: augmentedPath }

	// Try devilcode first
	const devilcodeOutput = await execAsync("devilcode", ["--version"], env)
	if (devilcodeOutput) {
		const match = devilcodeOutput.match(/v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)/)
		const version = match ? match[1] : devilcodeOutput.trim()
		const whichCmd = process.platform === "win32" ? "where" : "which"
		const binaryPath = await execAsync(whichCmd, ["devilcode"], env)
		return { version, path: binaryPath }
	}

	// Fallback: try opencode
	const versionOutput = await execAsync("opencode", ["--version"], env)
	if (versionOutput) {
		const match = versionOutput.match(/v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)/)
		const version = match ? match[1] : versionOutput.trim()
		const whichCmd = process.platform === "win32" ? "where" : "which"
		const binaryPath = await execAsync(whichCmd, ["opencode"], env)
		return { version, path: binaryPath }
	}

	// Fallback: check if the binary exists at all (might not support --version)
	const whichCmd = process.platform === "win32" ? "where" : "which"
	const binaryPath = await execAsync(whichCmd, ["devilcode"], env) || await execAsync(whichCmd, ["opencode"], env)
	if (binaryPath) {
		return { version: "unknown", path: binaryPath }
	}

	return { version: null, path: null }
}

// ============================================================
// Public API
// ============================================================

/**
 * Check whether the engine is installed and compatible with this version of Devil AI.
 * Runs the binary to get its version, then compares against the compatibility range.
 */
export async function checkOpenCode(): Promise<OpenCodeCheckResult> {
	log.info("Checking engine installation...")

	const { version, path: binaryPath } = await detectOpenCode()

	if (!version) {
		log.warn("Engine CLI not found")
		return {
			installed: false,
			version: null,
			path: null,
			compatible: false,
			compatibility: "unknown",
			message: "Engine not found. Please install Devil AI Engine.",
		}
	}

	log.info("Engine found", { version, path: binaryPath })

	// Coerce loose version strings (e.g. "1.3" -> "1.3.0") into valid semver.
	// Non-semver versions (e.g. "local", "dev", "unknown") are assumed compatible --
	// these are typically local/dev builds where the user knows what they're doing.
	const parsed = valid(version) ?? coerce(version)?.version ?? null
	if (!parsed) {
		log.info("Non-semver version detected, assuming compatible", { version })
		return {
			installed: true,
			version,
			path: binaryPath,
			compatible: true,
			compatibility: "ok",
			message: null,
		}
	}

	// Check blocked versions
	for (const blocked of OPENCODE_COMPAT.blocked) {
		if (satisfies(parsed, blocked)) {
			return {
				installed: true,
				version,
				path: binaryPath,
				compatible: false,
				compatibility: "blocked",
				message: `Engine version ${version} has known issues with this version of Devil AI. Please update.`,
			}
		}
	}

	// Check supported range -- hard block if below minimum
	if (!satisfies(parsed, OPENCODE_COMPAT.supported)) {
		return {
			installed: true,
			version,
			path: binaryPath,
			compatible: false,
			compatibility: "too-old",
			message: `Engine version ${version} is too old. Devil AI requires ${OPENCODE_COMPAT.supported}.`,
		}
	}

	// Check tested range -- supported but newer than what we've tested against
	if (!satisfies(parsed, OPENCODE_COMPAT.tested)) {
		return {
			installed: true,
			version,
			path: binaryPath,
			compatible: true,
			compatibility: "too-new",
			message: `Engine version ${version} is newer than tested. Devil AI is tested with ${OPENCODE_COMPAT.tested}. Some features may not work as expected.`,
		}
	}

	// Within the tested range -- fully compatible
	return {
		installed: true,
		version,
		path: binaryPath,
		compatible: true,
		compatibility: "ok",
		message: null,
	}
}

// ============================================================
// Git detection
// ============================================================

/**
 * Check whether Git is installed and accessible on this system.
 * On Windows uses `where git`, on Unix uses `which git`.
 */
export async function checkGit(): Promise<GitCheckResult> {
	log.info("Checking Git installation...")

	const env = { ...process.env, PATH: process.env.PATH ?? "" }

	// Try `git --version` first
	const versionOutput = await execAsync("git", ["--version"], env)
	if (versionOutput) {
		const match = versionOutput.match(/git version (\d+\.\d+\.\d+)/)
		const version = match ? match[1] : versionOutput.trim()

		// Find the binary path
		const whichCmd = process.platform === "win32" ? "where" : "which"
		const binaryPath = await execAsync(whichCmd, ["git"], env)

		log.info("Git found", { version, path: binaryPath })
		return {
			installed: true,
			version,
			path: binaryPath,
			message: null,
		}
	}

	// Fallback: check if binary exists
	const whichCmd = process.platform === "win32" ? "where" : "which"
	const binaryPath = await execAsync(whichCmd, ["git"], env)
	if (binaryPath) {
		return {
			installed: true,
			version: "unknown",
			path: binaryPath,
			message: null,
		}
	}

	log.warn("Git not found")
	return {
		installed: false,
		version: null,
		path: null,
		message: "Git is not installed. Install Git for version control features.",
	}
}

// ============================================================
// Python detection
// ============================================================

/**
 * Check whether Python 3 is installed and accessible on this system.
 */
export async function checkPython(): Promise<PythonCheckResult> {
	log.info("Checking Python installation...")

	const env = { ...process.env, PATH: process.env.PATH ?? "" }
	const pythonCmd = process.platform === "win32" ? "python" : "python3"

	// Try `python3 --version`
	const versionOutput = await execAsync(pythonCmd, ["--version"], env)
	if (versionOutput) {
		const match = versionOutput.match(/Python (\d+\.\d+\.\d+)/)
		const version = match ? match[1] : versionOutput.trim()

		// Find the binary path
		const whichCmd = process.platform === "win32" ? "where" : "which"
		const binaryPath = await execAsync(whichCmd, [pythonCmd], env)

		log.info("Python found", { version, path: binaryPath })
		return {
			installed: true,
			version,
			path: binaryPath,
			message: null,
		}
	}

	log.warn("Python not found")
	return {
		installed: false,
		version: null,
		path: null,
		message: "Python 3 is not installed. Python is required for Agent Reach internet search.",
	}
}
