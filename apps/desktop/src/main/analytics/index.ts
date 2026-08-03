import { sql, desc, eq } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { analyticsSessions } from "./schema"

const log = createLogger("analytics")

export interface AnalyticsSession {
	id: string
	projectId: string | null
	modelName: string | null
	durationSeconds: number
	tokensUsed: number
	estimatedCost: number
	createdAt: number
	endedAt: number | null
}

export interface AnalyticsDashboardStats {
	totalSessions: number
	totalTokensUsed: number
	estimatedCost: number
	avgSessionDuration: number
	mostUsedSkills: { name: string; count: number }[]
	sessionsByDay: { date: string; count: number }[]
	topModels: { name: string; usage: number }[]
}

let tablesEnsured = false

async function ensureAnalyticsTables() {
	if (tablesEnsured) return
	const db = await ensureDb()

	await db.run(sql`
		CREATE TABLE IF NOT EXISTS analytics_sessions (
			id text PRIMARY KEY,
			project_id text,
			model_name text,
			duration_seconds integer DEFAULT 0,
			tokens_used integer DEFAULT 0,
			estimated_cost real DEFAULT 0.0,
			created_at integer NOT NULL,
			ended_at integer
		)
	`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_sessions (created_at)`)
	await db.run(sql`CREATE INDEX IF NOT EXISTS idx_analytics_project ON analytics_sessions (project_id)`)

	tablesEnsured = true
	log.info("Analytics tables ensured")
}

export async function trackSessionStart(id: string, projectId?: string, modelName?: string): Promise<void> {
	await ensureAnalyticsTables()
	const db = await ensureDb()
	const now = Date.now()

	try {
		await db.insert(analyticsSessions).values({
			id,
			projectId: projectId ?? null,
			modelName: modelName ?? null,
			createdAt: now,
		})
	} catch (err: any) {
		// Ignore constraint errors if we already started tracking this session
		if (!err.message?.includes("UNIQUE constraint failed")) {
			log.error("Failed to track session start", err)
		}
	}
}

export async function trackSessionEnd(id: string): Promise<void> {
	await ensureAnalyticsTables()
	const db = await ensureDb()
	const now = Date.now()

	try {
		const session = await db.select().from(analyticsSessions).where(eq(analyticsSessions.id, id)).get()
		if (session) {
			const duration = Math.floor((now - session.createdAt) / 1000)
			await db.update(analyticsSessions).set({
				endedAt: now,
				durationSeconds: duration
			}).where(eq(analyticsSessions.id, id))
		}
	} catch (err) {
		log.error("Failed to track session end", err)
	}
}

export async function getDashboardStats(): Promise<AnalyticsDashboardStats> {
	await ensureAnalyticsTables()
	const db = await ensureDb()

	const sessions = await db.select().from(analyticsSessions).orderBy(desc(analyticsSessions.createdAt)).all()

	let totalTokensUsed = 0
	let estimatedCost = 0
	let totalDuration = 0
	const modelsMap = new Map<string, number>()
	const daysMap = new Map<string, number>()

	for (const session of sessions) {
		totalTokensUsed += session.tokensUsed || 0
		estimatedCost += session.estimatedCost || 0
		totalDuration += session.durationSeconds || 0

		if (session.modelName) {
			modelsMap.set(session.modelName, (modelsMap.get(session.modelName) || 0) + 1)
		}

		const date = new Date(session.createdAt).toISOString().split('T')[0]
		daysMap.set(date, (daysMap.get(date) || 0) + 1)
	}

	const totalSessions = sessions.length
	const avgSessionDuration = totalSessions > 0 ? Math.floor(totalDuration / totalSessions) : 0

	const topModels = Array.from(modelsMap.entries())
		.map(([name, usage]) => ({ name, usage }))
		.sort((a, b) => b.usage - a.usage)
		.slice(0, 5)

	const sessionsByDay = Array.from(daysMap.entries())
		.map(([date, count]) => ({ date, count }))
		.sort((a, b) => a.date.localeCompare(b.date))
		.slice(-30) // last 30 days

	return {
		totalSessions,
		totalTokensUsed,
		estimatedCost,
		avgSessionDuration,
		mostUsedSkills: [], // SDK integration needed for skills
		sessionsByDay,
		topModels,
	}
}
