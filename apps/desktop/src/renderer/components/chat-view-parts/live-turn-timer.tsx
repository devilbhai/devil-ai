import { useCallback, useEffect, useState } from "react"
import { formatWorkDuration } from "../../lib/session-metrics"

/**
 * Premium live timer displayed in the submit button while a turn is active.
 *
 * Design: animated pulsing dot + elapsed time inside a subtle pill.
 * The parent button switches to "ghost" variant so this component's
 * background is fully visible. Adapts to light/dark via utility classes.
 */
export function LiveTurnTimer({
	completedMs,
	activeStartMs,
}: {
	completedMs: number
	activeStartMs: number | null
}) {
	const computeDisplay = useCallback(
		() =>
			formatWorkDuration(completedMs + (activeStartMs != null ? Date.now() - activeStartMs : 0)),
		[completedMs, activeStartMs],
	)

	const [elapsed, setElapsed] = useState(computeDisplay)

	useEffect(() => {
		const tick = () => setElapsed(computeDisplay())
		tick()
		if (activeStartMs != null) {
			const id = setInterval(tick, 1_000)
			return () => clearInterval(id)
		}
	}, [computeDisplay, activeStartMs])

	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 tabular-nums dark:border-red-400/30 dark:bg-red-400/10">
			{/* Animated pulsing skull */}
			<span className="relative flex size-[6px]">
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-50 dark:bg-red-400" />
				<span className="relative inline-flex size-[6px] rounded-full bg-red-600 dark:bg-red-400" />
			</span>
			{/* Elapsed time */}
			<span className="text-[11px] font-semibold tracking-tight text-red-700 dark:text-red-300">
				{elapsed}
			</span>
		</span>
	)
}
