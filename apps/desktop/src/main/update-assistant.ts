/**
 * Update Assistant - AI-powered update help.
 *
 * Monitors update process, detects issues, and provides
 * real-time solutions using the AI agent.
 */

// ============================================================
// Types
// ============================================================

export interface UpdateIssue {
	id: string
	severity: "error" | "warning" | "info"
	message: string
	solution?: string
	autoFixable: boolean
	canRetry: boolean
}

export interface UpdateProgress {
	stage: string
	percent: number
	message: string
	currentVersion?: string
	newVersion?: string
	issues: UpdateIssue[]
}

export interface UpdateResult {
	success: boolean
	rolledBack: boolean
	issues: UpdateIssue[]
	duration: number
}

// ============================================================
// Common Update Issues & Solutions
// ============================================================

const KNOWN_UPDATE_ISSUES: Array<{
	pattern: RegExp
	issue: Omit<UpdateIssue, "id">
	solution: string
	autoFix?: (context: UpdateContext) => string[]
}> = [
	{
		pattern: /sha512.*mismatch|checksum.*fail|hash.*invalid/i,
		issue: {
			severity: "error",
			message: "Checksum mismatch - download may be corrupted",
			autoFixable: true,
			canRetry: true,
		},
		solution: "Re-download the update from official source",
		autoFix: (ctx) => [
			"Delete corrupted download",
			`Re-download from ${ctx.updateUrl}`,
			"Verify file integrity",
		],
	},
	{
		pattern: /ENOSPC|no space left/i,
		issue: {
			severity: "error",
			message: "Not enough disk space for update",
			autoFixable: false,
			canRetry: false,
		},
		solution: "Free up at least 500MB disk space and retry",
	},
	{
		pattern: /EACCES|permission denied|EPERM/i,
		issue: {
			severity: "error",
			message: "Permission denied during update",
			autoFixable: true,
			canRetry: true,
		},
		solution: "Close the app and run update as administrator",
		autoFix: (ctx) =>
			ctx.platform === "win32"
				? ["Close all Devil AI instances", "Run updater as administrator"]
				: ["Close the app", "Run with sudo"],
	},
	{
		pattern: /busy|locked|in use/i,
		issue: {
			severity: "error",
			message: "Application files are locked",
			autoFixable: true,
			canRetry: true,
		},
		solution: "Close the application completely before updating",
		autoFix: () => ["Close all Devil AI windows", "Wait 5 seconds", "Retry update"],
	},
	{
		pattern: /backup.*fail|restore.*fail/i,
		issue: {
			severity: "warning",
			message: "Backup/restore failed during update",
			autoFixable: false,
			canRetry: true,
		},
		solution: "Settings may have been reset. Check your preferences.",
	},
	{
		pattern: /ditto.*no space left|no space left on device/i,
		issue: {
			severity: "error",
			message: "Not enough disk space to extract update",
			autoFixable: false,
			canRetry: true,
		},
		solution:
			"Free up at least 2x the app size in disk space, then retry. " +
			"On macOS, the update needs temporary space to extract the new .app bundle.",
	},
	{
		pattern: /ditto.*pkzip|couldn't read pkzip signature/i,
		issue: {
			severity: "error",
			message: "Downloaded update file is corrupted",
			autoFixable: true,
			canRetry: true,
		},
		solution: "Delete the cached update and re-download from official source",
		autoFix: (ctx) => [
			"Delete cached update from ~/Library/Caches/",
			`Re-download from ${ctx.updateUrl}`,
			"If the problem persists, download the DMG manually",
		],
	},
	{
		pattern: /signature.*invalid|notarization|code.*sign/i,
		issue: {
			severity: "error",
			message: "Update signature verification failed",
			autoFixable: false,
			canRetry: false,
		},
		solution: "Download update from official source only",
	},
	{
		pattern: /downgrade|older version/i,
		issue: {
			severity: "warning",
			message: "Attempting to install older version",
			autoFixable: false,
			canRetry: false,
		},
		solution: "This version is older than your current installation",
	},
	{
		pattern: /network|timeout|ECONNREFUSED/i,
		issue: {
			severity: "error",
			message: "Network error during download",
			autoFixable: true,
			canRetry: true,
		},
		solution: "Check internet connection and retry",
		autoFix: () => [
			"Check internet connection",
			"Disable VPN/proxy if enabled",
			"Try downloading manually",
		],
	},
]

// ============================================================
// Context for auto-fix
// ============================================================

interface UpdateContext {
	platform: string
	currentVersion: string
	newVersion: string
	updateUrl: string
	installPath: string
}

// ============================================================
// Issue Detection
// ============================================================

/**
 * Analyzes update error output and identifies known issues.
 */
export function detectUpdateIssues(
	errorOutput: string,
	stdout: string = "",
	_context?: Partial<UpdateContext>,
): UpdateIssue[] {
	const issues: UpdateIssue[] = []
	const combined = `${errorOutput}\n${stdout}`

	for (const known of KNOWN_UPDATE_ISSUES) {
		if (known.pattern.test(combined)) {
			issues.push({
				id: known.issue.message.toLowerCase().replace(/\s+/g, "-"),
				...known.issue,
				solution: known.solution,
				autoFixable: !!known.autoFix,
			})
		}
	}

	return issues
}

// ============================================================
// Quick Recovery Suggestions
// ============================================================

export function getRecoverySuggestions(platform: string): Array<{ issue: string; recovery: string }> {
	const suggestions: Array<{ issue: string; recovery: string }> = []

	const RELEASE_PAGE = "github.com/devilbhai/devil-ai/releases"

	if (platform === "darwin") {
		suggestions.push({
			issue: "Update failed",
			recovery: `Download latest DMG from ${RELEASE_PAGE}`,
		})
		suggestions.push({
			issue: "App won't open after update",
			recovery: "Run: xattr -cr /Applications/Devil-ai.app",
		})
		suggestions.push({
			issue: "Settings lost",
			recovery: "Check ~/.config/devil-ai/ for backup",
		})
	}

	if (platform === "win32") {
		suggestions.push({
			issue: "Update failed",
			recovery: `Download latest EXE from ${RELEASE_PAGE}`,
		})
		suggestions.push({
			issue: "Antivirus blocked update",
			recovery: "Add exception for Devil AI in Windows Defender",
		})
		suggestions.push({
			issue: "Settings lost",
			recovery: "Check %APPDATA%/devil-ai/ for backup",
		})
	}

	if (platform === "linux") {
		suggestions.push({
			issue: "Update failed",
			recovery: `Download latest AppImage from ${RELEASE_PAGE}`,
		})
		suggestions.push({
			issue: "Permission denied",
			recovery: "chmod +x Devil-ai-*.AppImage",
		})
	}

	return suggestions
}
