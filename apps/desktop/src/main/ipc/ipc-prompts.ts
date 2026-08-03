/**
 * IPC handlers for Prompt Library.
 */

import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { createLogger } from "../logger"

const log = createLogger("ipc-prompts")

export function registerPromptsIpc(): void {
	ipcMain.handle("prompts:list", withLogging("prompts:list", () => import("../prompts").then((m) => m.listPrompts())))

	ipcMain.handle("prompts:get", withLogging("prompts:get", (_, id: string) => import("../prompts").then((m) => m.getPrompt(id))))

	ipcMain.handle(
		"prompts:create",
		withLogging("prompts:create", async (_, input: { title: string; content?: string; tags?: string; category?: string }) => {
			const { createPrompt } = await import("../prompts")
			return createPrompt(input)
		}),
	)

	ipcMain.handle(
		"prompts:update",
		withLogging("prompts:update", async (_, input: { id: string; title?: string; content?: string; tags?: string; category?: string; isFavorite?: boolean }) => {
			const { updatePrompt } = await import("../prompts")
			return updatePrompt(input)
		}),
	)

	ipcMain.handle("prompts:delete", withLogging("prompts:delete", (_, id: string) => import("../prompts").then((m) => m.deletePrompt(id))))

	ipcMain.handle("prompts:search", withLogging("prompts:search", (_, query: string) => import("../prompts").then((m) => m.searchPrompts(query))))

	ipcMain.handle("prompts:use", withLogging("prompts:use", (_, id: string) => import("../prompts").then((m) => m.incrementPromptUsage(id))))

	ipcMain.handle(
		"prompts:resolve",
		withLogging("prompts:resolve", (_, content: string, variables: Record<string, string>) => import("../prompts").then((m) => m.resolvePromptVariables(content, variables))),
	)

	ipcMain.handle("prompts:extract-vars", withLogging("prompts:extract-vars", (_, content: string) => import("../prompts").then((m) => m.extractPromptVariables(content))))

	log.info("Prompt Library IPC handlers registered")
}
