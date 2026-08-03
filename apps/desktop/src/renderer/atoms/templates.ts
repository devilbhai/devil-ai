/**
 * Jotai atoms for Session Templates state management.
 */

import { atom } from "jotai"
import type { SessionTemplate } from "../../preload/api"

export const templatesAtom = atom<SessionTemplate[]>([])
export const setTemplatesAtom = atom(null, (_get, set, templates: SessionTemplate[]) => set(templatesAtom, templates))
export const selectedTemplateIdAtom = atom<string | null>(null)
export const templateSearchQueryAtom = atom("")
export const templateCategoryFilterAtom = atom<string | null>(null)

export const filteredTemplatesAtom = atom((get) => {
	const templates = get(templatesAtom)
	const query = get(templateSearchQueryAtom).toLowerCase()
	const category = get(templateCategoryFilterAtom)
	let filtered = templates
	if (category) filtered = filtered.filter((t) => t.category === category)
	if (!query) return filtered
	return filtered.filter(
		(t) =>
			t.name.toLowerCase().includes(query) ||
			t.description.toLowerCase().includes(query) ||
			t.category.toLowerCase().includes(query),
	)
})

export const templateCountAtom = atom((get) => get(templatesAtom).length)
export const favoriteTemplatesAtom = atom((get) => get(templatesAtom).filter((t) => t.isFavorite))
