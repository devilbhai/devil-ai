/**
 * Agent Memory — persistent memory layer for Devil AI agents.
 *
 * Stores user preferences (coding style, guidelines) and agent memories
 * (decisions, patterns, context from past sessions). Injected into AI
 * prompts so the agent remembers across sessions.
 *
 * Also exports the new memory system modules:
 * - memory-store: CRUD for conversation_log, project_knowledge, learned_skills, etc.
 * - prompt-logger: auto-capture every prompt/response
 * - skill-accumulator: extract patterns from AI responses
 * - memory-assembler: context injection engine
 * - memory-consolidator: auto-summarize old conversations
 */

import { eq, like, or, desc, and, sql } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { userPreferences, agentMemories } from "./schema"

// Re-export new memory modules
export { logPrompt, logConversationTurn, batchLogMessages } from "./prompt-logger"
export { accumulateSkills, hasNotablePatterns } from "./skill-accumulator"
export { assembleContext, getMemoryContextString } from "./memory-assembler"
export { consolidateSession, autoConsolidateOldSessions } from "./memory-consolidator"
export {
	ensureMemoryStoreTables,
	logConversation,
	getConversationHistory,
	searchConversations,
	addProjectKnowledge,
	getProjectKnowledge,
	searchProjectKnowledge,
	addLearnedSkill,
	getLearnedSkills,
	searchLearnedSkills,
	useLearnedSkill,
	saveEmbedding,
	getAllEmbeddings,
	saveConsolidation,
	getConsolidations,
	getMemoryStats,
} from "./memory-store"
export type {
	ConversationEntry,
	ProjectKnowledgeEntry,
	LearnedSkill,
	MemoryEmbedding,
	MemoryConsolidationEntry,
} from "./memory-store"

const log = createLogger("memory")

// ============================================================
// Ensure tables exist (idempotent — safe to call on every startup)
// ============================================================

let tablesEnsured = false

async function ensureMemoryTables() {
	if (tablesEnsured) return
	const db = await ensureDb()

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS user_preferences (
			id text PRIMARY KEY,
			project_path text,
			category text NOT NULL,
			key text NOT NULL,
			value text NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_prefs_project ON user_preferences (project_path)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_prefs_category ON user_preferences (category)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_prefs_key ON user_preferences (key)`)

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS agent_memories (
			id text PRIMARY KEY,
			project_path text,
			session_id text,
			category text NOT NULL,
			summary text NOT NULL,
			content text NOT NULL,
			weight integer DEFAULT 50 NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_mem_project ON agent_memories (project_path)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_mem_session ON agent_memories (session_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_mem_category ON agent_memories (category)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_mem_weight ON agent_memories (weight)`)

	tablesEnsured = true
	log.info("Memory tables ensured")
}

// ============================================================
// Types
// ============================================================

export interface UserPreference {
	id: string
	projectPath: string | null
	category: string
	key: string
	value: string
	createdAt: number
	updatedAt: number
}

export interface AgentMemory {
	id: string
	projectPath: string | null
	sessionId: string | null
	category: string
	summary: string
	content: string
	weight: number
	createdAt: number
	updatedAt: number
}

export interface CreatePreferenceInput {
	projectPath?: string
	category: string
	key: string
	value: string
}

export interface UpdatePreferenceInput {
	id: string
	value?: string
	category?: string
}

export interface CreateMemoryInput {
	projectPath?: string
	sessionId?: string
	category: string
	summary: string
	content: string
	weight?: number
}

export interface UpdateMemoryInput {
	id: string
	summary?: string
	content?: string
	weight?: number
	category?: string
}

// ============================================================
// User Preferences CRUD
// ============================================================

export async function listPreferences(projectPath?: string): Promise<UserPreference[]> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const rows = projectPath
		? await db
				.select()
				.from(userPreferences)
				.where(or(eq(userPreferences.projectPath, projectPath), sql`${userPreferences.projectPath} IS NULL`))
				.orderBy(desc(userPreferences.updatedAt))
				.all()
		: await db.select().from(userPreferences).orderBy(desc(userPreferences.updatedAt)).all()
	return rows
}

export async function getPreference(id: string): Promise<UserPreference | null> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const row = await db.select().from(userPreferences).where(eq(userPreferences.id, id)).get()
	return row ?? null
}

export async function getPreferenceByKey(
	key: string,
	projectPath?: string,
): Promise<UserPreference | null> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const conditions = [eq(userPreferences.key, key)]
	if (projectPath) {
		conditions.push(or(eq(userPreferences.projectPath, projectPath), sql`${userPreferences.projectPath} IS NULL`)!)
	}
	const row = await db
		.select()
		.from(userPreferences)
		.where(and(...conditions))
		.orderBy(desc(userPreferences.projectPath)) // project-specific first
		.get()
	return row ?? null
}

export async function setPreference(input: CreatePreferenceInput): Promise<UserPreference> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const now = Date.now()

	// Upsert: update if key+project exists, insert otherwise
	const existing = await db
		.select()
		.from(userPreferences)
		.where(
			and(
				eq(userPreferences.key, input.key),
				input.projectPath
					? or(
							eq(userPreferences.projectPath, input.projectPath),
							sql`${userPreferences.projectPath} IS NULL`,
						)!
					: sql`${userPreferences.projectPath} IS NULL`,
			),
		)
		.get()

	if (existing) {
		const row = await db
			.update(userPreferences)
			.set({ value: input.value, category: input.category, updatedAt: now })
			.where(eq(userPreferences.id, existing.id))
			.returning()
			.get()
		log.debug("Preference updated", { key: input.key })
		return row
	}

	const id = crypto.randomUUID()
	const row = await db
		.insert(userPreferences)
		.values({
			id,
			projectPath: input.projectPath ?? null,
			category: input.category,
			key: input.key,
			value: input.value,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()
	log.debug("Preference created", { key: input.key })
	return row
}

export async function deletePreference(id: string): Promise<boolean> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const existing = await db.select().from(userPreferences).where(eq(userPreferences.id, id)).get()
	if (!existing) return false
	await db.delete(userPreferences).where(eq(userPreferences.id, id)).run()
	log.debug("Preference deleted", { id })
	return true
}

export async function searchPreferences(query: string): Promise<UserPreference[]> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const pattern = `%${query}%`
	const rows = await db
		.select()
		.from(userPreferences)
		.where(or(like(userPreferences.key, pattern), like(userPreferences.value, pattern)))
		.orderBy(desc(userPreferences.updatedAt))
		.all()
	return rows
}

// ============================================================
// Agent Memories CRUD
// ============================================================

export async function listMemories(
	projectPath?: string,
	category?: string,
	limit = 50,
): Promise<AgentMemory[]> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const conditions = []
	if (projectPath) {
		conditions.push(
			or(eq(agentMemories.projectPath, projectPath), sql`${agentMemories.projectPath} IS NULL`)!,
		)
	}
	if (category) {
		conditions.push(eq(agentMemories.category, category))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined
	const rows = await db
		.select()
		.from(agentMemories)
		.where(where)
		.orderBy(desc(agentMemories.weight), desc(agentMemories.updatedAt))
		.limit(limit)
		.all()
	return rows
}

export async function getMemory(id: string): Promise<AgentMemory | null> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const row = await db.select().from(agentMemories).where(eq(agentMemories.id, id)).get()
	return row ?? null
}

export async function createMemory(input: CreateMemoryInput): Promise<AgentMemory> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const now = Date.now()
	const id = crypto.randomUUID()

	const row = await db
		.insert(agentMemories)
		.values({
			id,
			projectPath: input.projectPath ?? null,
			sessionId: input.sessionId ?? null,
			category: input.category,
			summary: input.summary,
			content: input.content,
			weight: input.weight ?? 50,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()
	log.info("Memory created", { id, category: input.category, summary: input.summary.slice(0, 50) })
	return row
}

export async function updateMemory(input: UpdateMemoryInput): Promise<AgentMemory | null> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const existing = await db.select().from(agentMemories).where(eq(agentMemories.id, input.id)).get()
	if (!existing) return null

	const updates: Record<string, unknown> = { updatedAt: Date.now() }
	if (input.summary !== undefined) updates.summary = input.summary
	if (input.content !== undefined) updates.content = input.content
	if (input.weight !== undefined) updates.weight = input.weight
	if (input.category !== undefined) updates.category = input.category

	const row = await db.update(agentMemories).set(updates).where(eq(agentMemories.id, input.id)).returning().get()
	log.debug("Memory updated", { id: input.id })
	return row
}

export async function deleteMemory(id: string): Promise<boolean> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const existing = await db.select().from(agentMemories).where(eq(agentMemories.id, id)).get()
	if (!existing) return false
	await db.delete(agentMemories).where(eq(agentMemories.id, id)).run()
	log.debug("Memory deleted", { id })
	return true
}

export async function searchMemories(
	query: string,
	projectPath?: string,
	limit = 10,
): Promise<AgentMemory[]> {
	await ensureMemoryTables()
	const db = await ensureDb()
	const pattern = `%${query}%`
	const conditions = [
		or(like(agentMemories.summary, pattern), like(agentMemories.content, pattern)),
	]
	if (projectPath) {
		conditions.push(
			or(eq(agentMemories.projectPath, projectPath), sql`${agentMemories.projectPath} IS NULL`)!,
		)
	}

	const rows = await db
		.select()
		.from(agentMemories)
		.where(and(...conditions))
		.orderBy(desc(agentMemories.weight), desc(agentMemories.updatedAt))
		.limit(limit)
		.all()
	return rows
}

// ============================================================
// Context Injection — builds context string for AI prompts
// ============================================================

/**
 * Build memory context string for a project.
 * Fetches preferences + memories, formats them for injection into prompts.
 */
export async function getMemoryContext(projectPath: string): Promise<string> {
	await ensureMemoryTables()
	const [prefs, memories] = await Promise.all([
		listPreferences(projectPath),
		listMemories(projectPath, undefined, 20),
	])

	if (prefs.length === 0 && memories.length === 0) return ""

	const lines: string[] = []

	if (prefs.length > 0) {
		lines.push("# User Preferences (remembered across sessions)")
		for (const p of prefs) {
			const scope = p.projectPath ? "project" : "global"
			lines.push(`- [${p.category}/${scope}] ${p.key}: ${p.value}`)
		}
	}

	if (memories.length > 0) {
		if (lines.length > 0) lines.push("")
		lines.push("# Agent Memories (learned from past sessions)")
		for (const m of memories) {
			lines.push(`- [${m.category}] ${m.summary}`)
			if (m.content !== m.summary) {
				lines.push(`  ${m.content}`)
			}
		}
	}

	return lines.join("\n")
}
