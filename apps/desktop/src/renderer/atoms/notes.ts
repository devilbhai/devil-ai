/**
 * Jotai atoms for Notes state management.
 */

import { atom } from "jotai"
import type { Note } from "../../preload/api"

// ============================================================
// Notes atoms
// ============================================================

/** All notes list */
export const notesAtom = atom<Note[]>([])

/** Write-only setter for notes list */
export const setNotesAtom = atom(null, (_get, set, notes: Note[]) => {
	set(notesAtom, notes)
})

/** Currently selected note */
export const selectedNoteIdAtom = atom<string | null>(null)

/** Search query for notes */
export const noteSearchQueryAtom = atom("")

/** Filtered notes based on search */
export const filteredNotesAtom = atom((get) => {
	const notes = get(notesAtom)
	const query = get(noteSearchQueryAtom).toLowerCase()
	if (!query) return notes
	return notes.filter(
		(n) =>
			n.title.toLowerCase().includes(query) ||
			n.content.toLowerCase().includes(query) ||
			n.tags.toLowerCase().includes(query),
	)
})

/** Total note count */
export const noteCountAtom = atom((get) => get(notesAtom).length)

/** Notes included in AI context */
export const contextNotesAtom = atom((get) => get(notesAtom).filter((n) => n.includeInContext))
