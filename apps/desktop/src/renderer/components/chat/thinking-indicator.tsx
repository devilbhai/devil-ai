/**
 * ThinkingIndicator — Claude Code CLI-style Braille dots spinner.
 *
 * The canonical terminal spinner: six dots in a 2×3 Braille grid cycling the
 * classic cli-spinners "dots" frames (⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏). The ⠼ frame —
 * five of six dots lit — reads as a "G"; it holds ~400 ms each cycle so the
 * shape is clearly visible instead of flashing past.
 *
 * Status wording is phase-driven, not a random loop:
 *   - warmup (model booting, no activity yet) → Warming up, Vibing, Swooping…
 *   - thinking (reasoning streaming)          → Thinking, Contemplating…
 *   - tool status ("Reading package.json")    → shown verbatim
 * Each phase cycles its own short word list once per second, so wording
 * follows the agent's real state instead of spinning through every word.
 *
 * Drawn with CSS dots (2 columns × 3 rows), not Unicode glyphs, so it scales
 * crisply and never depends on the font rendering Braille. Unlit dots stay as
 * a faint ghost grid so the 3-row structure stays visible while dots travel.
 *
 * Craft rules:
 *   - 6 fixed positions, lit/unlit per frame; soft 60 ms fade between frames
 *   - 80 ms/frame, but the ⠼/"G" frame holds 400 ms (≈ once per 1.1 s)
 *   - word lists rotate every 1 s, restarting from the first word per phase
 *   - spinner is an essential status indicator, so it always animates
 *   - `prefers-reduced-motion` quiets only the decorative text effects
 *
 * `<ThinkingIndicator size="sm" label="Reading file" />`
 */

import { useEffect, useState } from "react"

interface ThinkingIndicatorProps {
	/** "md" for the main turn thinking state, "sm" for inline live-status rows */
	size?: "md" | "sm"
	/** Status text shown next to the spinner (no trailing ellipsis — it animates) */
	label: string
}

/**
 * Claude Code's playful status words, split by agent phase. Only the list for
 * the current phase cycles — the agent moves through phases in order, so the
 * wording steps along with it instead of shuffling everything together.
 */
const WARMUP_WORDS = ["Warming up", "Vibing", "Swooping", "Charging", "Manifesting"]
const THINKING_WORDS = ["Thinking", "Contemplating", "Pondering", "Brainstorming", "Reflecting", "Musing"]

const WORD_MS = 1000

/**
 * Braille dot frames — dot numbers 1–6 in a 2×3 grid:
 *
 *   1 4
 *   2 5
 *   3 6
 *
 * This is the classic cli-spinners `dots` sequence. Frame index 4 (⠼, dots
 * 2,3,4,5,6) is the fullest — a "G" read by the eye.
 */
const FRAMES: ReadonlyArray<readonly number[]> = [
	[1, 2, 4], // ⠋
	[1, 2, 4, 5], // ⠙
	[1, 2, 3, 4, 6], // ⠹
	[2, 3, 6], // ⠸
	[2, 3, 4, 5, 6], // ⠼ ← "G"
	[1, 3, 4, 5, 6], // ⠴
	[1, 3, 5, 6], // ⠦
	[1, 3, 4, 5], // ⠧
	[1, 4, 5], // ⠇
	[1, 2, 4], // ⠏
]

const G_INDEX = 4
const FRAME_MS = 80
/** How long to hold the ⠼/"G" frame so the shape is actually readable. */
const G_HOLD_MS = 400

const STYLES = `
/* ---- geometry (overridable per size) ---- */
.dt-braille { --dt-dot: 3px; --dt-gap: 2px;
  display: grid; grid-template-columns: repeat(2, var(--dt-dot));
  grid-template-rows: repeat(3, var(--dt-dot)); gap: var(--dt-gap);
  flex: none; color: currentColor; }
.dt-braille-sm { --dt-dot: 2.5px; --dt-gap: 1.5px; }

/* ---- dots: unlit = faint ghost grid, lit = full currentColor ---- */
.dt-braille-dot { width: var(--dt-dot); height: var(--dt-dot); border-radius: 50%;
  background: currentColor; opacity: .12; transition: opacity 60ms linear; }
.dt-braille-on { opacity: 1; }

/* ---- thinking words: subtle fade-in on each word change ---- */
.dt-fadein { animation: dt-fadein .25s ease-out; }
@keyframes dt-fadein { from { opacity: 0; transform: translateY(1px); } to { opacity: 1; transform: none; } }

/* ---- ellipsis: three dots pulsing in sequence (TTY cursor feel) ---- */
.dt-ellipsis { display: inline-flex; gap: 2px; padding-left: 3px; }
.dt-ellipsis i { width: 2.5px; height: 2.5px; border-radius: 50%; background: currentColor;
  animation: dt-blip 1.4s ease-in-out infinite; }
.dt-ellipsis i:nth-child(2) { animation-delay: .2s; }
.dt-ellipsis i:nth-child(3) { animation-delay: .4s; }
@keyframes dt-blip { 0%, 55%, 100% { opacity: .15; } 30% { opacity: 1; } }

/* ---- reduced motion: quiet the decorative text effects only ---- */
@media (prefers-reduced-motion: reduce) {
  .dt-fadein { animation: none; }
  .dt-ellipsis i { animation: none; opacity: .5; }
}
`

export function ThinkingIndicator({ size = "md", label }: ThinkingIndicatorProps) {
	const [frame, setFrame] = useState(0)
	const [word, setWord] = useState(0)

	// Phase → word list. Labels not in a phase are tool statuses, shown verbatim.
	const phase = label === "Warming up" ? "warmup" : label === "Thinking" ? "thinking" : null
	const words = phase === "warmup" ? WARMUP_WORDS : phase === "thinking" ? THINKING_WORDS : null
	const displayLabel = words ? words[word % words.length] : label
	const wordKey = words ? displayLabel : label

	const lit = FRAMES[frame]
	const gridClass = size === "sm" ? "dt-braille dt-braille-sm" : "dt-braille"

	// Spinner is an essential status indicator — always animate. Frames step at
	// 80 ms except the ⠼/"G" frame, which holds 400 ms so the shape reads.
	useEffect(() => {
		let cancelled = false
		let id: ReturnType<typeof setTimeout> | null = null
		const cursor = { frame: 0 }

		const tick = () => {
			if (cancelled) return
			cursor.frame = (cursor.frame + 1) % FRAMES.length
			setFrame(cursor.frame)
			id = setTimeout(tick, cursor.frame === G_INDEX ? G_HOLD_MS : FRAME_MS)
		}

		id = setTimeout(tick, FRAME_MS)
		return () => {
			cancelled = true
			if (id) clearTimeout(id)
		}
	}, [])

	// Word rotation — only for the current phase's list; restarts from the
	// first word so "Thinking" is the lead-in each time reasoning begins.
	useEffect(() => {
		if (!words) return
		setWord(0)
		const wordId = setInterval(() => setWord((w) => (w + 1) % words.length), WORD_MS)
		return () => clearInterval(wordId)
	}, [words])

	return (
		<div className="flex items-center gap-2 px-1 text-muted-foreground" role="status" aria-live="polite">
			<style>{STYLES}</style>
			<div className={gridClass} aria-hidden="true">
				{[1, 2, 3, 4, 5, 6].map((dot) => (
					<span key={dot} className={`dt-braille-dot${lit.includes(dot) ? " dt-braille-on" : ""}`} />
				))}
			</div>
			<span className="text-xs font-medium">
				<span key={wordKey} className="dt-fadein">
					{displayLabel}
				</span>
				<span className="dt-ellipsis" aria-hidden="true">
					<i />
					<i />
					<i />
				</span>
			</span>
		</div>
	)
}
