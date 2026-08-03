/**
 * AI Code Review Bot — automated PR review using Devil AI's code review agent
 * and git provider APIs.
 *
 * Workflow:
 * 1. Webhook triggers on PR open/update
 * 2. Fetch PR diff from GitHub/GitLab
 * 3. Run pattern-based code review
 * 4. Post review comments back to PR
 * 5. Set commit status
 */

import { reviewCode, type CodeReviewFinding } from "./code-review-agent"
import {
	getPR,
	postReview,
	setStatus,
	type GitProvider,
	type PRInfo,
	type ReviewComment,
	type ReviewSummary,
} from "./git-provider-api"
import { createLogger } from "./logger"

const log = createLogger("review-bot")

// ============================================================
// Types
// ============================================================

export interface ReviewBotConfig {
	/** GitHub or GitLab personal access token */
	githubToken?: string
	gitlabToken?: string
	/** Whether to auto-review on webhook events */
	autoReview: boolean
	/** Whether to post inline comments */
	inlineComments: boolean
	/** Whether to set commit status */
	setCommitStatus: boolean
	/** Categories to review */
	categories: Array<"security" | "performance" | "best-practice" | "complexity">
}

export interface ReviewBotResult {
	success: boolean
	provider: GitProvider
	repository: string
	prNumber: number
	review: ReviewSummary
	error?: string
}

// ============================================================
// Default Config
// ============================================================

const defaultConfig: ReviewBotConfig = {
	autoReview: true,
	inlineComments: true,
	setCommitStatus: true,
	categories: ["security", "performance", "best-practice"],
}

let config: ReviewBotConfig = { ...defaultConfig }

export function configureReviewBot(overrides: Partial<ReviewBotConfig>): void {
	config = { ...config, ...overrides }
	log.info("Review bot configured", { config })
}

// ============================================================
// Review Pipeline
// ============================================================

export async function reviewPR(
	provider: GitProvider,
	repository: string,
	prNumber: number,
): Promise<ReviewBotResult> {
	const token = provider === "github" ? config.githubToken : config.gitlabToken
	if (!token) {
		return {
			success: false,
			provider,
			repository,
			prNumber,
			review: { approved: false, comments: [], summary: "No API token configured", score: 0 },
			error: `No ${provider} token configured`,
		}
	}

	log.info("Starting PR review", { provider, repository, prNumber })

	// Set pending status
	if (config.setCommitStatus) {
		try {
			// We don't have the SHA yet, so we'll set it after fetching
		} catch (err) {
			log.warn("Failed to set pending status", { error: String(err) })
		}
	}

	try {
		// 1. Fetch PR info
		const prInfo = await getPR(provider, repository, prNumber, token)
		log.info("Fetched PR", { title: prInfo.title, files: prInfo.files.length })

		// 2. Set pending status
		if (config.setCommitStatus) {
			await setStatus(provider, repository, prInfo.headSha, token, "pending", "Review in progress...")
		}

		// 3. Review each file
		const allFindings: CodeReviewFinding[] = []
		const inlineComments: ReviewComment[] = []

		for (const file of prInfo.files) {
			if (!file.patch) continue
			// Skip non-code files
			if (!isReviewable(file.path)) continue

			const result = await reviewCode(file.patch, file.path, {
				categories: config.categories,
			})

			if (result.success && result.findings) {
				allFindings.push(...result.findings)

				if (config.inlineComments) {
					for (const finding of result.findings) {
						if (finding.severity !== "info") {
							// Only post warning/error as inline comments
							inlineComments.push({
								path: finding.file,
								line: finding.line,
								body: finding.suggestion
									? `${finding.message}\n\n**Suggestion:** ${finding.suggestion}`
									: finding.message,
								severity: finding.severity,
							})
						}
					}
				}
			}
		}

		// 4. Generate summary
		const errorCount = allFindings.filter((f) => f.severity === "error").length
		const warningCount = allFindings.filter((f) => f.severity === "warning").length
		const infoCount = allFindings.filter((f) => f.severity === "info").length

		let score = 100
		for (const f of allFindings) {
			if (f.severity === "error") score -= 5
			else if (f.severity === "warning") score -= 2
			else score -= 1
		}
		score = Math.max(0, score)

		const approved = errorCount === 0
		const summary = generateReviewSummary(
			prInfo,
			allFindings,
			score,
			approved,
			errorCount,
			warningCount,
			infoCount,
		)

		const review: ReviewSummary = {
			approved,
			comments: inlineComments,
			summary,
			score,
		}

		// 5. Post review
		await postReview(provider, repository, prNumber, prInfo.headSha, token, review)

		// 6. Set final status
		if (config.setCommitStatus) {
			await setStatus(
				provider,
				repository,
				prInfo.headSha,
				token,
				approved ? "success" : "failure",
				`Score: ${score}/100 (${errorCount} errors, ${warningCount} warnings)`,
			)
		}

		log.info("Review completed", {
			provider,
			repository,
			prNumber,
			score,
			approved,
			errors: errorCount,
			warnings: warningCount,
		})

		return {
			success: true,
			provider,
			repository,
			prNumber,
			review,
		}
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err)
		log.error("Review failed", { provider, repository, prNumber, error })

		// Set failure status
		if (config.setCommitStatus) {
			try {
				const prInfo = await getPR(provider, repository, prNumber, token)
				await setStatus(provider, repository, prInfo.headSha, token, "failure", "Review failed")
			} catch {
				// Ignore status update errors
			}
		}

		return {
			success: false,
			provider,
			repository,
			prNumber,
			review: { approved: false, comments: [], summary: "Review failed", score: 0 },
			error,
		}
	}
}

// ============================================================
// Helpers
// ============================================================

function isReviewable(filePath: string): boolean {
	const reviewableExtensions = new Set([
		".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
		".py", ".rb", ".go", ".rs", ".java", ".php",
		".cs", ".swift", ".kt",
	])
	const ext = filePath.substring(filePath.lastIndexOf("."))
	return reviewableExtensions.has(ext.toLowerCase())
}

function generateReviewSummary(
	prInfo: PRInfo,
	findings: CodeReviewFinding[],
	score: number,
	approved: boolean,
	errors: number,
	warnings: number,
	info: number,
): string {
	const lines: string[] = []

	lines.push(`## Devil AI Code Review`)
	lines.push(``)
	lines.push(`**PR:** #${prInfo.number} — ${prInfo.title}`)
	lines.push(`**Score:** ${score}/100`)
	lines.push(`**Status:** ${approved ? "✅ Approved" : "❌ Changes Requested"}`)
	lines.push(``)

	if (errors > 0 || warnings > 0) {
		lines.push(`### Summary`)
		lines.push(`- 🔴 ${errors} error(s)`)
		lines.push(`- 🟡 ${warnings} warning(s)`)
		lines.push(`- ℹ️ ${info} info(s)`)
		lines.push(``)

		// Group findings by category
		const byCategory = new Map<string, CodeReviewFinding[]>()
		for (const f of findings) {
			const cat = f.category
			if (!byCategory.has(cat)) byCategory.set(cat, [])
			byCategory.get(cat)!.push(f)
		}

		for (const [category, catFindings] of byCategory) {
			lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`)
			for (const f of catFindings.slice(0, 10)) {
				const icon = f.severity === "error" ? "🔴" : f.severity === "warning" ? "🟡" : "ℹ️"
				lines.push(`${icon} **${f.file}:${f.line}** — ${f.message}`)
				if (f.suggestion) {
					lines.push(`  💡 ${f.suggestion}`)
				}
			}
			if (catFindings.length > 10) {
				lines.push(`  ... and ${catFindings.length - 10} more`)
			}
			lines.push(``)
		}
	} else {
		lines.push(`No significant issues found. Nice work! 🎉`)
	}

	lines.push(`---`)
	lines.push(`*Powered by Devil AI Code Review Bot*`)

	return lines.join("\n")
}

// ============================================================
// Webhook Integration
// ============================================================

export function handleWebhookEvent(event: {
	type: string
	provider: GitProvider
	data: { repository: string; prNumber: number; commitSha: string }
}): void {
	if (!config.autoReview) return
	if (event.type !== "pr_opened" && event.type !== "pr_updated") return

	log.info("Processing webhook event for review", {
		provider: event.provider,
		repository: event.data.repository,
		prNumber: event.data.prNumber,
	})

	// Run review asynchronously
	reviewPR(event.provider, event.data.repository, event.data.prNumber).catch((err) => {
		log.error("Webhook review failed", { error: String(err) })
	})
}
