import { ipcMain } from "electron"
import { withLogging } from "./utils"
import {
	listPreferences,
	setPreference,
	deletePreference,
	searchPreferences,
	listMemories,
	createMemory,
	updateMemory,
	deleteMemory,
	searchMemories,
	getMemoryContext,
	logConversation,
	getConversationHistory,
	searchConversations,
	addProjectKnowledge,
	getProjectKnowledge,
	searchProjectKnowledge,
	addLearnedSkill,
	getLearnedSkills,
	searchLearnedSkills,
	useLearnedSkill,
	getMemoryStats,
	consolidateSession,
	autoConsolidateOldSessions,
	assembleContext,
} from "../memory"

export function registerMemoryIpc() {
	// --- User Preferences ---

	ipcMain.handle(
		"memory:prefs:list",
		withLogging("memory:prefs:list", (_, projectPath?: string) => listPreferences(projectPath)),
	)

	ipcMain.handle(
		"memory:prefs:set",
		withLogging(
			"memory:prefs:set",
			(
				_,
				input: { category: string; key: string; value: string; projectPath?: string },
			) => setPreference(input),
		),
	)

	ipcMain.handle(
		"memory:prefs:delete",
		withLogging("memory:prefs:delete", (_, id: string) => deletePreference(id)),
	)

	ipcMain.handle(
		"memory:prefs:search",
		withLogging("memory:prefs:search", (_, query: string) => searchPreferences(query)),
	)

	// --- Agent Memories ---

	ipcMain.handle(
		"memory:memories:list",
		withLogging(
			"memory:memories:list",
			(_, projectPath?: string, category?: string, limit?: number) =>
				listMemories(projectPath, category, limit),
		),
	)

	ipcMain.handle(
		"memory:memories:create",
		withLogging(
			"memory:memories:create",
			(
				_,
				input: {
					projectPath?: string
					sessionId?: string
					category: string
					summary: string
					content: string
					weight?: number
				},
			) => createMemory(input),
		),
	)

	ipcMain.handle(
		"memory:memories:update",
		withLogging(
			"memory:memories:update",
			(
				_,
				input: {
					id: string
					summary?: string
					content?: string
					weight?: number
					category?: string
				},
			) => updateMemory(input),
		),
	)

	ipcMain.handle(
		"memory:memories:delete",
		withLogging("memory:memories:delete", (_, id: string) => deleteMemory(id)),
	)

	ipcMain.handle(
		"memory:memories:search",
		withLogging(
			"memory:memories:search",
			(_, query: string, projectPath?: string, limit?: number) =>
				searchMemories(query, projectPath, limit),
		),
	)

	// --- Context for AI prompts ---

	ipcMain.handle(
		"memory:context",
		withLogging("memory:context", (_, projectPath: string) => getMemoryContext(projectPath)),
	)

	// ============================================================
	// NEW MEMORY SYSTEM — Conversation Log
	// ============================================================

	ipcMain.handle(
		"memory:conversations:log",
		withLogging(
			"memory:conversations:log",
			(
				_,
				input: {
					sessionId?: string
					projectPath?: string
					role: string
					content: string
				},
			) => logConversation(input),
		),
	)

	ipcMain.handle(
		"memory:conversations:history",
		withLogging(
			"memory:conversations:history",
			(
				_,
				options?: { sessionId?: string; projectPath?: string; limit?: number; offset?: number },
			) => getConversationHistory(options),
		),
	)

	ipcMain.handle(
		"memory:conversations:search",
		withLogging(
			"memory:conversations:search",
			(_, query: string, projectPath?: string, limit?: number) =>
				searchConversations(query, projectPath, limit),
		),
	)

	// ============================================================
	// NEW MEMORY SYSTEM — Project Knowledge
	// ============================================================

	ipcMain.handle(
		"memory:knowledge:add",
		withLogging(
			"memory:knowledge:add",
			(
				_,
				input: {
					projectPath: string
					type: string
					title: string
					description: string
					files?: string
					sessionId?: string
					technologies?: string
					weight?: number
				},
			) => addProjectKnowledge(input),
		),
	)

	ipcMain.handle(
		"memory:knowledge:list",
		withLogging(
			"memory:knowledge:list",
			(_, projectPath: string, type?: string, limit?: number) =>
				getProjectKnowledge(projectPath, type, limit),
		),
	)

	ipcMain.handle(
		"memory:knowledge:search",
		withLogging(
			"memory:knowledge:search",
			(_, query: string, projectPath?: string, limit?: number) =>
				searchProjectKnowledge(query, projectPath, limit),
		),
	)

	// ============================================================
	// NEW MEMORY SYSTEM — Learned Skills
	// ============================================================

	ipcMain.handle(
		"memory:skills:add",
		withLogging(
			"memory:skills:add",
			(
				_,
				input: {
					category: string
					name: string
					description: string
					pattern: string
					example?: string
					sessionId?: string
				},
			) => addLearnedSkill(input),
		),
	)

	ipcMain.handle(
		"memory:skills:list",
		withLogging(
			"memory:skills:list",
			(_, category?: string, limit?: number) => getLearnedSkills(category, limit),
		),
	)

	ipcMain.handle(
		"memory:skills:search",
		withLogging(
			"memory:skills:search",
			(_, query: string, limit?: number) => searchLearnedSkills(query, limit),
		),
	)

	ipcMain.handle(
		"memory:skills:use",
		withLogging("memory:skills:use", (_, id: string) => useLearnedSkill(id)),
	)

	// ============================================================
	// NEW MEMORY SYSTEM — Stats
	// ============================================================

	ipcMain.handle("memory:stats", withLogging("memory:stats", () => getMemoryStats()))

	// ============================================================
	// NEW MEMORY SYSTEM — Consolidation
	// ============================================================

	ipcMain.handle(
		"memory:consolidate:session",
		withLogging(
			"memory:consolidate:session",
			(_, options: { sessionId: string; projectPath?: string }) =>
				consolidateSession(options),
		),
	)

	ipcMain.handle(
		"memory:consolidate:auto",
		withLogging(
			"memory:consolidate:auto",
			(_, options?: { projectPath?: string; maxAge?: number; maxSessions?: number }) =>
				autoConsolidateOldSessions(options ?? {}),
		),
	)

	// ============================================================
	// NEW MEMORY SYSTEM — Assembler (Context Injection)
	// ============================================================

	ipcMain.handle(
		"memory:assemble",
		withLogging(
			"memory:assemble",
			(
				_,
				options: { query: string; projectPath?: string; sessionId?: string; limit?: number },
			) => assembleContext(options),
		),
	)
}
