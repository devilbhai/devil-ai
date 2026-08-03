/**
 * Jotai atoms for Snippets Manager state management.
 */

import { atom } from "jotai"
import type { Snippet } from "../../preload/api"

export const snippetsAtom = atom<Snippet[]>([])
export const setSnippetsAtom = atom(null, (_get, set, snippets: Snippet[]) => set(snippetsAtom, snippets))
export const selectedSnippetIdAtom = atom<string | null>(null)
export const snippetSearchQueryAtom = atom("")
export const snippetLanguageFilterAtom = atom<string | null>(null)

export const filteredSnippetsAtom = atom((get) => {
	const snippets = get(snippetsAtom)
	const query = get(snippetSearchQueryAtom).toLowerCase()
	const language = get(snippetLanguageFilterAtom)
	let filtered = snippets
	if (language) filtered = filtered.filter((s) => s.language === language)
	if (!query) return filtered
	return filtered.filter(
		(s) =>
			s.title.toLowerCase().includes(query) ||
			s.content.toLowerCase().includes(query) ||
			s.tags.toLowerCase().includes(query) ||
			s.language.toLowerCase().includes(query),
	)
})

export const snippetCountAtom = atom((get) => get(snippetsAtom).length)
export const favoriteSnippetsAtom = atom((get) => get(snippetsAtom).filter((s) => s.isFavorite))

/** Unique languages across all snippets */
export const snippetLanguagesAtom = atom((get) => {
	const snippets = get(snippetsAtom)
	return [...new Set(snippets.map((s) => s.language))].sort()
})
