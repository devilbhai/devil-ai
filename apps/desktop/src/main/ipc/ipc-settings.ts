import { ipcMain, app, nativeImage, powerSaveBlocker } from "electron"
import { join, resolve } from "node:path"
import { existsSync } from "node:fs"
import { getOpaqueWindows, getSettings, onSettingsChanged, updateSettings } from "../settings-store"
import { broadcast } from "./utils"
import { detectSkillsFromPrompt } from "../skill-matcher"
import { detectIssues, getQuickFixes } from "../installation-assistant"
import { detectUpdateIssues, getRecoverySuggestions } from "../update-assistant"

export function registerSettingsIpc() {
	// --- Window preferences (opaque windows) ---

	ipcMain.handle("prefs:get-opaque-windows", () => {
		return getOpaqueWindows()
	})

	ipcMain.handle("prefs:set-opaque-windows", (_, value: boolean) => {
		updateSettings({ opaqueWindows: value })
		return { success: true }
	})

	ipcMain.handle("app:relaunch", () => {
		app.relaunch()
		app.exit(0)
	})

	ipcMain.handle("app:set-icon", (_, iconName: string) => {
		if (process.platform === "darwin") {
			let iconPath = ""
			if (iconName === "devil-1") iconPath = resolve(__dirname, "../../resources/devil-1.png")
			else if (iconName === "devil-2") iconPath = resolve(__dirname, "../../resources/devil-2.png")
			else if (iconName === "devil-3") iconPath = resolve(__dirname, "../../resources/devil-3.png")
			else if (iconName === "devil-4") iconPath = resolve(__dirname, "../../resources/devil-4.png")
			else if (iconName === "devil-5") iconPath = resolve(__dirname, "../../resources/devil-5.png")
			else if (iconName === "devil-6") iconPath = resolve(__dirname, "../../resources/devil-6.png")
			else if (iconName === "devil-7") iconPath = resolve(__dirname, "../../resources/devil-7.png")
			else if (iconName === "devil-8") iconPath = resolve(__dirname, "../../resources/devil-8.png")
			else if (iconName === "devil-9") iconPath = resolve(__dirname, "../../resources/devil-9.png")
			else if (iconName === "devil-10") iconPath = resolve(__dirname, "../../resources/devil-10.png")
			else iconPath = resolve(__dirname, "../../resources/icon.png")
			
			if (existsSync(iconPath)) {
				const image = nativeImage.createFromPath(iconPath)
				app.dock?.setIcon(image)
				return true
			}
		}
		return false
	})

	// --- Power management (prevent sleep) ---
	let sleepBlockerId: number | null = null

	ipcMain.handle("power:prevent-sleep", (_, enable: boolean) => {
		if (enable) {
			if (sleepBlockerId === null) {
				sleepBlockerId = powerSaveBlocker.start("prevent-app-suspension")
				console.log("[Power] Sleep prevention enabled, id:", sleepBlockerId)
			}
		} else {
			if (sleepBlockerId !== null) {
				powerSaveBlocker.stop(sleepBlockerId)
				console.log("[Power] Sleep prevention disabled")
				sleepBlockerId = null
			}
		}
		return { success: true }
	})

	// --- Settings ---

	ipcMain.handle("settings:get", () => { const { masterPassword, masterPasswordSalt, ...rest } = getSettings(); return { ...rest, hasMasterPassword: !!masterPassword }; })

	ipcMain.handle("settings:update", (_, partial) => {
		const updated = updateSettings(partial)
		// Never return credential material to the renderer.
		const { masterPassword, masterPasswordSalt, ...publicSettings } = updated
		return { ...publicSettings, hasMasterPassword: !!masterPassword }
	})

	// --- Skills directory ---
	ipcMain.handle("config:get-skills-dir", () => {
		// Skills live in .agents/skills/ relative to the project root
		// For Electron app, use app.getPath('userData') or a fixed path
		const skillsDir = join(app.getPath("userData"), ".agents", "skills")
		return existsSync(skillsDir) ? skillsDir : null
	})

	// --- Auto-detect skills from prompt ---
	ipcMain.handle("skills:detect", (_, prompt: string, projectDir?: string) => {
		const skillsDir = join(app.getPath("userData"), ".agents", "skills")
		if (!existsSync(skillsDir)) {
			return { skills: [], keywords: [] }
		}
		return detectSkillsFromPrompt(prompt, skillsDir, projectDir)
	})

	// --- Installation Assistant ---
	ipcMain.handle("install:detect-issues", (_, errorOutput: string, stdout?: string) => {
		return detectIssues(errorOutput, stdout)
	})

	ipcMain.handle("install:quick-fixes", () => {
		return getQuickFixes(process.platform)
	})

	// --- Update Assistant ---
	ipcMain.handle(
		"update:detect-issues",
		(_, errorOutput: string, stdout?: string, context?: Record<string, string>) => {
			return detectUpdateIssues(errorOutput, stdout, context)
		},
	)

	ipcMain.handle("update:recovery-suggestions", () => {
		return getRecoverySuggestions(process.platform)
	})

	ipcMain.handle(
		"update:validate",
		(_, updateFilePath: string) => {
			if (!existsSync(updateFilePath)) {
				return {
					valid: false,
					issues: [
						{
							id: "file-not-found",
							severity: "error",
							message: "Update file not found",
							solution: "Re-download the update",
							autoFixable: false,
							canRetry: true,
						},
					],
				}
			}
			return { valid: true, issues: [] }
		},
	)


	// --- Settings push channel (main -> renderer) ---
	// Notify all renderer windows when settings change so they can update reactively.

	onSettingsChanged((settings) => {
		const { masterPassword, masterPasswordSalt, ...rest } = settings
		const publicSettings = { ...rest, hasMasterPassword: !!masterPassword }
		broadcast("settings:changed", publicSettings)
	})


}
