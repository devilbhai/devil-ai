/**
 * Contextual Memory — unified orchestrating layer for Notes, RAG, Related Sessions,
 * and the NEW memory system (conversation_log, project_knowledge, learned_skills).
 *
 * Provides a single API to query across all memory sources, rank by relevance,
 * and inject context into AI prompts. Replaces the fragmented approach of
 * querying Notes, RAG, and Related Sessions separately.
 */

import type { Note } from "../../main/notes"
import type { RagSearchResult } from "./rag-service"

// ============================================================
// Types
// ============================================================

export interface MemoryResult {
	/** Unique identifier */
	id: string
	/** Source of the memory */
	source: "note" | "rag" | "related-session" | "conversation" | "knowledge" | "skill"
	/** Title or summary */
	title: string
	/** Full content or snippet */
	content: string
	/** Relevance score (0-1) */
	score: number
	/** Timestamp */
	timestamp: number
	/** Optional metadata */
	metadata?: Record<string, unknown>
}

export interface ContextQuery {
	/** The search query or topic */
	query: string
	/** Current session ID to exclude from results */
	currentSessionId?: string
	/** Maximum results per source */
	limit?: number
	/** Minimum relevance score threshold */
	minScore?: number
	/** Sources to include (default: all) */
	sources?: ("note" | "rag" | "related-session" | "conversation" | "knowledge" | "skill")[]
	/** Project path for scoped results */
	projectPath?: string
}

export interface ContextBundle {
	/** All results ranked by relevance */
	results: MemoryResult[]
	/** Formatted context string for AI injection */
	contextString: string
	/** Source breakdown */
	counts: {
		notes: number
		rag: number
		related: number
		conversations: number
		knowledge: number
		skills: number
	}
}

// ============================================================
// Memory Sources (adapters)
// ============================================================

/**
 * Fetch notes from the main process via IPC.
 */
async function fetchNotes(query: string, limit: number, queryTokens: Set<string>): Promise<MemoryResult[]> {
	try {
		if (!window.devilAi?.notes?.search) return []
		const notes: Note[] = await window.devilAi.notes.search(query)
		return notes.slice(0, limit).map((note) => ({
			id: `note:${note.id}`,
			source: "note" as const,
			title: note.title,
			content: note.content,
			score: computeTextSimilarity(queryTokens, `${note.title} ${note.content}`),
			timestamp: note.updatedAt,
			metadata: { tags: note.tags, projectPath: note.projectPath },
		}))
	} catch {
		return []
	}
}

/**
 * Fetch RAG documents from localStorage.
 */
async function fetchRagDocuments(query: string, limit: number): Promise<MemoryResult[]> {
	try {
		const { searchDocuments } = await import("./rag-service")
		const results: RagSearchResult[] = searchDocuments(query, { limit })
		return results.map((r) => ({
			id: `rag:${r.document.id}`,
			source: "rag" as const,
			title: r.document.content.slice(0, 80) + (r.document.content.length > 80 ? "..." : ""),
			content: r.document.content,
			score: r.score,
			timestamp: r.document.timestamp,
			metadata: r.document.metadata,
		}))
	} catch {
		return []
	}
}

/**
 * Fetch related sessions from the knowledge graph.
 */
async function fetchRelatedSessions(
	currentSessionId: string | undefined,
	limit: number,
): Promise<MemoryResult[]> {
	try {
		if (!currentSessionId) return []
		const { relatedSessionsAtom } = await import("../atoms/knowledge-graph")
		const { appStore } = await import("../atoms/store")
		const related: Array<{
			sessionId: string
			title: string
			similarity: number
			reason: string
		}> = appStore.get(relatedSessionsAtom)
		return related
			.filter((r) => r.sessionId !== currentSessionId)
			.slice(0, limit)
			.map((r) => ({
				id: `related:${r.sessionId}`,
				source: "related-session" as const,
				title: r.title,
				content: r.reason,
				score: r.similarity,
				timestamp: Date.now(),
				metadata: { sessionId: r.sessionId },
			}))
	} catch {
		return []
	}
}

// ============================================================
// NEW MEMORY SYSTEM SOURCES
// ============================================================

/**
 * Fetch similar past conversations from conversation_log.
 */
async function fetchConversations(
	query: string,
	projectPath: string | undefined,
	limit: number,
	queryTokens: Set<string>,
): Promise<MemoryResult[]> {
	try {
		if (!window.devilAi?.memory?.searchConversations) return []
		const conversations = await window.devilAi.memory.searchConversations(query, projectPath, limit)
		return conversations.map((c) => ({
			id: `conv:${c.id}`,
			source: "conversation" as const,
			title: `${c.role}: ${(c.summary || c.content).slice(0, 80)}`,
			content: c.content,
			score: computeTextSimilarity(queryTokens, c.content),
			timestamp: c.timestamp,
			metadata: { sessionId: c.sessionId, topics: c.topics },
		}))
	} catch {
		return []
	}
}

/**
 * Fetch relevant project knowledge.
 */
async function fetchKnowledge(
	query: string,
	projectPath: string | undefined,
	limit: number,
	queryTokens: Set<string>,
): Promise<MemoryResult[]> {
	try {
		if (!window.devilAi?.memory?.searchKnowledge || !projectPath) return []
		const knowledge = await window.devilAi.memory.searchKnowledge(query, projectPath, limit)
		return knowledge.map((k) => ({
			id: `know:${k.id}`,
			source: "knowledge" as const,
			title: `[${k.type}] ${k.title}`,
			content: k.description,
			score: computeTextSimilarity(queryTokens, `${k.title} ${k.description}`),
			timestamp: k.updatedAt,
			metadata: { technologies: k.technologies, files: k.files },
		}))
	} catch {
		return []
	}
}

/**
 * Fetch relevant learned skills.
 */
async function fetchSkills(
	query: string,
	limit: number,
	queryTokens: Set<string>,
): Promise<MemoryResult[]> {
	try {
		if (!window.devilAi?.memory?.searchSkills) return []
		const skills = await window.devilAi.memory.searchSkills(query, limit)
		return skills.map((s) => ({
			id: `skill:${s.id}`,
			source: "skill" as const,
			title: `[${s.category}] ${s.name}`,
			content: `${s.description}\n\nPattern:\n${s.pattern}`,
			score: computeTextSimilarity(queryTokens, `${s.name} ${s.description} ${s.pattern}`),
			timestamp: s.updatedAt,
			metadata: { useCount: s.useCount, successRate: s.successRate },
		}))
	} catch {
		return []
	}
}

// ============================================================
// Text Similarity (simple TF-IDF-like scoring)
// ============================================================

function computeTextSimilarity(queryTokens: Set<string>, text: string): number {
	const textTokens = tokenize(text)
	if (queryTokens.size === 0 || textTokens.size === 0) return 0

	let matches = 0
	for (const token of queryTokens) {
		if (textTokens.has(token)) matches++
	}
	return matches / queryTokens.size
}

function tokenize(text: string): Set<string> {
	return new Set(
		text
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, " ")
			.split(/\s+/)
			.filter((w) => w.length > 2),
	)
}

// ============================================================
// Public API
// ============================================================

/**
 * Query all memory sources and return ranked results.
 */
export async function queryContextMemory(query: ContextQuery): Promise<ContextBundle> {
	const {
		query: q,
		currentSessionId,
		limit = 5,
		minScore = 0.1,
		sources,
		projectPath,
	} = query
	const includeNotes = !sources || sources.includes("note")
	const includeRag = !sources || sources.includes("rag")
	const includeRelated = !sources || sources.includes("related-session")
	const includeConversations = !sources || sources.includes("conversation")
	const includeKnowledge = !sources || sources.includes("knowledge")
	const includeSkills = !sources || sources.includes("skill")

	// Pre-tokenize query once — avoids redundant tokenization across all fetch functions
	const queryTokens = tokenize(q)

	const [notes, rag, related, conversations, knowledge, skills] = await Promise.all([
		includeNotes ? fetchNotes(q, limit, queryTokens) : Promise.resolve([]),
		includeRag ? fetchRagDocuments(q, limit) : Promise.resolve([]),
		includeRelated ? fetchRelatedSessions(currentSessionId, limit) : Promise.resolve([]),
		includeConversations ? fetchConversations(q, projectPath, limit, queryTokens) : Promise.resolve([]),
		includeKnowledge ? fetchKnowledge(q, projectPath, limit, queryTokens) : Promise.resolve([]),
		includeSkills ? fetchSkills(q, limit, queryTokens) : Promise.resolve([]),
	])

	// Merge and rank by score
	const all = [...notes, ...rag, ...related, ...conversations, ...knowledge, ...skills]
		.filter((r) => r.score >= minScore)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit * 4) // Top N across all sources

	// Build context string for AI injection
	const contextParts = all.map((r) => {
		const sourceLabel =
			r.source === "note"
				? "Note"
				: r.source === "rag"
					? "Context"
					: r.source === "related-session"
						? "Related"
						: r.source === "conversation"
							? "PastConversation"
							: r.source === "knowledge"
								? "ProjectKnowledge"
								: "LearnedSkill"
		return `[${sourceLabel}: ${r.title}]\n${r.content}`
	})

	return {
		results: all,
		contextString: contextParts.join("\n\n---\n\n"),
		counts: {
			notes: notes.length,
			rag: rag.length,
			related: related.length,
			conversations: conversations.length,
			knowledge: knowledge.length,
			skills: skills.length,
		},
	}
}

/**
 * Get context string for AI prompt injection.
 * Convenience wrapper around queryContextMemory.
 */
export async function getContextForPrompt(
	query: string,
	currentSessionId?: string,
	projectPath?: string,
): Promise<string> {
	const bundle = await queryContextMemory({
		query,
		currentSessionId,
		projectPath,
		limit: 3,
		minScore: 0.2,
	})
	return bundle.contextString
}
