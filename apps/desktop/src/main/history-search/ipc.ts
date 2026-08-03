/**
 * History Search IPC Handlers
 * 
 * Provides chat history search functionality using configconv scanner.
 */

import { ipcMain, IpcMainInvokeEvent } from "electron"
import { createLogger } from "../logger"
import { searchHistory, getHistorySessionDetail } from "./service"
import type { HistorySearchOptions, HistorySearchResult, HistorySessionDetail } from "../../renderer/types/history-search"

const log = createLogger("history-search:ipc")

export function registerHistorySearchIpc(): void {
	// Search chat history
	ipcMain.handle("history-search:search", async (
		_event: IpcMainInvokeEvent,
		options: HistorySearchOptions
	): Promise<HistorySearchResult[]> => {
		log.debug("History search request", options)
		return searchHistory(options)
	})

	// Get session detail
	ipcMain.handle("history-search:session-detail", async (
		_event: IpcMainInvokeEvent,
		sessionId: string,
		projectPath: string
	): Promise<HistorySessionDetail | null> => {
		log.debug("History session detail request", { sessionId, projectPath })
		return getHistorySessionDetail(sessionId, projectPath)
	})

	log.info("History search IPC registered")
}