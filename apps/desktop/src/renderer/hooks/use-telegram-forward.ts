import { useAtomValue } from "jotai"
import { useEffect, useRef } from "react"
import { telegramForwardSessionsAtom } from "../atoms/telegram-forward"
import { messagesFamily } from "../atoms/messages"
import { appStore } from "../atoms/store"
import { partsFamily } from "../atoms/parts"
import { mergeSessionParts } from "../atoms/derived/session-chat"
import { streamingVersionFamily } from "../atoms/streaming"

/**
 * Watches for new messages in a session and forwards them to Telegram
 * when the Telegram forward toggle is enabled for that session.
 */
export function useTelegramForward(sessionId: string | null) {
	const forwardSessions = useAtomValue(telegramForwardSessionsAtom)
	const isForwarding = sessionId ? forwardSessions.has(sessionId) : false
	const lastMessageCountRef = useRef(0)

	useEffect(() => {
		if (!sessionId || !isForwarding) {
			lastMessageCountRef.current = 0
			return
		}

		const storeMessages = appStore.get(messagesFamily(sessionId)) ?? []
		const streamingVersion = appStore.get(streamingVersionFamily(sessionId))
		const entries = mergeSessionParts(
			sessionId,
			storeMessages,
			(messageId) => appStore.get(partsFamily(messageId)),
			streamingVersion,
		)

		const currentCount = entries.length
		if (currentCount <= lastMessageCountRef.current) return

		// Forward new messages
		for (let i = lastMessageCountRef.current; i < currentCount; i++) {
			const entry = entries[i]
			const role = entry.info.role === "user" ? "user" : "assistant"
			// Extract text from parts
			const text = entry.parts
				.filter((p) => p.type === "text")
				.map((p) => p.text)
				.join("")
			if (text.trim()) {
				window.devilAi?.telegram?.sendForwarded(sessionId, role, text).catch(() => {})
			}
		}

		lastMessageCountRef.current = currentCount
	}, [sessionId, isForwarding])
}
