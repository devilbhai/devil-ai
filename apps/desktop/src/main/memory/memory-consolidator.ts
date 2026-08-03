/**
 * Memory Consolidator — auto-summarizes old conversations.
 *
 * Periodically reviews conversation_log entries and creates summaries
 * of old sessions. Extracts key learnings and stores them as
 * memory_consolidation entries for long-term retention.
 */

import { createLogger } from "../logger"
import { getConversationHistory, saveConsolidation, saveEmbedding } from "./memory-store"

const log = createLogger("memory-consolidator")

// ============================================================
// Summary generation (local, no AI API needed)
// ============================================================

/**
 * Generate a summary from a list of conversation messages.
 * Uses extractive summarization — picks the most important sentences.
 */
function generateSummary(messages: Array<{ role: string; content: string }>): string {
	if (messages.length === 0) return ""
	if (messages.length === 1) return messages[0].content.slice(0, 200)

	// Combine all messages
	const fullText = messages
		.filter((m) => m.role === "user")
		.map((m) => m.content)
		.join(" ")

	// Extract key sentences (simple: sentences with technical keywords)
	const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 20)
	const technicalKeywords = [
		"implement", "fix", "create", "add", "update", "refactor", "build",
		"design", "configure", "deploy", "test", "debug", "optimize", "migrate",
		"api", "component", "database", "server", "client", "function", "module",
		"react", "node", "typescript", "css", "html", "sql", "git", "docker",
	]

	const scored = sentences.map((s) => {
		const lower = s.toLowerCase()
		const score = technicalKeywords.filter((kw) => lower.includes(kw)).length
		return { sentence: s.trim(), score }
	})

	// Take top 3 sentences by score
	const topSentences = scored
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map((s) => s.sentence)

	return topSentences.join(". ").slice(0, 500)
}

/**
 * Extract key learnings from a conversation.
 */
function extractLearnings(messages: Array<{ role: string; content: string }>): string[] {
	const learnings: string[] = []

	for (const msg of messages) {
		if (msg.role !== "assistant") continue

		// Look for decision statements
		if (/\b(we (should|need|must|will|decided))\b/i.test(msg.content)) {
			const match = msg.content.match(/[^.]*(?:we should|we need|we must|we will|we decided)[^.]*/i)
			if (match) learnings.push(match[0].trim())
		}

		// Look for solution patterns
		if (/\b(the (solution|fix|approach|way))\b/i.test(msg.content)) {
			const match = msg.content.match(/[^.]*(?:the solution|the fix|the approach|the way)[^.]*/i)
			if (match) learnings.push(match[0].trim())
		}

		// Look for best practices
		if (/\b(best practice|recommended|important|note that|remember)\b/i.test(msg.content)) {
			const match = msg.content.match(
				/[^.]*(?:best practice|recommended|important|note that|remember)[^.]*/i,
			)
			if (match) learnings.push(match[0].trim())
		}
	}

	return learnings.slice(0, 5)
}

/**
 * Generate keywords for embedding from conversation.
 */
function extractKeywords(messages: Array<{ role: string; content: string }>): string[] {
	const allText = messages.map((m) => m.content).join(" ").toLowerCase()
	const words = allText
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 3)

	const freq = new Map<string, number>()
	for (const w of words) {
		freq.set(w, (freq.get(w) || 0) + 1)
	}

	return Array.from(freq.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([word]) => word)
}

// ============================================================
// Public API
// ============================================================

export interface ConsolidateOptions {
	/** Session ID to consolidate */
	sessionId: string
	/** Project path */
	projectPath?: string
	/** Minimum messages required for consolidation */
	minMessages?: number
}

/**
 * Consolidate a session's conversation into a summary.
 * Returns the consolidation entry, or null if not enough messages.
 */
export async function consolidateSession(
	options: ConsolidateOptions,
): Promise<{ summary: string; learnings: string[] } | null> {
	const { sessionId, projectPath, minMessages = 3 } = options

	// Fetch conversation history
	const messages = await getConversationHistory({ sessionId, limit: 100 })

	if (messages.length < minMessages) {
		log.debug("Not enough messages to consolidate", { sessionId, count: messages.length })
		return null
	}

	// Generate summary
	const summary = generateSummary(messages)
	const learnings = extractLearnings(messages)
	const keywords = extractKeywords(messages)

	// Save consolidation
	await saveConsolidation({
		sessionId,
		projectPath,
		conversationIds: messages.map((m) => m.id),
		summary,
		learnings: learnings.join("\n"),
		messageCount: messages.length,
	})

	// Save embedding for semantic search
	const fullText = messages.map((m) => `[${m.role}] ${m.content}`).join("\n")
	const vector: Record<string, number> = {}
	for (const kw of keywords) {
		vector[kw] = 1
	}

	await saveEmbedding({
		sourceType: "conversation",
		sourceId: sessionId,
		text: fullText.slice(0, 1000),
		vector,
		keywords,
	})

	log.info("Consolidated session", {
		sessionId,
		messageCount: messages.length,
		summaryLength: summary.length,
		learningsCount: learnings.length,
	})

	return { summary, learnings }
}

/**
 * Auto-consolidate old sessions that haven't been consolidated yet.
 * Run periodically (e.g., once per day).
 */
export async function autoConsolidateOldSessions(options: {
	projectPath?: string
	maxAge?: number // ms
	maxSessions?: number
}): Promise<number> {
	const { projectPath, maxAge = 7 * 24 * 60 * 60 * 1000, maxSessions = 10 } = options

	// Get old conversations
	const oldMessages = await getConversationHistory({
		projectPath,
		limit: maxSessions * 20,
	})

	// Group by session
	const sessionMap = new Map<string, typeof oldMessages>()
	for (const msg of oldMessages) {
		if (!msg.sessionId) continue
		const age = Date.now() - msg.timestamp
		if (age > maxAge) {
			const existing = sessionMap.get(msg.sessionId) || []
			existing.push(msg)
			sessionMap.set(msg.sessionId, existing)
		}
	}

	let consolidated = 0
	for (const [sessionId, messages] of sessionMap) {
		if (messages.length < 3) continue

		const summary = generateSummary(messages)
		const learnings = extractLearnings(messages)

		await saveConsolidation({
			sessionId,
			projectPath,
			conversationIds: messages.map((m) => m.id),
			summary,
			learnings: learnings.join("\n"),
			messageCount: messages.length,
		})

		consolidated++
		if (consolidated >= maxSessions) break
	}

	if (consolidated > 0) {
		log.info("Auto-consolidated old sessions", { count: consolidated })
	}

	return consolidated
}
