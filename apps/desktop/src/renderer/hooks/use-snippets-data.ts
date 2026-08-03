/**
 * Hook for fetching and managing Snippets data.
 */

import { useCallback, useEffect } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { snippetsAtom, setSnippetsAtom } from "../atoms/snippets"
import {
	fetchSnippets,
	createSnippet as backendCreateSnippet,
	updateSnippet as backendUpdateSnippet,
	deleteSnippet as backendDeleteSnippet,
	searchSnippets as backendSearchSnippets,
} from "../services/backend"
import { createLogger } from "../lib/logger"

const log = createLogger("use-snippets-data")

export function useSnippetsData() {
	const snippets = useAtomValue(snippetsAtom)
	const setSnippets = useSetAtom(setSnippetsAtom)

	const refresh = useCallback(async () => {
		try {
			const list = await fetchSnippets()
			setSnippets(list)
		} catch (err) {
			log.error("Failed to fetch snippets", err)
		}
	}, [setSnippets])

	useEffect(() => {
		refresh()
	}, [refresh])

	const create = useCallback(
		async (input: { title: string; content?: string; language?: string; tags?: string; projectPath?: string }) => {
			const snippet = await backendCreateSnippet(input)
			await refresh()
			return snippet
		},
		[refresh],
	)

	const update = useCallback(
		async (input: { id: string; title?: string; content?: string; language?: string; tags?: string; isFavorite?: boolean }) => {
			const snippet = await backendUpdateSnippet(input)
			await refresh()
			return snippet
		},
		[refresh],
	)

	const remove = useCallback(
		async (id: string) => {
			const success = await backendDeleteSnippet(id)
			if (success) await refresh()
			return success
		},
		[refresh],
	)

	const search = useCallback(async (query: string) => {
		return backendSearchSnippets(query)
	}, [])

	return { snippets, refresh, create, update, remove, search }
}
