/**
 * Notes CRUD operations.
 *
 * Provides create, read, update, delete, and search for user notes.
 * Notes are stored in SQLite via LibSQL + Drizzle ORM.
 */

import { eq, like, or, desc, sql } from "drizzle-orm"
import crypto from "node:crypto"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { notes } from "./schema"

const log = createLogger("notes")

export interface Note {
	id: string
	title: string
	content: string
	tags: string
	sessionId: string | null
	projectPath: string | null
	includeInContext: boolean
	createdAt: number
	updatedAt: number
}

export interface CreateNoteInput {
	title: string
	content?: string
	tags?: string
	sessionId?: string
	projectPath?: string
	includeInContext?: boolean
}

export interface UpdateNoteInput {
	id: string
	title?: string
	content?: string
	tags?: string
	includeInContext?: boolean
}

let tablesEnsured = false

async function ensureNotesTables() {
	if (tablesEnsured) return
	const db = await ensureDb()

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS notes (
			id text PRIMARY KEY,
			title text NOT NULL,
			content text NOT NULL DEFAULT '',
			tags text DEFAULT '',
			session_id text,
			project_path text,
			include_in_context integer NOT NULL DEFAULT 0,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notes_created ON notes (created_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes (updated_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notes_session ON notes (session_id)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notes_project ON notes (project_path)`)

	tablesEnsured = true
	log.info("Notes tables ensured")
}

export async function listNotes(): Promise<Note[]> {
	await ensureNotesTables()
	const db = await ensureDb()
	const rows = await db.select().from(notes).orderBy(desc(notes.updatedAt)).all()
	return rows.map((r) => ({
		...r,
		tags: r.tags ?? "",
		includeInContext: Boolean(r.includeInContext),
	}))
}

export async function getNote(id: string): Promise<Note | null> {
	await ensureNotesTables()
	const db = await ensureDb()
	const row = await db.select().from(notes).where(eq(notes.id, id)).get()
	if (!row) return null
	return { ...row, tags: row.tags ?? "", includeInContext: Boolean(row.includeInContext) }
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
	await ensureNotesTables()
	const db = await ensureDb()
	const now = Date.now()
	const id = crypto.randomUUID()

	const row = await db
		.insert(notes)
		.values({
			id,
			title: input.title,
			content: input.content ?? "",
			tags: input.tags ?? "",
			sessionId: input.sessionId ?? null,
			projectPath: input.projectPath ?? null,
			includeInContext: input.includeInContext ?? true,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()

	log.info("Note created", { id, title: input.title })
	return { ...row, tags: row.tags ?? "", includeInContext: Boolean(row.includeInContext) }
}

export async function updateNote(input: UpdateNoteInput): Promise<Note | null> {
	await ensureNotesTables()
	const db = await ensureDb()
	const existing = await db.select().from(notes).where(eq(notes.id, input.id)).get()
	if (!existing) return null

	const updates: Record<string, unknown> = { updatedAt: Date.now() }
	if (input.title !== undefined) updates.title = input.title
	if (input.content !== undefined) updates.content = input.content
	if (input.tags !== undefined) updates.tags = input.tags
	if (input.includeInContext !== undefined) updates.includeInContext = input.includeInContext ? 1 : 0

	const row = await db.update(notes).set(updates).where(eq(notes.id, input.id)).returning().get()
	log.info("Note updated", { id: input.id })
	return { ...row, tags: row.tags ?? "", includeInContext: Boolean(row.includeInContext) }
}

export async function deleteNote(id: string): Promise<boolean> {
	await ensureNotesTables()
	const db = await ensureDb()
	const existing = await db.select().from(notes).where(eq(notes.id, id)).get()
	if (!existing) return false

	await db.delete(notes).where(eq(notes.id, id)).run()
	log.info("Note deleted", { id })
	return true
}

export async function searchNotes(query: string): Promise<Note[]> {
	await ensureNotesTables()
	const db = await ensureDb()
	const pattern = `%${query}%`
	const rows = await db
		.select()
		.from(notes)
		.where(or(like(notes.title, pattern), like(notes.content, pattern), like(notes.tags, pattern)))
		.orderBy(desc(notes.updatedAt))
		.all()
	return rows.map((r) => ({ ...r, tags: r.tags ?? "", includeInContext: Boolean(r.includeInContext) }))
}

/**
 * Get all notes marked for AI context.
 * Returns formatted text that can be injected into system prompts.
 */
export async function getNotesForContext(projectPath?: string, promptText?: string): Promise<string> {
	await ensureNotesTables()
	const db = await ensureDb()
	const rows = await db
		.select()
		.from(notes)
		.where(sql`${notes.includeInContext} = 1`)
		.orderBy(desc(notes.updatedAt))
		.all()

	if (rows.length === 0) return ""

	let filtered = projectPath
		? rows.filter((r) => !r.projectPath || r.projectPath === projectPath)
		: rows

	if (promptText && promptText.trim().length > 0) {
		const promptLower = promptText.toLowerCase()
		filtered = filtered.filter((r) => {
			const titleLower = (r.title || "").toLowerCase()
			if (titleLower && promptLower.includes(titleLower)) return true

			const titleWords = titleLower.split(/\W+/).filter((w) => w.length > 3 && !["this", "that", "with", "from", "what", "when", "where", "which", "will", "would"].includes(w))
			const tagWords = (r.tags || "").toLowerCase().split(/\W+/).filter((w) => w.length > 2)

			const hasTitleWord = titleWords.length > 0 && titleWords.some((w) => promptLower.includes(w))
			const hasTagWord = tagWords.length > 0 && tagWords.some((w) => promptLower.includes(w))

			return hasTitleWord || hasTagWord
		})
	}

	if (filtered.length === 0) return ""

	const lines = filtered.map((r) => {
		const tags = r.tags ? ` [${r.tags}]` : ""
		return `## ${r.title}${tags}\n${r.content}`
	})

	return `# User Notes (Memory)\n\n${lines.join("\n\n")}`
}
