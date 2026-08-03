/**
 * Session Replay Controls — time-travel debugging interface.
 */
import { useAtomValue, useSetAtom } from "jotai"
import { useEffect, useRef } from "react"
import {
	replayActiveAtom,
	replayStateAtom,
	setReplayIndexAtom,
	setReplaySpeedAtom,
	startReplayAtom,
	stopReplayAtom,
	toggleReplayPlayAtom,
	type ReplaySpeed,
} from "../../atoms/session-replay"
import { Button } from "@devil-ai/ui/components/button"

const SPEED_OPTIONS: ReplaySpeed[] = ["0.5x", "1x", "2x", "4x", "instant"]

export function ReplayControls({ totalMessages }: { totalMessages: number }) {
	const state = useAtomValue(replayStateAtom)
	const active = useAtomValue(replayActiveAtom)

	const startReplay = useSetAtom(startReplayAtom)
	const stopReplay = useSetAtom(stopReplayAtom)
	const setIndex = useSetAtom(setReplayIndexAtom)
	const togglePlay = useSetAtom(toggleReplayPlayAtom)
	const setSpeed = useSetAtom(setReplaySpeedAtom)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	// Auto-advance when playing
	useEffect(() => {
		if (!state.playing || !active) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
			return
		}

		const speedMs =
			state.speed === "instant"
				? 0
				: state.speed === "4x"
					? 125
					: state.speed === "2x"
						? 250
						: state.speed === "1x"
							? 500
							: 1000

		intervalRef.current = setInterval(() => {
			setIndex(state.currentIndex + 1)
		}, speedMs)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [state.playing, state.speed, state.currentIndex, active, setIndex])

	// Stop when reaching end
	useEffect(() => {
		if (state.currentIndex >= state.totalMessages && state.playing) {
			stopReplay()
		}
	}, [state.currentIndex, state.totalMessages, state.playing, stopReplay])

	if (!active) {
		return (
			<Button
				variant="outline"
				size="sm"
				onClick={() => startReplay(totalMessages)}
			>
				▶ Replay Session
			</Button>
		)
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
			{/* Play/Pause */}
			<Button variant="ghost" size="sm" onClick={togglePlay} aria-label={state.playing ? "Pause" : "Play"}>
				{state.playing ? "⏸" : "▶"}
			</Button>

			{/* Timeline slider */}
			<input
				type="range"
				min={0}
				max={state.totalMessages}
				value={state.currentIndex}
				onChange={(e) => setIndex(Number.parseInt(e.target.value))}
				className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
			/>

			{/* Message counter */}
			<span className="font-mono text-xs text-muted-foreground">
				{state.currentIndex}/{state.totalMessages}
			</span>

			{/* Speed selector */}
			<div className="flex gap-1">
				{SPEED_OPTIONS.map((speed) => (
					<button
						key={speed}
						type="button"
						onClick={() => setSpeed(speed)}
						className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
							state.speed === speed
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{speed}
					</button>
				))}
			</div>

			{/* Stop */}
			<Button variant="ghost" size="sm" onClick={stopReplay}>
				✕
			</Button>
		</div>
	)
}
