/**
 * Codebase Indexer
 *
 * Walks project files, extracts semantic chunks (functions, classes, etc.),
 * and stores in SQLite for fast semantic search.
 */

import { createClient, type Client } from "@libsql/client"
import { readdir, stat, readFile } from "node:fs/promises"
import { join, extname } from "node:path"
import { createHash } from "node:crypto"
import { createLogger } from "../logger"
import type {
	CodeChunk,
	SearchOptions,
	SearchResult,
	IndexProgress,
	ProjectIndexState,
	FileWatchEvent,
} from "./types"

const log = createLogger("semantic-search:indexer")

// Language detection by extension
const LANGUAGE_MAP: Record<string, string> = {
	".ts": "typescript",
	".tsx": "typescript",
	".js": "javascript",
	".jsx": "javascript",
	".py": "python",
	".rs": "rust",
	".go": "go",
	".java": "java",
	".cpp": "cpp",
	".cc": "cpp",
	".cxx": "cpp",
	".c": "c",
	".h": "c",
	".hpp": "cpp",
	".cs": "csharp",
	".rb": "ruby",
	".php": "php",
	".swift": "swift",
	".kt": "kotlin",
	".scala": "scala",
	".clj": "clojure",
	".hs": "haskell",
	".ml": "ocaml",
	".fs": "fsharp",
	".vue": "vue",
	".svelte": "svelte",
	".astro": "astro",
	".json": "json",
	".yaml": "yaml",
	".yml": "yaml",
	".toml": "toml",
	".md": "markdown",
	".mdx": "markdown",
	".sql": "sql",
	".sh": "bash",
	".bash": "bash",
	".zsh": "bash",
	".fish": "fish",
	".ps1": "powershell",
	".dockerfile": "dockerfile",
	".tf": "terraform",
	".hcl": "hcl",
	".graphql": "graphql",
	".gql": "graphql",
	".proto": "protobuf",
	".css": "css",
	".scss": "scss",
	".less": "less",
	".html": "html",
	".htm": "html",
	".xml": "xml",
	".svg": "svg",
}

const IGNORED_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".next",
	".vercel",
	".turbo",
	"coverage",
	".nyc_output",
	"target",
	".idea",
	".vscode",
	".vs",
	"__pycache__",
	".pytest_cache",
	".mypy_cache",
	".ruff_cache",
	"vendor",
	"bower_components",
	"jspm_packages",
	".parcel-cache",
	".cache",
	".temp",
	"tmp",
	"out",
	"bin",
	"obj",
	".gradle",
	".maven",
	"pkg",
	".expo",
	".expo-shared",
])

const IGNORED_FILES = new Set([
	"package-lock.json",
	"yarn.lock",
	"pnpm-lock.yaml",
	"bun.lockb",
	"Cargo.lock",
	"go.sum",
	"composer.lock",
	"Gemfile.lock",
	"poetry.lock",
	"requirements.txt",
	"Pipfile.lock",
	"yarn-error.log",
	".DS_Store",
	"Thumbs.db",
])

const MAX_FILE_SIZE = 512 * 1024 // 512KB
const CHUNK_MAX_LINES = 100
const CHUNK_OVERLAP_LINES = 10

const SCHEMA_STATEMENTS = `
	CREATE TABLE IF NOT EXISTS chunks (
		id TEXT PRIMARY KEY,
		file_path TEXT NOT NULL,
		relative_path TEXT NOT NULL,
		language TEXT NOT NULL,
		start_line INTEGER NOT NULL,
		end_line INTEGER NOT NULL,
		content TEXT NOT NULL,
		symbols TEXT NOT NULL, -- JSON array
		content_hash TEXT NOT NULL,
		indexed_at INTEGER NOT NULL,
		project_path TEXT NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_chunks_project ON chunks(project_path);
	CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_path);
	CREATE INDEX IF NOT EXISTS idx_chunks_language ON chunks(language);
	CREATE INDEX IF NOT EXISTS idx_chunks_hash ON chunks(content_hash);

	CREATE TABLE IF NOT EXISTS project_state (
		project_path TEXT PRIMARY KEY,
		last_indexed INTEGER NOT NULL,
		file_count INTEGER NOT NULL,
		chunk_count INTEGER NOT NULL,
		languages TEXT NOT NULL, -- JSON array
		status TEXT NOT NULL,
		error TEXT
	);

	CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
		content,
		symbols,
		file_path,
		language,
		project_path,
		tokenize = 'porter unicode61'
	);
`

export class CodebaseIndexer {
	private db: Client
	private projectPath: string
	private isIndexing = false
	private initialized = false
	private progressCallback?: (progress: IndexProgress) => void
	private abortController = new AbortController()

	constructor(projectPath: string, dbPath: string) {
		this.projectPath = projectPath
		const url = dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`
		this.db = createClient({ url })
	}

	private async ensureSchema() {
		if (this.initialized) return
		await this.initSchema()
		this.initialized = true
	}

	private async initSchema() {
		const statements = SCHEMA_STATEMENTS
			.split(";")
			.map((s) => s.trim())
			.filter(Boolean)

		for (const statement of statements) {
			await this.db.execute(statement)
		}
	}

	private async run(sql: string, args: Array<string | number | null> = []) {
		await this.db.execute({ sql, args })
	}

	private async all<T = Record<string, any>>(sql: string, args: Array<string | number | null> = []): Promise<T[]> {
		const result = await this.db.execute({ sql, args })
		return result.rows as T[]
	}

	private async get<T = Record<string, any>>(sql: string, args: Array<string | number | null> = []): Promise<T | undefined> {
		const result = await this.db.execute({ sql, args })
		return (result.rows as T[])[0]
	}

	setProgressCallback(cb: (progress: IndexProgress) => void) {
		this.progressCallback = cb
	}

	abort() {
		this.abortController.abort()
		this.isIndexing = false
	}

	async indexProject(): Promise<ProjectIndexState> {
		if (this.isIndexing) {
			throw new Error("Already indexing")
		}

		await this.ensureSchema()
		this.isIndexing = true
		this.abortController = new AbortController()
		const signal = this.abortController.signal

		const startTime = Date.now()
		const state: ProjectIndexState = {
			projectPath: this.projectPath,
			lastIndexed: 0,
			fileCount: 0,
			chunkCount: 0,
			languages: [],
			status: "indexing",
		}

		try {
			this.emitProgress({
				phase: "scanning",
				filesTotal: 0,
				filesProcessed: 0,
			})

			// Scan all files
			const files = await this.scanFiles(signal)
			const totalFiles = files.length

			this.emitProgress({
				phase: "parsing",
				filesTotal: totalFiles,
				filesProcessed: 0,
			})

			// Parse and chunk files
			let processed = 0
			let totalChunks = 0
			const languages = new Set<string>()

			for (const file of files) {
				if (signal.aborted) break

				const chunks = await this.parseFile(file)
				if (chunks.length > 0) {
					await this.storeChunks(chunks)
					totalChunks += chunks.length
					for (const c of chunks) languages.add(c.language)
				}

				processed++
				if (processed % 20 === 0 || processed === totalFiles) {
					this.emitProgress({
						phase: "indexing",
						filesTotal: totalFiles,
						filesProcessed: processed,
						currentFile: file.relativePath,
					})
				}
			}

			// Build FTS index
			this.emitProgress({
				phase: "indexing",
				filesTotal: totalFiles,
				filesProcessed: totalFiles,
			})
			await this.buildFtsIndex()

			// Update project state
			state.lastIndexed = Date.now()
			state.fileCount = totalFiles
			state.chunkCount = totalChunks
			state.languages = Array.from(languages).sort()
			state.status = "idle"
			await this.saveProjectState(state)

			this.emitProgress({
				phase: "complete",
				filesTotal: totalFiles,
				filesProcessed: totalFiles,
			})

			log.info("Indexing complete", {
				files: totalFiles,
				chunks: totalChunks,
				duration: Date.now() - startTime,
			})

			return state
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") {
				state.status = "idle"
				return state
			}
			state.status = "error"
			state.error = err instanceof Error ? err.message : String(err)
			await this.saveProjectState(state)
			this.emitProgress({
				phase: "error",
				filesTotal: 0,
				filesProcessed: 0,
				error: state.error,
			})
			throw err
		} finally {
			this.isIndexing = false
		}
	}

	private async scanFiles(signal: AbortSignal): Promise<Array<{ absolutePath: string; relativePath: string }>> {
		const files: Array<{ absolutePath: string; relativePath: string }> = []

		async function walk(dir: string, base: string) {
			if (signal.aborted) return

			try {
				const entries = await readdir(dir, { withFileTypes: true })
				for (const entry of entries) {
					if (signal.aborted) return

					const fullPath = join(dir, entry.name)
					const relPath = join(base, entry.name)

					if (entry.isDirectory()) {
						if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
							await walk(fullPath, relPath)
						}
					} else if (entry.isFile()) {
						if (!IGNORED_FILES.has(entry.name)) {
							const ext = extname(entry.name).toLowerCase()
							if (LANGUAGE_MAP[ext] || ext === "") {
								try {
									const stats = await stat(fullPath)
									if (stats.size <= MAX_FILE_SIZE) {
										files.push({ absolutePath: fullPath, relativePath: relPath })
									}
								} catch {
									// Skip unreadable files
								}
							}
						}
					}
				}
			} catch {
				// Skip unreadable directories
			}
		}

		await walk(this.projectPath, "")
		return files
	}

	private async parseFile(file: { absolutePath: string; relativePath: string }): Promise<CodeChunk[]> {
		const ext = extname(file.relativePath).toLowerCase()
		const language = LANGUAGE_MAP[ext] || "text"
		const content = await readFile(file.absolutePath, "utf-8").catch(() => "")
		if (!content.trim()) return []

		const lines = content.split("\n")
		const chunks: CodeChunk[] = []
		const contentHash = createHash("sha256").update(content).digest("hex").slice(0, 16)

		// Check if already indexed with same hash
		const existing = await this.get<{ id: string }>(
			"SELECT id FROM chunks WHERE file_path = ? AND content_hash = ? AND project_path = ?",
			[file.absolutePath, contentHash, this.projectPath],
		)

		if (existing) {
			return [] // Already indexed, no changes
		}

		// Extract symbols (functions, classes, etc.) based on language
		const symbols = this.extractSymbols(content, language)

		// Chunk by logical blocks (functions/classes) with overlap
		const rawChunks = this.chunkBySymbols(lines, symbols, language)

		for (let i = 0; i < rawChunks.length; i++) {
			const { startLine, endLine, chunkContent, chunkSymbols } = rawChunks[i]
			const chunkHash = createHash("sha256")
				.update(`${file.relativePath}:${startLine}:${endLine}:${chunkContent}`)
				.digest("hex")
				.slice(0, 16)

			chunks.push({
				id: chunkHash,
				filePath: file.absolutePath,
				relativePath: file.relativePath,
				language,
				startLine,
				endLine,
				content: chunkContent,
				symbols: chunkSymbols,
				contentHash,
				indexedAt: Date.now(),
			})
		}

		return chunks
	}

	private extractSymbols(content: string, language: string): Array<{ name: string; line: number; type: string }> {
		const symbols: Array<{ name: string; line: number; type: string }> = []
		const lines = content.split("\n")

		// Language-aware regex patterns
		const patterns: Record<string, RegExp[]> = {
			typescript: [
				/^\s*(export\s+)?(async\s+)?function\s+(\w+)/,
				/^\s*(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(/,
				/^\s*(export\s+)?class\s+(\w+)/,
				/^\s*(export\s+)?interface\s+(\w+)/,
				/^\s*(export\s+)?type\s+(\w+)/,
				/^\s*(export\s+)?enum\s+(\w+)/,
			],
			javascript: [
				/^\s*(export\s+)?(async\s+)?function\s+(\w+)/,
				/^\s*(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(/,
				/^\s*(export\s+)?class\s+(\w+)/,
			],
			python: [
				/^\s*def\s+(\w+)/,
				/^\s*class\s+(\w+)/,
				/^\s*async\s+def\s+(\w+)/,
			],
			rust: [
				/^\s*(pub\s+)?(async\s+)?fn\s+(\w+)/,
				/^\s*(pub\s+)?struct\s+(\w+)/,
				/^\s*(pub\s+)?enum\s+(\w+)/,
				/^\s*(pub\s+)?trait\s+(\w+)/,
				/^\s*(pub\s+)?mod\s+(\w+)/,
			],
			go: [
				/^\s*func\s+(\([^)]+\)\s+)?(\w+)/,
				/^\s*type\s+(\w+)\s+struct/,
				/^\s*type\s+(\w+)\s+interface/,
			],
			java: [
				/^\s*(public|private|protected)?\s*(static\s+)?(class|interface|enum)\s+(\w+)/,
				/^\s*(public|private|protected)?\s*(static\s+)?\w+\s+(\w+)\s*\(/,
			],
			cpp: [
				/^\s*(class|struct)\s+(\w+)/,
				/^\s*(virtual\s+)?\w+\s+(\w+)\s*\(/,
			],
			c: [
				/^\s*\w+\s+(\w+)\s*\(/,
				/^\s*struct\s+(\w+)/,
			],
			csharp: [
				/^\s*(public|private|protected|internal)?\s*(static\s+)?(class|interface|struct|enum)\s+(\w+)/,
				/^\s*(public|private|protected|internal)?\s*(static\s+)?\w+\s+(\w+)\s*\(/,
			],
		}

		const langPatterns = patterns[language] || []

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			for (const pattern of langPatterns) {
				const match = line.match(pattern)
				if (match) {
					// Extract name from capture groups (usually last or 2nd to last)
					const name = match[match.length - 1] || match[match.length - 2]
					if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
						const type = line.includes("class") ? "class"
							: line.includes("interface") ? "interface"
							: line.includes("struct") ? "struct"
							: line.includes("enum") ? "enum"
							: line.includes("trait") ? "trait"
							: line.includes("fn ") || line.includes("function") || line.includes("def ") ? "function"
							: "symbol"
						symbols.push({ name, line: i + 1, type })
					}
				}
			}
		}

		return symbols
	}

	private chunkBySymbols(
		lines: string[],
		symbols: Array<{ name: string; line: number; type: string }>,
		language: string,
	): Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }> {
		if (symbols.length === 0) {
			// No symbols found - chunk by fixed size with overlap
			return this.chunkByLines(lines)
		}

		const chunks: Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }> = []

		for (let i = 0; i < symbols.length; i++) {
			const symbol = symbols[i]
			const nextSymbol = symbols[i + 1]

			const startLine = Math.max(1, symbol.line - 2) // Include signature
			const endLine = nextSymbol ? Math.min(lines.length, nextSymbol.line - 1) : lines.length

			// Extend to include full function/class body
			const actualEndLine = this.findBlockEnd(lines, startLine - 1, language)
			const chunkEndLine = Math.max(endLine, actualEndLine)

			const chunkLines = lines.slice(startLine - 1, chunkEndLine)
			const chunkContent = chunkLines.join("\n")

			if (chunkContent.trim().length > 20) {
				chunks.push({
					startLine,
					endLine: chunkEndLine,
					chunkContent,
					chunkSymbols: [symbol.name],
				})
			}
		}

		// Add overlap context
		return this.addOverlap(chunks, lines)
	}

	private findBlockEnd(lines: string[], startIdx: number, language: string): number {
		// Simple brace/bracket counting for block end
		let braceCount = 0
		let inString = false
		let stringChar = ""

		for (let i = startIdx; i < lines.length; i++) {
			const line = lines[i]
			for (let j = 0; j < line.length; j++) {
				const char = line[j]

				if (!inString && (char === '"' || char === "'" || char === "`")) {
					inString = true
					stringChar = char
				} else if (inString && char === stringChar && line[j - 1] !== "\\") {
					inString = false
				} else if (!inString) {
					if (char === "{" || char === "(" || char === "[") braceCount++
					if (char === "}" || char === ")" || char === "]") braceCount--
				}
			}

			// For Python, use indentation
			if (language === "python" && i > startIdx) {
				const trimmed = line.trim()
				if (trimmed && !trimmed.startsWith("#") && !/^\s/.test(line)) {
					return i + 1
				}
			}

			if (braceCount <= 0 && i > startIdx) {
				return i + 1
			}
		}

		return lines.length
	}

	private chunkByLines(lines: string[]): Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }> {
		const chunks: Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }> = []
		let start = 0

		while (start < lines.length) {
			const end = Math.min(start + CHUNK_MAX_LINES, lines.length)
			const chunkLines = lines.slice(start, end)
			const content = chunkLines.join("\n")

			if (content.trim().length > 20) {
				chunks.push({
					startLine: start + 1,
					endLine: end,
					chunkContent: content,
					chunkSymbols: [],
				})
			}
			start += CHUNK_MAX_LINES - CHUNK_OVERLAP_LINES
		}

		return chunks
	}

	private addOverlap(
		chunks: Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }>,
		lines: string[],
	): Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }> {
		if (chunks.length <= 1) return chunks

		const result: Array<{ startLine: number; endLine: number; chunkContent: string; chunkSymbols: string[] }> = []

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i]
			let overlapStart = chunk.startLine

			if (i > 0) {
				// Add overlap from previous chunk
				const prevChunk = chunks[i - 1]
				const overlapLines = Math.min(CHUNK_OVERLAP_LINES, prevChunk.endLine - prevChunk.startLine + 1)
				overlapStart = Math.max(1, prevChunk.endLine - overlapLines + 1)
			}

			const overlapEnd = chunk.endLine
			const chunkLines = lines.slice(overlapStart - 1, overlapEnd)
			const content = chunkLines.join("\n")

			result.push({
				startLine: overlapStart,
				endLine: overlapEnd,
				chunkContent: content,
				chunkSymbols: chunk.chunkSymbols,
			})
		}

		return result
	}

	private async storeChunks(chunks: CodeChunk[]) {
		const statements = chunks.map((chunk) => ({
			sql: `
				INSERT OR REPLACE INTO chunks
				(id, file_path, relative_path, language, start_line, end_line, content, symbols, content_hash, indexed_at, project_path)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
			args: [
				chunk.id,
				chunk.filePath,
				chunk.relativePath,
				chunk.language,
				chunk.startLine,
				chunk.endLine,
				chunk.content,
				JSON.stringify(chunk.symbols),
				chunk.contentHash,
				chunk.indexedAt,
				this.projectPath,
			],
		}))

		await this.db.batch(statements, "write")
	}

	private async buildFtsIndex() {
		// Clear and rebuild FTS
		await this.run("DELETE FROM chunks_fts WHERE project_path = ?", [this.projectPath])

		const rows = await this.all<{ content: string; symbols: string; file_path: string; language: string; project_path: string }>(
			"SELECT content, symbols, file_path, language, project_path FROM chunks WHERE project_path = ?",
			[this.projectPath],
		)

		const statements = rows.map((row) => ({
			sql: `
				INSERT INTO chunks_fts (content, symbols, file_path, language, project_path)
				VALUES (?, ?, ?, ?, ?)
			`,
			args: [row.content, row.symbols, row.file_path, row.language, row.project_path],
		}))

		await this.db.batch(statements, "write")
	}

	private async saveProjectState(state: ProjectIndexState) {
		await this.run(
			`
				INSERT OR REPLACE INTO project_state
				(project_path, last_indexed, file_count, chunk_count, languages, status, error)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
			[
				state.projectPath,
				state.lastIndexed,
				state.fileCount,
				state.chunkCount,
				JSON.stringify(state.languages),
				state.status,
				state.error || null,
			],
		)
	}

	async getProjectState(): Promise<ProjectIndexState | null> {
		await this.ensureSchema()
		const row = await this.get<{ project_path: string; last_indexed: number; file_count: number; chunk_count: number; languages: string; status: string; error: string | null }>(
			"SELECT * FROM project_state WHERE project_path = ?",
			[this.projectPath],
		)

		if (!row) return null

		return {
			projectPath: row.project_path,
			lastIndexed: row.last_indexed,
			fileCount: row.file_count,
			chunkCount: row.chunk_count,
			languages: JSON.parse(row.languages),
			status: row.status as ProjectIndexState["status"],
			error: row.error || undefined,
		}
	}

	async search(options: SearchOptions): Promise<SearchResult[]> {
		await this.ensureSchema()
		const {
			query,
			projectPath,
			limit = 20,
			threshold = 0.1,
			languages,
		} = options

		if (projectPath !== this.projectPath) {
			throw new Error("Project path mismatch")
		}

		const queryTerms = this.tokenize(query)
		if (queryTerms.length === 0) return []

		// Build FTS query
		const ftsQuery = queryTerms.map(t => `"${t}"*`).join(" OR ")

		let sql = `
			SELECT c.*,
			       rank as fts_rank
			FROM chunks_fts f
			JOIN chunks c ON c.id = f.rowid
			WHERE f.project_path = ? AND f.content MATCH ?
		`

		const params: (string | number)[] = [projectPath, ftsQuery]

		if (languages && languages.length > 0) {
			const placeholders = languages.map(() => "?").join(",")
			sql += ` AND c.language IN (${placeholders})`
			params.push(...languages)
		}

		sql += ` ORDER BY fts_rank LIMIT ?`
		params.push(limit * 2) // Get more for reranking

		const rows = await this.all<{
			id: string
			file_path: string
			relative_path: string
			language: string
			start_line: number
			end_line: number
			content: string
			symbols: string
			content_hash: string
			indexed_at: number
			fts_rank: number
		}>(sql, params)

		// Rerank with symbol match boost
		const querySymbols = new Set(queryTerms.filter(t => t.length > 2))
		const results: SearchResult[] = []

		for (const row of rows) {
			const chunkSymbols = JSON.parse(row.symbols) as string[]
			const symbolMatch = chunkSymbols.some(s => querySymbols.has(s.toLowerCase()))
			const textScore = 1 / (1 + row.fts_rank) // BM25 rank (lower is better)
			const symbolBoost = symbolMatch ? 0.5 : 0
			const score = textScore + symbolBoost

			if (score >= threshold) {
				const chunk: CodeChunk = {
					id: row.id,
					filePath: row.file_path,
					relativePath: row.relative_path,
					language: row.language,
					startLine: row.start_line,
					endLine: row.end_line,
					content: row.content,
					symbols: chunkSymbols,
					contentHash: row.content_hash,
					indexedAt: row.indexed_at,
				}

				results.push({
					chunk,
					score,
					matchType: symbolMatch ? "symbol" : "semantic",
					contextBefore: await this.getContext(row.file_path, row.start_line - 5, row.start_line - 1),
					contextAfter: await this.getContext(row.file_path, row.end_line + 1, row.end_line + 5),
				})
			}
		}

		// Sort by score descending
		results.sort((a, b) => b.score - a.score)
		return results.slice(0, limit)
	}

	private async getContext(filePath: string, startLine: number, endLine: number): Promise<string | undefined> {
		if (startLine < 1) return undefined
		const row = await this.get<{ content: string }>(
			"SELECT content FROM chunks WHERE file_path = ? AND start_line <= ? AND end_line >= ? ORDER BY start_line DESC LIMIT 1",
			[filePath, startLine, endLine],
		)
		return row?.content
	}

	private tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, " ")
			.split(/\s+/)
			.filter(w => w.length >= 2)
			.slice(0, 10)
	}

	private emitProgress(progress: IndexProgress) {
		this.progressCallback?.(progress)
	}

	async handleFileEvent(event: FileWatchEvent) {
		await this.ensureSchema()
		if (event.type === "deleted") {
			await this.removeFile(event.filePath)
			return
		}

		// For added/changed, re-parse the file
		const ext = extname(event.filePath).toLowerCase()
		const language = LANGUAGE_MAP[ext] || "text"
		const content = await readFile(event.filePath, "utf-8").catch(() => "")
		if (!content.trim()) return

		// Remove old chunks for this file
		await this.removeFile(event.filePath)

		// Parse and store new chunks
		const lines = content.split("\n")
		const symbols = this.extractSymbols(content, language)
		const rawChunks = this.chunkBySymbols(lines, symbols, language)
		const chunks = this.addOverlap(rawChunks, lines).map(({ startLine, endLine, chunkContent, chunkSymbols }) => {
			const contentHash = createHash("sha256").update(content).digest("hex").slice(0, 16)
			const chunkHash = createHash("sha256")
				.update(`${event.relativePath}:${startLine}:${endLine}:${chunkContent}`)
				.digest("hex")
				.slice(0, 16)

			return {
				id: chunkHash,
				filePath: event.filePath,
				relativePath: event.relativePath,
				language,
				startLine,
				endLine,
				content: chunkContent,
				symbols: chunkSymbols,
				contentHash,
				indexedAt: Date.now(),
			}
		})

		if (chunks.length > 0) {
			await this.storeChunks(chunks)
		}
	}

	private async removeFile(filePath: string) {
		// Delete from chunks
		await this.run("DELETE FROM chunks WHERE file_path = ? AND project_path = ?", [filePath, this.projectPath])

		// Delete from FTS
		await this.run("DELETE FROM chunks_fts WHERE file_path = ? AND project_path = ?", [filePath, this.projectPath])
	}

	close() {
		this.db.close()
	}
}
