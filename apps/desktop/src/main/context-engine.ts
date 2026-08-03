/**
 * Smart Context Engine — analyzes codebase structure, builds dependency graphs,
 * detects breaking changes, and provides intelligent context for AI agents.
 *
 * Features:
 * - Import/export dependency graph
 * - Breaking change detection
 * - Codebase health metrics
 * - Impact analysis for file changes
 * - Module boundary detection
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, extname, relative, dirname } from "node:path"
import { createLogger } from "./logger"

const log = createLogger("context-engine")

// ============================================================
// Types
// ============================================================

export interface FileInfo {
	path: string
	relativePath: string
	size: number
	language: string
	exports: string[]
	imports: ImportInfo[]
	classes: string[]
	functions: string[]
	interfaces: string[]
	types: string[]
	lines: number
}

export interface ImportInfo {
	source: string
	resolvedPath?: string
	specifiers: string[]
	isTypeOnly: boolean
	isDefault: boolean
	isNamespace: boolean
}

export interface DependencyEdge {
	from: string
	to: string
	imports: string[]
	isTypeOnly: boolean
}

export interface DependencyGraph {
	files: Map<string, FileInfo>
	edges: DependencyEdge[]
	reverseEdges: Map<string, string[]>
	metrics: CodebaseMetrics
}

export interface CodebaseMetrics {
	totalFiles: number
	totalLines: number
	totalExports: number
	totalImports: number
	languages: Record<string, number>
	avgFileSize: number
	circularDependencies: string[][]
	mostImported: Array<{ path: string; count: number }>
	mostImporting: Array<{ path: string; count: number }>
	orphanFiles: string[]
}

export interface BreakingChange {
	type: "removed_export" | "renamed_export" | "removed_parameter" | "changed_signature" | "removed_file"
	file: string
	detail: string
	affectedFiles: string[]
	severity: "high" | "medium" | "low"
}

export interface ImpactAnalysis {
	file: string
	directDependents: string[]
	transitiveDependents: string[]
	affectedExports: string[]
	riskScore: number
}

// ============================================================
// Language detection
// ============================================================

const LANGUAGE_MAP: Record<string, string> = {
	".ts": "typescript",
	".tsx": "typescript",
	".js": "javascript",
	".jsx": "javascript",
	".mjs": "javascript",
	".cjs": "javascript",
	".py": "python",
	".rs": "rust",
	".go": "go",
	".java": "java",
	".rb": "ruby",
	".php": "php",
	".css": "css",
	".scss": "scss",
	".html": "html",
	".json": "json",
	".yaml": "yaml",
	".yml": "yaml",
	".md": "markdown",
	".sh": "shell",
	".bash": "shell",
}

const IGNORED_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".next",
	".nuxt",
	"coverage",
	".turbo",
	".cache",
	"__pycache__",
	".DS_Store",
])

// ============================================================
// File Scanner
// ============================================================

function scanDirectory(dir: string, baseDir: string, files: string[] = []): string[] {
	if (!existsSync(dir)) return files

	const entries = readdirSync(dir)
	for (const entry of entries) {
		if (IGNORED_DIRS.has(entry)) continue
		const fullPath = join(dir, entry)
		const stat = statSync(fullPath)
		if (stat.isDirectory()) {
			scanDirectory(fullPath, baseDir, files)
		} else if (stat.isFile()) {
			const ext = extname(entry).toLowerCase()
			if (LANGUAGE_MAP[ext]) {
				files.push(fullPath)
			}
		}
	}
	return files
}

// ============================================================
// Parser (TypeScript/JavaScript)
// ============================================================

function parseTSFile(filePath: string, baseDir: string): FileInfo {
	const content = readFileSync(filePath, "utf-8")
	const lines = content.split("\n")
	const relativePath = relative(baseDir, filePath)

	const imports: ImportInfo[] = []
	const exports: string[] = []
	const classes: string[] = []
	const functions: string[] = []
	const interfaces: string[] = []
	const types: string[] = []

	// Parse imports
	const importRegex = /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+)(?:\s*,\s*\{([^}]+)\})?|\*\s+as\s+(\w+))\s+from\s+["']([^"']+)["']|import\s+["']([^"']+)["']/g
	let importMatch: RegExpExecArray | null
	while ((importMatch = importRegex.exec(content)) !== null) {
		const namedImports = importMatch[1]?.split(",").map((s) => s.trim().split(/\s+as\s+/)[0]) ?? []
		const defaultImport = importMatch[2]
		const additionalNamed = importMatch[3]?.split(",").map((s) => s.trim().split(/\s+as\s+/)[0]) ?? []
		const namespaceImport = importMatch[4]
		const source = importMatch[5] || importMatch[6]
		const isTypeOnly = importMatch[0].includes("import type")

		if (source) {
			imports.push({
				source,
				resolvedPath: resolveImportPath(source, filePath),
				specifiers: [...namedImports, ...additionalNamed].filter(Boolean),
				isTypeOnly,
				isDefault: !!defaultImport,
				isNamespace: !!namespaceImport,
			})
		}
	}

	// Parse exports
	const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum|async\s+function)\s+(\w+)|(?:export\s+\{([^}]+)\})/g
	let exportMatch: RegExpExecArray | null
	while ((exportMatch = exportRegex.exec(content)) !== null) {
		if (exportMatch[1]) {
			exports.push(exportMatch[1])
		} else if (exportMatch[2]) {
			const namedExports = exportMatch[2].split(",").map((s) => s.trim().split(/\s+as\s+/)[0])
			exports.push(...namedExports)
		}
	}

	// Parse classes
	const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g
	let classMatch: RegExpExecArray | null
	while ((classMatch = classRegex.exec(content)) !== null) {
		classes.push(classMatch[1])
	}

	// Parse functions
	const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g
	let funcMatch: RegExpExecArray | null
	while ((funcMatch = funcRegex.exec(content)) !== null) {
		functions.push(funcMatch[1])
	}

	// Parse interfaces
	const ifaceRegex = /(?:export\s+)?interface\s+(\w+)/g
	let ifaceMatch: RegExpExecArray | null
	while ((ifaceMatch = ifaceRegex.exec(content)) !== null) {
		interfaces.push(ifaceMatch[1])
	}

	// Parse types
	const typeRegex = /(?:export\s+)?type\s+(\w+)/g
	let typeMatch: RegExpExecArray | null
	while ((typeMatch = typeRegex.exec(content)) !== null) {
		types.push(typeMatch[1])
	}

	return {
		path: filePath,
		relativePath,
		size: content.length,
		language: LANGUAGE_MAP[extname(filePath).toLowerCase()] || "unknown",
		exports,
		imports,
		classes,
		functions,
		interfaces,
		types,
		lines: lines.length,
	}
}

function parsePythonFile(filePath: string, baseDir: string): FileInfo {
	const content = readFileSync(filePath, "utf-8")
	const lines = content.split("\n")
	const relativePath = relative(baseDir, filePath)

	const imports: ImportInfo[] = []
	const exports: string[] = []
	const classes: string[] = []
	const functions: string[] = []

	// Parse imports
	const importRegex = /(?:from\s+(\S+)\s+)?import\s+(.+)/g
	let importMatch: RegExpExecArray | null
	while ((importMatch = importRegex.exec(content)) !== null) {
		const source = importMatch[1] || "__builtins__"
		const specifiers = importMatch[2].split(",").map((s) => s.trim().split(/\s+as\s+/)[0])
		imports.push({
			source,
			specifiers,
			isTypeOnly: false,
			isDefault: false,
			isNamespace: false,
		})
	}

	// Parse classes and functions
	const classRegex = /class\s+(\w+)/g
	let classMatch: RegExpExecArray | null
	while ((classMatch = classRegex.exec(content)) !== null) {
		classes.push(classMatch[1])
	}

	const funcRegex = /def\s+(\w+)/g
	let funcMatch: RegExpExecArray | null
	while ((funcMatch = funcRegex.exec(content)) !== null) {
		functions.push(funcMatch[1])
	}

	// Public exports (no underscore prefix)
	const allExports = [...classes, ...functions].filter((n) => !n.startsWith("_"))
	const allRegex = /__all__\s*=\s*\[([^\]]+)\]/
	const allMatch = allRegex.exec(content)
	if (allMatch) {
		const namedExports = allMatch[1].split(",").map((s) => s.trim().replace(/['"]/g, ""))
		exports.push(...namedExports)
	} else {
		exports.push(...allExports)
	}

	return {
		path: filePath,
		relativePath,
		size: content.length,
		language: "python",
		exports,
		imports,
		classes,
		functions,
		interfaces: [],
		types: [],
		lines: lines.length,
	}
}

// ============================================================
// Resolution
// ============================================================

function resolveImportPath(source: string, fromFile: string): string | undefined {
	// Skip bare specifier imports (npm packages)
	if (!source.startsWith(".") && !source.startsWith("/")) return undefined

	const fromDir = dirname(fromFile)
	let resolved = join(fromDir, source)

	// Try adding extensions
	const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"]
	if (!extname(resolved)) {
		for (const ext of extensions) {
			if (existsSync(resolved + ext)) return resolved + ext
		}
	}

	return existsSync(resolved) ? resolved : undefined
}

// ============================================================
// Graph Builder
// ============================================================

export function buildDependencyGraph(projectDir: string): DependencyGraph {
	log.info("Building dependency graph", { projectDir })

	const files = scanDirectory(projectDir, projectDir)
	const fileMap = new Map<string, FileInfo>()
	const edges: DependencyEdge[] = []

	// Parse all files
	for (const filePath of files) {
		const ext = extname(filePath).toLowerCase()
		let info: FileInfo
		if (ext === ".py") {
			info = parsePythonFile(filePath, projectDir)
		} else if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
			info = parseTSFile(filePath, projectDir)
		} else {
			continue
		}
		fileMap.set(info.relativePath, info)
	}

	// Build edges
	for (const [, info] of fileMap) {
		for (const imp of info.imports) {
			if (imp.resolvedPath) {
				const targetRelative = relative(projectDir, imp.resolvedPath)
				if (fileMap.has(targetRelative)) {
					edges.push({
						from: info.relativePath,
						to: targetRelative,
						imports: imp.specifiers,
						isTypeOnly: imp.isTypeOnly,
					})
				}
			}
		}
	}

	// Build reverse edges (who imports me?)
	const reverseEdges = new Map<string, string[]>()
	for (const edge of edges) {
		if (!reverseEdges.has(edge.to)) reverseEdges.set(edge.to, [])
		reverseEdges.get(edge.to)!.push(edge.from)
	}

	// Calculate metrics
	const metrics = calculateMetrics(fileMap, edges, reverseEdges)

	log.info("Dependency graph built", {
		files: fileMap.size,
		edges: edges.length,
		circularDeps: metrics.circularDependencies.length,
	})

	return { files: fileMap, edges, reverseEdges, metrics }
}

// ============================================================
// Metrics
// ============================================================

function calculateMetrics(
	files: Map<string, FileInfo>,
	edges: DependencyEdge[],
	reverseEdges: Map<string, string[]>,
): CodebaseMetrics {
	const languages: Record<string, number> = {}
	let totalLines = 0
	let totalExports = 0
	let totalImports = 0

	for (const [, info] of files) {
		languages[info.language] = (languages[info.language] || 0) + 1
		totalLines += info.lines
		totalExports += info.exports.length
		totalImports += info.imports.length
	}

	// Most imported files
	const mostImported = Array.from(reverseEdges.entries())
		.map(([path, importers]) => ({ path, count: importers.length }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 20)

	// Most importing files
	const importCounts = new Map<string, number>()
	for (const edge of edges) {
		importCounts.set(edge.from, (importCounts.get(edge.from) || 0) + 1)
	}
	const mostImporting = Array.from(importCounts.entries())
		.map(([path, count]) => ({ path, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 20)

	// Orphan files (nothing imports them, they import nothing)
	const orphanFiles: string[] = []
	for (const [path] of files) {
		const hasImports = edges.some((e) => e.from === path)
		const isImported = reverseEdges.has(path)
		if (!hasImports && !isImported) orphanFiles.push(path)
	}

	// Circular dependencies
	const circularDependencies = detectCycles(files, edges)

	const avgFileSize = files.size > 0
		? Array.from(files.values()).reduce((sum, f) => sum + f.size, 0) / files.size
		: 0

	return {
		totalFiles: files.size,
		totalLines,
		totalExports,
		totalImports,
		languages,
		avgFileSize,
		circularDependencies,
		mostImported,
		mostImporting,
		orphanFiles,
	}
}

function detectCycles(files: Map<string, FileInfo>, edges: DependencyEdge[]): string[][] {
	const cycles: string[][] = []
	const adjacency = new Map<string, string[]>()
	for (const [path] of files) adjacency.set(path, [])
	for (const edge of edges) {
		adjacency.get(edge.from)?.push(edge.to)
	}

	const visited = new Set<string>()
	const stack = new Set<string>()
	const path: string[] = []

	function dfs(node: string): void {
		if (stack.has(node)) {
			const cycleStart = path.indexOf(node)
			if (cycleStart !== -1) {
				cycles.push([...path.slice(cycleStart), node])
			}
			return
		}
		if (visited.has(node)) return

		visited.add(node)
		stack.add(node)
		path.push(node)

		for (const neighbor of adjacency.get(node) || []) {
			dfs(neighbor)
		}

		path.pop()
		stack.delete(node)
	}

	for (const [path] of files) {
		dfs(path)
	}

	return cycles
}

// ============================================================
// Impact Analysis
// ============================================================

export function analyzeImpact(
	graph: DependencyGraph,
	changedFile: string,
): ImpactAnalysis {
	const relativePath = changedFile.startsWith("/")
		? relative(dirname(graph.files.values().next().value?.path || ""), changedFile)
		: changedFile

	// Direct dependents
	const directDependents = graph.reverseEdges.get(relativePath) || []

	// Transitive dependents (BFS)
	const transitiveDependents = new Set<string>()
	const queue = [...directDependents]
	while (queue.length > 0) {
		const current = queue.shift()!
		if (transitiveDependents.has(current)) continue
		transitiveDependents.add(current)
		const parents = graph.reverseEdges.get(current) || []
		queue.push(...parents)
	}

	// Affected exports
	const fileInfo = graph.files.get(relativePath)
	const affectedExports = fileInfo?.exports || []

	// Risk score (0-100)
	const directCount = directDependents.length
	const transitiveCount = transitiveDependents.size
	const riskScore = Math.min(100, directCount * 10 + transitiveCount * 2)

	return {
		file: relativePath,
		directDependents,
		transitiveDependents: Array.from(transitiveDependents),
		affectedExports,
		riskScore,
	}
}

// ============================================================
// Breaking Change Detection
// ============================================================

export function detectBreakingChanges(
	baseline: DependencyGraph,
	current: DependencyGraph,
): BreakingChange[] {
	const breakingChanges: BreakingChange[] = []

	// Check for removed files
	for (const [path] of baseline.files) {
		if (!current.files.has(path)) {
			const dependents = baseline.reverseEdges.get(path) || []
			breakingChanges.push({
				type: "removed_file",
				file: path,
				detail: `File "${path}" was removed`,
				affectedFiles: dependents,
				severity: dependents.length > 0 ? "high" : "low",
			})
		}
	}

	// Check for removed exports
	for (const [path, baselineInfo] of baseline.files) {
		const currentInfo = current.files.get(path)
		if (!currentInfo) continue

		const removedExports = baselineInfo.exports.filter((e) => !currentInfo.exports.includes(e))
		for (const exp of removedExports) {
			// Find who imports this export
			const affected = baseline.edges
				.filter((e) => e.to === path && e.imports.includes(exp))
				.map((e) => e.from)

			breakingChanges.push({
				type: "removed_export",
				file: path,
				detail: `Export "${exp}" was removed`,
				affectedFiles: affected,
				severity: affected.length > 0 ? "high" : "low",
			})
		}
	}

	return breakingChanges
}

// ============================================================
// Context Summary (for AI agents)
// ============================================================

export function generateContextSummary(graph: DependencyGraph, targetFile?: string): string {
	const lines: string[] = []
	const m = graph.metrics

	lines.push("## Codebase Overview")
	lines.push(`- ${m.totalFiles} files, ${m.totalLines.toLocaleString()} lines`)
	lines.push(`- Languages: ${Object.entries(m.languages).map(([k, v]) => `${k}(${v})`).join(", ")}`)
	lines.push(`- ${m.totalExports} exports, ${m.totalImports} imports`)

	if (m.circularDependencies.length > 0) {
		lines.push(`\n## Circular Dependencies (${m.circularDependencies.length})`)
		for (const cycle of m.circularDependencies.slice(0, 5)) {
			lines.push(`- ${cycle.join(" → ")}`)
		}
	}

	if (m.mostImported.length > 0) {
		lines.push("\n## Most Imported Files")
		for (const f of m.mostImported.slice(0, 10)) {
			lines.push(`- ${f.path} (imported by ${f.count} files)`)
		}
	}

	if (m.orphanFiles.length > 0) {
		lines.push(`\n## Orphan Files (${m.orphanFiles.length})`)
		for (const f of m.orphanFiles.slice(0, 10)) {
			lines.push(`- ${f}`)
		}
	}

	if (targetFile) {
		const impact = analyzeImpact(graph, targetFile)
		lines.push(`\n## Impact Analysis: ${targetFile}`)
		lines.push(`- Risk Score: ${impact.riskScore}/100`)
		lines.push(`- Direct dependents: ${impact.directDependents.length}`)
		lines.push(`- Transitive dependents: ${impact.transitiveDependents.length}`)
		if (impact.affectedExports.length > 0) {
			lines.push(`- Exports: ${impact.affectedExports.join(", ")}`)
		}
	}

	return lines.join("\n")
}

// ============================================================
// Public API
// ============================================================

let cachedGraph: DependencyGraph | null = null
let cachedProjectDir: string | null = null

export function getCachedGraph(projectDir: string): DependencyGraph {
	if (!cachedGraph || cachedProjectDir !== projectDir) {
		cachedGraph = buildDependencyGraph(projectDir)
		cachedProjectDir = projectDir
	}
	return cachedGraph
}

export function invalidateGraphCache(): void {
	cachedGraph = null
	cachedProjectDir = null
}
