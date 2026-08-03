import { app, BrowserWindow, dialog, shell } from "electron"
import type { AppUpdater, UpdateInfo } from "electron-updater"
import { createLogger } from "./logger"
import { detectUpdateIssues, getRecoverySuggestions } from "./update-assistant"
import { checkDiskSpaceForUpdate } from "./disk-space"

const log = createLogger("updater")

/**
 * Auto-updater module.
 *
 * Uses electron-updater to check for new releases on GitHub Releases.
 * Downloads updates in the background and notifies the renderer via IPC
 * so it can show a non-intrusive "update available" banner.
 *
 * The electron-updater module is lazily imported to avoid loading ~500KB+
 * of code during startup (especially in dev where the updater is a no-op).
 *
 * On macOS, Squirrel.Mac requires the app to be code-signed for in-place
 * updates. When the app is unsigned (CI builds with CSC_IDENTITY_AUTO_DISCOVERY=false),
 * we detect this and fall back to opening the download page so the user can
 * grab the new version manually. Windows and AppImage-based Linux installs
 * support in-place updates; only Linux .deb installs fall back to the release
 * page (deb packages can't be swapped while running).
 */

let _autoUpdater: AppUpdater | null = null

async function getAutoUpdater(): Promise<AppUpdater> {
	if (!_autoUpdater) {
		// electron-updater is CJS — the destructuring workaround is required
		// for ESM compatibility. See electron-builder#7976.
		const electronUpdater = await import("electron-updater")
		_autoUpdater = electronUpdater.default.autoUpdater
	}
	return _autoUpdater
}

// ============================================================
// Signing detection
// ============================================================

/**
 * Detect whether the current install supports in-place auto-updates:
 *
 *  - macOS: requires a properly code-signed .app bundle (real Developer ID,
 *    not ad-hoc/unsigned) — Squirrel.Mac rejects unsigned installs.
 *  - Linux: AppImage installs can be replaced in-place by electron-updater
 *    (detected via the APPIMAGE env var); .deb installs cannot.
 *  - Windows: always supported (NSIS).
 */
function detectCanAutoInstall(): boolean {
	if (!app.isPackaged) return true

	// Linux: AppImage supports in-place auto-update, .deb does not.
	if (process.platform === "linux") {
		return process.env.APPIMAGE != null
	}

	try {
		const { execSync } = require("node:child_process")
		// codesign --verify exits 0 if valid signature, non-zero otherwise
		execSync(`codesign --verify --deep --strict "${app.getPath("exe")}"`, {
			encoding: "utf8",
			stdio: "pipe",
		})
		return true
	} catch {
		// Unsigned or ad-hoc signed — Squirrel.Mac will reject the install
		return false
	}
}

/** Whether the current build supports automatic in-place updates. */
let canAutoInstall = true

// ============================================================
// State
// ============================================================

/** Current update state, queryable by the renderer. */
export interface UpdateState {
	status: "idle" | "checking" | "available" | "downloading" | "ready" | "error" | "latest"
	version?: string
	releaseNotes?: string
	progress?: {
		percent: number
		bytesPerSecond: number
		transferred: number
		total: number
	}
	error?: string
	/** Whether the app can auto-install updates (false on unsigned macOS builds). */
	canAutoInstall: boolean
}

let state: UpdateState = { status: "idle", canAutoInstall: true }
let checkInterval: ReturnType<typeof setInterval> | null = null

function getMainWindow(): BrowserWindow | null {
	return BrowserWindow.getAllWindows()[0] ?? null
}

function setState(next: Partial<UpdateState>): void {
	state = { ...state, ...next }
	getMainWindow()?.webContents.send("updater:state-changed", state)
}

// ============================================================
// GitHub release URL
// ============================================================

const GITHUB_OWNER = "devilbhai"
const GITHUB_REPO = "devil-ai"
const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`

/**
 * Map the running platform + arch to the exact installer artifact name.
 *
 * Matches what electron-builder actually produces (verified against the
 * 1.10.0 release): macOS uses `mac-<x64|arm64>.dmg` (from the new dmg target),
 * Windows `win-x64.exe`, and Linux expands x64 to `x86_64` in the AppImage
 * file name (`Devil-ai-<v>-linux-x86_64.AppImage`), not `x64`.
 */
function getArtifactFileName(version: string): string {
	if (process.platform === "darwin") {
		const arch = process.arch === "arm64" ? "arm64" : "x64"
		return `Devil-ai-${version}-mac-${arch}.dmg`
	}
	if (process.platform === "win32") {
		return `Devil-ai-${version}-win-x64.exe`
	}
	// Linux — only x64 is built (electron-builder.yml); AppImage names use x86_64.
	const arch = process.arch === "arm64" ? "arm64" : "x86_64"
	return `Devil-ai-${version}-linux-${arch}.AppImage`
}

/** Build the download URL for a specific version (or the base listing if unknown). */
function getReleaseUrl(version?: string): string {
	if (!version) return GITHUB_REPO_URL
	return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${version}/${getArtifactFileName(version)}`
}

// ============================================================
// Public API
// ============================================================

/**
 * Initialises the auto-updater. Call once after the main window is created.
 * In development (unpackaged), this is a no-op.
 */
export async function initAutoUpdater(): Promise<void> {
	if (!app.isPackaged) return

	canAutoInstall = detectCanAutoInstall()
	state = { ...state, canAutoInstall }

	log.info(`platform=${process.platform}, canAutoInstall=${canAutoInstall}`)

	const autoUpdater = await getAutoUpdater()

	// Logging
	autoUpdater.logger = log

	// Don't auto-download — let the user trigger it, or download silently
	// after they've been notified.
	autoUpdater.autoDownload = false

	// Install on quit by default (only effective when canAutoInstall is true)
	autoUpdater.autoInstallOnAppQuit = canAutoInstall

	// Skip code-signature verification on macOS. The CI builds are currently
	// unsigned (CSC_IDENTITY_AUTO_DISCOVERY=false) so the Squirrel/ShipIt
	// updater rejects the downloaded .app. Remove this once Apple Developer
	// code signing is configured in the release workflow.
	autoUpdater.forceDevUpdateConfig = !app.isPackaged

	// ── Events ──────────────────────────────────────────────────

	autoUpdater.on("checking-for-update", () => {
		setState({ status: "checking" })
	})

	autoUpdater.on("update-available", (info: UpdateInfo) => {
		// On unsigned macOS builds, skip download — Squirrel.Mac will reject the install.
		// Just notify the user and open the release page.
		if (!canAutoInstall && process.platform === "darwin") {
			setState({
				status: "available",
				version: info.version,
				releaseNotes:
					typeof info.releaseNotes === "string"
						? info.releaseNotes
						: Array.isArray(info.releaseNotes)
							? info.releaseNotes.map((n) => n.note).join("\n")
							: undefined,
			})
			return
		}
		setState({
			status: "available",
			version: info.version,
			releaseNotes:
				typeof info.releaseNotes === "string"
					? info.releaseNotes
					: Array.isArray(info.releaseNotes)
						? info.releaseNotes.map((n) => n.note).join("\n")
						: undefined,
		})
	})

	autoUpdater.on("update-not-available", () => {
		setState({ status: "latest" })
	})

	autoUpdater.on("download-progress", (progress) => {
		setState({
			status: "downloading",
			progress: {
				percent: progress.percent,
				bytesPerSecond: progress.bytesPerSecond,
				transferred: progress.transferred,
				total: progress.total,
			},
		})
	})

	autoUpdater.on("update-downloaded", () => {
		setState({ status: "ready", progress: undefined })
	})

	autoUpdater.on("error", (err) => {
		log.error("Error:", err.message)
		setState({ status: "error", error: err.message })

		// Use update assistant to detect known issues and show friendly dialog
		const issues = detectUpdateIssues(err.message)
		if (issues.length > 0) {
			const suggestions = getRecoverySuggestions(process.platform)
			const topIssue = issues[0]
			const detail = [
				topIssue.message,
				"",
				`Solution: ${topIssue.solution}`,
				"",
				...suggestions
					.filter((s) => s.issue === "Update failed")
					.map((s) => s.recovery),
			].join("\n")

			dialog.showMessageBox({
				type: "error",
				title: "Update Failed",
				message: "The update could not be installed.",
				detail,
				buttons: topIssue.canRetry ? ["Retry", "Download Manually", "Dismiss"] : ["Download Manually", "Dismiss"],
				defaultId: 0,
			}).then(({ response }) => {
				if (topIssue.canRetry && response === 0) {
					checkForUpdates().catch(() => {})
				} else if (response === (topIssue.canRetry ? 1 : 0)) {
					openReleasePage()
				}
			})
		}
	})

	// ── Initial check (10s after launch) + periodic (every 4 hours) ──

	setTimeout(() => {
		autoUpdater.checkForUpdates().catch(() => {})
	}, 10_000)

	checkInterval = setInterval(
		() => {
			autoUpdater.checkForUpdates().catch(() => {})
		},
		4 * 60 * 60 * 1000,
	)
}

/** Returns the current update state (for IPC handler). */
export function getUpdateState(): UpdateState {
	return state
}

/** Manually triggers an update check. */
export async function checkForUpdates(): Promise<void> {
	if (!app.isPackaged) return
	const autoUpdater = await getAutoUpdater()
	await autoUpdater.checkForUpdates()
}

/** Starts downloading the available update. */
export async function downloadUpdate(): Promise<void> {
	// On unsigned macOS builds or Linux .deb, don't download — open release page instead
	if (!canAutoInstall) {
		await openReleasePage()
		return
	}

	// Check disk space before downloading
	if (!checkDiskSpaceForUpdate()) {
		log.warn("Skipping update download due to low disk space")
		return
	}

	const autoUpdater = await getAutoUpdater()
	await autoUpdater.downloadUpdate()
}

/**
 * Quits and installs the downloaded update.
 * Only works when canAutoInstall is true (signed macOS builds, Windows, Linux).
 */
export async function installUpdate(): Promise<void> {
	if (!canAutoInstall) {
		// Fallback: open release page instead of attempting Squirrel install
		await openReleasePage()
		return
	}
	const autoUpdater = await getAutoUpdater()
	autoUpdater.quitAndInstall(false, true)
}

/**
 * Opens the download URL for the current update version in the user's
 * default browser — pointing straight at the platform-specific installer
 * (.dmg / .exe / .AppImage). Used as a fallback where in-place updates
 * aren't possible (unsigned macOS builds, Linux .deb installs).
 */
export async function openReleasePage(): Promise<void> {
	const url = getReleaseUrl(state.version)
	await shell.openExternal(url)
}

/** Cleanup — call on app quit. */
export function stopAutoUpdater(): void {
	if (checkInterval) {
		clearInterval(checkInterval)
		checkInterval = null
	}
}
