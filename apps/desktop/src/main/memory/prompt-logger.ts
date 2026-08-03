/**
 * Prompt Logger — auto-captures every user prompt and AI response.
 *
 * Hooks into the OpenCode SSE event stream to log messages as they flow.
 * Extracts topics, estimates tokens, and stores everything in conversation_log.
 */

import { createLogger } from "../logger"
import { logConversation } from "./memory-store"

const log = createLogger("prompt-logger")

// ============================================================
// Token estimation (rough: 1 token ≈ 4 chars for English)
// ============================================================

function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4)
}

// ============================================================
// Topic extraction (simple keyword extraction)
// ============================================================

const STOP_WORDS = new Set([
	"the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
	"have", "has", "had", "do", "does", "did", "will", "would", "could",
	"should", "may", "might", "shall", "can", "need", "dare", "ought",
	"used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
	"as", "into", "through", "during", "before", "after", "above", "below",
	"between", "out", "off", "over", "under", "again", "further", "then",
	"once", "here", "there", "when", "where", "why", "how", "all", "both",
	"each", "few", "more", "most", "other", "some", "such", "no", "nor",
	"not", "only", "own", "same", "so", "than", "too", "very", "s", "t",
	"just", "don", "now", "and", "but", "or", "if", "while", "this",
	"that", "these", "those", "i", "me", "my", "we", "our", "you", "your",
	"it", "its", "they", "them", "their", "what", "which", "who", "whom",
])

function extractTopics(text: string): string[] {
	const words = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 3 && !STOP_WORDS.has(w))

	// Count frequency
	const freq = new Map<string, number>()
	for (const w of words) {
		freq.set(w, (freq.get(w) || 0) + 1)
	}

	// Sort by frequency, take top 5
	return Array.from(freq.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([word]) => word)
}

// ============================================================
// Public API
// ============================================================

export interface LogPromptOptions {
	sessionId?: string
	projectPath?: string
	role: "user" | "assistant"
	content: string
}

/**
 * Log a single message (prompt or response) to the conversation log.
 * Called automatically by the SSE event handler.
 */
export async function logPrompt(options: LogPromptOptions): Promise<void> {
	try {
		const topics = extractTopics(options.content)
		await logConversation({
			sessionId: options.sessionId,
			projectPath: options.projectPath,
			role: options.role,
			content: options.content,
			topics: topics.join(","),
			tokenCount: estimateTokens(options.content),
		})

		log.debug("Logged message", {
			role: options.role,
			sessionId: options.sessionId,
			contentLength: options.content.length,
			topics: topics.slice(0, 3).join(", "),
		})
	} catch (err) {
		log.error("Failed to log prompt", err)
	}
}

/**
 * Log a full conversation turn (user prompt + assistant response).
 */
export async function logConversationTurn(options: {
	sessionId?: string
	projectPath?: string
	userPrompt: string
	assistantResponse: string
}): Promise<void> {
	await logPrompt({
		sessionId: options.sessionId,
		projectPath: options.projectPath,
		role: "user",
		content: options.userPrompt,
	})

	await logPrompt({
		sessionId: options.sessionId,
		projectPath: options.projectPath,
		role: "assistant",
		content: options.assistantResponse,
	})
}

/**
 * Batch log multiple messages (for importing session history).
 */
export async function batchLogMessages(
	messages: Array<{
		sessionId?: string
		projectPath?: string
		role: "user" | "assistant"
		content: string
		timestamp?: number
	}>,
): Promise<number> {
	let count = 0
	for (const msg of messages) {
		await logPrompt(msg)
		count++
	}
	return count
}
