/**
 * Hook for searching files in the project.
 * Uses fzf when enabled (via feature flag), falls back to server API.
 * Provides debounced file search with caching.
 * When query is empty, fetches an initial set of files.
 */
import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useEffect, useRef, useState } from "react"
import { fzfEnabledAtom } from "../atoms/feature-flags"
import { getProjectClient } from "../services/connection-manager"

const FILE_SEARCH_DEBOUNCE_MS = 150

export function useFileSearch(directory: string | null, query: string, enabled = true) {
	const [debouncedQuery, setDebouncedQuery] = useState(query)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const fzfEnabled = useAtomValue(fzfEnabledAtom)

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => {
			setDebouncedQuery(query)
		}, FILE_SEARCH_DEBOUNCE_MS)
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [query])

	// fzf-based file search (when enabled and in Electron)
	const { data: fzfData, isLoading: fzfLoading } = useQuery({
		queryKey: ["fzf-file-search", directory, debouncedQuery],
		queryFn: async () => {
			if (typeof window === "undefined" || !("devilAi" in window)) return []
			const result = await window.devilAi.fzf.files(directory || ".", debouncedQuery || undefined)
			if (result.success && result.result) {
				return result.result.items
			}
			return []
		},
		enabled: !!directory && enabled && fzfEnabled && typeof window !== "undefined" && "devilAi" in window,
		staleTime: 10_000,
	})

	// Fallback: server API (when fzf is disabled or unavailable)
	const { data: openCodeData, isLoading: openCodeLoading } = useQuery({
		queryKey: ["file-search", directory, debouncedQuery],
		queryFn: async () => {
			const client = getProjectClient(directory!)
			if (!client) return []
			// Empty query returns initial/recent files from the server
			const result = await client.find.files({ query: debouncedQuery })
			return (result.data ?? []) as string[]
		},
		enabled: !!directory && enabled && (!fzfEnabled || typeof window === "undefined" || !("devilAi" in window)),
		staleTime: 10_000,
	})

	// Use fzf results when enabled, otherwise use server results
	const files = fzfEnabled ? (fzfData ?? []) : (openCodeData ?? [])
	const isLoading = fzfEnabled ? fzfLoading : openCodeLoading

	return {
		files,
		isLoading,
	}
}
