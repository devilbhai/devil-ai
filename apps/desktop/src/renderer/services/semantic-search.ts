/**
 * Semantic Search Service (Renderer)
 * 
 * Provides semantic search functionality to the renderer process
 * via IPC to the main process indexer.
 */

import type {
	SearchOptions,
	SearchResult,
	IndexProgress,
	ProjectIndexState,
	FileWatchEvent,
} from "../../main/semantic-search/types"

const CACHE_KEY = "devil-ai:semantic-search:projects"

export interface CachedProject {
	path: string
	lastIndexed: number
	state: ProjectIndexState | null
}

export class SemanticSearchService {
	private projectPath: string | null = null
	private progressListeners = new Set<(progress: IndexProgress) => void>()
	private searchCache = new Map<string, SearchResult[]>()
	private maxCacheSize = 50

	async initialize(projectPath: string): Promise<ProjectIndexState | null> {
		this.projectPath = projectPath

		// Check cache first
		const cached = this.getCachedProject(projectPath)
		if (cached?.state) {
			return cached.state
		}

		// Query indexer state
		try {
			const state = await window.devilAi.semanticSearch.state(projectPath)
			if (state) {
				this.cacheProject(projectPath, state)
				return state
			}
		} catch (err) {
			console.warn("Semantic search state check failed:", err)
		}

		return null
	}

	async indexProject(onProgress?: (progress: IndexProgress) => void): Promise<ProjectIndexState> {
		if (!this.projectPath) throw new Error("No project initialized")

		const projectPath = this.projectPath

		return new Promise((resolve, reject) => {
			const cleanup = () => {
				if (onProgress) this.removeProgressListener(onProgress)
			}

			if (onProgress) this.addProgressListener(onProgress)

			window.devilAi.semanticSearch.index(projectPath)
				.then((state: ProjectIndexState) => {
					this.cacheProject(projectPath, state)
					resolve(state)
					cleanup()
				})
				.catch((err: Error) => {
					reject(err)
					cleanup()
				})
		})
	}

	async abortIndexing(): Promise<void> {
		if (!this.projectPath) return
		await window.devilAi.semanticSearch.abort(this.projectPath)
	}

	async search(
		query: string,
		options: Partial<Omit<SearchOptions, "query" | "projectPath">> = {}
	): Promise<SearchResult[]> {
		if (!this.projectPath) throw new Error("No project initialized")

		const cacheKey = `${query}:${JSON.stringify(options)}`
		if (this.searchCache.has(cacheKey)) {
			return this.searchCache.get(cacheKey)!
		}

		const searchOptions: SearchOptions = {
			query,
			projectPath: this.projectPath,
			...options,
		}

		const results = await window.devilAi.semanticSearch.search(searchOptions)
		// Cache result
		this.addToCache(cacheKey, results)
		return results
	}

	async handleFileEvent(event: FileWatchEvent): Promise<void> {
		if (!this.projectPath) return
		await window.devilAi.semanticSearch.fileEvent(this.projectPath, event)
	}

	// Progress listeners
	addProgressListener(listener: (progress: IndexProgress) => void) {
		this.progressListeners.add(listener)
	}

	removeProgressListener(listener: (progress: IndexProgress) => void) {
		this.progressListeners.delete(listener)
	}

	// Cache management
	private getCachedProject(path: string): CachedProject | undefined {
		try {
			const cached = localStorage.getItem(CACHE_KEY)
			if (!cached) return undefined
			const projects = JSON.parse(cached) as Record<string, CachedProject>
			return projects[path]
		} catch {
			return undefined
		}
	}

	private cacheProject(path: string, state: ProjectIndexState) {
		try {
			const cached = localStorage.getItem(CACHE_KEY)
			const projects = cached ? JSON.parse(cached) : {}
			projects[path] = { path, lastIndexed: Date.now(), state }
			localStorage.setItem(CACHE_KEY, JSON.stringify(projects))
		} catch {
			// Ignore storage errors
		}
	}

	private addToCache(key: string, results: SearchResult[]) {
		if (this.searchCache.size >= this.maxCacheSize) {
			const firstKey = this.searchCache.keys().next().value
			if (firstKey) this.searchCache.delete(firstKey)
		}
		this.searchCache.set(key, results)
	}

	clearCache() {
		this.searchCache.clear()
	}
}

// Singleton instance
let instance: SemanticSearchService | null = null

export function getSemanticSearchService(): SemanticSearchService {
	if (!instance) {
		instance = new SemanticSearchService()
	}
	return instance
}