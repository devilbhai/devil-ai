import React, {
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from "react"
import { useStickToBottomContext } from "@devil-ai/ui/components/ai-elements/conversation"
import { ArrowUpToLineIcon } from "lucide-react"

/**
 * Custom hook to manage auto-scroll behavior with user interaction detection.
 * - Auto-scrolls to bottom when new messages arrive (if user is at bottom)
 * - Stops auto-scroll when user manually scrolls up
 * - Resumes auto-scroll when user scrolls back to bottom
 * - Smooth scrolling with configurable easing
 */
export function useAutoScroll(options: {
	enabled?: boolean
	threshold?: number
	smoothDuration?: number
} = {}) {
	const {
		enabled = true,
		threshold = 100, // px from bottom to consider "at bottom"
		smoothDuration = 300,
	} = options

	const {
		scrollRef,
		scrollToBottom: stickToBottomScroll,
		isAtBottom: stickIsAtBottom,
	} = useStickToBottomContext()

	const [userScrolledAway, setUserScrolledAway] = useState(false)
	const [isAtBottom, setIsAtBottom] = useState(true)
	const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const rafRef = useRef<number | null>(null)

	// Smooth scroll with easing (similar to ChatGPT/Codex)
	const smoothScrollTo = useCallback(
		(targetY: number, duration = smoothDuration) => {
			const element = scrollRef.current
			if (!element) return

			const startY = element.scrollTop
			const distance = targetY - startY
			const startTime = performance.now()

			const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

			const animate = (currentTime: number) => {
				const elapsed = currentTime - startTime
				const progress = Math.min(elapsed / duration, 1)
				const eased = easeOutCubic(progress)
				element.scrollTop = startY + distance * eased

				if (progress < 1) {
					rafRef.current = requestAnimationFrame(animate)
				}
			}

			if (rafRef.current) cancelAnimationFrame(rafRef.current)
			rafRef.current = requestAnimationFrame(animate)
		},
		[scrollRef, smoothDuration]
	)

	// Check if user is at bottom
	const checkScrollPosition = useCallback(() => {
		const element = scrollRef.current
		if (!element) return

		const { scrollTop, scrollHeight, clientHeight } = element
		const atBottom = scrollHeight - scrollTop - clientHeight <= threshold
		setIsAtBottom(atBottom)

		if (!atBottom && !userScrolledAway) {
			setUserScrolledAway(true)
		} else if (atBottom && userScrolledAway) {
			setUserScrolledAway(false)
		}
	}, [scrollRef, threshold, userScrolledAway])

	// Listen to scroll events to detect user interaction
	useEffect(() => {
		const element = scrollRef.current
		if (!element) return

		const handleScroll = () => {
			// Debounce scroll check
			if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
			scrollTimeoutRef.current = setTimeout(checkScrollPosition, 16) // ~60fps
		}

		element.addEventListener("scroll", handleScroll, { passive: true })
		return () => {
			element.removeEventListener("scroll", handleScroll)
			if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
		}
	}, [scrollRef, checkScrollPosition])

	// Auto-scroll to bottom when new content arrives (if enabled and user is at bottom)
	const scrollToBottom = useCallback(
		(behavior?: "instant" | "smooth") => {
			if (!enabled) return

			const element = scrollRef.current
			if (!element) return

			if (behavior === "instant" || !userScrolledAway) {
				if (behavior === "instant") {
					element.scrollTop = element.scrollHeight
				} else {
					smoothScrollTo(element.scrollHeight)
				}
			}
		},
		[enabled, scrollRef, userScrolledAway, smoothScrollTo]
	)

	// Scroll to specific position
	const scrollToPosition = useCallback(
		(top: number) => {
			const element = scrollRef.current
			if (!element) return
			smoothScrollTo(top)
		},
		[scrollRef, smoothScrollTo]
	)

	// Get scroll height
	const getScrollHeight = useCallback(() => {
		return scrollRef.current?.scrollHeight ?? 0
	}, [scrollRef])

	// Expose scroll state
	const isUserAtBottom = isAtBottom && !userScrolledAway

	return {
		scrollToBottom,
		scrollToPosition,
		getScrollHeight,
		isAtBottom: isUserAtBottom,
		userScrolledAway,
		stickToBottomScroll, // Direct access to library's scroll if needed
		stickIsAtBottom,
	}
}

export function ScrollOnLoad({ loading, sessionId }: { loading: boolean; sessionId: string }) {
	const { scrollToBottom } = useStickToBottomContext()
	const prevLoadingRef = useRef(loading)
	const prevSessionRef = useRef(sessionId)

	useLayoutEffect(() => {
		const wasLoading = prevLoadingRef.current
		const sessionChanged = prevSessionRef.current !== sessionId
		prevLoadingRef.current = loading
		prevSessionRef.current = sessionId

		if ((wasLoading && !loading) || (sessionChanged && !loading)) {
			scrollToBottom("instant")
		}
	}, [loading, sessionId, scrollToBottom])

	return null
}

export interface ScrollHandle {
	scrollToBottom: (behavior?: "instant" | "smooth") => void
	forceScrollToBottom: () => void
	getScrollHeight: () => number
	scrollToPosition: (top: number) => void
}

export function ScrollBridge({ scrollRef }: { scrollRef: React.RefObject<ScrollHandle | null> }) {
	const { scrollToBottom, getScrollHeight, scrollToPosition } = useAutoScroll({ smoothDuration: 300 })

	useImperativeHandle(
		scrollRef,
		() => ({
			scrollToBottom: (behavior?: "instant" | "smooth") => {
				scrollToBottom(behavior ?? "smooth")
			},
			forceScrollToBottom: () => {
				const el = document.querySelector("[data-conversation-content]")?.parentElement
				if (el) {
					el.scrollTop = el.scrollHeight
				}
			},
			getScrollHeight,
			scrollToPosition,
		}),
		[scrollToBottom, getScrollHeight, scrollToPosition],
	)
	return null
}

export function ScrollToResponseStart({
	isWorking,
	scrollRef,
}: {
	isWorking: boolean
	scrollRef: React.RefObject<ScrollHandle | null>
}) {
	const [visible, setVisible] = useState(false)
	const prevWorkingRef = useRef(isWorking)
	const savedScrollTopRef = useRef(0)

	useEffect(() => {
		const wasWorking = prevWorkingRef.current
		prevWorkingRef.current = isWorking

		if (!wasWorking && isWorking) {
			const handle = scrollRef.current
			if (handle) {
				savedScrollTopRef.current = Math.max(0, handle.getScrollHeight() - 80)
			}
		}

		if (wasWorking && !isWorking) {
			setVisible(true)
		}

		if (isWorking) {
			setVisible(false)
		}
	}, [isWorking, scrollRef])

	useEffect(() => {
		if (!visible) return
		const timer = setTimeout(() => setVisible(false), 8000)
		return () => clearTimeout(timer)
	}, [visible])

	const handleClick = useCallback(() => {
		scrollRef.current?.scrollToPosition(savedScrollTopRef.current)
		setVisible(false)
	}, [scrollRef])

	if (!visible) return null

	return (
		<button
			type="button"
			onClick={handleClick}
			className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-md transition-colors hover:bg-muted hover:text-foreground"
		>
			<ArrowUpToLineIcon className="size-3" />
			<span>Jump to start of response</span>
		</button>
	)
}
