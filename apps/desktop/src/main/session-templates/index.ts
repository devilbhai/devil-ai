/**
 * Session Templates CRUD operations.
 *
 * Provides create, read, update, delete, and usage tracking
 * for pre-configured session setups.
 */

import { eq, like, or, desc, sql } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { sessionTemplates } from "./schema"

const log = createLogger("session-templates")

export interface SessionTemplate {
	id: string
	name: string
	description: string
	/** JSON-serialized config: { model, systemPrompt, skills[], temperature } */
	config: string
	category: string
	useCount: number
	isFavorite: boolean
	createdAt: number
	updatedAt: number
}

export interface TemplateConfig {
	model?: string
	systemPrompt?: string
	skills?: string[]
	temperature?: number
	maxTokens?: number
	[key: string]: unknown
}

export interface CreateTemplateInput {
	name: string
	description?: string
	config?: TemplateConfig | string
	category?: string
	isFavorite?: boolean
}

export interface UpdateTemplateInput {
	id: string
	name?: string
	description?: string
	config?: TemplateConfig | string
	category?: string
	isFavorite?: boolean
}

export async function listTemplates(): Promise<SessionTemplate[]> {
	const db = await ensureDb()
	const rows = await db.select().from(sessionTemplates).orderBy(desc(sessionTemplates.updatedAt)).all()
	return rows.map((r) => ({
		...r,
		isFavorite: Boolean(r.isFavorite),
	}))
}

export async function getTemplate(id: string): Promise<SessionTemplate | null> {
	const db = await ensureDb()
	const row = await db.select().from(sessionTemplates).where(eq(sessionTemplates.id, id)).get()
	if (!row) return null
	return { ...row, isFavorite: Boolean(row.isFavorite) }
}

export async function createTemplate(input: CreateTemplateInput): Promise<SessionTemplate> {
	const db = await ensureDb()
	const now = Date.now()
	const id = crypto.randomUUID()
	const configStr = typeof input.config === "string" ? input.config : JSON.stringify(input.config ?? {})

	const row = await db
		.insert(sessionTemplates)
		.values({
			id,
			name: input.name,
			description: input.description ?? "",
			config: configStr,
			category: input.category ?? "general",
			isFavorite: input.isFavorite ?? false,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()

	log.info("Template created", { id, name: input.name })
	return { ...row, isFavorite: Boolean(row.isFavorite) }
}

export async function updateTemplate(input: UpdateTemplateInput): Promise<SessionTemplate | null> {
	const db = await ensureDb()
	const existing = await db.select().from(sessionTemplates).where(eq(sessionTemplates.id, input.id)).get()
	if (!existing) return null

	const updates: Record<string, unknown> = { updatedAt: Date.now() }
	if (input.name !== undefined) updates.name = input.name
	if (input.description !== undefined) updates.description = input.description
	if (input.config !== undefined) {
		updates.config = typeof input.config === "string" ? input.config : JSON.stringify(input.config)
	}
	if (input.category !== undefined) updates.category = input.category
	if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite ? 1 : 0

	const row = await db.update(sessionTemplates).set(updates).where(eq(sessionTemplates.id, input.id)).returning().get()
	log.info("Template updated", { id: input.id })
	return { ...row, isFavorite: Boolean(row.isFavorite) }
}

export async function deleteTemplate(id: string): Promise<boolean> {
	const db = await ensureDb()
	const existing = await db.select().from(sessionTemplates).where(eq(sessionTemplates.id, id)).get()
	if (!existing) return false

	await db.delete(sessionTemplates).where(eq(sessionTemplates.id, id)).run()
	log.info("Template deleted", { id })
	return true
}

export async function searchTemplates(query: string): Promise<SessionTemplate[]> {
	const db = await ensureDb()
	const pattern = `%${query}%`
	const rows = await db
		.select()
		.from(sessionTemplates)
		.where(
			or(
				like(sessionTemplates.name, pattern),
				like(sessionTemplates.description, pattern),
				like(sessionTemplates.category, pattern),
			),
		)
		.orderBy(desc(sessionTemplates.updatedAt))
		.all()
	return rows.map((r) => ({ ...r, isFavorite: Boolean(r.isFavorite) }))
}

/** Increment usage count when a template is applied */
export async function incrementTemplateUsage(id: string): Promise<void> {
	const db = await ensureDb()
	await db
		.update(sessionTemplates)
		.set({ useCount: sql`${sessionTemplates.useCount} + 1`, updatedAt: Date.now() })
		.where(eq(sessionTemplates.id, id))
		.run()
}

/** Parse template config from JSON string */
export function parseTemplateConfig(config: string): TemplateConfig {
	try {
		return JSON.parse(config)
	} catch {
		return {}
	}
}
