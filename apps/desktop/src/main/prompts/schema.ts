/**
 * Drizzle ORM schema for prompts table.
 *
 * Prompt Library stores reusable prompt templates with variables.
 * Users can save frequently used prompts and insert them with {{variable}} placeholders.
 */

import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const prompts = sqliteTable(
	"prompts",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		content: text("content").notNull().default(""),
		/** Comma-separated tags for categorization */
		tags: text("tags").default(""),
		/** Category: "general", "code-review", "debugging", "refactor", etc. */
		category: text("category").notNull().default("general"),
		/** How many times this prompt has been used */
		useCount: int("use_count").notNull().default(0),
		/** Whether this is a favorite/pinned prompt */
		isFavorite: int("is_favorite", { mode: "boolean" }).notNull().default(false),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_prompts_created").on(table.createdAt),
		index("idx_prompts_updated").on(table.updatedAt),
		index("idx_prompts_category").on(table.category),
	],
)
