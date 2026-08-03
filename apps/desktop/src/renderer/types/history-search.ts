/**
 * Chat History Search Types
 * 
 * Types for searching and displaying chat history across sessions.
 */

export interface HistorySearchOptions {
	query: string
	projectPath?: string
	limit?: number
	offset?: number
	since?: number // timestamp
	until?: number // timestamp
}

export interface HistorySearchResult {
	sessionId: string
	projectPath: string
	sessionDisplay: string
	timestamp: number
	preview: string
	messageCount: number
	model?: string
}

export interface HistorySessionDetail {
	sessionId: string
	projectPath: string
	display: string
	timestamp: number
	messageCount: number
	model?: string
	summary?: string
	messages: HistoryMessage[]
}

export interface HistoryMessage {
	id: string
	role: "user" | "assistant"
	content: string
	timestamp: number
	parts?: HistoryMessagePart[]
}

export interface HistoryMessagePart {
	type: "text" | "reasoning" | "tool"
	content: string
	toolName?: string
	toolInput?: unknown
	toolOutput?: unknown
}