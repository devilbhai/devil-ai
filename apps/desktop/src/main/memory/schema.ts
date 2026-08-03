/**
 * Drizzle ORM schema for agent memory tables.
 *
 * user_preferences: key-value store for coding style, project guidelines,
 *   preferred patterns — anything the agent should remember across sessions.
 *
 * agent_memories: what the agent learned from past interactions —
 *   project context, design decisions, approved patterns, etc.
 *
 * conversation_log: every prompt + response for full recall.
 * project_knowledge: project-wise task/feature/decision tracking.
 * learned_skills: reusable patterns accumulated from completed tasks.
 * memory_embeddings: TF-IDF vectors for semantic search across memories.
 * memory_consolidation: tracks auto-summarization of old conversations.
 */

import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const userPreferences = sqliteTable(
	"user_preferences",
	{
		id: text("id").primaryKey(),
		/** Scoped to a project path, or null for global prefs */
		projectPath: text("project_path"),
		/** Category: "style", "guideline", "preference", "pattern" */
		category: text("category").notNull(),
		/** Short key name, e.g. "indent_style", "naming_convention" */
		key: text("key").notNull(),
		/** The preference value */
		value: text("value").notNull(),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_prefs_project").on(table.projectPath),
		index("idx_prefs_category").on(table.category),
		index("idx_prefs_key").on(table.key),
	],
)

export const agentMemories = sqliteTable(
	"agent_memories",
	{
		id: text("id").primaryKey(),
		/** Scoped to a project path, or null for global memories */
		projectPath: text("project_path"),
		/** Session that generated this memory */
		sessionId: text("session_id"),
		/** Category: "decision", "context", "pattern", "bug_fix", "approval" */
		category: text("category").notNull(),
		/** Short summary */
		summary: text("summary").notNull(),
		/** Full memory content */
		content: text("content").notNull(),
		/** Importance weight (0-1), higher = more relevant */
		weight: int("weight").notNull().default(50),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_mem_project").on(table.projectPath),
		index("idx_mem_session").on(table.sessionId),
		index("idx_mem_category").on(table.category),
		index("idx_mem_weight").on(table.weight),
	],
)

// ============================================================
// Conversation Log — stores every prompt and response
// ============================================================

export const conversationLog = sqliteTable(
	"conversation_log",
	{
		id: text("id").primaryKey(),
		/** Session ID from OpenCode */
		sessionId: text("session_id"),
		/** Project path this conversation belongs to */
		projectPath: text("project_path"),
		/** "user" or "assistant" */
		role: text("role").notNull(),
		/** The message content */
		content: text("content").notNull(),
		/** Optional summary for long messages */
		summary: text("summary"),
		/** Token count estimate */
		tokenCount: int("token_count"),
		/** Extracted topics/tags */
		topics: text("topics"),
		/** Message timestamp */
		timestamp: int("timestamp").notNull(),
	},
	(table) => [
		index("idx_conv_session").on(table.sessionId),
		index("idx_conv_project").on(table.projectPath),
		index("idx_conv_role").on(table.role),
		index("idx_conv_timestamp").on(table.timestamp),
	],
)

// ============================================================
// Project Knowledge — tracks what was done per project
// ============================================================

export const projectKnowledge = sqliteTable(
	"project_knowledge",
	{
		id: text("id").primaryKey(),
		/** Project directory path */
		projectPath: text("project_path").notNull(),
		/** "feature", "bug_fix", "refactor", "config", "architecture", "decision" */
		type: text("type").notNull(),
		/** Short title of what was done */
		title: text("title").notNull(),
		/** Detailed description */
		description: text("description").notNull(),
		/** Files involved (comma-separated) */
		files: text("files"),
		/** Session that generated this knowledge */
		sessionId: text("session_id"),
		/** Technologies/patterns used */
		technologies: text("technologies"),
		/** Importance weight (0-100) */
		weight: int("weight").notNull().default(50),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_pk_project").on(table.projectPath),
		index("idx_pk_type").on(table.type),
		index("idx_pk_session").on(table.sessionId),
		index("idx_pk_weight").on(table.weight),
	],
)

// ============================================================
// Learned Skills — reusable patterns from completed tasks
// ============================================================

export const learnedSkills = sqliteTable(
	"learned_skills",
	{
		id: text("id").primaryKey(),
		/** Skill category: "react", "node", "database", "git", "css", "testing", etc. */
		category: text("category").notNull(),
		/** Short skill name */
		name: text("name").notNull(),
		/** Description of what this skill does */
		description: text("description").notNull(),
		/** The actual code pattern or solution */
		pattern: text("pattern").notNull(),
		/** Example usage */
		example: text("example"),
		/** How many times this skill was used (popularity) */
		useCount: int("use_count").notNull().default(0),
		/** Success rate (0-100) */
		successRate: int("success_rate").notNull().default(100),
		/** Session that generated this skill */
		sessionId: text("session_id"),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_skill_category").on(table.category),
		index("idx_skill_name").on(table.name),
		index("idx_skill_useCount").on(table.useCount),
		index("idx_skill_successRate").on(table.successRate),
	],
)

// ============================================================
// Memory Embeddings — TF-IDF vectors for semantic search
// ============================================================

export const memoryEmbeddings = sqliteTable(
	"memory_embeddings",
	{
		id: text("id").primaryKey(),
		/** Source type: "conversation", "knowledge", "skill" */
		sourceType: text("source_type").notNull(),
		/** ID of the source record */
		sourceId: text("source_id").notNull(),
		/** The original text that was vectorized */
		text: text("text").notNull(),
		/** JSON-serialized TF-IDF vector (term -> weight) */
		vector: text("vector").notNull(),
		/** Top keywords extracted from the text */
		keywords: text("keywords"),
		createdAt: int("created_at").notNull(),
	},
	(table) => [
		index("idx_emb_source").on(table.sourceType, table.sourceId),
		index("idx_emb_created").on(table.createdAt),
	],
)

// ============================================================
// Memory Consolidation — tracks auto-summarization
// ============================================================

export const memoryConsolidation = sqliteTable(
	"memory_consolidation",
	{
		id: text("id").primaryKey(),
		/** Session that was consolidated */
		sessionId: text("session_id"),
		/** Project path */
		projectPath: text("project_path"),
		/** Original conversation log IDs that were consolidated */
		conversationIds: text("conversation_ids"),
		/** The generated summary */
		summary: text("summary").notNull(),
		/** Key learnings extracted */
		learnings: text("learnings"),
		/** Number of messages consolidated */
		messageCount: int("message_count").notNull().default(0),
		/** Consolidation timestamp */
		consolidatedAt: int("consolidated_at").notNull(),
	},
	(table) => [
		index("idx_con_session").on(table.sessionId),
		index("idx_con_project").on(table.projectPath),
		index("idx_con_at").on(table.consolidatedAt),
	],
)

// ============================================================
// Connector Tokens — cached OAuth tokens for connectors
// Synced from admin panel server, used by native connector tools
// ============================================================

export const connectorTokens = sqliteTable(
	"connector_tokens",
	{
		id: text("id").primaryKey(),
		/** User email (from admin panel) */
		userEmail: text("user_email").notNull(),
		/** Connector ID (gmail, google-drive, canva, etc.) */
		connectorId: text("connector_id").notNull(),
		/** Access token (encrypted in production) */
		accessToken: text("access_token"),
		/** Refresh token for OAuth connectors */
		refreshToken: text("refresh_token"),
		/** Token expiry timestamp (ms) */
		expiresAt: int("expires_at"),
		/** Token scope */
		scope: text("scope"),
		/** Additional token metadata (JSON) */
		metadata: text("metadata"),
		/** Last sync timestamp from server */
		lastSyncedAt: int("last_synced_at").notNull(),
		/** Whether the token is valid/active */
		isActive: int("is_active").notNull().default(1),
		createdAt: int("created_at").notNull(),
		updatedAt: int("updated_at").notNull(),
	},
	(table) => [
		index("idx_ct_user").on(table.userEmail),
		index("idx_ct_connector").on(table.connectorId),
		index("idx_ct_user_connector").on(table.userEmail, table.connectorId),
		index("idx_ct_active").on(table.isActive),
	],
)
