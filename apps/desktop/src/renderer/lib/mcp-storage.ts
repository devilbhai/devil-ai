/**
 * Local MCP Server Storage
 * 
 * Store added MCP servers in localStorage for persistence
 * 
 * @module mcp-storage
 */

import type { AwesomeMCPServer } from "./awesome-mcp-servers"

// ============================================================
// Types
// ============================================================

export interface AddedMCPServer extends AwesomeMCPServer {
	addedAt: number
}

// ============================================================
// Storage Key
// ============================================================

const STORAGE_KEY = "devil-ai-added-mcp-servers"

// ============================================================
// Storage Functions
// ============================================================

/**
 * Get all added MCP servers
 */
export function getAddedServers(): AddedMCPServer[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		return JSON.parse(raw)
	} catch {
		return []
	}
}

/**
 * Add an MCP server
 */
export function addServer(server: AwesomeMCPServer): AddedMCPServer[] {
	const added = getAddedServers()

	// Check if already added
	if (added.some((s) => s.id === server.id)) {
		return added
	}

	const newServer: AddedMCPServer = {
		...server,
		addedAt: Date.now(),
	}

	const updated = [newServer, ...added]
	localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
	return updated
}

/**
 * Remove an MCP server
 */
export function removeServer(serverId: string): AddedMCPServer[] {
	const added = getAddedServers()
	const updated = added.filter((s) => s.id !== serverId)
	localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
	return updated
}

/**
 * Check if a server is added
 */
export function isServerAdded(serverId: string): boolean {
	return getAddedServers().some((s) => s.id === serverId)
}

/**
 * Get added server count
 */
export function getAddedServerCount(): number {
	return getAddedServers().length
}

/**
 * Clear all added servers
 */
export function clearAllServers(): void {
	localStorage.removeItem(STORAGE_KEY)
}

/**
 * Export added servers as JSON
 */
export function exportAddedServers(): string {
	return JSON.stringify(getAddedServers(), null, 2)
}

/**
 * Import servers from JSON
 */
export function importServers(json: string): AddedMCPServer[] {
	try {
		const servers: AddedMCPServer[] = JSON.parse(json)
		const added = getAddedServers()

		// Merge without duplicates
		const merged = [...added]
		for (const server of servers) {
			if (!merged.some((s) => s.id === server.id)) {
				merged.push(server)
			}
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
		return merged
	} catch {
		return getAddedServers()
	}
}
