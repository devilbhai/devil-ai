/**
 * Drizzle ORM schema for keyboard_shortcuts table.
 *
 * Keyboard Shortcut Customizer stores user-defined hotkey bindings.
 * Users can override default shortcuts or create new ones.
 */

import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const keyboardShortcuts = sqliteTable(
	"keyboard_shortcuts",
	{
		id: text("id").primaryKey(),
		/** Action identifier, e.g. "newSession", "toggleSidebar", "runCode" */
		action: text("action").notNull(),
		/** Human-readable label, e.g. "New Session" */
		label: text("label").notNull(),
		/** Category for grouping in UI, e.g. "General", "Chat", "Navigation" */
		category: text("category").notNull().default("General"),
		/** Key combination, e.g. "Cmd+N", "Ctrl+Shift+K" */
		shortcut: text("shortcut").notNull(),
		/** Whether this shortcut is enabled */
		isEnabled: int("is_enabled", { mode: "boolean" }).notNull().default(true),
		/** Whether this is a user override of a default shortcut */
		isCustom: int("is_custom", { mode: "boolean" }).notNull().default(false),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_shortcuts_action").on(table.action),
		index("idx_shortcuts_category").on(table.category),
	],
)
