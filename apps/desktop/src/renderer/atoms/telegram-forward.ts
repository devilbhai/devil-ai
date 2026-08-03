import { atom } from "jotai"

/**
 * Tracks which sessions have Telegram forwarding enabled.
 * When a session ID is in this set, all new messages will be forwarded to Telegram bot.
 */
export const telegramForwardSessionsAtom = atom(new Set<string>())

/**
 * Toggle Telegram forwarding for a specific session.
 */
export const toggleTelegramForwardAtom = atom(
	null,
	(get, set, sessionId: string) => {
		const current = get(telegramForwardSessionsAtom)
		const next = new Set(current)
		if (next.has(sessionId)) {
			next.delete(sessionId)
		} else {
			next.add(sessionId)
		}
		set(telegramForwardSessionsAtom, next)
	},
)
