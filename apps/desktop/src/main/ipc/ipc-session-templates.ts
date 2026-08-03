/**
 * IPC handlers for Session Templates.
 */

import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { createLogger } from "../logger"

const log = createLogger("ipc-session-templates")

export function registerSessionTemplatesIpc(): void {
	ipcMain.handle("templates:list", withLogging("templates:list", () => import("../session-templates").then((m) => m.listTemplates())))

	ipcMain.handle("templates:get", withLogging("templates:get", (_, id: string) => import("../session-templates").then((m) => m.getTemplate(id))))

	ipcMain.handle(
		"templates:create",
		withLogging("templates:create", async (_, input: { name: string; description?: string; config?: string; category?: string }) => {
			const { createTemplate } = await import("../session-templates")
			return createTemplate(input)
		}),
	)

	ipcMain.handle(
		"templates:update",
		withLogging("templates:update", async (_, input: { id: string; name?: string; description?: string; config?: string; category?: string; isFavorite?: boolean }) => {
			const { updateTemplate } = await import("../session-templates")
			return updateTemplate(input)
		}),
	)

	ipcMain.handle("templates:delete", withLogging("templates:delete", (_, id: string) => import("../session-templates").then((m) => m.deleteTemplate(id))))

	ipcMain.handle("templates:search", withLogging("templates:search", (_, query: string) => import("../session-templates").then((m) => m.searchTemplates(query))))

	ipcMain.handle("templates:use", withLogging("templates:use", (_, id: string) => import("../session-templates").then((m) => m.incrementTemplateUsage(id))))

	log.info("Session Templates IPC handlers registered")
}
