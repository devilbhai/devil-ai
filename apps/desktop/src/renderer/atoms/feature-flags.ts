/**
 * Feature flags -- persisted toggles for experimental features.
 *
 * Each flag is an independent atomWithStorage so they survive reloads.
 * Toggle via the command palette (Cmd+K > "Enable/Disable ...").
 */

import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// ============================================================
// Automations
// ============================================================

/**
 * Whether the Automations feature is enabled.
 * Enabled by default -- users can disable it via the command palette.
 */
export const automationsEnabledAtom = atomWithStorage<boolean>("devil-ai:automationsEnabled", true)

/** Write-only toggle for the command palette. */
export const toggleAutomationsAtom = atom(null, (get, set) => {
	set(automationsEnabledAtom, !get(automationsEnabledAtom))
})

// ============================================================
// Additional feature flags
// ============================================================

/** fzf (Fuzzy Finder) feature flag. On by default. */
export const fzfEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:fzf", true)

/** CodeGraph (Code Knowledge Graph) feature flag. On by default. */
export const codegraphEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:codegraph", true)

/** Ponytail (Code Quality) feature flag. On by default. */
export const ponytailEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:ponytail", true)

/** Premium UI sections (hero/testimonials/etc) are available. */
export const premiumSectionsEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:premiumSections", false)

/** Voice input (Whisper/Web Speech) for chat. Off by default. */
export const voiceInputEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:voiceInput", false)

/** LanceDB local RAG for session context/memory. Off by default. */
export const ragEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:rag", false)

/** Hellfire Profiler (React Render Analysis) */
export const hellfireProfilerEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:hellfireProfiler", false)

/** Pre-Cognitive Debugging */
export const preCognitiveDebuggingAtom = atomWithStorage<boolean>("devil-ai:feature:preCognitiveDebugging", false)


/** Tesseract.js OCR for image text extraction. Off by default. */
export const ocrEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:ocr", false)

/** Notes (User Memory) feature. On by default. */
export const notesEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:notes", true)

/** Write-only toggle for the command palette. */
export const toggleNotesAtom = atom(null, (get, set) => {
	set(notesEnabledAtom, !get(notesEnabledAtom))
})

/** Plugin Installer feature flag. On by default. */
export const pluginInstallerEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:pluginInstaller", true)

/** Prompt Library feature flag. On by default. */
export const promptLibraryEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:promptLibrary", true)
export const togglePromptLibraryAtom = atom(null, (get, set) => {
	set(promptLibraryEnabledAtom, !get(promptLibraryEnabledAtom))
})

/** Snippets Manager feature flag. On by default. */
export const snippetsEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:snippets", true)
export const toggleSnippetsAtom = atom(null, (get, set) => {
	set(snippetsEnabledAtom, !get(snippetsEnabledAtom))
})

/** Session Templates feature flag. On by default. */
export const sessionTemplatesEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:sessionTemplates", true)
export const toggleSessionTemplatesAtom = atom(null, (get, set) => {
	set(sessionTemplatesEnabledAtom, !get(sessionTemplatesEnabledAtom))
})

/** Keyboard Shortcuts Customizer feature flag. On by default. */
export const keyboardShortcutsEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:keyboardShortcuts", true)
export const toggleKeyboardShortcutsAtom = atom(null, (get, set) => {
	set(keyboardShortcutsEnabledAtom, !get(keyboardShortcutsEnabledAtom))
})

/** Built-in Terminal feature flag. Off by default. */
export const terminalEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:terminal", false)
export const toggleTerminalAtom = atom(null, (get, set) => {
	set(terminalEnabledAtom, !get(terminalEnabledAtom))
})

/** Database Viewer feature flag. Off by default. */
export const databaseViewerEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:databaseViewer", false)
export const toggleDatabaseViewerAtom = atom(null, (get, set) => {
	set(databaseViewerEnabledAtom, !get(databaseViewerEnabledAtom))
})

/** API Tester feature flag. Off by default. */
export const apiTesterEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:apiTester", false)
export const toggleApiTesterAtom = atom(null, (get, set) => {
	set(apiTesterEnabledAtom, !get(apiTesterEnabledAtom))
})

/** Analytics Dashboard feature flag. Off by default. */
export const analyticsEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:analytics", false)
export const toggleAnalyticsAtom = atom(null, (get, set) => {
	set(analyticsEnabledAtom, !get(analyticsEnabledAtom))
})

/** Browser Automation feature flag. Off by default. */
export const browserEnabledAtom = atomWithStorage<boolean>("devil-ai:feature:browser", false)
export const toggleBrowserAtom = atom(null, (get, set) => {
	set(browserEnabledAtom, !get(browserEnabledAtom))
})

/** Puzzle icon atom (for Plugin Installer). */
export const puzzleIconAtom = atom<boolean>(true)

/**
 * User-defined feature toggles. Allows users to add custom feature flags
 * from the settings UI. Persisted in local storage.
 */
export type UserFeature = { id: string; name: string; enabled: boolean }
export const userFeaturesAtom = atomWithStorage<UserFeature[]>("devil-ai:feature:userAdded", [])

/** Add a user feature by name. Generates a stable id and enables it. */
export const addUserFeatureAtom = atom(null, (get, set, name: string) => {
    if (!name || typeof name !== "string") return
    const features = get(userFeaturesAtom) || []
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    const id = `${slug}-${Date.now().toString(36)}`
    const f: UserFeature = { id, name: name.trim(), enabled: true }
    set(userFeaturesAtom, [...features, f])
})

/** Toggle a user feature by id. */
export const toggleUserFeatureAtom = atom(null, (get, set, id: string) => {
    const features = get(userFeaturesAtom) || []
    set(
        userFeaturesAtom,
        features.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    )
})

/** Remove a user feature by id. */
export const removeUserFeatureAtom = atom(null, (get, set, id: string) => {
    const features = get(userFeaturesAtom) || []
    set(userFeaturesAtom, features.filter((f) => f.id !== id))
})
