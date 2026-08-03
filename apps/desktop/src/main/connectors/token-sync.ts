/**
 * Token Sync Service
 *
 * Syncs OAuth tokens from admin panel server to local SQLite DB.
 * Makes tokens available to native connector tools for API calls.
 */

import { eq, and } from "drizzle-orm"
import { connectorTokens } from "../memory/schema"
import { ensureDb } from "../automation/database"
import { randomUUID } from "node:crypto"
import { getConnectorCredential, setConnectorCredential } from "../services/connector-manager"
import { restartServer } from "../opencode-manager"

// ============================================================
// Types
// ============================================================

export interface ConnectorToken {
	id: string
	userEmail: string
	connectorId: string
	accessToken: string | null
	refreshToken: string | null
	expiresAt: number | null
	scope: string | null
	metadata: string | null
	lastSyncedAt: number
	isActive: number
	createdAt: number
	updatedAt: number
}

export interface ServerConnectorStatus {
	connectorId: string
	connected: boolean
	accessToken?: string
	refreshToken?: string
	expiresAt?: number
	scope?: string
	email?: string
}

// ============================================================
// Constants
// ============================================================

const SERVER_BASE_URL = "https://devil-ai.agribee.in"
const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000 // 5 minutes before expiry

// ============================================================
// Token Sync Service
// ============================================================

let syncInterval: ReturnType<typeof setInterval> | null = null
let isSyncing = false

/**
 * Get all connector tokens for a user from local DB
 */
export async function getConnectorTokens(userEmail: string): Promise<ConnectorToken[]> {
	const db = await ensureDb()
	return db
		.select()
		.from(connectorTokens)
		.where(
			and(
				eq(connectorTokens.userEmail, userEmail),
				eq(connectorTokens.isActive, 1),
			),
		)
		.all()
}

/**
 * Get a specific connector token for a user
 */
export async function getConnectorToken(
	userEmail: string,
	connectorId: string,
): Promise<ConnectorToken | undefined> {
	const db = await ensureDb()
	return db
		.select()
		.from(connectorTokens)
		.where(
			and(
				eq(connectorTokens.userEmail, userEmail),
				eq(connectorTokens.connectorId, connectorId),
				eq(connectorTokens.isActive, 1),
			),
		)
		.get()
}

/**
 * Check if a connector token is valid (not expired)
 */
export function isConnectorTokenValid(token: ConnectorToken): boolean {
	if (!token.accessToken) return false
	if (!token.expiresAt) return true // No expiry = valid
	return Date.now() < token.expiresAt - TOKEN_EXPIRY_BUFFER_MS
}

/**
 * Store or update a connector token in local DB
 */
export async function upsertConnectorToken(token: {
	userEmail: string
	connectorId: string
	accessToken?: string
	refreshToken?: string
	expiresAt?: number
	scope?: string
	metadata?: string
}): Promise<ConnectorToken> {
	const db = await ensureDb()
	const now = Date.now()

	// Check if token already exists
	const existing = await db
		.select()
		.from(connectorTokens)
		.where(
			and(
				eq(connectorTokens.userEmail, token.userEmail),
				eq(connectorTokens.connectorId, token.connectorId),
			),
		)
		.get()

	if (existing) {
		// Update existing token
		const updated = await db
			.update(connectorTokens)
			.set({
				accessToken: token.accessToken ?? existing.accessToken,
				refreshToken: token.refreshToken ?? existing.refreshToken,
				expiresAt: token.expiresAt ?? existing.expiresAt,
				scope: token.scope ?? existing.scope,
				metadata: token.metadata ?? existing.metadata,
				lastSyncedAt: now,
				isActive: 1,
				updatedAt: now,
			})
			.where(eq(connectorTokens.id, existing.id))
			.returning()
			.get()

		return updated
	}

	// Create new token
	const id = randomUUID()
	const newToken = await db
		.insert(connectorTokens)
		.values({
			id,
			userEmail: token.userEmail,
			connectorId: token.connectorId,
			accessToken: token.accessToken ?? null,
			refreshToken: token.refreshToken ?? null,
			expiresAt: token.expiresAt ?? null,
			scope: token.scope ?? null,
			metadata: token.metadata ?? null,
			lastSyncedAt: now,
			isActive: 1,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()

	return newToken
}

/**
 * Deactivate a connector token
 */
export async function deactivateConnectorToken(
	userEmail: string,
	connectorId: string,
): Promise<void> {
	const db = await ensureDb()
	await db.update(connectorTokens)
		.set({ isActive: 0, updatedAt: Date.now() })
		.where(
			and(
				eq(connectorTokens.userEmail, userEmail),
				eq(connectorTokens.connectorId, connectorId),
			),
		)
		.run()
}

/**
 * Fetch all connected connectors from server and sync to local DB
 */
export async function syncTokensFromServer(userEmail: string): Promise<{
	synced: number
	errors: string[]
}> {
	if (isSyncing) {
		return { synced: 0, errors: ["Already syncing"] }
	}

	isSyncing = true
	const errors: string[] = []
	let synced = 0

	try {
		// Fetch user's tokens from server
		const response = await fetch(
			`${SERVER_BASE_URL}/api/connectors/my-tokens?user_email=${encodeURIComponent(userEmail)}`,
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		)

		if (!response.ok) {
			errors.push(`Server returned ${response.status}`)
			return { synced, errors }
		}

		// The server returns a map of provider -> { apiToken, refreshToken, expiry, connectedAt }
		const serverTokens = await response.json()
		
		// Note: We used to deactivate local tokens not found on the server,
		// but this breaks local-only connectors (like Jira, API keys, etc.) 
		// and OAuth tokens that failed to save to the server DB.
		// Now we only upsert what the server gives us, and rely on 
		// local token expiry/validity checks for the rest.
		// Sync each connected connector's token from server
		let needsRestart = false
		for (const [provider, tokenData] of Object.entries<any>(serverTokens)) {
			try {
				const existingCreds = getConnectorCredential(provider)
				const hasChanged = !existingCreds || 
					existingCreds.apiToken !== tokenData.apiToken || 
					existingCreds.accessToken !== tokenData.apiToken ||
					existingCreds.refreshToken !== tokenData.refreshToken

				await upsertConnectorToken({
					userEmail,
					connectorId: provider,
					accessToken: tokenData.apiToken,
					refreshToken: tokenData.refreshToken,
					expiresAt: tokenData.expiry ? Number(tokenData.expiry) : undefined,
					metadata: JSON.stringify({ connected: true, connectedAt: tokenData.connectedAt }),
				})
				
				// ALSO save to the keychain/legacy credential store so `opencode-manager` can inject it into the MCP server
				setConnectorCredential(provider, {
					accessToken: tokenData.apiToken,
					...(tokenData.refreshToken && { refreshToken: tokenData.refreshToken })
				})
				
				if (hasChanged) {
					needsRestart = true
				}
				synced++
			} catch (err) {
				errors.push(
					`Failed to sync ${provider}: ${err instanceof Error ? err.message : "Unknown error"}`,
				)
			}
		}
		
		if (needsRestart) {
			restartServer().catch(err => console.error("Failed to restart engine after background token sync:", err))
		}
	} catch (err) {
		errors.push(
			`Failed to fetch from server: ${err instanceof Error ? err.message : "Unknown error"}`,
		)
	} finally {
		isSyncing = false
	}

	return { synced, errors }
}

/**
 * Refresh a specific connector's token if expired
 */
export async function refreshTokenIfNeeded(
	userEmail: string,
	connectorId: string,
): Promise<boolean> {
	const token = await getConnectorToken(userEmail, connectorId)
	if (!token) return false

	// Check if token is still valid
	if (isConnectorTokenValid(token)) {
		return true
	}

	// Token is expired, try to refresh from server
	try {
		const response = await fetch(
			`${SERVER_BASE_URL}/api/connectors/refresh?email=${encodeURIComponent(userEmail)}&connector=${connectorId}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			},
		)

		if (response.ok) {
			const data = await response.json()
			await upsertConnectorToken({
				userEmail,
				connectorId,
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
				expiresAt: data.expiresAt,
				scope: data.scope,
			})
			return true
		}
	} catch (err) {
		console.error(`Failed to refresh token for ${connectorId}:`, err)
	}

	return false
}

/**
 * Start periodic token sync
 */
export function startTokenSync(userEmail: string): void {
	// Initial sync
	syncTokensFromServer(userEmail).catch(console.error)

	// Periodic sync
	if (syncInterval) {
		clearInterval(syncInterval)
	}

	syncInterval = setInterval(() => {
		syncTokensFromServer(userEmail).catch(console.error)
	}, SYNC_INTERVAL_MS)
}

/**
 * Stop periodic token sync
 */
export function stopTokenSync(): void {
	if (syncInterval) {
		clearInterval(syncInterval)
		syncInterval = null
	}
}

/**
 * Get all connected connector IDs for a user
 */
export async function getConnectedConnectorIds(userEmail: string): Promise<string[]> {
	const tokens = await getConnectorTokens(userEmail)
	return tokens.filter((t) => t.isActive === 1).map((t) => t.connectorId)
}

/**
 * Check if a specific connector is connected and valid
 */
export async function isConnectorConnected(
	userEmail: string,
	connectorId: string,
): Promise<boolean> {
	const token = await getConnectorToken(userEmail, connectorId)
	if (!token) return false
	return token.isActive === 1 && isConnectorTokenValid(token)
}
