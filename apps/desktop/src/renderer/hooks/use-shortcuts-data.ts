/**
 * Hook for fetching and managing Keyboard Shortcuts data.
 */

import { useCallback, useEffect } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { shortcutsAtom, setShortcutsAtom } from "../atoms/shortcuts"
import { fetchShortcuts, updateShortcut as backendUpdateShortcut } from "../services/backend"
import { createLogger } from "../lib/logger"

const log = createLogger("use-shortcuts-data")

export function useShortcutsData() {
	const shortcuts = useAtomValue(shortcutsAtom)
	const setShortcuts = useSetAtom(setShortcutsAtom)

	const refresh = useCallback(async () => {
		try {
			const list = await fetchShortcuts()
			setShortcuts(list)
		} catch (err) {
			log.error("Failed to fetch shortcuts", err)
		}
	}, [setShortcuts])

	useEffect(() => {
		refresh()
	}, [refresh])

	const update = useCallback(
		async (input: { id: string; shortcut?: string; isEnabled?: boolean }) => {
			const shortcut = await backendUpdateShortcut(input)
			await refresh()
			return shortcut
		},
		[refresh],
	)

	return { shortcuts, refresh, update }
}
