/**
 * Pre-Cognitive Debugger — AST-based code analysis for error prediction.
 *
 * Analyzes code for potential issues before they happen:
 * - Null/undefined access patterns
 * - Missing error handling
 * - Type safety issues
 * - Race conditions
 * - Resource leaks
 */

import { atom } from "jotai"

// ============================================================
// Types
// ============================================================

export type IssueSeverity = "error" | "warning" | "info"
export type IssueCategory = "null-safety" | "error-handling" | "type-safety" | "race-condition" | "resource-leak" | "performance"

export interface DebugIssue {
	id: string
	category: IssueCategory
	severity: IssueSeverity
	message: string
	line: number
	column: number
	suggestion?: string
	confidence: number // 0-1
}

export interface AnalysisResult {
	filePath: string
	issues: DebugIssue[]
	score: number // 0-100, higher is better
	analyzedAt: number
}

// ============================================================
// Atoms
// ============================================================

export const preCognitiveEnabledAtom = atom(false)
export const lastAnalysisAtom = atom<AnalysisResult | null>(null)
export const isAnalyzingAtom = atom(false)

// ============================================================
// Pattern-based analysis rules
// ============================================================

interface AnalysisRule {
	category: IssueCategory
	severity: IssueSeverity
	pattern: RegExp
	message: string
	suggestion?: string
	confidence: number
}

const ANALYSIS_RULES: AnalysisRule[] = [
	// Null safety
	{
		category: "null-safety",
		severity: "warning",
		pattern: /\.\w+\s*\.\w+/g,
		message: "Potential null dereference — chained property access without null check",
		suggestion: "Use optional chaining (?.) or add a null check",
		confidence: 0.6,
	},
	{
		category: "null-safety",
		severity: "error",
		pattern: /JSON\.parse\([^)]+\)/g,
		message: "JSON.parse can throw on invalid input",
		suggestion: "Wrap in try/catch or use a validation library",
		confidence: 0.8,
	},

	// Error handling
	{
		category: "error-handling",
		severity: "warning",
		pattern: /catch\s*\{\s*\}/g,
		message: "Empty catch block silently swallows errors",
		suggestion: "Add error logging or rethrow",
		confidence: 0.9,
	},
	{
		category: "error-handling",
		severity: "info",
		pattern: /async\s+\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{[^}]*\}/g,
		message: "Async function without try/catch",
		suggestion: "Ensure errors are handled upstream",
		confidence: 0.5,
	},

	// Type safety
	{
		category: "type-safety",
		severity: "warning",
		pattern: /as\s+any\b/g,
		message: "Type assertion to 'any' bypasses type checking",
		suggestion: "Use a more specific type or unknown",
		confidence: 0.85,
	},
	{
		category: "type-safety",
		severity: "warning",
		pattern: /@ts-ignore|@ts-expect-error/g,
		message: "TypeScript directive suppresses type errors",
		suggestion: "Fix the underlying type issue",
		confidence: 0.9,
	},

	// Race conditions
	{
		category: "race-condition",
		severity: "warning",
		pattern: /setInterval\([^)]+,\s*\d+\)/g,
		message: "Interval may cause race conditions with async operations",
		suggestion: "Consider using async iteration or cancellation",
		confidence: 0.4,
	},

	// Resource leaks
	{
		category: "resource-leak",
		severity: "warning",
		pattern: /new\s+EventSource|new\s+WebSocket/g,
		message: "Network resource created without cleanup",
		suggestion: "Ensure close() is called on cleanup",
		confidence: 0.7,
	},
	{
		category: "resource-leak",
		severity: "warning",
		pattern: /addEventListener\([^)]+\)(?![\s\S]*removeEventListener)/g,
		message: "Event listener added without corresponding removal",
		suggestion: "Remove listener in cleanup function",
		confidence: 0.5,
	},

	// Performance
	{
		category: "performance",
		severity: "info",
		pattern: /\bfor\s*\(\s*(?:let|var|const)\s+\w+\s*=\s*0\s*;.*\bJSON\.stringify\b/g,
		message: "JSON.stringify in loop may cause performance issues",
		suggestion: "Cache the stringified result outside the loop",
		confidence: 0.6,
	},
]

// ============================================================
// Analysis engine
// ============================================================

function analyzeCodeInternal(code: string, filePath: string): AnalysisResult {
	const issues: DebugIssue[] = []
	let issueCounter = 0

	for (const rule of ANALYSIS_RULES) {
		const matches = code.matchAll(rule.pattern)
		for (const match of matches) {
			const lineNumber = code.slice(0, match.index).split("\n").length
			const lastNewline = code.lastIndexOf("\n", match.index)
			const column = match.index - lastNewline

			issues.push({
				id: `issue-${++issueCounter}`,
				category: rule.category,
				severity: rule.severity,
				message: rule.message,
				line: lineNumber,
				column,
				suggestion: rule.suggestion,
				confidence: rule.confidence,
			})
		}
	}

	// Calculate score (100 = no issues)
	let score = 100
	for (const issue of issues) {
		const penalty = issue.severity === "error" ? 10 : issue.severity === "warning" ? 5 : 2
		score -= penalty * issue.confidence
	}
	score = Math.max(0, Math.min(100, score))

	return {
		filePath,
		issues,
		score: Math.round(score),
		analyzedAt: Date.now(),
	}
}

// ============================================================
// Public API
// ============================================================

/**
 * Analyze code for potential issues.
 */
export function analyzeCode(code: string, filePath: string): AnalysisResult {
	return analyzeCodeInternal(code, filePath)
}

/**
 * Get a summary string for the analysis result.
 */
export function getAnalysisSummary(result: AnalysisResult): string {
	const errors = result.issues.filter((i) => i.severity === "error").length
	const warnings = result.issues.filter((i) => i.severity === "warning").length
	const infos = result.issues.filter((i) => i.severity === "info").length

	return `Score: ${result.score}/100 — ${errors} errors, ${warnings} warnings, ${infos} info`
}
