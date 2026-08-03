/**
 * Keyboard Shortcuts CRUD operations.
 *
 * Provides create, read, update, delete for user-defined hotkey bindings.
 * Supports overriding default shortcuts and creating new ones.
 */

import { eq } from "drizzle-orm"
import { createLogger } from "../logger"
import { ensureDb } from "../automation/database"
import { keyboardShortcuts } from "./schema"

const log = createLogger("keyboard-shortcuts")

export interface KeyboardShortcut {
	id: string
	action: string
	label: string
	category: string
	shortcut: string
	isEnabled: boolean
	isCustom: boolean
	createdAt: number
	updatedAt: number
}

export interface CreateShortcutInput {
	action: string
	label: string
	category?: string
	shortcut: string
	isEnabled?: boolean
	isCustom?: boolean
}

export interface UpdateShortcutInput {
	id: string
	shortcut?: string
	isEnabled?: boolean
}

/** Default keyboard shortcuts built into the app */
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, "id" | "createdAt" | "updatedAt">[] = [
	{ action: "newSession", label: "New Session", category: "General", shortcut: "Cmd+N", isEnabled: true, isCustom: false },
	{ action: "commandPalette", label: "Command Palette", category: "General", shortcut: "Cmd+K", isEnabled: true, isCustom: false },
	{ action: "toggleSidebar", label: "Toggle Sidebar", category: "Navigation", shortcut: "Cmd+B", isEnabled: true, isCustom: false },
	{ action: "undoTurn", label: "Undo Last Turn", category: "Chat", shortcut: "Cmd+Z", isEnabled: true, isCustom: false },
	{ action: "redoTurn", label: "Redo Turn", category: "Chat", shortcut: "Shift+Cmd+Z", isEnabled: true, isCustom: false },
	{ action: "focusChat", label: "Focus Chat Input", category: "Chat", shortcut: "Cmd+L", isEnabled: true, isCustom: false },
	{ action: "searchFiles", label: "Search Files", category: "Navigation", shortcut: "Cmd+P", isEnabled: true, isCustom: false },
	{ action: "saveNote", label: "Save Note", category: "Notes", shortcut: "Cmd+S", isEnabled: true, isCustom: false },
	{ action: "toggleTerminal", label: "Toggle Terminal", category: "Developer", shortcut: "Ctrl+`", isEnabled: true, isCustom: false },
	{ action: "runCode", label: "Run Code", category: "Developer", shortcut: "Cmd+Enter", isEnabled: true, isCustom: false },
	{ action: "openSettings", label: "Open Settings", category: "General", shortcut: "Cmd+,", isEnabled: true, isCustom: false },
	{ action: "insertSnippet", label: "Insert Snippet", category: "Snippets", shortcut: "Cmd+Shift+S", isEnabled: true, isCustom: false },
	{ action: "insertPrompt", label: "Insert Prompt", category: "Prompts", shortcut: "Cmd+Shift+P", isEnabled: true, isCustom: false },
	{ action: "toggleTheme", label: "Toggle Theme", category: "Appearance", shortcut: "Cmd+Shift+D", isEnabled: true, isCustom: false },
]

export async function listShortcuts(): Promise<KeyboardShortcut[]> {
	const db = await ensureDb()
	const rows = await db.select().from(keyboardShortcuts).orderBy(keyboardShortcuts.category, keyboardShortcuts.label).all()
	return rows.map((r) => ({
		...r,
		isEnabled: Boolean(r.isEnabled),
		isCustom: Boolean(r.isCustom),
	}))
}

export async function getShortcut(id: string): Promise<KeyboardShortcut | null> {
	const db = await ensureDb()
	const row = await db.select().from(keyboardShortcuts).where(eq(keyboardShortcuts.id, id)).get()
	if (!row) return null
	return { ...row, isEnabled: Boolean(row.isEnabled), isCustom: Boolean(row.isCustom) }
}

export async function getShortcutByAction(action: string): Promise<KeyboardShortcut | null> {
	const db = await ensureDb()
	const row = await db.select().from(keyboardShortcuts).where(eq(keyboardShortcuts.action, action)).get()
	if (!row) return null
	return { ...row, isEnabled: Boolean(row.isEnabled), isCustom: Boolean(row.isCustom) }
}

export async function createShortcut(input: CreateShortcutInput): Promise<KeyboardShortcut> {
	const db = await ensureDb()
	const now = Date.now()
	const id = crypto.randomUUID()

	const row = await db
		.insert(keyboardShortcuts)
		.values({
			id,
			action: input.action,
			label: input.label,
			category: input.category ?? "General",
			shortcut: input.shortcut,
			isEnabled: input.isEnabled ?? true,
			isCustom: input.isCustom ?? true,
			createdAt: now,
			updatedAt: now,
		})
		.returning()
		.get()

	log.info("Shortcut created", { id, action: input.action, shortcut: input.shortcut })
	return { ...row, isEnabled: Boolean(row.isEnabled), isCustom: Boolean(row.isCustom) }
}

export async function updateShortcut(input: UpdateShortcutInput): Promise<KeyboardShortcut | null> {
	const db = await ensureDb()
	const existing = await db.select().from(keyboardShortcuts).where(eq(keyboardShortcuts.id, input.id)).get()
	if (!existing) return null

	const updates: Record<string, unknown> = { updatedAt: Date.now(), isCustom: true }
	if (input.shortcut !== undefined) updates.shortcut = input.shortcut
	if (input.isEnabled !== undefined) updates.isEnabled = input.isEnabled ? 1 : 0

	const row = await db.update(keyboardShortcuts).set(updates).where(eq(keyboardShortcuts.id, input.id)).returning().get()
	log.info("Shortcut updated", { id: input.id })
	return { ...row, isEnabled: Boolean(row.isEnabled), isCustom: Boolean(row.isCustom) }
}

export async function deleteShortcut(id: string): Promise<boolean> {
	const db = await ensureDb()
	const existing = await db.select().from(keyboardShortcuts).where(eq(keyboardShortcuts.id, id)).get()
	if (!existing) return false

	await db.delete(keyboardShortcuts).where(eq(keyboardShortcuts.id, id)).run()
	log.info("Shortcut deleted", { id })
	return true
}

/** Seed default shortcuts if the table is empty */
export async function seedDefaultShortcuts(): Promise<void> {
	const db = await ensureDb()
	const count = await db.select({ count: keyboardShortcuts.id }).from(keyboardShortcuts).all()
	if (count.length > 0) return

	const now = Date.now()
	for (const shortcut of DEFAULT_SHORTCUTS) {
		await db.insert(keyboardShortcuts).values({
			id: crypto.randomUUID(),
			...shortcut,
			createdAt: now,
			updatedAt: now,
		})
	}
	log.info("Default shortcuts seeded", { count: DEFAULT_SHORTCUTS.length })
}
