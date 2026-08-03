/**
 * DevilRoute session-token monitoring hook.
 *
 * Surfaces gateway provider problems as in-app toasts:
 *   - OAuth providers whose refresh token is dead ("needs re-auth"),
 *   - cookie / web-session providers whose session token expired.
 *
 * Each toast has an "Open gateway" action that jumps to the gateway's
 * /dashboard/providers page so the user can re-paste a fresh token fast.
 *
 * Dedupes by (provider, state) per app session so a provider that stays
 * expired isn't nagged every 2-hour cycle — but on a fresh launch the current
 * problems are shown once, so the user always knows what needs attention.
 */

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import type { TokenProblem } from "../../preload/api"

const DASHBOARD_URL = "http://127.0.0.1:20128/dashboard/providers"

function showProblemToast(problem: TokenProblem): void {
	const expired = problem.state === "expired"
	toast.warning(expired ? "Session token expired" : "Session needs re-auth", {
		description: `${problem.displayName} (${problem.provider}) — update it in the DevilRoute gateway.`,
		action: {
			label: "Open gateway",
			onClick: () => window.open(DASHBOARD_URL, "_blank"),
		},
		duration: 15_000,
	})
}

export function useDevilRouteTokens(): void {
	const shownRef = useRef<Set<string>>(new Set())

	useEffect(() => {
		if (typeof window === "undefined" || !("devilAi" in window)) return

		const showProblems = (problems: TokenProblem[]): void => {
			const fresh = problems.filter((p) => {
				const key = `${p.id}:${p.state}`
				if (shownRef.current.has(key)) return false
				shownRef.current.add(key)
				return true
			})
			if (fresh.length === 0) return
			if (fresh.length === 1) {
				showProblemToast(fresh[0])
				return
			}
			const expired = fresh.filter((p) => p.state === "expired").length
			toast.warning(`${fresh.length} session tokens need attention`, {
				description: `${expired} expired, ${fresh.length - expired} need re-auth — update them in the DevilRoute gateway.`,
				action: {
					label: "Open gateway",
					onClick: () => window.open(DASHBOARD_URL, "_blank"),
				},
				duration: 15_000,
			})
		}

		// Current problems on mount (covers a fresh launch / restart).
		window.devilAi.devilroute
			.getStatus()
			.then(({ lastSummary }) => {
				if (!lastSummary) return
				showProblems([...lastSummary.expired, ...lastSummary.needsReauth])
			})
			.catch(() => {
				// Gateway down or not configured — nothing to show.
			})

		// Newly-detected problems from the main-process refresher.
		const unsubscribe = window.devilAi.devilroute.onTokenStatus(({ newProblems }) => {
			showProblems(newProblems)
		})
		return unsubscribe
	}, [])
}
