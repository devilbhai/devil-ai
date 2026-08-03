/**
 * DevilRoute session-token auto-refresher.
 *
 * The local gateway (http://127.0.0.1:20128) stores provider connections in its
 * own SQLite DB. "Session token" providers fall into two camps:
 *
 *   1. OAuth connections  (`authType === "oauth"`) — carry a `refresh_token` and
 *      CAN be refreshed programmatically via `POST /api/providers/{id}/refresh`
 *      (the gateway exchanges the refresh token for a fresh access token).
 *   2. Cookie / web-session providers (`authType === "cookie"`, e.g. chatgpt-web,
 *      gemini-web, zai, huggingface…) — a pasted browser cookie. The gateway
 *      rejects manual refresh for these (there is no server-side refresh), so we
 *      monitor them and notify the user when one expires so they can re-paste.
 *
 * This module logs into the gateway's admin API (password-only, stored via the
 * safeStorage credential store under "devilroute-admin"), lists providers once,
 * refreshes the OAuth ones, and tracks expiry transitions for the cookie ones.
 *
 * Scheduling: once at app start, then every 2h via an unref'd timer — a couple of
 * localhost HTTP calls, negligible load on any OS. No password configured → the
 * refresher is a no-op (the feature is disabled, never silently broken).
 */

import { BrowserWindow } from "electron"
import { getCredential } from "./credential-store"
import { DEVILROUTE_BASE_URL, isDevilRouteHealthy } from "./devilroute-manager"
import { createLogger } from "./logger"

const log = createLogger("devilroute-token-refresher")

// ============================================================
// Constants
// ============================================================

/** Credential-store key under which the gateway admin password lives. */
export const DEVILROUTE_ADMIN_CRED_ID = "devilroute-admin"

/** Re-scan cadence (user asked for every 2 hours). */
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000

/** Login JWT is valid 30 days server-side; re-login early (25d) to be safe. */
const LOGIN_TTL_MS = 25 * 24 * 60 * 60 * 1000

/** Timeouts — a hang here must never hold up the app. */
const LOGIN_TIMEOUT_MS = 8_000
const API_TIMEOUT_MS = 15_000

// ============================================================
// Types
// ============================================================

interface ProviderConnection {
	id: string
	provider: string
	authType: string
	displayName?: string
	testStatus?: string
	lastError?: string
}

export interface TokenProblem {
	id: string
	state: "expired" | "needsReauth"
	provider: string
	displayName: string
}

export interface TokenRefreshSummary {
	/** Non-API-key connections examined. */
	scanned: number
	/** OAuth connections actually refreshed. */
	refreshed: number
	/** Connections where refresh/test threw or returned a hard error. */
	failed: number
	/** OAuth connections whose refresh token is dead — user must re-auth. */
	needsReauth: TokenProblem[]
	/** Cookie/session connections currently expired — user must re-paste. */
	expired: TokenProblem[]
	checkedAt: string
}

// ============================================================
// State
// ============================================================

let cachedJwt: string | null = null
let cachedJwtExpiry = 0
let timer: ReturnType<typeof setInterval> | null = null
let cycleRunning = false
let lastSummary: TokenRefreshSummary | null = null

/** provider id -> problem state, for transition-only notifications. */
const lastProblemState = new Map<string, string>()

const EMPTY_SUMMARY = (): TokenRefreshSummary => ({
	scanned: 0,
	refreshed: 0,
	failed: 0,
	needsReauth: [],
	expired: [],
	checkedAt: new Date().toISOString(),
})

// ============================================================
// Auth — password-only login, JWT cached in memory
// ============================================================

/** Parse the `auth_token=<jwt>` value out of a Set-Cookie header. */
function parseAuthToken(setCookie: string): string | null {
	const match = setCookie.match(/(?:^|;\s*)auth_token=([^;]+)/)
	return match ? match[1] : null
}

/** Log in with the stored admin password; cache the JWT on success. */
async function loginToGateway(): Promise<string | null> {
	const password = getCredential(DEVILROUTE_ADMIN_CRED_ID)
	if (!password) {
		log.debug("No gateway admin password configured — refresher disabled")
		return null
	}
	try {
		const res = await fetch(`${DEVILROUTE_BASE_URL}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password }),
			signal: AbortSignal.timeout(LOGIN_TIMEOUT_MS),
		})
		if (!res.ok) {
			log.warn("Gateway login rejected", { status: res.status })
			return null
		}
		// Node's fetch does not persist cookies — grab the JWT from the header.
		const setCookie =
			(typeof res.headers.getSetCookie === "function"
				? (res.headers.getSetCookie() ?? [])
				: [res.headers.get("set-cookie") ?? ""]
			).find((c) => c.startsWith("auth_token=")) ?? res.headers.get("set-cookie") ?? ""
		const jwt = parseAuthToken(setCookie)
		if (jwt) {
			cachedJwt = jwt
			cachedJwtExpiry = Date.now() + LOGIN_TTL_MS
			log.info("Gateway admin session established")
		}
		return jwt
	} catch (err) {
		log.warn("Gateway login failed", err)
		return null
	}
}

/** Return a cached (still-valid) JWT, or log in fresh. */
async function ensureJwt(): Promise<string | null> {
	if (cachedJwt && Date.now() < cachedJwtExpiry) return cachedJwt
	cachedJwt = null
	return loginToGateway()
}

/** GET/POST a gateway admin API path with the auth cookie. Re-logins once on 401/403. */
async function gatewayFetch(path: string, init?: RequestInit): Promise<Response> {
	let jwt = await ensureJwt()
	const call = (token: string) =>
		fetch(`${DEVILROUTE_BASE_URL}${path}`, {
			...init,
			headers: {
				...(init?.headers ?? {}),
				Cookie: `auth_token=${token}`,
			},
			signal: AbortSignal.timeout(API_TIMEOUT_MS),
		})
	if (!jwt) throw new Error("No gateway admin session available")
	let res = await call(jwt)
	if ((res.status === 401 || res.status === 403) && init?.method !== "POST") {
		// JWT expired server-side — one re-login attempt for safe requests.
		cachedJwt = null
		jwt = await loginToGateway()
		if (jwt) res = await call(jwt)
	}
	return res
}

// ============================================================
// Core — scan providers, refresh OAuth, monitor cookie expiry
// ============================================================

/**
 * Run one scan against the gateway.
 * Skips quietly when the gateway is down or no admin password is configured.
 */
export async function refreshSessionTokens(): Promise<TokenRefreshSummary> {
	// Gateway not up (or not installed yet) → nothing to do, no error UI.
	if (!(await isDevilRouteHealthy())) {
		log.debug("Gateway not healthy, skipping token refresh")
		return EMPTY_SUMMARY()
	}

	const jwt = await ensureJwt()
	if (!jwt) {
		log.debug("No gateway admin session, skipping token refresh")
		return EMPTY_SUMMARY()
	}

	// List providers and keep only session-token style ones (skip permanent api keys).
	let connections: ProviderConnection[] = []
	try {
		const res = await gatewayFetch("/api/providers")
		if (!res.ok) {
			log.warn("Failed to list providers", { status: res.status })
			return EMPTY_SUMMARY()
		}
		const data = (await res.json()) as { connections?: ProviderConnection[] }
		connections = (data.connections ?? []).filter(
			(c) => c.authType && c.authType !== "apikey",
		)
	} catch (err) {
		log.warn("Failed to list gateway providers", err)
		return EMPTY_SUMMARY()
	}

	const summary = EMPTY_SUMMARY()
	summary.scanned = connections.length

	for (const conn of connections) {
		const label = conn.displayName || conn.provider
		try {
			const res = await gatewayFetch(
				`/api/providers/${encodeURIComponent(conn.id)}/refresh`,
				{ method: "POST", headers: { "Content-Type": "application/json" } },
			)
			const body = (await res.json().catch(() => ({}))) as Record<string, unknown>

			if (res.ok && body.success) {
				// OAuth refresh worked.
				summary.refreshed++
				clearProblem(conn.id)
				continue
			}
			if (res.status === 401 && body.requiresReauth) {
				// OAuth refresh token is dead — needs a manual re-auth.
				summary.needsReauth.push(toProblem(conn, "needsReauth"))
				continue
			}
			// 400 "Only OAuth connections support manual token refresh" →
			// cookie/session provider. Re-validate to catch expiry.
			await assessCookieProvider(conn, summary)
		} catch (err) {
			log.warn("Token refresh error for provider", { id: conn.id, label }, err)
			summary.failed++
		}
	}

	summary.checkedAt = new Date().toISOString()
	lastSummary = summary
	log.info("Gateway token refresh complete", {
		scanned: summary.scanned,
		refreshed: summary.refreshed,
		expired: summary.expired.length,
		needsReauth: summary.needsReauth.length,
	})
	return summary
}

/** Re-validate a non-OAuth connection and flag it if the session is expired. */
async function assessCookieProvider(
	conn: ProviderConnection,
	summary: TokenRefreshSummary,
): Promise<void> {
	const label = conn.displayName || conn.provider
	let expired = conn.testStatus === "expired" || conn.testStatus === "invalid"

	try {
		const res = await gatewayFetch(
			`/api/providers/${encodeURIComponent(conn.id)}/test`,
			{ method: "POST", headers: { "Content-Type": "application/json" } },
		)
		const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
		if (body.valid === false && body.error !== "Provider test not supported") {
			expired = true
		} else if (body.valid === true) {
			expired = false
		}
	} catch (err) {
		log.debug("Provider re-test failed (using stored status)", { id: conn.id, label }, err)
	}

	if (expired) {
		summary.expired.push(toProblem(conn, "expired"))
	} else {
		clearProblem(conn.id)
	}
}

function toProblem(conn: ProviderConnection, state: TokenProblem["state"]): TokenProblem {
	return {
		id: conn.id,
		state,
		provider: conn.provider,
		displayName: conn.displayName || conn.provider,
	}
}

function clearProblem(id: string): void {
	lastProblemState.delete(id)
}

// ============================================================
// Notifications — transition-only, emitted to the renderer
// ============================================================

/**
 * Push a status update to the renderer only when a provider transitions into a
 * problem state (or resolves) — so the user isn't nagged every 2h.
 */
function emitTokenStatus(summary: TokenRefreshSummary): void {
	const current = new Map<string, string>()
	for (const p of summary.expired) current.set(p.id, p.state)
	for (const p of summary.needsReauth) current.set(p.id, p.state)

	// New problems (state changed or never seen) get surfaced.
	const newProblems: TokenProblem[] = []
	for (const [id, state] of current) {
		if (lastProblemState.get(id) !== state) {
			const source = [...summary.expired, ...summary.needsReauth].find((p) => p.id === id)
			if (source) newProblems.push(source)
			lastProblemState.set(id, state)
		}
	}
	// Providers that recovered are removed from the watch list.
	for (const [id] of lastProblemState) {
		if (!current.has(id)) lastProblemState.delete(id)
	}

	if (newProblems.length === 0) return

	const payload = { summary, newProblems }
	for (const win of BrowserWindow.getAllWindows()) {
		win.webContents.send("devilroute:token-status", payload)
	}
}

// ============================================================
// Lifecycle
// ============================================================

/** Run one scan now (used by the 2h interval and the manual "Refresh now" button). */
export async function runTokenRefresh(): Promise<TokenRefreshSummary> {
	if (cycleRunning) return lastSummary ?? EMPTY_SUMMARY()
	cycleRunning = true
	try {
		const summary = await refreshSessionTokens()
		emitTokenStatus(summary)
		return summary
	} finally {
		cycleRunning = false
	}
}

/** Start the refresher: one immediate scan, then every 2h. Idempotent. */
export function startDevilRouteTokenRefresher(): void {
	if (timer) return
	runTokenRefresh().catch((err) => log.warn("Initial token refresh failed", err))
	timer = setInterval(() => {
		runTokenRefresh().catch((err) => log.warn("Scheduled token refresh failed", err))
	}, REFRESH_INTERVAL_MS)
	timer.unref?.()
	log.info("DevilRoute token refresher started", { intervalMs: REFRESH_INTERVAL_MS })
}

/** Stop the refresher. Idempotent — safe for app quit. */
export function stopDevilRouteTokenRefresher(): void {
	if (timer) {
		clearInterval(timer)
		timer = null
	}
	log.debug("DevilRoute token refresher stopped")
}

/** Status snapshot for the Settings UI. */
export function getDevilRouteTokenStatus(): {
	configured: boolean
	lastSummary: TokenRefreshSummary | null
} {
	return {
		configured: getCredential(DEVILROUTE_ADMIN_CRED_ID) !== null,
		lastSummary,
	}
}

/** Drop any cached session so the next cycle logs in with fresh credentials. */
export function invalidateGatewaySession(): void {
	cachedJwt = null
	cachedJwtExpiry = 0
}
