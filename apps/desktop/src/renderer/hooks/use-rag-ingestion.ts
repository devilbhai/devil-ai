/**
 * Hook that ingests session messages into the local RAG store.
 * Watches for message changes and automatically indexes new content.
 */

import { useAtomValue } from "jotai"
import { useEffect, useRef } from "react"
import { messagesFamily } from "../atoms/messages"
import { partsFamily } from "../atoms/parts"
import { ragEnabledAtom } from "../atoms/feature-flags"
import { sessionFamily } from "../atoms/sessions"
import { addSessionMessages, clearSessionDocs } from "../services/rag-service"
import { appStore } from "../atoms/store"
import type { TextPart } from "../lib/types"

interface UseRagIngestionOptions {
	sessionId: string
}

export function useRagIngestion({ sessionId }: UseRagIngestionOptions) {
	const messages = useAtomValue(messagesFamily(sessionId))
	const ragEnabled = useAtomValue(ragEnabledAtom)
	const session = useAtomValue(sessionFamily(sessionId))
	const lastIngestedCount = useRef(0)

	const isStreaming =
		session?.status?.type === "busy"

	useEffect(() => {
		if (!ragEnabled || !messages || messages.length === 0) return
		// Skip while the session is actively streaming to avoid redundant re-embedding.
		if (isStreaming) return

		// Only ingest new messages (avoid re-ingesting everything)
		const newMessages = messages.slice(lastIngestedCount.current)
		if (newMessages.length === 0) return

		// Extract text content from messages using partsFamily
		const textMessages = newMessages
			.filter((m) => m.role === "user" || m.role === "assistant")
			.map((m) => {
				const parts = appStore.get(partsFamily(m.id))
				const textParts = (parts ?? []).filter((p): p is TextPart => p.type === "text")
				const content = textParts.map((p) => p.text).join("\n")
				return { role: m.role, content }
			})
			.filter((m) => m.content.trim().length > 20)

		if (textMessages.length > 0) {
			addSessionMessages(sessionId, textMessages)
			lastIngestedCount.current = messages.length
		}
	}, [messages, ragEnabled, sessionId, isStreaming])

	// Free RAG docs when the hook unmounts (e.g. session removed).
	useEffect(() => {
		if (!ragEnabled) return
		return () => {
			clearSessionDocs(sessionId)
		}
	}, [ragEnabled, sessionId])
}

/**
 * Clear RAG data for a session.
 */
export function clearSessionRag(sessionId: string) {
	clearSessionDocs(sessionId)
}
