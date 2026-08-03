/**
 * Semantic Search IPC Handlers
 * 
 * Exposes codebase indexing and search functionality to the renderer process.
 */

import { ipcMain, IpcMainInvokeEvent } from "electron"
import { createLogger } from "../logger"
import { CodebaseIndexer } from "./indexer"
import { getProjectStatePath } from "../automation/paths"
import { join } from "node:path"
import type { SearchOptions, SearchResult, IndexProgress, ProjectIndexState, FileWatchEvent } from "./types"

const log = createLogger("semantic-search:ipc")

// Track active indexers by project path
const indexers = new Map<string, CodebaseIndexer>()
const progressCallbacks = new Map<string, (progress: IndexProgress) => void>()

function getIndexer(projectPath: string): CodebaseIndexer {
	let indexer = indexers.get(projectPath)
	if (!indexer) {
		const dbPath = join(getProjectStatePath(projectPath), "semantic-search.db")
		indexer = new CodebaseIndexer(projectPath, dbPath)
		indexers.set(projectPath, indexer)

		// Set up progress callback
		const callback = progressCallbacks.get(projectPath)
		if (callback) {
			indexer.setProgressCallback(callback)
		}
	}
	return indexer
}

export function registerSemanticSearchIpc(): void {
	// Start indexing a project
	ipcMain.handle("semantic-search:index", async (_event: IpcMainInvokeEvent, projectPath: string): Promise<ProjectIndexState> => {
		log.info("Starting index", { projectPath })
		const indexer = getIndexer(projectPath)
		return indexer.indexProject()
	})

	// Get current index state
	ipcMain.handle("semantic-search:state", async (_event: IpcMainInvokeEvent, projectPath: string): Promise<ProjectIndexState | null> => {
		const indexer = getIndexer(projectPath)
		return indexer.getProjectState()
	})

	// Search codebase
	ipcMain.handle("semantic-search:search", async (
		_event: IpcMainInvokeEvent,
		options: SearchOptions
	): Promise<SearchResult[]> => {
		const indexer = getIndexer(options.projectPath)
		return indexer.search(options)
	})

	// Subscribe to progress updates
	ipcMain.on("semantic-search:subscribe-progress", async (event: IpcMainInvokeEvent, projectPath: string) => {
		const callback = (progress: IndexProgress) => {
			event.sender.send("semantic-search:progress", progress)
		}
		progressCallbacks.set(projectPath, callback)

		const indexer = indexers.get(projectPath)
		if (indexer) {
			indexer.setProgressCallback(callback)
		}

		// Send current state if available
		const state = await indexer?.getProjectState()
		if (state) {
			event.sender.send("semantic-search:progress", {
				phase: state.status === "indexing" ? "indexing" : "complete",
				filesTotal: state.fileCount,
				filesProcessed: state.fileCount,
			})
		}
	})

	// Unsubscribe from progress
	ipcMain.on("semantic-search:unsubscribe-progress", (_event: IpcMainInvokeEvent, projectPath: string) => {
		progressCallbacks.delete(projectPath)
		const indexer = indexers.get(projectPath)
		if (indexer) {
			indexer.setProgressCallback(undefined as any)
		}
	})

	// Cancel indexing
	ipcMain.handle("semantic-search:cancel", async (_event: IpcMainInvokeEvent, projectPath: string): Promise<void> => {
		const indexer = indexers.get(projectPath)
		if (indexer) {
			indexer.abort()
		}
	})

	// Handle file system events (from renderer watching project)
	ipcMain.handle("semantic-search:file-event", async (
		_event: IpcMainInvokeEvent,
		projectPath: string,
		eventData: FileWatchEvent
	): Promise<void> => {
		const indexer = getIndexer(projectPath)
		await indexer.handleFileEvent(eventData)
	})

	// Remove project index
	ipcMain.handle("semantic-search:remove", async (_event: IpcMainInvokeEvent, projectPath: string): Promise<void> => {
		const indexer = indexers.get(projectPath)
		if (indexer) {
			indexer.close()
			indexers.delete(projectPath)
		}
		progressCallbacks.delete(projectPath)
	})
}