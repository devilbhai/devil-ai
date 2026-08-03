/**
 * Session Replay atoms — time-travel debugging for agent sessions.
 * Allows playing back the entire session like a video.
 */
import { atom } from "jotai"

export type ReplaySpeed = "0.5x" | "1x" | "2x" | "4x" | "instant"

export interface ReplayState {
	/** Whether replay mode is active */
	active: boolean
	/** Current message index in the replay */
	currentIndex: number
	/** Total messages in the session */
	totalMessages: number
	/** Playback speed */
	speed: ReplaySpeed
	/** Whether currently playing */
	playing: boolean
	/** Timestamps for each message */
	timestamps: number[]
}

export const replayStateAtom = atom<ReplayState>({
	active: false,
	currentIndex: 0,
	totalMessages: 0,
	speed: "1x",
	playing: false,
	timestamps: [],
})

export const replayActiveAtom = atom((get) => get(replayStateAtom).active)
export const replayProgressAtom = atom((get) => {
	const { currentIndex, totalMessages } = get(replayStateAtom)
	if (!totalMessages) return 0
	return (currentIndex / totalMessages) * 100
})

export const startReplayAtom = atom(null, (_get, set, totalMessages: number) => {
	set(replayStateAtom, {
		active: true,
		currentIndex: 0,
		totalMessages,
		speed: "1x",
		playing: true,
		timestamps: [],
	})
})

export const stopReplayAtom = atom(null, (_get, set) => {
	set(replayStateAtom, {
		active: false,
		currentIndex: 0,
		totalMessages: 0,
		speed: "1x",
		playing: false,
		timestamps: [],
	})
})

export const setReplayIndexAtom = atom(
	null,
	(_get, set, index: number) => {
		set(replayStateAtom, (prev) => ({
			...prev,
			currentIndex: Math.max(0, Math.min(index, prev.totalMessages)),
		}))
	},
)

export const toggleReplayPlayAtom = atom(null, (_get, set) => {
	set(replayStateAtom, (prev) => ({
		...prev,
		playing: !prev.playing,
	}))
})

export const setReplaySpeedAtom = atom(
	null,
	(_get, set, speed: ReplaySpeed) => {
		set(replayStateAtom, (prev) => ({ ...prev, speed }))
	},
)
