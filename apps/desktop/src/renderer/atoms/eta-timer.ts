/**
 * ETA Timer atoms — reverse countdown for task completion.
 * Estimates remaining time based on agent status and history.
 */
import { atom } from "jotai"

export interface ETAState {
	/** When the current task started (ms since epoch) */
	startedAt: number
	/** Estimated total duration in seconds (from history or heuristics) */
	estimatedTotalSec: number
	/** Whether the agent is actively running */
	running: boolean
}

/**
 * Family of ETA states keyed by session ID.
 * Each session tracks its own start time and estimate.
 */
export const etaFamily = atom<Map<string, ETAState>>(new Map())

/**
 * Derive ETA for a specific session.
 * Returns null if no data, otherwise remaining seconds + formatted string.
 */
export function computeETA(state: ETAState | undefined, now: number): {
	remainingSec: number
	label: string
	percent: number
} | null {
	if (!state || !state.running) return null

	const elapsed = (now - state.startedAt) / 1000
	const remaining = Math.max(0, state.estimatedTotalSec - elapsed)
	const percent = Math.min(100, (elapsed / state.estimatedTotalSec) * 100)

	return {
		remainingSec: remaining,
		label: formatDuration(remaining),
		percent,
	}
}

/**
 * Format seconds into a human-readable string.
 * Examples: "2m 30s", "45s", "1h 12m", "< 10s"
 */
function formatDuration(seconds: number): string {
	if (seconds < 10) return "< 10s"
	if (seconds < 60) return `${Math.round(seconds)}s`
	if (seconds < 3600) {
		const m = Math.floor(seconds / 60)
		const s = Math.round(seconds % 60)
		return s > 0 ? `${m}m ${s}s` : `${m}m`
	}
	const h = Math.floor(seconds / 3600)
	const m = Math.round((seconds % 3600) / 60)
	return `${h}h ${m}m`
}
