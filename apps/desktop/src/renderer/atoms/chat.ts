import { atom } from "jotai"
import { atomFamily } from "jotai-family"
import type { ModelRef } from "../hooks/use-opencode-data"

// ============================================================
// Session Settings (Atomic per session)
// ============================================================

export interface SessionChatSettings {
	selectedModel: ModelRef | null
	selectedAgent: string | null
	selectedVariant: string | undefined
}

/**
 * Persisted chat settings per session.
 * Seeded from project preferences, but overrides are session-specific.
 */
export const sessionSettingsAtom = atomFamily((_sessionId: string) =>
	atom<SessionChatSettings>({
		selectedModel: null,
		selectedAgent: null,
		selectedVariant: undefined,
	}),
)

