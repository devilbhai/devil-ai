import { appStore } from "../store"
import { sessionFamily, sessionIdsAtom, setSessionErrorAtom, setSessionStatusAtom } from "../sessions"

// ============================================================
// Constants
// ============================================================

/** How often to check for stuck sessions (ms) */
const WATCHDOG_INTERVAL_MS = 10_000

/** How long a session can be "busy" without any event before we consider it stuck (ms) */
const STALE_BUSY_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes

// ============================================================
// Stuck Session Watchdog
// ============================================================

/**
 * Detects sessions that have been in "busy" state for too long without
 * receiving any status updates. This can happen when:
 * - The SSE connection drops while a session is processing
 * - The model hits a rate limit and the server doesn't send a retry event
 * - The server crashes mid-request
 *
 * Uses `lastActiveAt` from the session entry to determine staleness.
 * When a stuck session is detected, we:
 * 1. Set an error on the session with a descriptive message
 * 2. Reset the session status to "idle" so the user can retry
 */
function checkForStuckSessions() {
	const now = Date.now()

	try {
		const sessionIds = appStore.get(sessionIdsAtom)
		if (!sessionIds) return

		for (const sessionId of sessionIds) {
			const entry = appStore.get(sessionFamily(sessionId))
			if (!entry) continue

			const { status, error } = entry

			// Only check busy sessions
			if (status.type !== "busy") continue

			// If we already have an error, skip (user already knows)
			if (error) continue

			// Use lastActiveAt to detect staleness — this is updated by the
			// event processor whenever any event arrives for this session.
			const staleDuration = now - entry.session.time.updated

			if (staleDuration > STALE_BUSY_THRESHOLD_MS) {
				console.warn(
					`[Watchdog] Session ${sessionId} stuck for ${Math.round(staleDuration / 1000)}s, resetting`,
				)

				appStore.set(setSessionErrorAtom, {
					sessionId,
					error: {
						name: "StuckSession",
						data: {
							message:
								"Session appears stuck — no response received. This can happen if the connection was lost or the model hit a rate limit. Please try again.",
						},
					},
				})

				appStore.set(setSessionStatusAtom, {
					sessionId,
					status: { type: "idle" },
				})
			}
		}
	} catch (err) {
		console.error("[Watchdog] Error checking for stuck sessions:", err)
	}
}

// ============================================================
// Watchdog Lifecycle
// ============================================================

let watchdogInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start the stuck session watchdog.
 * Safe to call multiple times — only one watchdog runs at a time.
 */
export function startStuckSessionWatchdog() {
	if (watchdogInterval) return
	console.log("[Watchdog] Starting stuck session watchdog")
	watchdogInterval = setInterval(checkForStuckSessions, WATCHDOG_INTERVAL_MS)
	checkForStuckSessions()
}

/**
 * Stop the stuck session watchdog.
 */
export function stopStuckSessionWatchdog() {
	if (watchdogInterval) {
		console.log("[Watchdog] Stopping stuck session watchdog")
		clearInterval(watchdogInterval)
		watchdogInterval = null
	}
}
