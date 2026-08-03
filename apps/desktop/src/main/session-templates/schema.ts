/**
 * Drizzle ORM schema for session_templates table.
 *
 * Session Templates store pre-configured session setups with default
 * model, skills, system prompt, and other settings.
 */

import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const sessionTemplates = sqliteTable(
	"session_templates",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		/** Description of what this template is for */
		description: text("description").notNull().default(""),
		/** JSON-serialized configuration: { model, systemPrompt, skills[], temperature, etc. } */
		config: text("config").notNull().default("{}"),
		/** Category: "debugging", "review", "refactor", "audit", etc. */
		category: text("category").notNull().default("general"),
		/** How many times this template has been used */
		useCount: int("use_count").notNull().default(0),
		/** Whether this is a favorite/pinned template */
		isFavorite: int("is_favorite", { mode: "boolean" }).notNull().default(false),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_templates_created").on(table.createdAt),
		index("idx_templates_updated").on(table.updatedAt),
		index("idx_templates_category").on(table.category),
	],
)
