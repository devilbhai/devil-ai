/**
 * Full-screen overlay shown during initial app startup.
 *
 * Two-layer splash architecture:
 * 1. The HTML-level splash (`#splash` in index.html) renders instantly before
 *    any JS loads, blocking interaction with half-loaded UI.
 * 2. This React component mounts and immediately hides the HTML splash,
 *    taking over seamlessly. Uses `bg-background` so the liquid glass /
 *    vibrancy of the native window chrome shows through.
 *
 * Fades out once discovery reaches the "ready" phase, then unmounts after
 * the CSS transition completes.
 */

import { useAtomValue } from "jotai"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@devil-ai/ui/components/button"
import { RefreshCwIcon } from "lucide-react"
import type { DiscoveryPhase } from "../atoms/discovery"
import { discoveryAtom, discoveryPhaseAtom } from "../atoms/discovery"
import { serverConnectedAtom } from "../atoms/connection"
import { appStore } from "../atoms/store"
import { resetDiscoveryGuard } from "../hooks/use-discovery"
import { DevilAiWordmark } from "./devil-ai-wordmark"

// ============================================================
// Constants
// ============================================================

const FADE_DURATION_MS = 400

const PHASE_LABELS: Record<DiscoveryPhase, string> = {
	idle: "Initializing...",
	"starting-server": "Starting server...",
	connecting: "Connecting...",
	"loading-projects": "Loading projects...",
	"loading-sessions": "Loading sessions...",
	ready: "",
	error: "Connection failed",
}

// ============================================================
// Component
// ============================================================

type OverlayState = "visible" | "fading" | "unmounted"

export function StartupOverlay() {
	const phase = useAtomValue(discoveryPhaseAtom)
	const isConnected = useAtomValue(serverConnectedAtom)

	const initialPhaseRef = useRef(phase)
	const [state, setState] = useState<OverlayState>(
		initialPhaseRef.current === "ready" ? "unmounted" : "visible",
	)

	const skipOverlay = initialPhaseRef.current === "ready"
	useEffect(() => {
		const splash = document.getElementById("splash")
		if (!splash) return

		if (skipOverlay) {
			splash.classList.add("hiding")
			setTimeout(() => splash.remove(), 300)
		} else {
			splash.remove()
		}
	}, [skipOverlay])

	useEffect(() => {
		if (phase !== "ready") {
			// If we were fading/unmounted but phase changed back (e.g. retry), become visible again
			if (state !== "visible") setState("visible")
			return
		}
		setState("fading")
	}, [phase, state])

	useEffect(() => {
		if (state !== "fading") return
		const timer = setTimeout(() => setState("unmounted"), FADE_DURATION_MS)
		return () => clearTimeout(timer)
	}, [state])

	// Auto-recover if background SSE loop reconnects while we're showing the error
	const handleRetry = useCallback(() => {
		resetDiscoveryGuard()
		appStore.set(discoveryAtom, (prev) => ({
			...prev,
			loaded: false,
			loading: false,
			phase: "idle"
		}))
	}, [])

	useEffect(() => {
		if (phase === "error") {
			if (isConnected) {
				handleRetry()
				return
			}
			
			// Auto-retry in the background every 3 seconds.
			// This handles the case where the user starts the engine from their terminal
			// or if it recovers on its own, clearing the "Start engine to continue" screen.
			const timer = setInterval(() => {
				handleRetry()
			}, 3000)
			return () => clearInterval(timer)
		}
	}, [phase, isConnected, handleRetry])

	if (state === "unmounted") return null

	const isVisible = state === "visible"
	const statusText = PHASE_LABELS[phase] ?? ""

	return (
		<div
			data-slot="startup-overlay"
			className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}
			style={{
				transitionDuration: `${FADE_DURATION_MS}ms`,
				transitionTimingFunction: "ease-out",
				pointerEvents: isVisible ? "auto" : "none",
			}}
		>
			<DevilAiWordmark className="h-5 w-auto text-foreground" />

			<div className="mt-6 flex h-14 flex-col items-center justify-center gap-3">
				{phase !== "error" && isVisible && (
					<div className="flex items-center gap-1.5">
						<span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
						<span
							className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40"
							style={{ animationDelay: "150ms" }}
						/>
						<span
							className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40"
							style={{ animationDelay: "300ms" }}
						/>
					</div>
				)}

				{phase === "error" && (
					<Button size="sm" variant="outline" onClick={handleRetry} className="gap-2">
						<RefreshCwIcon className="size-3.5" />
						Start engine to continue
					</Button>
				)}

				{statusText && phase !== "error" && (
					<p className="text-xs text-muted-foreground/60">
						{statusText}
					</p>
				)}
			</div>
		</div>
	)
}
