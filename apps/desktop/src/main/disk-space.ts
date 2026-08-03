/**
 * Disk space monitoring for Devil AI.
 * Checks available disk space before critical operations (DB writes, updates)
 * and warns the user when space is critically low.
 */

import { execSync } from "node:child_process"
import { dialog, app } from "electron"
import { createLogger } from "./logger"

const log = createLogger("disk-space")

/** Minimum free space in MB required for safe operation. */
const MIN_FREE_SPACE_MB = 500

/** Minimum free space in MB required for updates (need 2x app size). */
const MIN_UPDATE_SPACE_MB = 1024

let lastWarningTime = 0
const WARNING_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Returns available disk space in MB for the volume containing the given path.
 * Uses `df` on macOS/Linux and `wmic` on Windows.
 */
export function getAvailableSpaceMB(dirPath?: string): number | null {
	try {
		const target = dirPath || app.getPath("userData")

		if (process.platform === "win32") {
			// Windows: use PowerShell to get free space
			const driveLetter = target.charAt(0).toUpperCase()
			const output = execSync(
				`powershell -Command "(Get-PSDrive ${driveLetter}).Free / 1MB"`,
				{ encoding: "utf-8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] },
			).trim()
			return Number.parseFloat(output)
		}

		// macOS/Linux: use df -m
		const output = execSync(`df -m "${target}"`, {
			encoding: "utf-8",
			timeout: 5000,
			stdio: ["ignore", "pipe", "ignore"],
		})
		// Second line, 4th column = Available (MB)
		const lines = output.trim().split("\n")
		if (lines.length >= 2) {
			const parts = lines[1].split(/\s+/)
			// df output: Filesystem 1K-blocks Used Available Capacity Mounted on
			// With -m flag: Filesystem 1M-blocks Used Available Capacity Mounted on
			const available = Number.parseInt(parts[3], 10)
			if (!Number.isNaN(available)) return available
		}
	} catch (err) {
		log.warn("Failed to check disk space", { error: String(err) })
	}
	return null
}

/**
 * Checks if there's enough free disk space for normal operation.
 * Shows a warning dialog if space is critically low.
 * Returns true if space is sufficient.
 */
export function checkDiskSpaceForOperation(): boolean {
	const spaceMB = getAvailableSpaceMB()
	if (spaceMB === null) return true // Can't determine, assume OK

	log.debug("Available disk space", { mb: spaceMB })

	if (spaceMB < MIN_FREE_SPACE_MB) {
		const now = Date.now()
		// Don't spam warnings — cooldown of 5 minutes
		if (now - lastWarningTime < WARNING_COOLDOWN_MS) return false
		lastWarningTime = now

		log.warn("Critically low disk space", { availableMB: spaceMB, requiredMB: MIN_FREE_SPACE_MB })

		dialog.showMessageBox({
			type: "warning",
			title: "Low Disk Space",
			message: "Your disk is almost full.",
			detail:
				`Only ${spaceMB}MB remaining. Devil AI needs at least ${MIN_FREE_SPACE_MB}MB to function correctly.\n\n` +
				"Please free up disk space to avoid errors with the database and updates.",
			buttons: ["OK"],
		}).catch(() => {})

		return false
	}

	return true
}

/**
 * Checks if there's enough free disk space for an update.
 * Returns true if sufficient space is available.
 */
export function checkDiskSpaceForUpdate(): boolean {
	const spaceMB = getAvailableSpaceMB()
	if (spaceMB === null) return true

	if (spaceMB < MIN_UPDATE_SPACE_MB) {
		log.warn("Not enough space for update", { availableMB: spaceMB, requiredMB: MIN_UPDATE_SPACE_MB })

		dialog.showMessageBox({
			type: "warning",
			title: "Insufficient Disk Space for Update",
			message: "Not enough disk space to install the update.",
			detail:
				`Only ${spaceMB}MB available. The update requires at least ${MIN_UPDATE_SPACE_MB}MB.\n\n` +
				"Please free up disk space and try again.",
			buttons: ["OK"],
		}).catch(() => {})

		return false
	}

	return true
}

/**
 * Wraps a database operation with disk space checking.
 * Returns the result of the operation, or null if disk is full.
 */
export async function withDiskSpaceCheck<T>(operation: () => Promise<T>, context?: string): Promise<T | null> {
	try {
		return await operation()
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err)

		// Detect "disk full" SQLite errors
		if (/database or disk is full|ENOSPC|no space left/i.test(errorMsg)) {
			log.error("Disk full error during operation", { context, error: errorMsg })

			const now = Date.now()
			if (now - lastWarningTime >= WARNING_COOLDOWN_MS) {
				lastWarningTime = now

				const spaceMB = getAvailableSpaceMB()
				dialog.showMessageBox({
					type: "error",
					title: "Disk Full",
					message: "Operation failed — your disk is full.",
					detail:
						`Available: ${spaceMB ?? "unknown"}MB\n\n` +
						`Failed operation: ${context || "database write"}\n\n` +
						"Please free up disk space immediately to prevent data loss.",
					buttons: ["Open Disk Cleanup", "Dismiss"],
					defaultId: 0,
				}).then(({ response }) => {
					if (response === 0) {
						// Open system disk cleanup
						if (process.platform === "darwin") {
							execSync("open /System/Library/CoreServices/Applications/Storage.app")
						} else if (process.platform === "win32") {
							execSync("cleanmgr /d C")
						}
					}
				}).catch(() => {})
			}

			return null
		}

		throw err
	}
}
