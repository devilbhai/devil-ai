/**
 * Jotai atoms for Keyboard Shortcuts state management.
 */

import { atom } from "jotai"
import type { KeyboardShortcut } from "../../preload/api"

export const shortcutsAtom = atom<KeyboardShortcut[]>([])
export const setShortcutsAtom = atom(null, (_get, set, shortcuts: KeyboardShortcut[]) => set(shortcutsAtom, shortcuts))
export const shortcutSearchQueryAtom = atom("")

export const filteredShortcutsAtom = atom((get) => {
	const shortcuts = get(shortcutsAtom)
	const query = get(shortcutSearchQueryAtom).toLowerCase()
	if (!query) return shortcuts
	return shortcuts.filter(
		(s) =>
			s.label.toLowerCase().includes(query) ||
			s.action.toLowerCase().includes(query) ||
			s.shortcut.toLowerCase().includes(query) ||
			s.category.toLowerCase().includes(query),
	)
})

/** Shortcuts grouped by category */
export const shortcutsByCategoryAtom = atom((get) => {
	const shortcuts = get(filteredShortcutsAtom)
	const grouped: Record<string, KeyboardShortcut[]> = {}
	for (const s of shortcuts) {
		if (!grouped[s.category]) grouped[s.category] = []
		grouped[s.category].push(s)
	}
	return grouped
})

export const shortcutCountAtom = atom((get) => get(shortcutsAtom).length)
