/**
 * Session Report atoms — structured export with actionable TODOs.
 */
import { atom } from "jotai"

export interface SessionReport {
	sessionId: string
	title: string
	createdAt: number
	duration: number
	/** What was accomplished */
	accomplishments: string[]
	/** Files changed */
	fileChanges: FileChange[]
	/** Auto-detected follow-up TODOs */
	todos: ReportTodo[]
	/** Cost breakdown */
	cost: CostBreakdown
	/** Model used */
	model: string
	/** Agent used */
	agent: string
}

export interface FileChange {
	path: string
	action: "added" | "modified" | "deleted"
	linesChanged: number
}

export interface ReportTodo {
	text: string
	priority: "high" | "medium" | "low"
	detectedFrom: string
}

export interface CostBreakdown {
	totalCost: number
	inputTokens: number
	outputTokens: number
	cacheReadTokens: number
	cacheWriteTokens: number
	modelCosts: Record<string, number>
}

export interface SessionReportState {
	generating: boolean
	report: SessionReport | null
	exportFormat: "markdown" | "json" | "clipboard"
}

export const sessionReportAtom = atom<SessionReportState>({
	generating: false,
	report: null,
	exportFormat: "markdown",
})

export const setReportFormatAtom = atom(
	null,
	(_get, set, format: "markdown" | "json" | "clipboard") => {
		set(sessionReportAtom, (prev) => ({ ...prev, exportFormat: format }))
	},
)
