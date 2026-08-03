import { useAtomValue, useSetAtom } from "jotai"
import { useLayoutEffect, useMemo } from "react"
import { autoThemeScheduleAtom, colorSchemeAtom, themeAtom, appIconAtom } from "../atoms/preferences"
import { type ColorScheme, getAvailableThemes, getTheme, type ThemeDefinition } from "../lib/themes"

// ============================================================
// useThemeEffect — synchronises persisted store to <html> element
// ============================================================

const STYLE_ID = "devil-ai-theme-vars"

function getOrCreateStyleElement(): HTMLStyleElement {
	let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
	if (!el) {
		el = document.createElement("style")
		el.id = STYLE_ID
		document.head.appendChild(el)
	}
	return el
}

function resolveColorSchemeClass(scheme: ColorScheme): "dark" | "light" {
	if (scheme === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
	}
	return scheme
}

/**
 * Check if current time falls within the dark hours schedule.
 * Handles overnight schedules (e.g., 20:00 - 07:00).
 */
function isCurrentTimeDark(
	darkStartHour: number,
	darkStartMinute: number,
	darkEndHour: number,
	darkEndMinute: number,
): boolean {
	const now = new Date()
	const currentMinutes = now.getHours() * 60 + now.getMinutes()
	const startMinutes = darkStartHour * 60 + darkStartMinute
	const endMinutes = darkEndHour * 60 + darkEndMinute

	if (startMinutes <= endMinutes) {
		// Same day schedule (e.g., 09:00 - 17:00)
		return currentMinutes >= startMinutes && currentMinutes < endMinutes
	}
	// Overnight schedule (e.g., 20:00 - 07:00)
	return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

function buildGlassVars(theme: ThemeDefinition): [string, string][] {
	const g = theme.glass
	if (!g) return []
	const vars: [string, string][] = []
	if (g.bodyOpacity !== undefined) vars.push(["--glass-body", `${g.bodyOpacity}%`])
	if (g.sidebarOpacity !== undefined) vars.push(["--glass-sidebar", `${g.sidebarOpacity}%`])
	if (g.surfaceOpacity !== undefined) vars.push(["--glass-surface", `${g.surfaceOpacity}%`])
	if (g.elevatedOpacity !== undefined) vars.push(["--glass-elevated", `${g.elevatedOpacity}%`])
	if (g.cardOpacity !== undefined) vars.push(["--glass-card", `${g.cardOpacity}%`])
	if (g.contentOpacity !== undefined) vars.push(["--glass-content", `${g.contentOpacity}%`])
	if (g.blurScale !== undefined) {
		const s = g.blurScale
		vars.push(["--blur-sm", `${8 * s}px`])
		vars.push(["--blur-md", `${12 * s}px`])
		vars.push(["--blur-lg", `${16 * s}px`])
		vars.push(["--blur-xl", `${24 * s}px`])
	}
	return vars
}

function buildThemeCss(theme: ThemeDefinition): string {
	const lightEntries = Object.entries(theme.cssVars.light)
	const darkEntries = Object.entries(theme.cssVars.dark)
	const densityEntries = theme.density ? Object.entries(theme.density) : []
	const radiusEntry = theme.radius ? [["--radius", theme.radius] as const] : []
	const glassEntries = buildGlassVars(theme)

	// Glass entries are defaults — cssVars entries override them (come last)
	const allLight = [...glassEntries, ...densityEntries, ...radiusEntry, ...lightEntries]
	const allDark = [...glassEntries, ...densityEntries, ...radiusEntry, ...darkEntries]

	if (allLight.length === 0 && allDark.length === 0) return ""

	let css = ""
	if (allLight.length > 0) {
		css += `:root {\n${allLight.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n`
	}
	if (allDark.length > 0) {
		css += `.dark {\n${allDark.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n`
	}
	return css
}

export function useThemeEffect() {
	const themeId = useAtomValue(themeAtom)
	const colorScheme = useAtomValue(colorSchemeAtom)
	const autoSchedule = useAtomValue(autoThemeScheduleAtom)

	const theme = useMemo(() => getTheme(themeId), [themeId])

	// Resolve effective color scheme considering auto-schedule
	const effectiveColorScheme = useMemo<ColorScheme>(() => {
		if (colorScheme !== "system" || !autoSchedule.enabled) return colorScheme
		const isDark = isCurrentTimeDark(
			autoSchedule.darkStartHour,
			autoSchedule.darkStartMinute,
			autoSchedule.darkEndHour,
			autoSchedule.darkEndMinute,
		)
		return isDark ? "dark" : "light"
	}, [colorScheme, autoSchedule])

	useLayoutEffect(() => {
		const root = document.documentElement

		const cls = resolveColorSchemeClass(effectiveColorScheme)
		root.classList.remove("dark", "light")
		root.classList.add(cls)

		for (const c of Array.from(root.classList)) {
			if (c.startsWith("theme-")) root.classList.remove(c)
		}
		if (theme.id !== "default") {
			root.classList.add(`theme-${theme.id}`)
		}

		// If the theme disables glass, force opaque regardless of platform tier
		if (theme.glass?.disabled) {
			root.classList.remove("electron-transparent", "electron-vibrancy")
			root.classList.add("electron-opaque")
		}

		const styleEl = getOrCreateStyleElement()
		styleEl.textContent = buildThemeCss(theme)

		// Sync native theme with macOS so the glass tint matches the CSS color scheme.
		// Without this, macOS applies its system appearance (dark/light) to the native
		// glass layer regardless of what the app's CSS says — causing mismatched tinting.
		if ("devilAi" in window) {
			window.devilAi.setNativeTheme(colorScheme === "system" ? "system" : cls)
		}

		if (theme.fonts?.sans) {
			root.style.setProperty("--font-sans", theme.fonts.sans)
		} else {
			root.style.removeProperty("--font-sans")
		}
		if (theme.fonts?.mono) {
			root.style.setProperty("--font-mono", theme.fonts.mono)
		} else {
			root.style.removeProperty("--font-mono")
		}

		if (colorScheme === "system") {
			if (autoSchedule.enabled) {
				// Schedule-based: check every minute for transitions
				const interval = setInterval(() => {
					const isDark = isCurrentTimeDark(
						autoSchedule.darkStartHour,
						autoSchedule.darkStartMinute,
						autoSchedule.darkEndHour,
						autoSchedule.darkEndMinute,
					)
					const newCls = isDark ? "dark" : "light"
					root.classList.remove("dark", "light")
					root.classList.add(newCls)
					if ("devilAi" in window) {
						window.devilAi.setNativeTheme("system")
					}
				}, 60_000)
				return () => clearInterval(interval)
			}
			// Normal system: follow OS preference
			const mq = window.matchMedia("(prefers-color-scheme: dark)")
			const handler = (e: MediaQueryListEvent) => {
				root.classList.remove("dark", "light")
				root.classList.add(e.matches ? "dark" : "light")
			}
			mq.addEventListener("change", handler)
			return () => mq.removeEventListener("change", handler)
		}
	}, [theme, colorScheme, effectiveColorScheme, autoSchedule])

	const appIcon = useAtomValue(appIconAtom)
	useLayoutEffect(() => {
		if ("devilAi" in window && window.devilAi.platform === "darwin" && window.devilAi.setAppIcon) {
			window.devilAi.setAppIcon(appIcon)
		}
	}, [appIcon])
}

// ============================================================
// Convenience hooks
// ============================================================

export function useCurrentTheme(): ThemeDefinition {
	const themeId = useAtomValue(themeAtom)
	return useMemo(() => getTheme(themeId), [themeId])
}

export function useColorScheme(): ColorScheme {
	return useAtomValue(colorSchemeAtom)
}

export function useAvailableThemes(): ThemeDefinition[] {
	const platform =
		typeof window !== "undefined" && "devilAi" in window ? window.devilAi.platform : undefined
	return useMemo(() => getAvailableThemes(platform), [platform])
}

export function useSetTheme(): (id: string) => void {
	return useSetAtom(themeAtom)
}

export function useSetColorScheme(): (scheme: ColorScheme) => void {
	return useSetAtom(colorSchemeAtom)
}

export function useAppIcon(): string {
	return useAtomValue(appIconAtom)
}

export function useSetAppIcon(): (icon: string) => void {
	return useSetAtom(appIconAtom)
}
