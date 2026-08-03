/**
 * Self-healing workflows for Devil AI.
 * Automatically detects and repairs issues with automations, tools, and services.
 */

import { createLogger } from "./logger"
import { checkFzf } from "./fzf"
import { getServerUrl, ensureServer } from "./opencode-manager"
import { getGitHubConfig, getGitLabConfig } from "./git-provider-client"

const log = createLogger("self-healing")

// ============================================================
// Types
// ============================================================

export interface HealingResult {
	action: "repaired" | "installed" | "reconfigured" | "failed"
	component: string
	details: string
	retryCount?: number
}

// ============================================================
// Health Check Functions
// ============================================================

async function checkServer(): Promise<HealingResult | null> {
	try {
		const serverUrl = getServerUrl()
		if (!serverUrl) {
			log.warn("Engine server not running, attempting to start")
			try {
				await ensureServer()
				log.info("Successfully started engine server")
				return null
			} catch (err) {
				return {
			action: "failed",
				component: "engine-server",
				details: `Failed to start server: ${err instanceof Error ? err.message : "Unknown error"}`,
			}
		}
	}
	return null
	} catch (err) {
		return {
			action: "repaired",
			component: "engine-server",
			details: `Failed to connect to server: ${err instanceof Error ? err.message : "Unknown error"}`,
		}
	}
}

async function checkFzfConfig(): Promise<HealingResult | null> {
	const fzfStatus = await checkFzf()
	if (fzfStatus.installed) {
		return null
	}
	return {
		action: "installed",
		component: "fzf",
		details: `Not installed on ${process.platform}`,
	}
}

function checkGitTokens(): HealingResult[] {
	const results: HealingResult[] = []

	const githubConfig = getGitHubConfig()
	if (!githubConfig) {
		results.push({
			action: "reconfigured",
			component: "github",
			details: "GitHub token not configured",
		})
	}

	const gitlabConfig = getGitLabConfig()
	if (!gitlabConfig) {
		results.push({
			action: "reconfigured",
			component: "gitlab",
			details: "GitLab token not configured",
		})
	}

	return results
}

// ============================================================
// Public API
// ============================================================

export async function runHealthCheck(): Promise<HealingResult[]> {
	log.info("Running self-healing health check")

	const checks = await Promise.all([
		checkServer(),
		checkFzfConfig(),
	])

	const gitTokenIssues = checkGitTokens()
	const allIssues = [...checks.filter((c): c is HealingResult => c !== null), ...gitTokenIssues]

	if (allIssues.length > 0) {
		log.warn("Health check found issues", { issues: allIssues })
		return allIssues
	}

	log.info("Health check passed - all systems healthy")
	return []
}

export async function applyFixes(): Promise<HealingResult[]> {
	log.info("Applying self-healing fixes")

	const results: HealingResult[] = []

	// Install missing tools
	const fzfStatus = await checkFzfConfig()
	if (fzfStatus?.action === "installed") {
		const { installFzf } = await import("./fzf")
		await installFzf()
		results.push({
			action: "repaired",
			component: "fzf",
			details: `Installed fzf on ${process.platform}`,
		})
	}

	// Start engine server if not running
	const serverStatus = await checkServer()
	if (serverStatus?.action === "repaired") {
		try {
			await ensureServer()
			results.push({
			action: "repaired",
			component: "engine-server",
			details: "Started engine server on port 4101",
			})
		} catch (err) {
			results.push({
				action: "failed",
				component: "engine-server",
				details: `Failed to start server: ${err instanceof Error ? err.message : "Unknown error"}`,
			})
		}
	} else if (serverStatus?.action === "failed") {
		results.push(serverStatus)
	}

	log.info("Applied fixes", { results })
	return results
}

// ============================================================
// Ongoing Monitoring
// ============================================================

export function startSelfHealing(): () => void {
	const intervalMs = 5 * 60 * 1000 // 5 minutes
	const initialCheckMs = 30 * 1000 // 30 seconds after startup

	// Run initial check after 30 seconds
	const initialTimer = setTimeout(async () => {
		try {
			log.info("Running initial self-healing check")
			const issues = await runHealthCheck()
			if (issues.length > 0) {
				log.info("Found issues on initial check, applying fixes")
				await applyFixes()
			}
		} catch (err) {
			log.error("Initial self-healing check error", err)
		}
	}, initialCheckMs)

	// Run periodic checks
	const monitor = async () => {
		try {
			const issues = await runHealthCheck()
			if (issues.length > 0) {
				await applyFixes()
			}
		} catch (err) {
			log.error("Self-healing monitor error", err)
		}
	}

	const timer = setInterval(monitor, intervalMs)
	log.info("Started self-healing monitor", { intervalMs, initialCheckMs })

	return () => {
		clearTimeout(initialTimer)
		clearInterval(timer)
		log.info("Stopped self-healing monitor")
	}
}

export const selfHealing = {
	startSelfHealing,
	runHealthCheck,
	applyFixes,
}

export function startCrossAppController(): () => void {
	startSelfHealing()
	return () => {}
}
