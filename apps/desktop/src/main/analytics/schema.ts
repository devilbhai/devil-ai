import { index, int, sqliteTable, text, real } from "drizzle-orm/sqlite-core"

export const analyticsSessions = sqliteTable(
	"analytics_sessions",
	{
		id: text("id").primaryKey(), // We use the session ID from OpenCode
		projectId: text("project_id"),
		modelName: text("model_name"),
		durationSeconds: int("duration_seconds").default(0),
		tokensUsed: int("tokens_used").default(0), // For future use
		estimatedCost: real("estimated_cost").default(0.0), // For future use
		createdAt: int("created_at").notNull(),
		endedAt: int("ended_at"), // Nullable until session is closed
	},
	(table) => [
		index("idx_analytics_created").on(table.createdAt),
		index("idx_analytics_project").on(table.projectId),
	],
)
