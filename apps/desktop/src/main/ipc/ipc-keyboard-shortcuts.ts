/**
 * IPC handlers for Keyboard Shortcuts.
 */

import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { createLogger } from "../logger"

const log = createLogger("ipc-keyboard-shortcuts")

export function registerKeyboardShortcutsIpc(): void {
	ipcMain.handle("shortcuts:list", withLogging("shortcuts:list", async () => {
		const { listShortcuts, seedDefaultShortcuts } = await import("../keyboard-shortcuts")
		await seedDefaultShortcuts()
		return listShortcuts()
	}))

	ipcMain.handle("shortcuts:get", withLogging("shortcuts:get", (_, id: string) => import("../keyboard-shortcuts").then((m) => m.getShortcut(id))))

	ipcMain.handle(
		"shortcuts:create",
		withLogging("shortcuts:create", async (_, input: { action: string; label: string; category?: string; shortcut: string }) => {
			const { createShortcut } = await import("../keyboard-shortcuts")
			return createShortcut(input)
		}),
	)

	ipcMain.handle(
		"shortcuts:update",
		withLogging("shortcuts:update", async (_, input: { id: string; shortcut?: string; isEnabled?: boolean }) => {
			const { updateShortcut } = await import("../keyboard-shortcuts")
			return updateShortcut(input)
		}),
	)

	ipcMain.handle("shortcuts:delete", withLogging("shortcuts:delete", (_, id: string) => import("../keyboard-shortcuts").then((m) => m.deleteShortcut(id))))

	ipcMain.handle("shortcuts:get-by-action", withLogging("shortcuts:get-by-action", (_, action: string) => import("../keyboard-shortcuts").then((m) => m.getShortcutByAction(action))))

	log.info("Keyboard Shortcuts IPC handlers registered")
}
