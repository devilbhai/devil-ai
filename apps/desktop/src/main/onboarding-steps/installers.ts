import { type ChildProcess, spawn } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";
import { BrowserWindow } from "electron";
import type { GitCheckResult, OpenCodeCheckResult, PythonCheckResult } from "../compatibility";
import { checkGit, checkOpenCode, checkPython } from "../compatibility";
import {
	type DevilRouteStatus,
	checkDevilRoute,
	ensureDevilRoute,
	isDevilRouteHealthy,
} from "../devilroute-manager";
import { createLogger } from "../logger";

const log = createLogger("onboarding:installers");

export async function checkOpenCodeInstallation(): Promise<OpenCodeCheckResult> {
	return checkOpenCode()
}

// ============================================================
// Engine install
// ============================================================

let installProcess: ChildProcess | null = null

/**
 * Installs the engine by running the official install script.
 * Streams output lines to the renderer via the "onboarding:install-output" channel.
 * Returns when the install process exits.
 */
export async function installOpenCode(): Promise<{ success: boolean; error?: string }> {
	if (installProcess) {
		return { success: false, error: "Installation already in progress" }
	}

	return new Promise((resolve) => {
		const isWindows = process.platform === "win32"

		if (isWindows) {
			// Windows: use winget to install DevilCode CLI
			installProcess = spawn(
				"winget",
				["install", "--id", "SST.opencode", "--accept-package-agreements", "--accept-source-agreements"],
				{
					cwd: homedir(),
					stdio: "pipe",
					env: process.env,
				},
			)
		} else {
			// macOS/Linux: download to temp file first to prevent partial execution (curl-pipe-bash mitigation)
			installProcess = spawn("bash", ["-c", "curl -fsSL https://opencode.ai/install -o /tmp/install-devilcode.sh && bash /tmp/install-devilcode.sh"], {
				cwd: homedir(),
				stdio: "pipe",
				env: process.env,
			})
		}

		const proc = installProcess

		const sendOutput = (text: string) => {
			for (const win of BrowserWindow.getAllWindows()) {
				win.webContents.send("onboarding:install-output", text)
			}
		}

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[install:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[install:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("Install process error", err)
			installProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			installProcess = null
			if (code === 0) {
				log.info("Engine install completed successfully")
				// Auto install DevilRoute gateway as well
				installDevilRoute().catch((e) => log.error("DevilRoute auto install error:", e))
				resolve({ success: true })
			} else {
				log.warn("Engine install exited with code", code)
				resolve({ success: false, error: `Install script exited with code ${code}` })
			}
		})
	})
}

/**
 * Checks whether the DevilRoute gateway is installed and/or running.
 * Used by the onboarding DevilRoute step to render its current state.
 */
export async function checkDevilRouteInstallation(): Promise<DevilRouteStatus> {
	return checkDevilRoute()
}

/**
 * Installs (if needed) and launches the DevilRoute local gateway.
 *
 * Unlike the old fire-and-forget version, this:
 *   - skips install entirely when the gateway is already healthy,
 *   - runs `npm install -g --legacy-peer-deps devilroute` (fallback: omniroute),
 *   - streams install output to the onboarding UI,
 *   - resolves `{ success }` only once `/v1/models` actually responds.
 */
export async function installDevilRoute(): Promise<{ success: boolean; error?: string }> {
	const sendOutput = (text: string) => {
		// The user-facing package is "DevilRoute" — keep the brand consistent
		// even when npm streams `omniroute` lines (fallback install).
		const sanitized = text.replace(/omniroute/gi, "devilroute").replace(/OmniRoute/gi, "DevilRoute")
		for (const win of BrowserWindow.getAllWindows()) {
			win.webContents.send("onboarding:install-output", sanitized)
		}
	}

	// If the gateway is already healthy, nothing to do.
	if (await isDevilRouteHealthy()) {
		sendOutput("DevilRoute Local Gateway is already running on port 20128.\n")
		return { success: true }
	}

	const result = await ensureDevilRoute(sendOutput)
	if (!result.success) {
		sendOutput(`\nDevilRoute setup failed: ${result.error ?? "Unknown error"}\n`)
	}
	return result
}

// ============================================================
// Git check (delegates to compatibility module)
// ============================================================

export async function checkGitInstallation(): Promise<GitCheckResult> {
	return checkGit()
}

// ============================================================
// Git install
// ============================================================

let gitInstallProcess: ChildProcess | null = null

/**
 * Installs Git on Windows via winget (Git.Git package).
 * Streams output lines to the renderer via the "onboarding:install-output" channel.
 * On macOS/Linux, shows a message to install manually (Homebrew/apt).
 */
export async function installGit(): Promise<{ success: boolean; error?: string }> {
	if (gitInstallProcess) {
		return { success: false, error: "Git installation already in progress" }
	}

	const isWindows = process.platform === "win32"

	if (!isWindows) {
		// macOS/Linux: guide user to install manually
		const sendOutput = (text: string) => {
			for (const win of BrowserWindow.getAllWindows()) {
				win.webContents.send("onboarding:install-output", text)
			}
		}
		sendOutput("Git installation is not automated on this platform.\n")
		sendOutput("Please install Git manually:\n")
		sendOutput("  macOS: brew install git\n")
		sendOutput("  Ubuntu/Debian: sudo apt install git\n")
		sendOutput("  Fedora: sudo dnf install git\n\n")
		sendOutput("After installing, click 'Re-check' to verify.\n")
		return { success: false, error: "Manual installation required" }
	}

	return new Promise((resolve) => {
		// Windows: use winget to install Git silently
		gitInstallProcess = spawn(
			"winget",
			["install", "--id", "Git.Git", "--accept-source-agreements", "--accept-package-agreements"],
			{
				cwd: homedir(),
				stdio: "pipe",
				env: process.env,
			},
		)

		const proc = gitInstallProcess

		const sendOutput = (text: string) => {
			for (const win of BrowserWindow.getAllWindows()) {
				win.webContents.send("onboarding:install-output", text)
			}
		}

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[git-install:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[git-install:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("Git install process error", err)
			gitInstallProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			gitInstallProcess = null
			if (code === 0) {
				log.info("Git install completed successfully")
				resolve({ success: true })
			} else {
				log.warn("Git install exited with code", code)
				resolve({ success: false, error: `Install script exited with code ${code}` })
			}
		})
	})
}

// ============================================================
// Cloudflared install
// ============================================================

let cloudflaredInstallProcess: ChildProcess | null = null

/**
 * Installs cloudflared for session sharing features.
 * Streams output lines to the renderer via the "onboarding:install-output" channel.
 */
export async function installCloudflared(): Promise<{ success: boolean; error?: string }> {
	if (cloudflaredInstallProcess) {
		return { success: false, error: "Cloudflared installation already in progress" }
	}

	const isWindows = process.platform === "win32"
	const isMac = process.platform === "darwin"

	return new Promise((resolve) => {
		const sendOutput = (text: string) => {
			for (const win of BrowserWindow.getAllWindows()) {
				win.webContents.send("onboarding:install-output", text)
			}
		}

		if (isMac) {
			sendOutput("Installing cloudflared via Homebrew...\n")
			cloudflaredInstallProcess = spawn("brew", ["install", "cloudflare/cloudflare/cloudflared"], {
				cwd: homedir(),
				stdio: "pipe",
				env: process.env,
			})
		} else if (isWindows) {
			sendOutput("Installing cloudflared via winget...\n")
			cloudflaredInstallProcess = spawn(
				"winget",
				["install", "--id", "Cloudflare.cloudflared", "--accept-source-agreements", "--accept-package-agreements"],
				{ cwd: homedir(), stdio: "pipe", env: process.env },
			)
		} else {
			// Linux: download binary directly
			sendOutput("Installing cloudflared binary...\n")
			cloudflaredInstallProcess = spawn(
				"bash",
				[
					"-c",
					"curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared",
				],
				{ cwd: homedir(), stdio: "pipe", env: process.env },
			)
		}

		const proc = cloudflaredInstallProcess

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[cloudflared-install:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[cloudflared-install:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("Cloudflared install process error", err)
			cloudflaredInstallProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			cloudflaredInstallProcess = null
			if (code === 0) {
				log.info("Cloudflared install completed successfully")
				resolve({ success: true })
			} else {
				log.warn("Cloudflared install exited with code", code)
				resolve({ success: false, error: `Install exited with code ${code}` })
			}
		})
	})
}

// ============================================================
// Multi-provider detection (lightweight, no configconv import)
// ============================================================

// ============================================================
// Python check (delegates to compatibility module)
// ============================================================

export async function checkPythonInstallation(): Promise<PythonCheckResult> {
	return checkPython()
}

// ============================================================
// Agent Reach install
// ============================================================

let agentReachInstallProcess: ChildProcess | null = null

/**
 * Installs Agent Reach via Python venv.
 * Streams output lines to the renderer via the "onboarding:install-output" channel.
 */
export async function installAgentReach(): Promise<{ success: boolean; error?: string }> {
	if (agentReachInstallProcess) {
		return { success: false, error: "Agent Reach installation already in progress" }
	}

	return new Promise((resolve) => {
		const sendOutput = (text: string) => {
			for (const win of BrowserWindow.getAllWindows()) {
				win.webContents.send("onboarding:install-output", text)
			}
		}

		const isWindows = process.platform === "win32"
		const pythonCmd = isWindows ? "python" : "python3"
		const venvDir = path.join(homedir(), ".agent-reach-venv")
		
		sendOutput(`Creating Python virtual environment at ${venvDir}...\n`)
		
		const setupCmd = isWindows 
			? `py -3 -m venv ${venvDir} && ${venvDir}\\Scripts\\python.exe -m pip install https://github.com/Panniantong/agent-reach/archive/main.zip && ${venvDir}\\Scripts\\agent-reach.exe install --env=auto`
			: `${pythonCmd} -m venv ${venvDir} && ${venvDir}/bin/pip install https://github.com/Panniantong/agent-reach/archive/main.zip && ${venvDir}/bin/agent-reach install --env=auto`

		const shell = isWindows ? "cmd.exe" : "bash"
		const shellFlag = isWindows ? "/c" : "-c"

		agentReachInstallProcess = spawn(shell, [shellFlag, setupCmd], {
			cwd: homedir(),
			stdio: "pipe",
			env: process.env,
		})

		const proc = agentReachInstallProcess

		proc.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[agent-reach-install:stdout] ${text.trim()}`)
		})

		proc.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			sendOutput(text)
			log.debug(`[agent-reach-install:stderr] ${text.trim()}`)
		})

		proc.on("error", (err) => {
			log.error("Agent Reach install process error", err)
			agentReachInstallProcess = null
			resolve({ success: false, error: err.message })
		})

		proc.on("exit", (code) => {
			agentReachInstallProcess = null
			if (code === 0) {
				log.info("Agent Reach install completed successfully")
				resolve({ success: true })
			} else {
				log.warn("Agent Reach install exited with code", code)
				resolve({ success: false, error: `Install exited with code ${code}` })
			}
		})
	})
}


/**
 * Quickly detects which agent tools have configuration on this machine.
 * Does NOT import @devil-ai/configconv, just checks for file/directory existence.
 * Returns an array of detections (one per supported provider).
 */
