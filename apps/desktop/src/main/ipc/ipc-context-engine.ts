/**
 * IPC handlers for Smart Context Engine.
 */

import { ipcMain } from "electron"
import { createLogger } from "../logger"
import { withLogging } from "./utils"
import {
	buildDependencyGraph,
	analyzeImpact,
	detectBreakingChanges,
	generateContextSummary,
	invalidateGraphCache,
	type DependencyGraph,
} from "../context-engine"

const log = createLogger("ipc-context-engine")

// Cached graphs per project
const graphs = new Map<string, DependencyGraph>()

function getGraph(projectDir: string): DependencyGraph {
	if (!graphs.has(projectDir)) {
		graphs.set(projectDir, buildDependencyGraph(projectDir))
	}
	return graphs.get(projectDir)!
}

export function registerContextEngineIpc(): void {
	ipcMain.handle(
		"context:buildGraph",
		withLogging("context:buildGraph", (_event, args: { projectDir: string }) => {
			const graph = buildDependencyGraph(args.projectDir)
			graphs.set(args.projectDir, graph)
			return {
				success: true,
				metrics: graph.metrics,
				fileCount: graph.files.size,
				edgeCount: graph.edges.length,
			}
		}),
	)

	ipcMain.handle(
		"context:getMetrics",
		withLogging("context:getMetrics", (_event, args: { projectDir: string }) => {
			const graph = getGraph(args.projectDir)
			return { success: true, metrics: graph.metrics }
		}),
	)

	ipcMain.handle(
		"context:analyzeImpact",
		withLogging("context:analyzeImpact", (_event, args: {
			projectDir: string
			filePath: string
		}) => {
			const graph = getGraph(args.projectDir)
			const impact = analyzeImpact(graph, args.filePath)
			return { success: true, impact }
		}),
	)

	ipcMain.handle(
		"context:detectBreakingChanges",
		withLogging("context:detectBreakingChanges", (_event, args: {
			projectDir: string
		}) => {
			const graph = getGraph(args.projectDir)
			// Compare with a fresh scan
			const currentGraph = buildDependencyGraph(args.projectDir)
			const changes = detectBreakingChanges(graph, currentGraph)
			return { success: true, changes }
		}),
	)

	ipcMain.handle(
		"context:getSummary",
		withLogging("context:getSummary", (_event, args: {
			projectDir: string
			filePath?: string
		}) => {
			const graph = getGraph(args.projectDir)
			const summary = generateContextSummary(graph, args.filePath)
			return { success: true, summary }
		}),
	)

	ipcMain.handle(
		"context:getFileImports",
		withLogging("context:getFileImports", (_event, args: {
			projectDir: string
			filePath: string
		}) => {
			const graph = getGraph(args.projectDir)
			const relativePath = args.filePath.replace(args.projectDir + "/", "")
			const fileInfo = graph.files.get(relativePath)
			if (!fileInfo) return { success: false, error: "File not found in graph" }
			return { success: true, imports: fileInfo.imports, exports: fileInfo.exports }
		}),
	)

	ipcMain.handle(
		"context:getDependents",
		withLogging("context:getDependents", (_event, args: {
			projectDir: string
			filePath: string
		}) => {
			const graph = getGraph(args.projectDir)
			const relativePath = args.filePath.replace(args.projectDir + "/", "")
			const dependents = graph.reverseEdges.get(relativePath) || []
			return { success: true, dependents }
		}),
	)

	ipcMain.handle(
		"context:invalidateCache",
		withLogging("context:invalidateCache", (_event, args: { projectDir: string }) => {
			graphs.delete(args.projectDir)
			invalidateGraphCache()
			return { success: true }
		}),
	)

	log.info("Context Engine IPC handlers registered")
}
