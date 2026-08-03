/**
 * Webhook review handler for GitHub/GitLab PR events.
 * Listens to webhook events and triggers code reviews using the code review agent.
 */

import { onWebhookEvent, type WebhookEvent, type PRReviewRequest } from "./webhook-server"
import { getProviderConfig, getPRDiff, postPRComment } from "./git-provider-client"
import { createLogger } from "./logger"

const log = createLogger("webhook-review-handler")

// ============================================================
// Types
// ============================================================

interface ReviewState {
	repository: string
	prNumber: number
	lastReview?: number
	reviewing: boolean
}

// ============================================================
// State
// ============================================================

let handlerRegistered = false
const reviewStates = new Map<string, ReviewState>()

// ============================================================
// Public API
// ============================================================

/**
 * Initialize the webhook review handler.
 * Call this once during app startup.
 */
export function initWebhookReviewHandler(): void {
	if (handlerRegistered) return

	onWebhookEvent(handleWebhookEvent)
	handlerRegistered = true

	log.info("Webhook review handler initialized")
}

/**
 * Get review status for a PR.
 */
export function getPRReviewStatus(
	provider: string,
	repository: string,
	prNumber: number,
): { reviewed: boolean; lastReview?: number; reviewing: boolean } {
	const key = `${provider}:${repository}:${prNumber}`
	const state = reviewStates.get(key)
	return {
		reviewed: !!state?.lastReview,
		lastReview: state?.lastReview,
		reviewing: state?.reviewing ?? false,
	}
}

// ============================================================
// Event Handler
// ============================================================

async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
	const { type, provider, data } = event

	log.info("Processing webhook event", {
		type,
		provider,
		pr: data.prNumber,
		repository: data.repository,
	})

	try {
		switch (type) {
			case "pr_opened":
				await handlePROpened(data)
				break
			case "pr_updated":
				await handlePRUpdated(data)
				break
			case "pr_closed":
				await handlePRClosed(data)
				break
			default:
				log.debug("Unhandled webhook event type", { type })
		}
	} catch (err) {
		log.error("Failed to process webhook event", { type, provider, error: err })
	}
}

async function handlePROpened(data: PRReviewRequest): Promise<void> {
	log.info("PR opened, triggering review", {
		repository: data.repository,
		pr: data.prNumber,
		title: data.prTitle,
	})

	await triggerCodeReview(data)
}

async function handlePRUpdated(data: PRReviewRequest): Promise<void> {
	log.info("PR updated, triggering review", {
		repository: data.repository,
		pr: data.prNumber,
		commit: data.commitSha,
	})

	await triggerCodeReview(data)
}

async function handlePRClosed(data: PRReviewRequest): Promise<void> {
	log.info("PR closed", {
		repository: data.repository,
		pr: data.prNumber,
	})

	const key = `${data.provider}:${data.repository}:${data.prNumber}`
	reviewStates.delete(key)
}

// ============================================================
// Code Review Trigger
// ============================================================

async function triggerCodeReview(data: PRReviewRequest): Promise<void> {
	const key = `${data.provider}:${data.repository}:${data.prNumber}`

	// Skip if already reviewing
	const existingState = reviewStates.get(key)
	if (existingState?.reviewing) {
		log.info("Review already in progress, skipping", {
			repository: data.repository,
			pr: data.prNumber,
		})
		return
	}

	// Set reviewing state
	reviewStates.set(key, {
		repository: data.repository,
		prNumber: data.prNumber,
		reviewing: true,
	})

	try {
		// Get provider config
		const config = getProviderConfig(data.provider)
		if (!config) {
			log.warn("Provider config not available, skipping review", {
				provider: data.provider,
			})
			return
		}

		// Fetch PR diff
		log.info("Fetching PR diff", {
			provider: data.provider,
			repository: data.repository,
			pr: data.prNumber,
		})

		const diff = await getPRDiff(config, data.repository, data.prNumber)

		log.info("Fetched PR diff", {
			files: diff.files.length,
			commits: diff.commits.length,
		})

		// Run code review on the changes
		const reviewResult = await reviewCodeChanges(data, diff)

		// Post review comment to PR
		if (reviewResult) {
			await postPRComment(config, data.repository, data.prNumber, reviewResult)
			log.info("Posted review comment to PR", {
				provider: data.provider,
				repository: data.repository,
				pr: data.prNumber,
			})
		}

		// Update state
		const state = reviewStates.get(key)
		if (state) {
			state.lastReview = Date.now()
			state.reviewing = false
		}
	} catch (err) {
		log.error("Code review failed", err)

		// Update state
		const state = reviewStates.get(key)
		if (state) {
			state.reviewing = false
		}
	}
}

// ============================================================
// Code Review Logic
// ============================================================

async function reviewCodeChanges(
	data: PRReviewRequest,
	diff: { files: Array<{ filename: string; patch?: string }> },
): Promise<string | null> {
	try {
		// Build review comment
		const sections: string[] = []

		// Summary section
		sections.push(`## 🔍 AI Code Review\n`)
		sections.push(`**PR:** #${data.prNumber} - ${data.prTitle}`)
		sections.push(`**Repository:** ${data.repository}`)
		sections.push(`**Branch:** ${data.branch}\n`)

		// Files reviewed
		sections.push(`### Files Reviewed\n`)
		for (const file of diff.files) {
			sections.push(`- \`${file.filename}\``)
		}
		sections.push("")

		// Analyze patches for common issues
		const issues: string[] = []

		for (const file of diff.files) {
			if (!file.patch) continue

			const fileIssues = analyzePatch(file.filename, file.patch)
			issues.push(...fileIssues)
		}

		if (issues.length > 0) {
			sections.push(`### Issues Found\n`)
			sections.push(...issues)
			sections.push("")
		} else {
			sections.push(`### ✅ No Issues Found\n`)
			sections.push("The code looks good! No obvious issues detected.\n")
		}

		// Footer
		sections.push("---")
		sections.push("*Automated review by Devil AI Code Reviewer*")

		return sections.join("\n")
	} catch (err) {
		log.error("Failed to generate review", err)
		return null
	}
}

function analyzePatch(filename: string, patch: string): string[] {
	const issues: string[] = []
	const lines = patch.split("\n")

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]

		// Skip context lines
		if (!line.startsWith("+")) continue

		const content = line.slice(1)

		// Check for console.log statements
		if (content.includes("console.log(")) {
			issues.push(
				`- ⚠️ **${filename}** (line ~${i + 1}): Contains \`console.log\` statement - consider removing for production`,
			)
		}

		// Check for TODO/FIXME comments
		if (content.includes("TODO") || content.includes("FIXME")) {
			issues.push(
				`- ℹ️ **${filename}** (line ~${i + 1}): Contains TODO/FIXME comment`,
			)
		}

		// Check for potential secrets
		const secretPatterns = [
			/password\s*[:=]\s*["'][^"']+["']/i,
			/secret\s*[:=]\s*["'][^"']+["']/i,
			/api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
			/token\s*[:=]\s*["'][^"']+["']/i,
		]

		for (const pattern of secretPatterns) {
			if (pattern.test(content)) {
				issues.push(
					`- 🚨 **${filename}** (line ~${i + 1}): Potential hardcoded secret detected`,
				)
				break
			}
		}

		// Check for eval() usage
		if (content.includes("eval(")) {
			issues.push(
				`- ⚠️ **${filename}** (line ~${i + 1}): \`eval()\` usage detected - potential security risk`,
			)
		}
	}

	return issues
}
