/**
 * Hook for fetching and managing Prompt Library data.
 */

import { useCallback, useEffect } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { promptsAtom, setPromptsAtom } from "../atoms/prompts"
import {
	fetchPrompts,
	createPrompt as backendCreatePrompt,
	updatePrompt as backendUpdatePrompt,
	deletePrompt as backendDeletePrompt,
	searchPrompts as backendSearchPrompts,
} from "../services/backend"
import { createLogger } from "../lib/logger"

const log = createLogger("use-prompts-data")

export function usePromptsData() {
	const prompts = useAtomValue(promptsAtom)
	const setPrompts = useSetAtom(setPromptsAtom)

	const refresh = useCallback(async () => {
		try {
			const list = await fetchPrompts()
			setPrompts(list)
		} catch (err) {
			log.error("Failed to fetch prompts", err)
		}
	}, [setPrompts])

	useEffect(() => {
		refresh()
	}, [refresh])

	const create = useCallback(
		async (input: { title: string; content?: string; tags?: string; category?: string }) => {
			const prompt = await backendCreatePrompt(input)
			await refresh()
			return prompt
		},
		[refresh],
	)

	const update = useCallback(
		async (input: { id: string; title?: string; content?: string; tags?: string; category?: string; isFavorite?: boolean }) => {
			const prompt = await backendUpdatePrompt(input)
			await refresh()
			return prompt
		},
		[refresh],
	)

	const remove = useCallback(
		async (id: string) => {
			const success = await backendDeletePrompt(id)
			if (success) await refresh()
			return success
		},
		[refresh],
	)

	const search = useCallback(async (query: string) => {
		return backendSearchPrompts(query)
	}, [])

	return { prompts, refresh, create, update, remove, search }
}
