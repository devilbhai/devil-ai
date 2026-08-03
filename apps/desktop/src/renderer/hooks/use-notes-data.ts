/**
 * Hook for fetching and managing notes data.
 * Handles IPC subscriptions, polling, and state updates.
 */

import { useCallback, useEffect } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { notesAtom, setNotesAtom } from "../atoms/notes"
import {
	fetchNotes,
	createNote as backendCreateNote,
	updateNote as backendUpdateNote,
	deleteNote as backendDeleteNote,
	searchNotes as backendSearchNotes,
} from "../services/backend"
import { createLogger } from "../lib/logger"

const log = createLogger("use-notes-data")

export function useNotesData() {
	const notes = useAtomValue(notesAtom)
	const setNotes = useSetAtom(setNotesAtom)

	const refresh = useCallback(async () => {
		try {
			const list = await fetchNotes()
			setNotes(list)
		} catch (err) {
			log.error("Failed to fetch notes", err)
		}
	}, [setNotes])

	useEffect(() => {
		refresh()
	}, [refresh])

	const create = useCallback(
		async (input: { title: string; content?: string; tags?: string; sessionId?: string; projectPath?: string }) => {
			const note = await backendCreateNote(input)
			await refresh()
			return note
		},
		[refresh],
	)

	const update = useCallback(
		async (input: { id: string; title?: string; content?: string; tags?: string; includeInContext?: boolean }) => {
			const note = await backendUpdateNote(input)
			await refresh()
			return note
		},
		[refresh],
	)

	const remove = useCallback(
		async (id: string) => {
			const success = await backendDeleteNote(id)
			if (success) await refresh()
			return success
		},
		[refresh],
	)

	const search = useCallback(async (query: string) => {
		return backendSearchNotes(query)
	}, [])

	return { notes, refresh, create, update, remove, search }
}
