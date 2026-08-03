import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { app } from "electron"

// ESM equivalent for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Resolves the path to the CLI shell script bundled inside the app.
 *
 * macOS packaged:  Devil-ai.app/Contents/Resources/bin/devil-ai
 * Linux packaged:  <install-dir>/resources/bin/devil-ai
 * Windows:         <install-dir>/resources/bin/devil-ai.cmd
 * Dev mode:        <repo>/apps/desktop/resources/bin/devil-ai
 */
function getCliSourcePath(): string {
	const scriptName = process.platform === "win32" ? "devil-ai.cmd" : "devil-ai"

	if (app.isPackaged) {
		// In packaged apps, extraResources go into the resources directory
		return path.join(process.resourcesPath, "bin", scriptName)
	}

	// Dev mode — point to the source file in the repo
	return path.join(__dirname, "../../resources/bin", scriptName)
}

/**
 * Returns the directory where the CLI symlink will be installed.
 *
 * macOS/Linux: /usr/local/bin
 * Windows:     %LOCALAPPDATA%\Devil AI\bin  (added to PATH by the user)
 */
function getCliInstallDir(): string {
	if (process.platform === "win32") {
		const localAppData =
			process.env.LOCALAPPDATA ?? path.join(app.getPath("home"), "AppData", "Local")
		return path.join(localAppData, "Devil-ai", "bin")
	}
	return "/usr/local/bin"
}

/**
 * Returns the full path where the `devil-ai` symlink/script will be placed.
 */
function getCliInstallPath(): string {
	const name = process.platform === "win32" ? "devil-ai.cmd" : "devil-ai"
	return path.join(getCliInstallDir(), name)
}

/**
 * Checks whether the CLI command is currently installed.
 */
export function isCliInstalled(): boolean {
	const installPath = getCliInstallPath()
	try {
		const stat = fs.lstatSync(installPath)
		if (stat.isSymbolicLink()) {
			const target = fs.readlinkSync(installPath)
			return target === getCliSourcePath()
		}
		return stat.isFile()
	} catch {
		return false
	}
}

/**
 * Installs the `devil-ai` CLI command by symlinking it into /usr/local/bin
 * (or the platform equivalent).
 *
 * Returns an object with `success` and optional `error` message.
 */
export function installCli(): { success: boolean; error?: string } {
	const source = getCliSourcePath()
	const dest = getCliInstallPath()
	const destDir = getCliInstallDir()

	try {
		// Verify the source script exists
		if (!fs.existsSync(source)) {
			return { success: false, error: `CLI script not found at ${source}` }
		}

		// Ensure destination directory exists
		fs.mkdirSync(destDir, { recursive: true })

		// Remove existing symlink/file if present
		try {
			fs.unlinkSync(dest)
		} catch {
			// Doesn't exist — that's fine
		}

		if (process.platform === "win32") {
			// On Windows, copy the script instead of symlinking
			fs.copyFileSync(source, dest)
		} else {
			// On Unix, create a symlink
			fs.symlinkSync(source, dest)
		}

		return { success: true }
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)

		// Common case: /usr/local/bin not writable without sudo
		if (message.includes("EACCES") || message.includes("permission")) {
			if (process.platform === "darwin") {
				try {
					const { execFileSync } = require("node:child_process")
					const escapePath = (p: string) => p.replace(/'/g, "'\\''")
					const shellCmd = `rm -f '${escapePath(dest)}' && ln -sf '${escapePath(source)}' '${escapePath(dest)}'`
					const appleScriptStr = shellCmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
					// Use osascript to prompt for password natively on macOS
					const script = `do shell script "${appleScriptStr}" with administrator privileges`
					execFileSync("osascript", ["-e", script])
					return { success: true }
				} catch (sudoErr) {
					return {
						success: false,
						error: "Admin permission was denied or failed to link CLI.",
					}
				}
			}

			return {
				success: false,
				error: `Permission denied. Try running:\n  sudo ln -sf "${source}" "${dest}"`,
			}
		}

		return { success: false, error: message }
	}
}

/**
 * Uninstalls the `devil-ai` CLI command by removing the symlink.
 */
export function uninstallCli(): { success: boolean; error?: string } {
	const dest = getCliInstallPath()

	try {
		if (!fs.existsSync(dest)) {
			return { success: true } // Already gone
		}

		fs.unlinkSync(dest)
		return { success: true }
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)

		if (message.includes("EACCES") || message.includes("permission")) {
			if (process.platform === "darwin") {
				try {
					const { execSync } = require("node:child_process")
					const script = `do shell script "rm -f \\"${dest}\\"" with administrator privileges`
					execSync(`osascript -e '${script}'`)
					return { success: true }
				} catch (sudoErr) {
					return {
						success: false,
						error: "Admin permission was denied or failed to remove CLI.",
					}
				}
			}

			return {
				success: false,
				error: `Permission denied. Try running:\n  sudo rm "${dest}"`,
			}
		}

		return { success: false, error: message }
	}
}
