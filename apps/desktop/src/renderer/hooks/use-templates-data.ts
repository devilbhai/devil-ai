/**
 * Hook for fetching and managing Session Templates data.
 */

import { useCallback, useEffect } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { templatesAtom, setTemplatesAtom } from "../atoms/templates"
import {
	fetchTemplates,
	createTemplate as backendCreateTemplate,
	updateTemplate as backendUpdateTemplate,
	deleteTemplate as backendDeleteTemplate,
} from "../services/backend"
import { createLogger } from "../lib/logger"

const log = createLogger("use-templates-data")

export function useTemplatesData() {
	const templates = useAtomValue(templatesAtom)
	const setTemplates = useSetAtom(setTemplatesAtom)

	const refresh = useCallback(async () => {
		try {
			const list = await fetchTemplates()
			setTemplates(list)
		} catch (err) {
			log.error("Failed to fetch templates", err)
		}
	}, [setTemplates])

	useEffect(() => {
		refresh()
	}, [refresh])

	const create = useCallback(
		async (input: { name: string; description?: string; config?: string; category?: string }) => {
			const template = await backendCreateTemplate(input)
			await refresh()
			return template
		},
		[refresh],
	)

	const update = useCallback(
		async (input: { id: string; name?: string; description?: string; config?: string; category?: string; isFavorite?: boolean }) => {
			const template = await backendUpdateTemplate(input)
			await refresh()
			return template
		},
		[refresh],
	)

	const remove = useCallback(
		async (id: string) => {
			const success = await backendDeleteTemplate(id)
			if (success) await refresh()
			return success
		},
		[refresh],
	)

	return { templates, refresh, create, update, remove }
}
