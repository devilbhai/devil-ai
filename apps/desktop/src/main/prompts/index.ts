/**
 * Prompt Library CRUD operations.
 *
 * Provides create, read, update, delete, search, and usage tracking
 * for reusable prompt templates with {{variable}} support.
 */

import { eq, like, or, desc, sql } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { prompts } from "./schema"

const log = createLogger("prompts")

export interface Prompt {
	id: string
	title: string
	content: string
	tags: string
	category: string
	useCount: number
	isFavorite: boolean
	createdAt: number
	updatedAt: number
}

export interface CreatePromptInput {
	title: string
	content?: string
	tags?: string
	category?: string
	isFavorite?: boolean
}

export interface UpdatePromptInput {
	id: string
	title?: string
	content?: string
	tags?: string
	category?: string
	isFavorite?: boolean
}

let tablesEnsured = false

async function ensurePromptTables() {
	if (tablesEnsured) return
	const db = await ensureDb()

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS prompts (
			id text PRIMARY KEY,
			title text NOT NULL,
			content text NOT NULL DEFAULT '',
			tags text DEFAULT '',
			category text NOT NULL DEFAULT 'general',
			use_count integer NOT NULL DEFAULT 0,
			is_favorite integer NOT NULL DEFAULT 0,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts (created_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_prompts_updated ON prompts (updated_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts (category)`)

	tablesEnsured = true
	log.info("Prompt tables ensured")

	await seedDefaultPrompts(db)
}

async function seedDefaultPrompts(db: any): Promise<void> {
	const countRow = await db.select({ count: sql<number>`count(*)` }).from(prompts).get()
	if (countRow && countRow.count > 0) return

	const defaultPrompts: CreatePromptInput[] = [
		{ title: "Code Review", content: "Please review the following code for potential bugs, security issues, and performance improvements:\n\n{{code}}", category: "code-review", tags: "review,bug,security" },
		{ title: "Refactor to React Hooks", content: "Refactor the following React class component into a functional component using hooks:\n\n{{code}}", category: "refactor", tags: "react,hooks,refactor" },
		{ title: "Explain Code", content: "Explain what the following code does step by step:\n\n{{code}}", category: "general", tags: "explain,learning" },
		{ title: "Generate Unit Tests", content: "Write comprehensive unit tests for the following function using {{framework}}:\n\n{{code}}", category: "testing", tags: "test,unit-test" },
		{ title: "Add Comments", content: "Add clear and concise JSDoc comments to the following code:\n\n{{code}}", category: "documentation", tags: "docs,comments" },
		{ title: "Optimize Performance", content: "Optimize the following code for better performance and explain the changes:\n\n{{code}}", category: "refactor", tags: "optimize,performance" },
		{ title: "Fix Bug", content: "I'm getting this error: '{{error}}'. Help me fix it in the following code:\n\n{{code}}", category: "debugging", tags: "bug,fix,error" },
		{ title: "Generate Regex", content: "Write a regular expression to match {{pattern_description}} and provide examples of what it matches and doesn't match.", category: "general", tags: "regex,pattern" },
		{ title: "Write SQL Query", content: "Write an SQL query to {{query_description}} given the following schema:\n\n{{schema}}", category: "general", tags: "sql,database" },
		{ title: "Translate Code", content: "Translate the following {{source_language}} code into {{target_language}}:\n\n{{code}}", category: "general", tags: "translate,language" }
	]

	const now = Date.now()
	const insertValues = defaultPrompts.map(p => ({
		id: crypto.randomUUID(),
		title: p.title,
		content: p.content ?? "",
		tags: p.tags ?? "",
		category: p.category ?? "general",
		isFavorite: false,
		createdAt: now,
		updatedAt: now,
	}))

	await db.insert(prompts).values(insertValues).run()
	log.info("Seeded 10 default prompts")
}

export async function listPrompts(): Promise<Prompt[]> {
	await ensurePromptTables()
	const db = await ensureDb()
	const rows = await db.select().from(prompts).orderBy(desc(prompts.updatedAt)).all()
	return rows.map((r) => ({
		...r,
		tags: r.tags ?? "",
		isFavorite: Boolean(r.isFavorite),
	}))
}

export async function getPrompt(id: string): Promise<Prompt | null> {
	await ensurePromptTables()
	const db = await ensureDb()
	const row = await db.select().from(prompts).where(eq(prompts.id, id)).get()
	if (!row) return null
	return { ...row, tags: row.tags ?? "", isFavorite: Boolean(row.isFavorite) }
}

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
	await ensurePromptTables()
	const db = await ensureDb()
	const now = Date.now()
	const id = crypto.randomUUID()

	const row = await db
		.insert(prompts)
		.values({
			id,
			title: input.title,
			content: input.content ?? "",
			tags: input.tags ?? "",
			category: input.category ?? "general",
			isFavorite: input.isFavorite ?? false,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()

	log.info("Prompt created", { id, title: input.title })
	return { ...row, tags: row.tags ?? "", isFavorite: Boolean(row.isFavorite) }
}

export async function updatePrompt(input: UpdatePromptInput): Promise<Prompt | null> {
	await ensurePromptTables()
	const db = await ensureDb()
	const existing = await db.select().from(prompts).where(eq(prompts.id, input.id)).get()
	if (!existing) return null

	const updates: Record<string, unknown> = { updatedAt: Date.now() }
	if (input.title !== undefined) updates.title = input.title
	if (input.content !== undefined) updates.content = input.content
	if (input.tags !== undefined) updates.tags = input.tags
	if (input.category !== undefined) updates.category = input.category
	if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite ? 1 : 0

	const row = await db.update(prompts).set(updates).where(eq(prompts.id, input.id)).returning().get()
	log.info("Prompt updated", { id: input.id })
	return { ...row, tags: row.tags ?? "", isFavorite: Boolean(row.isFavorite) }
}

export async function deletePrompt(id: string): Promise<boolean> {
	await ensurePromptTables()
	const db = await ensureDb()
	const existing = await db.select().from(prompts).where(eq(prompts.id, id)).get()
	if (!existing) return false

	await db.delete(prompts).where(eq(prompts.id, id)).run()
	log.info("Prompt deleted", { id })
	return true
}

export async function searchPrompts(query: string): Promise<Prompt[]> {
	await ensurePromptTables()
	const db = await ensureDb()
	const pattern = `%${query}%`
	const rows = await db
		.select()
		.from(prompts)
		.where(or(like(prompts.title, pattern), like(prompts.content, pattern), like(prompts.tags, pattern)))
		.orderBy(desc(prompts.updatedAt))
		.all()
	return rows.map((r) => ({ ...r, tags: r.tags ?? "", isFavorite: Boolean(r.isFavorite) }))
}

/** Increment usage count when a prompt is inserted into chat */
export async function incrementPromptUsage(id: string): Promise<void> {
	await ensurePromptTables()
	const db = await ensureDb()
	await db
		.update(prompts)
		.set({ useCount: sql`${prompts.useCount} + 1`, updatedAt: Date.now() })
		.where(eq(prompts.id, id))
		.run()
}

/** Resolve {{variable}} placeholders in prompt content */
export function resolvePromptVariables(
	content: string,
	variables: Record<string, string>,
): string {
	return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

/** Extract variable names from prompt content */
export function extractPromptVariables(content: string): string[] {
	const matches = content.match(/\{\{(\w+)\}\}/g)
	if (!matches) return []
	return [...new Set(matches.map((m) => m.slice(2, -2)))]
}
