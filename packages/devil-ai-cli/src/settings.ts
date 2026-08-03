import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createLogger } from "./logger.js"
import type { AppSettings } from "./types.js"

const log = createLogger("settings")

const DEFAULT_SETTINGS: AppSettings = {
	servers: {
		servers: [{ id: "local", name: "Local", type: "local" }],
		activeServerId: "local",
	},
}

let settings: AppSettings = structuredClone(DEFAULT_SETTINGS)
let settingsPath: string | null = null

const listeners = new Set<(settings: AppSettings) => void>()

function getConfigDir(): string {
	const platform = process.platform
	if (platform === "win32") {
		return path.join(os.homedir(), "AppData", "Roaming", "devil-ai")
	}
	if (platform === "darwin") {
		return path.join(os.homedir(), "Library", "Application Support", "devil-ai")
	}
	// Linux / other — XDG
	const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
	return path.join(xdg, "devil-ai")
}

export function initSettings(): void {
	const configDir = getConfigDir()
	settingsPath = path.join(configDir, "settings.json")

	try {
		if (fs.existsSync(settingsPath)) {
			const raw = fs.readFileSync(settingsPath, "utf-8")
			const parsed = JSON.parse(raw)
			settings = deepMerge(structuredClone(DEFAULT_SETTINGS), parsed)
			log.info("Settings loaded", { path: settingsPath })
		} else {
			log.info("No settings file, using defaults", { path: settingsPath })
		}
	} catch (err) {
		log.error("Failed to load settings, using defaults", err)
	}
}

export function getSettings(): AppSettings {
	return settings
}

export function updateSettings(partial: DeepPartial<AppSettings>): AppSettings {
	settings = deepMerge(settings, partial)
	persist()
	notifyListeners()
	return settings
}

export function onSettingsChanged(listener: (settings: AppSettings) => void): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

function persist(): void {
	if (!settingsPath) return
	try {
		const dir = path.dirname(settingsPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		const tmpPath = `${settingsPath}.tmp`
		fs.writeFileSync(tmpPath, JSON.stringify(settings, null, "\t"), "utf-8")
		fs.renameSync(tmpPath, settingsPath)
	} catch (err) {
		log.error("Failed to persist settings", err)
	}
}

function notifyListeners(): void {
	for (const listener of listeners) {
		try {
			listener(settings)
		} catch (err) {
			log.error("Settings listener error", err)
		}
	}
}

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"])

// biome-ignore lint/suspicious/noExplicitAny: deep merge utility
function deepMerge(target: any, source: any): any {
	const result = { ...target }
	for (const key of Object.keys(source)) {
		if (UNSAFE_KEYS.has(key)) continue
		const sourceVal = source[key]
		const targetVal = target[key]
		if (
			sourceVal !== null &&
			sourceVal !== undefined &&
			typeof sourceVal === "object" &&
			!Array.isArray(sourceVal) &&
			typeof targetVal === "object" &&
			targetVal !== null &&
			!Array.isArray(targetVal)
		) {
			result[key] = deepMerge(targetVal, sourceVal)
		} else if (sourceVal !== undefined) {
			result[key] = sourceVal
		}
	}
	return result
}
