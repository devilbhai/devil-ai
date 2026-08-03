/**
 * IPC handlers for Snippets Manager.
 */

import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { createLogger } from "../logger"

const log = createLogger("ipc-snippets")

export function registerSnippetsIpc(): void {
	ipcMain.handle("snippets:list", withLogging("snippets:list", () => import("../snippets").then((m) => m.listSnippets())))

	ipcMain.handle("snippets:get", withLogging("snippets:get", (_, id: string) => import("../snippets").then((m) => m.getSnippet(id))))

	ipcMain.handle(
		"snippets:create",
		withLogging("snippets:create", async (_, input: { title: string; content?: string; language?: string; tags?: string; projectPath?: string }) => {
			const { createSnippet } = await import("../snippets")
			return createSnippet(input)
		}),
	)

	ipcMain.handle(
		"snippets:update",
		withLogging("snippets:update", async (_, input: { id: string; title?: string; content?: string; language?: string; tags?: string; isFavorite?: boolean }) => {
			const { updateSnippet } = await import("../snippets")
			return updateSnippet(input)
		}),
	)

	ipcMain.handle("snippets:delete", withLogging("snippets:delete", (_, id: string) => import("../snippets").then((m) => m.deleteSnippet(id))))

	ipcMain.handle("snippets:search", withLogging("snippets:search", (_, query: string) => import("../snippets").then((m) => m.searchSnippets(query))))

	ipcMain.handle("snippets:use", withLogging("snippets:use", (_, id: string) => import("../snippets").then((m) => m.incrementSnippetUsage(id))))

	log.info("Snippets Manager IPC handlers registered")
}
