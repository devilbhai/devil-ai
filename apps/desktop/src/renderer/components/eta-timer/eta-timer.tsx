/**
 * ETA Timer — reverse countdown showing estimated time remaining.
 * Displays "Est. Xm Xs remaining" or "Running for Xm" during active sessions.
 */
import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"
import { agentFamily } from "../../atoms/derived/agents"
import { computeETA, type ETAState } from "../../atoms/eta-timer"

/** Heuristic: average task duration in seconds by activity pattern */
const BASELINE_DURATION_SEC = 120 // 2 minutes default

/**
 * Derive an ETA estimate from agent metadata.
 * Uses activity patterns and history when available.
 */
function deriveEstimate(agent: { status: string; createdAt: number; lastActiveAt: number }): ETAState {
	const now = Date.now()
	const elapsed = (now - agent.createdAt) / 1000

	// Running agents: estimate based on elapsed time + buffer
	const running = agent.status === "running" || agent.status === "waiting" || agent.status === "retry"
	if (running) {
		// Simple heuristic: 2x elapsed time, minimum 2 minutes
		const estimated = Math.max(BASELINE_DURATION_SEC, elapsed * 2)
		return {
			startedAt: agent.createdAt,
			estimatedTotalSec: estimated,
			running: true,
		}
	}

	return {
		startedAt: agent.createdAt,
		estimatedTotalSec: elapsed || BASELINE_DURATION_SEC,
		running: false,
	}
}

export function ETATimer({ sessionId }: { sessionId: string }) {
	const agent = useAtomValue(agentFamily(sessionId))
	const [now, setNow] = useState(Date.now())

	// Tick every second for live countdown
	useEffect(() => {
		if (!agent) return
		const running = agent.status === "running" || agent.status === "waiting" || agent.status === "retry"
		if (!running) return

		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [agent?.status])

	if (!agent) return null

	const eta = deriveEstimate(agent)
	const result = computeETA(eta, now)

	if (!result) return null

	// For completed/failed agents, show total duration
	if (agent.status === "completed" || agent.status === "failed") {
		const totalSec = (agent.lastActiveAt - agent.createdAt) / 1000
		return (
			<span className="text-xs text-muted-foreground">
				{agent.status === "completed" ? "Done in " : "Failed after "}
				{formatSimpleDuration(totalSec)}
			</span>
		)
	}

	// Running/waiting: show countdown
	return (
		<div className="flex items-center gap-1.5">
			{/* Animated dot */}
			<span className="relative flex h-2 w-2">
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
				<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
			</span>

			{/* ETA label */}
			<span className="text-xs text-muted-foreground">
				Est. {result.label} remaining
			</span>

			{/* Progress bar */}
			<div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-green-500 transition-all duration-1000"
					style={{ width: `${Math.min(result.percent, 100)}%` }}
				/>
			</div>
		</div>
	)
}

function formatSimpleDuration(seconds: number): string {
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
