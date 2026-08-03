/**
 * Hook for Ponytail auto-review.
 *
 * Since Ponytail is now a built-in skill that injects rules into prompts,
 * the review happens during code generation (not after).
 * This hook provides status information about Ponytail's active state.
 */

import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"
import { ponytailEnabledAtom } from "../atoms/feature-flags"
import { createLogger } from "../lib/logger"

const log = createLogger("ponytail-auto-review")

export interface PonytailFinding {
	file: string
	line: number
	tag: "delete" | "stdlib" | "native" | "yagni" | "shrink"
	description: string
	replacement: string
}

export interface ReviewResult {
	sessionId: string
	messageId: string
	findings: PonytailFinding[]
	summary: string
	timestamp: number
}

/**
 * Hook that provides Ponytail status information.
 *
 * Since Ponytail is now a built-in skill, it injects rules into prompts
 * during code generation. This hook tracks whether Ponytail is active.
 *
 * Usage:
 * ```tsx
 * const { isActive, mode } = usePonytailAutoReview(sessionId)
 * ```
 */
export function usePonytailAutoReview(_sessionId: string | null) {
	const ponytailEnabled = useAtomValue(ponytailEnabledAtom)
	const [mode, setMode] = useState<"lite" | "full" | "ultra" | "off">("full")
	const [isActive, setIsActive] = useState(false)

	useEffect(() => {
		if (typeof window === "undefined" || !("devilAi" in window)) {
			return
		}

		// Check ponytail status
		const checkPonytailStatus = async () => {
			try {
				const enabled = await window.devilAi.ponytail.isEnabled()
				const currentMode = await window.devilAi.ponytail.getMode()
				setIsActive(enabled && ponytailEnabled)
				setMode(currentMode)
				log.debug("Ponytail status", { enabled, mode: currentMode })
			} catch (err) {
				log.debug("Failed to check ponytail status", {}, err)
			}
		}

		checkPonytailStatus()
	}, [ponytailEnabled])

	return {
		isActive,
		mode,
		reviews: [], // Reviews are now part of the prompt injection
		isReviewing: false,
		clearReviews: () => {},
	}
}
