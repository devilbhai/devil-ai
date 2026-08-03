/**
 * Installation Assistant - AI-powered installation help.
 *
 * Monitors installation process, detects issues, and provides
 * real-time solutions using the AI agent.
 */

import { spawn, execSync } from "node:child_process"
import { createLogger } from "./logger"

const log = createLogger("install-assistant")

// ============================================================
// Types
// ============================================================

export interface InstallIssue {
	id: string
	severity: "error" | "warning" | "info"
	message: string
	solution?: string
	autoFixable: boolean
}

export interface InstallProgress {
	stage: string
	percent: number
	message: string
	issues: InstallIssue[]
}

export interface InstallResult {
	success: boolean
	issues: InstallIssue[]
	duration: number
	logFile?: string
}

// ============================================================
// Common Installation Issues & Solutions
// ============================================================

const KNOWN_ISSUES: Array<{
	pattern: RegExp
	issue: Omit<InstallIssue, "id">
	solution: string
	autoFix?: (platform: string) => string[]
}> = [
	{
		pattern: /EACCES|permission denied|EPERM/i,
		issue: {
			severity: "error",
			message: "Permission denied - need admin privileges",
			autoFixable: true,
		},
		solution: "Run with sudo or administrator privileges",
		autoFix: (platform) =>
			platform === "win32"
				? ['powershell -Command "Start-Process cmd -ArgumentList \'/c pause\' -Verb RunAs"']
				: ["sudo"],
	},
	{
		pattern: /ENOSPC|no space left/i,
		issue: {
			severity: "error",
			message: "Not enough disk space",
			autoFixable: false,
		},
		solution: "Free up disk space and try again",
	},
	{
		pattern: /ENOTFOUND|getaddrinfo|network/i,
		issue: {
			severity: "error",
			message: "Network connection failed",
			autoFixable: true,
		},
		solution: "Check internet connection and try again",
		autoFix: () => ["ping -c 1 google.com", "Check VPN/proxy settings"],
	},
	{
		pattern: /ECONNREFUSED|timeout/i,
		issue: {
			severity: "error",
			message: "Connection refused or timed out",
			autoFixable: true,
		},
		solution: "Server may be down. Try again in a few minutes",
		autoFix: () => ["curl -I https://github.com/devilbhai/devil-ai/releases/latest"],
	},
	{
		pattern: /corrupt|hash mismatch|checksum/i,
		issue: {
			severity: "error",
			message: "Downloaded file is corrupted",
			autoFixable: true,
		},
		solution: "Re-download the file",
		autoFix: () => ["Delete the file and download again"],
	},
	{
		pattern: /not found|missing dependency/i,
		issue: {
			severity: "error",
			message: "Missing required dependency",
			autoFixable: true,
		},
		solution: "Install missing dependencies",
		autoFix: (platform) =>
			platform === "darwin"
				? ["xcode-select --install", "brew install"]
				: platform === "win32"
					? ["choco install", "winget install"]
					: ["apt-get install", "yum install"],
	},
	{
		pattern: /gatekeeper|quarantine|unsigned/i,
		issue: {
			severity: "warning",
			message: "App is not signed (macOS Gatekeeper)",
			autoFixable: true,
		},
		solution: "Right-click → Open to bypass Gatekeeper",
		autoFix: () => ["xattr -cr /Applications/Devil-ai.app"],
	},
	{
		pattern: /antivirus|defender|blocked/i,
		issue: {
			severity: "warning",
			message: "Antivirus may be blocking installation",
			autoFixable: false,
		},
		solution: "Temporarily disable antivirus or add exception",
	},
	{
		pattern: /older version|version mismatch/i,
		issue: {
			severity: "info",
			message: "Installing over older version",
			autoFixable: true,
		},
		solution: "This is normal - will update existing installation",
		autoFix: () => ["Backup settings before proceeding"],
	},
]

// ============================================================
// Issue Detection
// ============================================================

/**
 * Analyzes error output and identifies known issues.
 */
export function detectIssues(errorOutput: string, stdout: string = ""): InstallIssue[] {
	const issues: InstallIssue[] = []
	const combined = `${errorOutput}\n${stdout}`

	for (const known of KNOWN_ISSUES) {
		if (known.pattern.test(combined)) {
			issues.push({
				id: known.issue.message.toLowerCase().replace(/\s+/g, "-"),
				...known.issue,
				solution: known.solution,
			})
		}
	}

	// If no known issues found, create generic issue
	if (issues.length === 0 && errorOutput) {
		issues.push({
			id: "unknown-error",
			severity: "error",
			message: "Installation failed with unexpected error",
			solution: "Check the logs for details",
			autoFixable: false,
		})
	}

	return issues
}

/**
 * Gets auto-fix commands for an issue.
 */
export function getAutoFixCommands(issue: InstallIssue, platform: string): string[] {
	const known = KNOWN_ISSUES.find((k) => k.issue.message.toLowerCase() === issue.message.toLowerCase())
	if (known?.autoFix) {
		return known.autoFix(platform)
	}
	return []
}

// ============================================================
// Installation Monitor
// ============================================================

export class InstallationAssistant {
	private progress: InstallProgress = {
		stage: "initializing",
		percent: 0,
		message: "Starting installation...",
		issues: [],
	}

	private onProgress?: (progress: InstallProgress) => void
	private onIssue?: (issue: InstallIssue) => void

	constructor(
		callbacks: {
			onProgress?: (progress: InstallProgress) => void
			onIssue?: (issue: InstallIssue) => void
		} = {},
	) {
		this.onProgress = callbacks.onProgress
		this.onIssue = callbacks.onIssue
	}

	/**
	 * Updates progress and notifies listeners.
	 */
	private updateProgress(stage: string, percent: number, message: string): void {
		this.progress = { ...this.progress, stage, percent, message }
		this.onProgress?.(this.progress)
		log.info("Install progress", { stage, percent, message })
	}

	/**
	 * Adds an issue and notifies listeners.
	 */
	private addIssue(issue: InstallIssue): void {
		this.progress.issues.push(issue)
		this.onIssue?.(issue)
		log.warn("Install issue", { issue: issue.message, severity: issue.severity })
	}

	/**
	 * Monitors a child process for errors.
	 */
	monitorProcess(
		process: ReturnType<typeof spawn>,
		_stages: { start: number; end: number; name: string }[] = [],
	): Promise<{ success: boolean; issues: InstallIssue[] }> {
		return new Promise((resolve) => {
			let stderr = ""
			let stdout = ""

			process.stdout?.on("data", (data: Buffer) => {
				const output = data.toString()
				stdout += output

				// Update progress based on output
				if (output.includes("Installing") || output.includes("copying")) {
					this.updateProgress("installing", 50, "Installing files...")
				} else if (output.includes("Done") || output.includes("complete")) {
					this.updateProgress("finishing", 90, "Finalizing installation...")
				}
			})

			process.stderr?.on("data", (data: Buffer) => {
				stderr += data.toString()
			})

			process.on("close", (code) => {
				const issues = detectIssues(stderr, stdout)

				if (code !== 0) {
					issues.forEach((issue) => this.addIssue(issue))
					this.updateProgress("failed", 0, "Installation failed")
					resolve({ success: false, issues })
				} else {
					this.updateProgress("complete", 100, "Installation completed successfully!")
					resolve({ success: true, issues: [] })
				}
			})

			process.on("error", (err) => {
				const issues = detectIssues(err.message)
				issues.forEach((issue) => this.addIssue(issue))
				this.updateProgress("error", 0, `Installation error: ${err.message}`)
				resolve({ success: false, issues })
			})
		})
	}

	/**
	 * Gets current progress.
	 */
	getProgress(): InstallProgress {
		return { ...this.progress }
	}

	/**
	 * Attempts to auto-fix an issue.
	 */
	async attemptAutoFix(issue: InstallIssue, platform: string): Promise<boolean> {
		if (!issue.autoFixable) return false

		const commands = getAutoFixCommands(issue, platform)
		if (commands.length === 0) return false

		log.info("Attempting auto-fix", { issue: issue.message, commands })

		for (const cmd of commands) {
			try {
				if (cmd.startsWith("xattr") || cmd.startsWith("sudo")) {
					// Execute command
					execSync(cmd, { timeout: 30000 })
				}
				// Some commands are suggestions, not executable
			} catch (err) {
				log.error("Auto-fix failed", { command: cmd, error: String(err) })
				return false
			}
		}

		return true
	}
}

// ============================================================
// Quick Fix Suggestions
// ============================================================

export function getQuickFixes(platform: string): Array<{ issue: string; fix: string }> {
	const fixes: Array<{ issue: string; fix: string }> = []

	if (platform === "darwin") {
		fixes.push({
			issue: "App won't open (Gatekeeper)",
			fix: "Right-click the app → Open → Open again",
		})
		fixes.push({
			issue: "App is damaged",
			fix: "Run: xattr -cr /Applications/Devil-ai.app",
		})
	}

	if (platform === "win32") {
		fixes.push({
			issue: "Windows SmartScreen blocked",
			fix: "Click 'More info' → 'Run anyway'",
		})
		fixes.push({
			issue: "Antivirus warning",
			fix: "Add exception or temporarily disable",
		})
	}

	if (platform === "linux") {
		fixes.push({
			issue: "Permission denied",
			fix: "Run with sudo or chmod +x",
		})
		fixes.push({
			issue: "Missing dependencies",
			fix: "sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1",
		})
	}

	return fixes
}
