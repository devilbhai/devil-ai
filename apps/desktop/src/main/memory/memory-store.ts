/**
 * Memory Store — CRUD operations for the 5 new memory tables.
 *
 * conversation_log: stores every prompt and response.
 * project_knowledge: tracks what was done per project.
 * learned_skills: reusable patterns accumulated from tasks.
 * memory_embeddings: TF-IDF vectors for semantic search.
 * memory_consolidation: tracks auto-summarization.
 */

import { eq, like, or, desc, and, sql } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import {
	conversationLog,
	projectKnowledge,
	learnedSkills,
	memoryEmbeddings,
	memoryConsolidation,
} from "./schema"

const log = createLogger("memory-store")

// ============================================================
// Ensure tables exist (idempotent)
// ============================================================

let tablesEnsured = false

export async function ensureMemoryStoreTables() {
	if (tablesEnsured) return
	const db = await ensureDb()

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS conversation_log (
			id text PRIMARY KEY,
			session_id text,
			project_path text,
			role text NOT NULL,
			content text NOT NULL,
			summary text,
			token_count integer,
			topics text,
			timestamp integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_conv_session ON conversation_log (session_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_conv_project ON conversation_log (project_path)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_conv_role ON conversation_log (role)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_conv_timestamp ON conversation_log (timestamp)`)

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS project_knowledge (
			id text PRIMARY KEY,
			project_path text NOT NULL,
			type text NOT NULL,
			title text NOT NULL,
			description text NOT NULL,
			files text,
			session_id text,
			technologies text,
			weight integer DEFAULT 50 NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pk_project ON project_knowledge (project_path)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pk_type ON project_knowledge (type)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pk_session ON project_knowledge (session_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pk_weight ON project_knowledge (weight)`)

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS learned_skills (
			id text PRIMARY KEY,
			category text NOT NULL,
			name text NOT NULL,
			description text NOT NULL,
			pattern text NOT NULL,
			example text,
			use_count integer DEFAULT 0 NOT NULL,
			success_rate integer DEFAULT 100 NOT NULL,
			session_id text,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_skill_category ON learned_skills (category)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_skill_name ON learned_skills (name)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_skill_useCount ON learned_skills (use_count)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_skill_successRate ON learned_skills (success_rate)`)

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS memory_embeddings (
			id text PRIMARY KEY,
			source_type text NOT NULL,
			source_id text NOT NULL,
			text text NOT NULL,
			vector text NOT NULL,
			keywords text,
			created_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_emb_source ON memory_embeddings (source_type, source_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_emb_created ON memory_embeddings (created_at)`)

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS memory_consolidation (
			id text PRIMARY KEY,
			session_id text,
			project_path text,
			conversation_ids text,
			summary text NOT NULL,
			learnings text,
			message_count integer DEFAULT 0 NOT NULL,
			consolidated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_con_session ON memory_consolidation (session_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_con_project ON memory_consolidation (project_path)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_con_at ON memory_consolidation (consolidated_at)`)

	// Connector tokens table
	await db.run(sql`
		CREATE TABLE IF NOT EXISTS connector_tokens (
			id text PRIMARY KEY,
			user_email text NOT NULL,
			connector_id text NOT NULL,
			access_token text,
			refresh_token text,
			expires_at integer,
			scope text,
			metadata text,
			last_synced_at integer NOT NULL,
			is_active integer DEFAULT 1 NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ct_user ON connector_tokens (user_email)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ct_connector ON connector_tokens (connector_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ct_user_connector ON connector_tokens (user_email, connector_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ct_active ON connector_tokens (is_active)`)

	tablesEnsured = true
	log.info("Memory store tables ensured")
}

// ============================================================
// Types
// ============================================================

export interface ConversationEntry {
	id: string
	sessionId: string | null
	projectPath: string | null
	role: string
	content: string
	summary: string | null
	tokenCount: number | null
	topics: string | null
	timestamp: number
}

export interface ProjectKnowledgeEntry {
	id: string
	projectPath: string
	type: string
	title: string
	description: string
	files: string | null
	sessionId: string | null
	technologies: string | null
	weight: number
	createdAt: number
	updatedAt: number
}

export interface LearnedSkill {
	id: string
	category: string
	name: string
	description: string
	pattern: string
	example: string | null
	useCount: number
	successRate: number
	sessionId: string | null
	createdAt: number
	updatedAt: number
}

export interface MemoryEmbedding {
	id: string
	sourceType: string
	sourceId: string
	text: string
	vector: string
	keywords: string | null
	createdAt: number
}

export interface MemoryConsolidationEntry {
	id: string
	sessionId: string | null
	projectPath: string | null
	conversationIds: string | null
	summary: string
	learnings: string | null
	messageCount: number
	consolidatedAt: number
}

// ============================================================
// Conversation Log CRUD
// ============================================================

export async function logConversation(entry: {
	sessionId?: string
	projectPath?: string
	role: string
	content: string
	summary?: string
	tokenCount?: number
	topics?: string
}): Promise<ConversationEntry> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const id = crypto.randomUUID()
	const now = Date.now()

	const row = await db
		.insert(conversationLog)
		.values({
			id,
			sessionId: entry.sessionId ?? null,
			projectPath: entry.projectPath ?? null,
			role: entry.role,
			content: entry.content,
			summary: entry.summary ?? null,
			tokenCount: entry.tokenCount ?? null,
			topics: entry.topics ?? null,
			timestamp: now,
		})
		.returning()
		.get()

	return row
}

export async function getConversationHistory(options: {
	sessionId?: string
	projectPath?: string
	limit?: number
	offset?: number
} = {}): Promise<ConversationEntry[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const { sessionId, projectPath, limit = 50, offset = 0 } = options

	const conditions = []
	if (sessionId) conditions.push(eq(conversationLog.sessionId, sessionId))
	if (projectPath) conditions.push(eq(conversationLog.projectPath, projectPath))

	const where = conditions.length > 0 ? and(...conditions) : undefined

	return db
		.select()
		.from(conversationLog)
		.where(where)
		.orderBy(desc(conversationLog.timestamp))
		.limit(limit)
		.offset(offset)
		.all()
}

export async function searchConversations(
	query: string,
	projectPath?: string,
	limit = 20,
): Promise<ConversationEntry[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const pattern = `%${query}%`

	const conditions = [
		or(like(conversationLog.content, pattern), like(conversationLog.topics, pattern)),
	]
	if (projectPath) conditions.push(eq(conversationLog.projectPath, projectPath))

	return db
		.select()
		.from(conversationLog)
		.where(and(...conditions))
		.orderBy(desc(conversationLog.timestamp))
		.limit(limit)
		.all()
}

// ============================================================
// Project Knowledge CRUD
// ============================================================

export async function addProjectKnowledge(entry: {
	projectPath: string
	type: string
	title: string
	description: string
	files?: string
	sessionId?: string
	technologies?: string
	weight?: number
}): Promise<ProjectKnowledgeEntry> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const id = crypto.randomUUID()
	const now = Date.now()

	return db
		.insert(projectKnowledge)
		.values({
			id,
			projectPath: entry.projectPath,
			type: entry.type,
			title: entry.title,
			description: entry.description,
			files: entry.files ?? null,
			sessionId: entry.sessionId ?? null,
			technologies: entry.technologies ?? null,
			weight: entry.weight ?? 50,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()
}

export async function getProjectKnowledge(
	projectPath: string,
	type?: string,
	limit = 50,
): Promise<ProjectKnowledgeEntry[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()

	const conditions = [eq(projectKnowledge.projectPath, projectPath)]
	if (type) conditions.push(eq(projectKnowledge.type, type))

	return db
		.select()
		.from(projectKnowledge)
		.where(and(...conditions))
		.orderBy(desc(projectKnowledge.weight), desc(projectKnowledge.updatedAt))
		.limit(limit)
		.all()
}

export async function searchProjectKnowledge(
	query: string,
	projectPath?: string,
	limit = 20,
): Promise<ProjectKnowledgeEntry[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const pattern = `%${query}%`

	const conditions = [
		or(like(projectKnowledge.title, pattern), like(projectKnowledge.description, pattern)),
	]
	if (projectPath) conditions.push(eq(projectKnowledge.projectPath, projectPath))

	return db
		.select()
		.from(projectKnowledge)
		.where(and(...conditions))
		.orderBy(desc(projectKnowledge.weight), desc(projectKnowledge.updatedAt))
		.limit(limit)
		.all()
}

// ============================================================
// Learned Skills CRUD
// ============================================================

export async function addLearnedSkill(entry: {
	category: string
	name: string
	description: string
	pattern: string
	example?: string
	sessionId?: string
}): Promise<LearnedSkill> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const now = Date.now()

	// Check if skill with same name+category exists
	const existing = await db
		.select()
		.from(learnedSkills)
		.where(and(eq(learnedSkills.name, entry.name), eq(learnedSkills.category, entry.category)))
		.get()

	if (existing) {
		// Update use count and timestamp
		return db
			.update(learnedSkills)
			.set({
				useCount: existing.useCount + 1,
				updatedAt: now,
			})
			.where(eq(learnedSkills.id, existing.id))
			.returning()
			.get()
	}

	const id = crypto.randomUUID()
	return db
		.insert(learnedSkills)
		.values({
			id,
			category: entry.category,
			name: entry.name,
			description: entry.description,
			pattern: entry.pattern,
			example: entry.example ?? null,
			useCount: 1,
			successRate: 100,
			sessionId: entry.sessionId ?? null,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()
}

export async function getLearnedSkills(
	category?: string,
	limit = 50,
): Promise<LearnedSkill[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()

	const where = category ? eq(learnedSkills.category, category) : undefined

	return db
		.select()
		.from(learnedSkills)
		.where(where)
		.orderBy(desc(learnedSkills.useCount), desc(learnedSkills.updatedAt))
		.limit(limit)
		.all()
}

export async function searchLearnedSkills(
	query: string,
	limit = 20,
): Promise<LearnedSkill[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const pattern = `%${query}%`

	return db
		.select()
		.from(learnedSkills)
		.where(
			or(
				like(learnedSkills.name, pattern),
				like(learnedSkills.description, pattern),
				like(learnedSkills.pattern, pattern),
			),
		)
		.orderBy(desc(learnedSkills.useCount))
		.limit(limit)
		.all()
}

export async function useLearnedSkill(id: string): Promise<LearnedSkill | null> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const existing = await db.select().from(learnedSkills).where(eq(learnedSkills.id, id)).get()
	if (!existing) return null

	return db
		.update(learnedSkills)
		.set({ useCount: existing.useCount + 1, updatedAt: Date.now() })
		.where(eq(learnedSkills.id, id))
		.returning()
		.get()
}

// ============================================================
// Memory Embeddings CRUD
// ============================================================

export async function saveEmbedding(entry: {
	sourceType: string
	sourceId: string
	text: string
	vector: Record<string, number>
	keywords?: string[]
}): Promise<MemoryEmbedding> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const id = crypto.randomUUID()

	// Check if embedding already exists for this source
	const existing = await db
		.select()
		.from(memoryEmbeddings)
		.where(
			and(
				eq(memoryEmbeddings.sourceType, entry.sourceType),
				eq(memoryEmbeddings.sourceId, entry.sourceId),
			),
		)
		.get()

	if (existing) {
		return db
			.update(memoryEmbeddings)
			.set({
				text: entry.text,
				vector: JSON.stringify(entry.vector),
				keywords: entry.keywords?.join(",") ?? null,
			})
			.where(eq(memoryEmbeddings.id, existing.id))
			.returning()
			.get()
	}

	return db
		.insert(memoryEmbeddings)
		.values({
			id,
			sourceType: entry.sourceType,
			sourceId: entry.sourceId,
			text: entry.text,
			vector: JSON.stringify(entry.vector),
			keywords: entry.keywords?.join(",") ?? null,
			createdAt: Date.now(),
		})
		.returning()
		.get()
}

export async function getEmbeddingsForSource(
	sourceType: string,
	sourceId: string,
): Promise<MemoryEmbedding[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()

	return db
		.select()
		.from(memoryEmbeddings)
		.where(
			and(
				eq(memoryEmbeddings.sourceType, sourceType),
				eq(memoryEmbeddings.sourceId, sourceId),
			),
		)
		.all()
}

export async function getAllEmbeddings(limit = 500): Promise<MemoryEmbedding[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()

	return db
		.select()
		.from(memoryEmbeddings)
		.orderBy(desc(memoryEmbeddings.createdAt))
		.limit(limit)
		.all()
}

// ============================================================
// Memory Consolidation CRUD
// ============================================================

export async function saveConsolidation(entry: {
	sessionId?: string
	projectPath?: string
	conversationIds?: string[]
	summary: string
	learnings?: string
	messageCount: number
}): Promise<MemoryConsolidationEntry> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()
	const id = crypto.randomUUID()

	return db
		.insert(memoryConsolidation)
		.values({
			id,
			sessionId: entry.sessionId ?? null,
			projectPath: entry.projectPath ?? null,
			conversationIds: entry.conversationIds?.join(",") ?? null,
			summary: entry.summary,
			learnings: entry.learnings ?? null,
			messageCount: entry.messageCount,
			consolidatedAt: Date.now(),
		})
		.returning()
		.get()
}

export async function getConsolidations(
	projectPath?: string,
	limit = 20,
): Promise<MemoryConsolidationEntry[]> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()

	const where = projectPath ? eq(memoryConsolidation.projectPath, projectPath) : undefined

	return db
		.select()
		.from(memoryConsolidation)
		.where(where)
		.orderBy(desc(memoryConsolidation.consolidatedAt))
		.limit(limit)
		.all()
}

// ============================================================
// Stats
// ============================================================

export async function getMemoryStats(): Promise<{
	conversations: number
	knowledge: number
	skills: number
	embeddings: number
	consolidations: number
}> {
	await ensureMemoryStoreTables()
	const db = await ensureDb()

	const [convCount] = await db.select({ count: sql<number>`count(*)` }).from(conversationLog).all()
	const [knowCount] = await db.select({ count: sql<number>`count(*)` }).from(projectKnowledge).all()
	const [skillCount] = await db.select({ count: sql<number>`count(*)` }).from(learnedSkills).all()
	const [embCount] = await db.select({ count: sql<number>`count(*)` }).from(memoryEmbeddings).all()
	const [conCount] = await db.select({ count: sql<number>`count(*)` }).from(memoryConsolidation).all()

	return {
		conversations: convCount?.count ?? 0,
		knowledge: knowCount?.count ?? 0,
		skills: skillCount?.count ?? 0,
		embeddings: embCount?.count ?? 0,
		consolidations: conCount?.count ?? 0,
	}
}