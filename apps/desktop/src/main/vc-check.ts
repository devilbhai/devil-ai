/**
 * Visual C++ Redistributable check for Windows.
 *
 * For NSIS installer: handled by build/installer.nsh (pre-install check).
 * For portable exe: handled here at runtime since there's no installer.
 *
 * Checks if VC++ 2015-2022 Redistributable (x64) is installed via registry.
 * Shows a dialog prompting the user to download and install if missing.
 */

import { execSync } from "node:child_process"
import { app, dialog, shell } from "electron"
import { createLogger } from "./logger"

const log = createLogger("vc-check")

/** Registry key for VC++ 2015-2022 Redistributable (x64). */
const VC_REG_KEY =
	"HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64"

/** Download URL for VC++ Redistributable. */
const VC_DOWNLOAD_URL = "https://aka.ms/vs/17/release/vc_redist.x64.exe"

/**
 * Check if VC++ Redistributable is installed on Windows.
 * Returns true if installed, false if missing, or true on non-Windows platforms.
 */
function isVCRedistInstalled(): boolean {
	if (process.platform !== "win32") return true

	try {
		const output = execSync(`reg query "${VC_REG_KEY}" /v Installed`, {
			encoding: "utf-8",
			timeout: 5000,
			stdio: ["ignore", "pipe", "ignore"],
		})
		return output.includes("0x1")
	} catch {
		return false
	}
}

/**
 * Prompt user to install VC++ Redistributable.
 * Opens the download page in default browser.
 * Returns after user dismisses the dialog.
 */
async function promptVCInstall(): Promise<void> {
	const { response } = await dialog.showMessageBox({
		type: "warning",
		title: "Missing Dependency",
		message: "Microsoft Visual C++ Redistributable is not installed.",
		detail:
			"Devil AI requires the Visual C++ 2015-2022 Redistributable to run.\n\n" +
			"Click OK to open the download page, install it, then restart Devil AI.",
		buttons: ["Open Download Page", "Continue Anyway"],
		defaultId: 0,
		cancelId: 1,
	})

	if (response === 0) {
		shell.openExternal(VC_DOWNLOAD_URL)
	}
}

/**
 * Check VC++ on app startup (portable exe only).
 * Called early in app.whenReady() before window creation.
 * Non-blocking: shows dialog but doesn't prevent app from starting.
 */
export async function checkVcRedistOnStartup(): Promise<void> {
	if (process.platform !== "win32") return

	// Only check for portable exe (not installed via NSIS)
	// NSIS installer handles this via build/installer.nsh
	if (app.isPackaged) {
		// Check if running from a temp/extracted path (portable) vs installed path
		const appPath = app.getPath("exe")
		const isInstalled =
			appPath.includes("Program Files") || appPath.includes("WindowsApps")

		if (!isInstalled) {
			log.info("Portable exe detected, checking VC++ Redistributable...")
			if (!isVCRedistInstalled()) {
				log.warn("VC++ Redistributable not installed")
				await promptVCInstall()
			} else {
				log.info("VC++ Redistributable is installed")
			}
		}
	}
}
