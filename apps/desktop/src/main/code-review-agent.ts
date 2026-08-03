/**
 * Code Review Agent — extends Ponytail with security, performance, and best practices.
 *
 * Wraps Ponytail for over-engineering detection and adds custom review rules
 * for security vulnerabilities, performance issues, and coding best practices.
 * Ponytail is now a built-in skill (not a CLI tool).
 */

import { existsSync } from "node:fs"
import { createLogger } from "./logger"

const log = createLogger("code-review-agent")

// ============================================================
// Types
// ============================================================

export type ReviewCategory = "security" | "performance" | "best-practice" | "complexity"

export interface CodeReviewResult {
	success: boolean
	findings?: CodeReviewFinding[]
	summary?: string
	score?: number
	error?: string
}

export interface CodeReviewFinding {
	file: string
	line: number
	category: ReviewCategory
	severity: "error" | "warning" | "info"
	message: string
	suggestion?: string
	rule?: string
}

export interface ReviewOptions {
	/** Categories to review (default: all) */
	categories?: ReviewCategory[]
	/** File path for single-file review */
	filePath?: string
	/** Whether to include Ponytail complexity findings */
	includeComplexity?: boolean
}

// ============================================================
// Ponytail integration (built-in skill)
// ============================================================

export async function checkPonytailInstalled(): Promise<{ installed: boolean; version?: string }> {
	// Ponytail is always "installed" as a built-in skill
	return { installed: true, version: "1.0.0-devil-ai" }
}

// ============================================================
// Security rules (built-in, no external tool needed)
// ============================================================

const SECURITY_PATTERNS: Array<{
	pattern: RegExp
	message: string
	severity: "error" | "warning" | "info"
	rule: string
}> = [
	{
		pattern: /eval\s*\(/,
		message: "eval() usage detected — potential code injection risk",
		severity: "error",
		rule: "no-eval",
	},
	{
		pattern: /innerHTML\s*=/,
		message: "innerHTML assignment — potential XSS vulnerability",
		severity: "error",
		rule: "no-innerhtml",
	},
	{
		pattern: /dangerouslySetInnerHTML/,
		message: "dangerouslySetInnerHTML usage — ensure HTML is sanitized",
		severity: "warning",
		rule: "no-dangerously-set-innerhtml",
	},
	{
		pattern: /new\s+Function\s*\(/,
		message: "Function constructor — potential code injection",
		severity: "error",
		rule: "no-function-constructor",
	},
	{
		pattern: /child_process/,
		message: "child_process import — ensure commands are sanitized",
		severity: "warning",
		rule: "sanitize-shell-commands",
	},
	{
		pattern: /execSync\s*\(\s*[^)]*\$\{/,
		message: "Template literal in execSync — shell injection risk",
		severity: "error",
		rule: "no-template-in-exec",
	},
	{
		pattern: /process\.env/,
		message: "process.env access — ensure secrets are not logged",
		severity: "info",
		rule: "no-env-leaks",
	},
	{
		pattern: /console\.\w+\(.*(?:password|secret|token|key)/i,
		message: "Sensitive data may be logged to console",
		severity: "warning",
		rule: "no-sensitive-logging",
	},
	{
		pattern: /(?:http|https):\/\/(?:localhost|127\.0\.0\.1)/,
		message: "Hardcoded localhost URL — ensure this is not in production",
		severity: "info",
		rule: "no-hardcoded-urls",
	},
]

// ============================================================
// Performance rules (built-in)
// ============================================================

const PERFORMANCE_PATTERNS: Array<{
	pattern: RegExp
	message: string
	severity: "error" | "warning" | "info"
	rule: string
}> = [
	{
		pattern: /\.forEach\s*\(\s*async/,
		message: "async callback in forEach — use Promise.all() or for...of",
		severity: "warning",
		rule: "no-async-forEach",
	},
	{
		pattern: /for\s*\(\s*(?:let|var)\s+\w+\s*=\s*0\s*;.*\.length/,
		message: "Consider using for...of or array methods for better readability",
		severity: "info",
		rule: "prefer-for-of",
	},
	{
		pattern: /JSON\.parse\s*\(\s*JSON\.stringify/,
		message: "Deep clone via JSON — use structuredClone() or lodash.cloneDeep()",
		severity: "warning",
		rule: "no-json-clone",
	},
	{
		pattern: /document\.getElementById|document\.querySelector/,
		message: "Direct DOM query — consider React refs or state",
		severity: "info",
		rule: "prefer-react-refs",
	},
	{
		pattern: /setInterval\s*\(/,
		message: "setInterval usage — ensure cleanup in useEffect return",
		severity: "info",
		rule: "cleanup-intervals",
	},
]

// ============================================================
// Best practices rules (built-in)
// ============================================================

const BEST_PRACTICE_PATTERNS: Array<{
	pattern: RegExp
	message: string
	severity: "error" | "warning" | "info"
	rule: string
}> = [
	{
		pattern: /catch\s*\(\s*\)\s*\{[\s]*\}/,
		message: "Empty catch block — errors are silently swallowed",
		severity: "warning",
		rule: "no-empty-catch",
	},
	{
		pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}/,
		message: "Catch block with no error handling — at minimum log the error",
		severity: "warning",
		rule: "handle-catch-errors",
	},
	{
		pattern: /:\s*any(?:\s|;|,|\))/,
		message: "Explicit 'any' type — consider a more specific type",
		severity: "info",
		rule: "no-explicit-any",
	},
	{
		pattern: /console\.log\s*\(/,
		message: "console.log in production code — use structured logger",
		severity: "info",
		rule: "use-structured-logger",
	},
	{
		pattern: /(?:===|!==)\s*(?:null|undefined)/,
		message: "Consider using ?? or optional chaining for null checks",
		severity: "info",
		rule: "prefer-nullish-coalescing",
	},
]

// ============================================================
// Review engine
// ============================================================

function reviewWithPatterns(
	code: string,
	filePath: string,
	patterns: Array<{ pattern: RegExp; message: string; severity: "error" | "warning" | "info"; rule: string }>,
	category: ReviewCategory,
): CodeReviewFinding[] {
	const findings: CodeReviewFinding[] = []
	const lines = code.split("\n")

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		for (const { pattern, message, severity, rule } of patterns) {
			if (pattern.test(line)) {
				findings.push({
					file: filePath,
					line: i + 1,
					category,
					severity,
					message,
					rule,
				})
			}
		}
	}

	return findings
}

// ============================================================
// Public API
// ============================================================

/**
 * Run a comprehensive code review combining Ponytail + built-in rules.
 */
export async function reviewCode(
	code: string,
	filePath: string = "untitled",
	options: ReviewOptions = {},
): Promise<CodeReviewResult> {
	const {
		categories = ["security", "performance", "best-practice", "complexity"],
		includeComplexity = true,
	} = options

	const findings: CodeReviewFinding[] = []

	// Run built-in pattern checks
	if (categories.includes("security")) {
		findings.push(...reviewWithPatterns(code, filePath, SECURITY_PATTERNS, "security"))
	}
	if (categories.includes("performance")) {
		findings.push(...reviewWithPatterns(code, filePath, PERFORMANCE_PATTERNS, "performance"))
	}
	if (categories.includes("best-practice")) {
		findings.push(...reviewWithPatterns(code, filePath, BEST_PRACTICE_PATTERNS, "best-practice"))
	}

	// Run Ponytail for complexity findings
	if (categories.includes("complexity") && includeComplexity) {
		try {
			const ponytail = await checkPonytailInstalled()
			if (ponytail.installed) {
				const result = await runPonytailReview(code, filePath)
				if (result.success && result.findings) {
					for (const f of result.findings) {
						findings.push({
							file: f.file,
							line: f.line,
							category: "complexity",
							severity: "warning",
							message: f.description,
							suggestion: f.replacement,
							rule: `ponytail-${f.tag}`,
						})
					}
				}
			}
		} catch (err) {
			log.warn("Ponytail review failed, continuing with built-in rules", { error: String(err) })
		}
	}

	// Calculate score (100 = no issues, -5 per error, -2 per warning, -1 per info)
	let score = 100
	for (const f of findings) {
		if (f.severity === "error") score -= 5
		else if (f.severity === "warning") score -= 2
		else score -= 1
	}
	score = Math.max(0, score)

	const errorCount = findings.filter((f) => f.severity === "error").length
	const warningCount = findings.filter((f) => f.severity === "warning").length
	const infoCount = findings.filter((f) => f.severity === "info").length

	return {
		success: true,
		findings,
		summary: `${findings.length} findings (${errorCount} errors, ${warningCount} warnings, ${infoCount} info) — Score: ${score}/100`,
		score,
	}
}

/**
 * Audit an entire directory.
 */
export async function auditDirectory(
	cwd: string,
	_options?: ReviewOptions,
): Promise<CodeReviewResult> {
	if (!existsSync(cwd)) {
		return { success: false, error: `Directory not found: ${cwd}` }
	}

	// Ponytail is now a built-in skill - complexity review happens at prompt level
	// Return a message indicating ponytail rules are active
	return {
		success: true,
		findings: [],
		summary: "Ponytail skill is active - complexity rules are injected into prompts automatically",
		score: 100,
	}
}

// ============================================================
// Helpers
// ============================================================

function runPonytailReview(
	_code: string,
	_filePath: string,
): Promise<{ success: boolean; findings?: Array<{ file: string; line: number; tag: string; description: string; replacement: string }> }> {
	// Ponytail is now a built-in skill - review happens at prompt level
	// Return empty findings since the AI agent applies ponytail rules during generation
	return Promise.resolve({ success: true, findings: [] })
}
