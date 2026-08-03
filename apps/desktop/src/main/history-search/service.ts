/**
 * Chat History Search Service (Main Process)
 * 
 * Uses the existing scanner infrastructure to search chat history.
 */

import { scanFormat } from "@devil-ai/configconv"
import { createLogger } from "../logger"
import type { HistorySearchOptions, HistorySearchResult, HistorySessionDetail, HistoryMessage } from "../../renderer/types/history-search"

const log = createLogger("history-search")

export async function searchHistory(options: HistorySearchOptions): Promise<HistorySearchResult[]> {
	const {
		query,
		projectPath,
		limit = 20,
		offset = 0,
		since,
	} = options

	try {
		const scanResult = await scanFormat({
			format: "claude-code",
			global: false,
			project: projectPath,
			includeHistory: true,
			since: since ? new Date(since) : undefined,
})

	if (scanResult.format !== "claude-code") return []

	const data = scanResult.data

	const results: HistorySearchResult[] = []

	// Search session indices
	if (data.history?.sessionIndices) {
			for (const index of data.history.sessionIndices) {
				for (const entry of index.index.entries) {
					const display = entry.firstPrompt || entry.summary || ""
					if (display.toLowerCase().includes(query.toLowerCase())) {
						results.push({
							sessionId: entry.sessionId,
							projectPath: index.projectPath,
							sessionDisplay: formatSessionDisplay(index.projectPath),
							timestamp: entry.created ? new Date(entry.created).getTime() : Date.now(),
							preview: highlightMatch(display, query),
							messageCount: entry.messageCount || 0,
						})
					}
				}
			}
		}

		// Search prompt history
		if (data.history?.promptHistory) {
			for (const entry of data.history.promptHistory) {
				if (entry.display.toLowerCase().includes(query.toLowerCase())) {
					results.push({
						sessionId: entry.project || "unknown",
						projectPath: entry.project || "unknown",
						sessionDisplay: formatSessionDisplay(entry.project || "unknown"),
						timestamp: entry.timestamp,
						preview: highlightMatch(entry.display, query),
						messageCount: 1,
					})
				}
			}
		}

		// Sort by timestamp descending
		results.sort((a, b) => b.timestamp - a.timestamp)

		// Apply pagination
		return results.slice(offset, offset + limit)
	} catch (err) {
		log.error("History search failed", { query: options.query, projectPath }, err)
		return []
	}
}

export async function getHistorySessionDetail(
	sessionId: string,
	projectPath: string
): Promise<HistorySessionDetail | null> {
	try {
		const scanResult = await scanFormat({
			format: "claude-code",
			global: false,
			project: projectPath,
			includeHistory: true,
		})

		if (scanResult.format !== "claude-code") return null

		const data = scanResult.data

		if (!data.history?.sessionIndices) return null

		// Find the session index entry
		let targetEntry: { sessionId: string; created?: string; messageCount?: number; fullPath?: string } | null = null
		let targetProjectPath = projectPath

		for (const index of data.history.sessionIndices) {
			const entry = index.index.entries.find((e) => e.sessionId === sessionId)
			if (entry) {
				targetEntry = entry
				targetProjectPath = index.projectPath
				break
			}
		}

		if (!targetEntry) return null

		// Load the actual transcript file for full messages
		const transcriptPath = targetEntry.fullPath || ""
		const messages = await loadTranscriptMessages(transcriptPath)

		return {
			sessionId,
			projectPath: targetProjectPath,
			display: targetEntry.sessionId,
			timestamp: targetEntry.created ? new Date(targetEntry.created).getTime() : Date.now(),
			messageCount: targetEntry.messageCount || 0,
			model: undefined,
			summary: undefined,
			messages,
		}
	} catch (err) {
		log.error("Failed to get session detail", { sessionId, projectPath }, err)
		return null
	}
}

async function loadTranscriptMessages(transcriptPath: string): Promise<HistoryMessage[]> {
	try {
		const { readFile } = await import("node:fs/promises")
		const content = await readFile(transcriptPath, "utf-8")
		const lines = content.trim().split("\n").filter(Boolean)

		const messages: HistoryMessage[] = []

		for (const line of lines) {
			try {
				const entry = JSON.parse(line)
				if (entry.type === "user" || entry.type === "assistant") {
					const content = typeof entry.message?.content === "string"
						? entry.message.content
						: JSON.stringify(entry.message?.content)
					messages.push({
						id: entry.uuid || `${Date.now()}-${Math.random()}`,
						role: entry.type,
						content,
						timestamp: entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now(),
					})
				}
			} catch {
				// Skip malformed lines
			}
		}

		return messages
	} catch {
		return []
	}
}

function highlightMatch(text: string, query: string): string {
	const idx = text.toLowerCase().indexOf(query.toLowerCase())
	if (idx === -1) return text.slice(0, 200)

	const start = Math.max(0, idx - 50)
	const end = Math.min(text.length, idx + query.length + 50)
	let snippet = text.slice(start, end)
	if (start > 0) snippet = "..." + snippet
	if (end < text.length) snippet = snippet + "..."
	return snippet
}

function formatSessionDisplay(projectPath: string): string {
	const parts = projectPath.split("/").filter(Boolean)
	return parts[parts.length - 1] || projectPath
}