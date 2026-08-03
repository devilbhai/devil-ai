/**
 * Drizzle ORM schema for snippets table.
 *
 * Snippets Manager stores reusable code snippets with language detection.
 * Users can save, search, and insert snippets across sessions.
 */

import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const snippets = sqliteTable(
	"snippets",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		/** The code/content of the snippet */
		content: text("content").notNull().default(""),
		/** Programming language for syntax highlighting */
		language: text("language").notNull().default("text"),
		/** Comma-separated tags for categorization */
		tags: text("tags").default(""),
		/** Optional link to project where snippet was created */
		projectPath: text("project_path"),
		/** How many times this snippet has been inserted */
		useCount: int("use_count").notNull().default(0),
		/** Whether this is a favorite/pinned snippet */
		isFavorite: int("is_favorite", { mode: "boolean" }).notNull().default(false),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_snippets_created").on(table.createdAt),
		index("idx_snippets_updated").on(table.updatedAt),
		index("idx_snippets_language").on(table.language),
		index("idx_snippets_project").on(table.projectPath),
	],
)
