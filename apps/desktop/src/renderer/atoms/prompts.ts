/**
 * Jotai atoms for Prompt Library state management.
 */

import { atom } from "jotai"
import type { Prompt } from "../../preload/api"

export const promptsAtom = atom<Prompt[]>([])
export const setPromptsAtom = atom(null, (_get, set, prompts: Prompt[]) => set(promptsAtom, prompts))
export const selectedPromptIdAtom = atom<string | null>(null)
export const promptSearchQueryAtom = atom("")
export const promptCategoryFilterAtom = atom<string | null>(null)

export const filteredPromptsAtom = atom((get) => {
	const prompts = get(promptsAtom)
	const query = get(promptSearchQueryAtom).toLowerCase()
	const category = get(promptCategoryFilterAtom)
	let filtered = prompts
	if (category) filtered = filtered.filter((p) => p.category === category)
	if (!query) return filtered
	return filtered.filter(
		(p) =>
			p.title.toLowerCase().includes(query) ||
			p.content.toLowerCase().includes(query) ||
			p.tags.toLowerCase().includes(query),
	)
})

export const promptCountAtom = atom((get) => get(promptsAtom).length)
export const favoritePromptsAtom = atom((get) => get(promptsAtom).filter((p) => p.isFavorite))
