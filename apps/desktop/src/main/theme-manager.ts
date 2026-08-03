/**
 * Theme Manager - Custom themes for Devil AI.
 *
 * Features:
 * - Predefined themes (dark, light, custom)
 * - Custom color schemes
 * - Import/export themes
 * - Theme persistence
 */

import { createLogger } from "./logger"

const log = createLogger("theme-manager")

// ============================================================
// Types
// ============================================================

export interface ThemeColors {
	// Primary colors
	primary: string
	primaryForeground: string

	// Background colors
	background: string
	foreground: string
	card: string
	cardForeground: string

	// Border colors
	border: string
	input: string
	ring: string

	// Muted colors
	muted: string
	mutedForeground: string

	// Accent colors
	accent: string
	accentForeground: string

	// Destructive colors
	destructive: string
	destructiveForeground: string

	// Status colors
	success: string
	warning: string
	info: string

	// Sidebar colors
	sidebar: string
	sidebarForeground: string
	sidebarAccent: string

	// Editor colors
	editor: string
	editorForeground: string
	editorLineHighlight: string
	editorSelection: string
	editorCursor: string

	// Terminal colors
	terminal: string
	terminalForeground: string
	terminalAnsi: string[]

	// Custom brand colors
	brandPrimary: string
	brandSecondary: string
	brandAccent: string
}

export interface Theme {
	id: string
	name: string
	description: string
	author: string
	version: string
	isDark: boolean
	colors: ThemeColors
	createdAt: string
	updatedAt: string
}

export interface ThemePreset {
	id: string
	name: string
	description: string
	theme: Theme
}

// ============================================================
// Default Themes
// ============================================================

const DEFAULT_DARK_THEME: Theme = {
	id: "devil-ai-dark",
	name: "Devil AI Dark",
	description: "Default dark theme",
	author: "Devil AI",
	version: "1.0.0",
	isDark: true,
	colors: {
		primary: "#6366f1",
		primaryForeground: "#ffffff",

		background: "#0a0a0f",
		foreground: "#e4e4e7",
		card: "#12121a",
		cardForeground: "#e4e4e7",

		border: "#27272a",
		input: "#27272a",
		ring: "#6366f1",

		muted: "#18181b",
		mutedForeground: "#a1a1aa",

		accent: "#6366f1",
		accentForeground: "#ffffff",

		destructive: "#ef4444",
		destructiveForeground: "#ffffff",

		success: "#22c55e",
		warning: "#f59e0b",
		info: "#3b82f6",

		sidebar: "#0d0d14",
		sidebarForeground: "#e4e4e7",
		sidebarAccent: "#1a1a2e",

		editor: "#0a0a0f",
		editorForeground: "#e4e4e7",
		editorLineHighlight: "#1a1a2e",
		editorSelection: "#6366f133",
		editorCursor: "#6366f1",

		terminal: "#0a0a0f",
		terminalForeground: "#e4e4e7",
		terminalAnsi: [
			"#0a0a0f", "#ef4444", "#22c55e", "#f59e0b",
			"#3b82f6", "#a855f7", "#06b6d4", "#e4e4e7",
			"#71717a", "#ef4444", "#22c55e", "#f59e0b",
			"#3b82f6", "#a855f7", "#06b6d4", "#ffffff",
		],

		brandPrimary: "#dc2626",
		brandSecondary: "#f97316",
		brandAccent: "#eab308",
	},
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
}

const DEFAULT_LIGHT_THEME: Theme = {
	id: "devil-ai-light",
	name: "Devil AI Light",
	description: "Default light theme",
	author: "Devil AI",
	version: "1.0.0",
	isDark: false,
	colors: {
		primary: "#6366f1",
		primaryForeground: "#ffffff",

		background: "#ffffff",
		foreground: "#18181b",
		card: "#ffffff",
		cardForeground: "#18181b",

		border: "#e4e4e7",
		input: "#e4e4e7",
		ring: "#6366f1",

		muted: "#f4f4f5",
		mutedForeground: "#71717a",

		accent: "#6366f1",
		accentForeground: "#ffffff",

		destructive: "#ef4444",
		destructiveForeground: "#ffffff",

		success: "#22c55e",
		warning: "#f59e0b",
		info: "#3b82f6",

		sidebar: "#f8fafc",
		sidebarForeground: "#18181b",
		sidebarAccent: "#f1f5f9",

		editor: "#ffffff",
		editorForeground: "#18181b",
		editorLineHighlight: "#f8fafc",
		editorSelection: "#6366f122",
		editorCursor: "#6366f1",

		terminal: "#ffffff",
		terminalForeground: "#18181b",
		terminalAnsi: [
			"#ffffff", "#ef4444", "#22c55e", "#f59e0b",
			"#3b82f6", "#a855f7", "#06b6d4", "#18181b",
			"#71717a", "#ef4444", "#22c55e", "#f59e0b",
			"#3b82f6", "#a855f7", "#06b6d4", "#000000",
		],

		brandPrimary: "#dc2626",
		brandSecondary: "#f97316",
		brandAccent: "#eab308",
	},
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
}

export const THEME_PRESETS: ThemePreset[] = [
	{ id: "devil-ai-dark", name: "Devil AI Dark", description: "Default dark theme", theme: DEFAULT_DARK_THEME },
	{ id: "devil-ai-light", name: "Devil AI Light", description: "Default light theme", theme: DEFAULT_LIGHT_THEME },
]

// ============================================================
// Theme Manager
// ============================================================

let currentTheme: Theme = structuredClone(DEFAULT_DARK_THEME)
const listeners = new Set<(theme: Theme) => void>()

/**
 * Initialize theme manager with saved preferences.
 */
export function initThemeManager(savedTheme?: Theme): void {
	if (savedTheme) {
		currentTheme = deepMerge(structuredClone(DEFAULT_DARK_THEME), savedTheme)
	}
	applyTheme(currentTheme)
	log.info("Theme manager initialized", { themeId: currentTheme.id })
}

/**
 * Get current theme.
 */
export function getCurrentTheme(): Theme {
	return structuredClone(currentTheme)
}

/**
 * Set theme by ID (preset) or custom theme object.
 */
export function setTheme(themeOrId: string | Theme): void {
	if (typeof themeOrId === "string") {
		const preset = THEME_PRESETS.find((p) => p.id === themeOrId)
		if (preset) {
			currentTheme = structuredClone(preset.theme)
		}
	} else {
		currentTheme = deepMerge(structuredClone(DEFAULT_DARK_THEME), themeOrId)
	}

	applyTheme(currentTheme)
	notifyListeners()
	log.info("Theme changed", { themeId: currentTheme.id })
}

/**
 * Update theme colors partially.
 */
export function updateThemeColors(colors: Partial<ThemeColors>): void {
	currentTheme.colors = { ...currentTheme.colors, ...colors }
	currentTheme.updatedAt = new Date().toISOString()
	applyTheme(currentTheme)
	notifyListeners()
	log.info("Theme colors updated")
}

/**
 * Subscribe to theme changes.
 */
export function onThemeChanged(callback: (theme: Theme) => void): () => void {
	listeners.add(callback)
	return () => {
		listeners.delete(callback)
	}
}

/**
 * Export theme as JSON string.
 */
export function exportTheme(): string {
	return JSON.stringify(currentTheme, null, 2)
}

/**
 * Import theme from JSON string.
 */
export function importTheme(json: string): boolean {
	try {
		const theme = JSON.parse(json) as Theme
		if (!theme.id || !theme.name || !theme.colors) {
			throw new Error("Invalid theme format")
		}
		setTheme(theme)
		return true
	} catch (err) {
		log.error("Failed to import theme", err)
		return false
	}
}

/**
 * Get CSS custom properties for the current theme.
 */
export function getThemeCSSProperties(): Record<string, string> {
	const c = currentTheme.colors
	return {
		"--primary": c.primary,
		"--primary-foreground": c.primaryForeground,
		"--background": c.background,
		"--foreground": c.foreground,
		"--card": c.card,
		"--card-foreground": c.cardForeground,
		"--border": c.border,
		"--input": c.input,
		"--ring": c.ring,
		"--muted": c.muted,
		"--muted-foreground": c.mutedForeground,
		"--accent": c.accent,
		"--accent-foreground": c.accentForeground,
		"--destructive": c.destructive,
		"--destructive-foreground": c.destructiveForeground,
		"--success": c.success,
		"--warning": c.warning,
		"--info": c.info,
		"--sidebar": c.sidebar,
		"--sidebar-foreground": c.sidebarForeground,
		"--sidebar-accent": c.sidebarAccent,
		"--editor": c.editor,
		"--editor-foreground": c.editorForeground,
		"--editor-line-highlight": c.editorLineHighlight,
		"--editor-selection": c.editorSelection,
		"--editor-cursor": c.editorCursor,
		"--terminal": c.terminal,
		"--terminal-foreground": c.terminalForeground,
		"--brand-primary": c.brandPrimary,
		"--brand-secondary": c.brandSecondary,
		"--brand-accent": c.brandAccent,
	}
}

// ============================================================
// Internal Helpers
// ============================================================

function applyTheme(theme: Theme): void {
	if (typeof document === "undefined") return

	const root = document.documentElement
	const properties = getThemeCSSProperties()

	for (const [key, value] of Object.entries(properties)) {
		root.style.setProperty(key, value)
	}

	// Set dark/light mode class
	root.classList.toggle("dark", theme.isDark)
	root.classList.toggle("light", !theme.isDark)
}

function notifyListeners(): void {
	const themeCopy = structuredClone(currentTheme)
	for (const listener of listeners) {
		try {
			listener(themeCopy)
		} catch (err) {
			log.error("Theme listener error", err)
		}
	}
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
	const result = { ...target }
	for (const key in source) {
		if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
			;(result as any)[key] = deepMerge(
				(result as any)[key] || {},
				source[key] as any,
			)
		} else if (source[key] !== undefined) {
			;(result as any)[key] = source[key]
		}
	}
	return result
}
