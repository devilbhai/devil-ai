/**
 * Drizzle ORM schema for notes table.
 *
 * Notes store user's coding memory - snippets, context, project knowledge.
 * AI can read these to provide better suggestions across sessions.
 */

import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const notes = sqliteTable(
	"notes",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		content: text("content").notNull().default(""),
		/** Tags for categorization (comma-separated) */
		tags: text("tags").default(""),
		/** Optional link to a session that created this note */
		sessionId: text("session_id"),
		/** Optional link to a project directory */
		projectPath: text("project_path"),
		/** Whether this note should be included in AI context */
		includeInContext: int("include_in_context", { mode: "boolean" }).notNull().default(true),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_notes_created").on(table.createdAt),
		index("idx_notes_updated").on(table.updatedAt),
		index("idx_notes_session").on(table.sessionId),
		index("idx_notes_project").on(table.projectPath),
	],
)
