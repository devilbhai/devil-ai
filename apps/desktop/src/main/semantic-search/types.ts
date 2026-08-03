/**
 * Semantic Search Types
 * 
 * Local codebase indexing and semantic search for Devil AI.
 * Uses SQLite + TF-IDF (upgradeable to embeddings).
 */

export interface CodeChunk {
	id: string
	filePath: string
	relativePath: string
	language: string
	startLine: number
	endLine: number
	content: string
	symbols: string[] // function/class/variable names
	contentHash: string
	indexedAt: number
}

export interface SearchOptions {
	query: string
	projectPath: string
	limit?: number
	threshold?: number
	languages?: string[]
	includeSymbols?: boolean
}

export interface SearchResult {
	chunk: CodeChunk
	score: number
	matchType: "semantic" | "symbol" | "text"
	contextBefore?: string
	contextAfter?: string
}

export interface IndexProgress {
	phase: "scanning" | "parsing" | "indexing" | "complete" | "error"
	filesTotal: number
	filesProcessed: number
	currentFile?: string
	error?: string
}

export interface ProjectIndexState {
	projectPath: string
	lastIndexed: number
	fileCount: number
	chunkCount: number
	languages: string[]
	status: "idle" | "indexing" | "error"
	error?: string
}

export interface FileWatchEvent {
	type: "added" | "changed" | "deleted"
	filePath: string
	relativePath: string
}