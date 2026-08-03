/**
 * Snippets Manager CRUD operations.
 *
 * Provides create, read, update, delete, search, and usage tracking
 * for reusable code snippets with language detection.
 */

import { eq, like, or, desc, sql } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { snippets } from "./schema"

const log = createLogger("snippets")

export interface Snippet {
	id: string
	title: string
	content: string
	language: string
	tags: string
	projectPath: string | null
	useCount: number
	isFavorite: boolean
	createdAt: number
	updatedAt: number
}

export interface CreateSnippetInput {
	title: string
	content?: string
	language?: string
	tags?: string
	projectPath?: string
	isFavorite?: boolean
}

export interface UpdateSnippetInput {
	id: string
	title?: string
	content?: string
	language?: string
	tags?: string
	projectPath?: string
	isFavorite?: boolean
}

let tablesEnsured = false

async function ensureSnippetTables() {
	if (tablesEnsured) return
	const db = await ensureDb()

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS snippets (
			id text PRIMARY KEY,
			title text NOT NULL,
			content text NOT NULL DEFAULT '',
			language text NOT NULL DEFAULT 'text',
			tags text DEFAULT '',
			project_path text,
			use_count integer NOT NULL DEFAULT 0,
			is_favorite integer NOT NULL DEFAULT 0,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets (created_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_snippets_updated ON snippets (updated_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets (language)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_snippets_project ON snippets (project_path)`)

	tablesEnsured = true
	log.info("Snippet tables ensured")
}

export async function listSnippets(): Promise<Snippet[]> {
	await ensureSnippetTables()
	const db = await ensureDb()
	const rows = await db.select().from(snippets).orderBy(desc(snippets.updatedAt)).all()
	return rows.map((r) => ({
		...r,
		tags: r.tags ?? "",
		isFavorite: Boolean(r.isFavorite),
	}))
}

export async function getSnippet(id: string): Promise<Snippet | null> {
	await ensureSnippetTables()
	const db = await ensureDb()
	const row = await db.select().from(snippets).where(eq(snippets.id, id)).get()
	if (!row) return null
	return { ...row, tags: row.tags ?? "", isFavorite: Boolean(row.isFavorite) }
}

export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
	await ensureSnippetTables()
	const db = await ensureDb()
	const now = Date.now()
	const id = crypto.randomUUID()

	const row = await db
		.insert(snippets)
		.values({
			id,
			title: input.title,
			content: input.content ?? "",
			language: input.language ?? "text",
			tags: input.tags ?? "",
			projectPath: input.projectPath ?? null,
			isFavorite: input.isFavorite ?? false,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()

	log.info("Snippet created", { id, title: input.title })
	return { ...row, tags: row.tags ?? "", isFavorite: Boolean(row.isFavorite) }
}

export async function updateSnippet(input: UpdateSnippetInput): Promise<Snippet | null> {
	await ensureSnippetTables()
	const db = await ensureDb()
	const existing = await db.select().from(snippets).where(eq(snippets.id, input.id)).get()
	if (!existing) return null

	const updates: Record<string, unknown> = { updatedAt: Date.now() }
	if (input.title !== undefined) updates.title = input.title
	if (input.content !== undefined) updates.content = input.content
	if (input.language !== undefined) updates.language = input.language
	if (input.tags !== undefined) updates.tags = input.tags
	if (input.projectPath !== undefined) updates.projectPath = input.projectPath
	if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite ? 1 : 0

	const row = await db.update(snippets).set(updates).where(eq(snippets.id, input.id)).returning().get()
	log.info("Snippet updated", { id: input.id })
	return { ...row, tags: row.tags ?? "", isFavorite: Boolean(row.isFavorite) }
}

export async function deleteSnippet(id: string): Promise<boolean> {
	await ensureSnippetTables()
	const db = await ensureDb()
	const existing = await db.select().from(snippets).where(eq(snippets.id, id)).get()
	if (!existing) return false

	await db.delete(snippets).where(eq(snippets.id, id)).run()
	log.info("Snippet deleted", { id })
	return true
}

export async function searchSnippets(query: string): Promise<Snippet[]> {
	await ensureSnippetTables()
	const db = await ensureDb()
	const pattern = `%${query}%`
	const rows = await db
		.select()
		.from(snippets)
		.where(
			or(
				like(snippets.title, pattern),
				like(snippets.content, pattern),
				like(snippets.tags, pattern),
				like(snippets.language, pattern),
			),
		)
		.orderBy(desc(snippets.updatedAt))
		.all()
	return rows.map((r) => ({ ...r, tags: r.tags ?? "", isFavorite: Boolean(r.isFavorite) }))
}

/** Increment usage count when a snippet is inserted into chat */
export async function incrementSnippetUsage(id: string): Promise<void> {
	await ensureSnippetTables()
	const db = await ensureDb()
	await db
		.update(snippets)
		.set({ useCount: sql`${snippets.useCount} + 1`, updatedAt: Date.now() })
		.where(eq(snippets.id, id))
		.run()
}
