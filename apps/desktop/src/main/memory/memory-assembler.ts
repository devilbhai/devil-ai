/**
 * Memory Assembler — context injection engine for new prompts.
 *
 * When a new prompt arrives, this module:
 * 1. Searches similar past prompts
 * 2. Loads relevant project knowledge
 * 3. Loads learned skills for this domain
 * 4. Loads user preferences and agent memories
 * 5. Ranks everything by relevance
 * 6. Builds a context string for AI injection
 */

import { createLogger } from "../logger"
import {
	searchConversations,
	searchProjectKnowledge,
	searchLearnedSkills,
} from "./memory-store"
import { listMemories, listPreferences } from "./index"

const log = createLogger("memory-assembler")

// ============================================================
// Text similarity (TF-IDF-like scoring)
// ============================================================

function tokenize(text: string): Set<string> {
	return new Set(
		text
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, " ")
			.split(/\s+/)
			.filter((w) => w.length > 2),
	)
}

function computeSimilarity(query: string, text: string): number {
	const queryTokens = tokenize(query)
	const textTokens = tokenize(text)
	if (queryTokens.size === 0 || textTokens.size === 0) return 0

	let matches = 0
	for (const token of queryTokens) {
		if (textTokens.has(token)) matches++
	}
	return matches / queryTokens.size
}

// ============================================================
// Types
// ============================================================

export interface AssembledContext {
	/** Similar past prompts */
	similarPrompts: Array<{
		content: string
		score: number
		role: string
		timestamp: number
	}>
	/** Relevant project knowledge */
	knowledge: Array<{
		title: string
		description: string
		type: string
		score: number
	}>
	/** Relevant learned skills */
	skills: Array<{
		name: string
		description: string
		category: string
		pattern: string
		score: number
	}>
	/** Agent memories */
	memories: Array<{
		summary: string
		content: string
		category: string
	}>
	/** User preferences */
	preferences: Array<{
		key: string
		value: string
		category: string
	}>
	/** Final formatted context string for AI injection */
	contextString: string
}

// ============================================================
// Public API
// ============================================================

/**
 * Assemble all relevant context for a new prompt.
 * Returns structured context and a formatted string for AI injection.
 */
export async function assembleContext(options: {
	query: string
	projectPath?: string
	sessionId?: string
	limit?: number
}): Promise<AssembledContext> {
	const { query, projectPath, limit = 5 } = options

	// Run all searches in parallel
	const [similarPrompts, knowledge, skills, memories, preferences] = await Promise.all([
		searchConversations(query, projectPath, limit).then((results) =>
			results.map((r) => ({
				content: r.summary || r.content.slice(0, 200),
				score: computeSimilarity(query, r.content),
				role: r.role,
				timestamp: r.timestamp,
			})),
		),
		projectPath
			? searchProjectKnowledge(query, projectPath, limit).then((results) =>
					results.map((r) => ({
						title: r.title,
						description: r.description,
						type: r.type,
						score: computeSimilarity(query, `${r.title} ${r.description}`),
					})),
				)
			: Promise.resolve([]),
		searchLearnedSkills(query, limit).then((results) =>
			results.map((r) => ({
				name: r.name,
				description: r.description,
				category: r.category,
				pattern: r.pattern,
				score: computeSimilarity(query, `${r.name} ${r.description} ${r.pattern}`),
			})),
		),
		projectPath ? listMemories(projectPath, undefined, 10) : Promise.resolve([]),
		projectPath ? listPreferences(projectPath) : Promise.resolve([]),
	])

	// Sort and filter
	const rankedPrompts = similarPrompts
		.filter((r) => r.score > 0.15)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)

	const rankedKnowledge = knowledge
		.filter((r) => r.score > 0.2)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)

	const rankedSkills = skills
		.filter((r) => r.score > 0.2)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)

	// Build context string
	const contextParts: string[] = []

	if (rankedPrompts.length > 0) {
		contextParts.push("# Similar Past Conversations")
		for (const p of rankedPrompts.slice(0, 3)) {
			contextParts.push(`[${p.role}] ${p.content}`)
		}
	}

	if (rankedKnowledge.length > 0) {
		contextParts.push("# Relevant Project Knowledge")
		for (const k of rankedKnowledge.slice(0, 3)) {
			contextParts.push(`[${k.type}] ${k.title}: ${k.description}`)
		}
	}

	if (rankedSkills.length > 0) {
		contextParts.push("# Learned Skills (reuse these patterns)")
		for (const s of rankedSkills.slice(0, 3)) {
			contextParts.push(`[${s.category}] ${s.name}: ${s.description}`)
		}
	}

	if (memories.length > 0) {
		contextParts.push("# Agent Memories")
		for (const m of memories.slice(0, 5)) {
			contextParts.push(`[${m.category}] ${m.summary}`)
		}
	}

	if (preferences.length > 0) {
		contextParts.push("# User Preferences")
		for (const p of preferences.slice(0, 5)) {
			contextParts.push(`[${p.category}] ${p.key}: ${p.value}`)
		}
	}

	const contextString = contextParts.join("\n")

	log.info("Assembled context", {
		query: query.slice(0, 50),
		similarPrompts: rankedPrompts.length,
		knowledge: rankedKnowledge.length,
		skills: rankedSkills.length,
		memories: memories.length,
		preferences: preferences.length,
		contextLength: contextString.length,
	})

	return {
		similarPrompts: rankedPrompts,
		knowledge: rankedKnowledge,
		skills: rankedSkills,
		memories,
		preferences,
		contextString,
	}
}

/**
 * Quick context string for prompt injection.
 * Convenience wrapper around assembleContext.
 */
export async function getMemoryContextString(
	query: string,
	projectPath?: string,
): Promise<string> {
	const ctx = await assembleContext({ query, projectPath, limit: 3 })
	return ctx.contextString
}
