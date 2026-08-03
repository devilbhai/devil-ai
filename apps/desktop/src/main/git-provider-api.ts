/**
 * Git Provider API Client — GitHub and GitLab integration for code reviews.
 *
 * Fetches PR diffs, posts review comments, and manages review status.
 */

import { createLogger } from "./logger"

const log = createLogger("git-provider-api")

// ============================================================
// Types
// ============================================================

export type GitProvider = "github" | "gitlab"

export interface PRFile {
	path: string
	patch?: string
	additions: number
	deletions: number
	status: "added" | "removed" | "modified" | "renamed"
}

export interface PRInfo {
	number: number
	title: string
	body: string
	headSha: string
	headBranch: string
	baseBranch: string
	state: "open" | "closed" | "merged"
	files: PRFile[]
	diff: string
}

export interface ReviewComment {
	path: string
	line: number
	body: string
	severity: "error" | "warning" | "info" | "suggestion"
}

export interface ReviewSummary {
	approved: boolean
	comments: ReviewComment[]
	summary: string
	score: number
}

// ============================================================
// GitHub API
// ============================================================

async function githubFetch(
	endpoint: string,
	token: string,
	options?: { method?: string; body?: unknown },
): Promise<unknown> {
	const url = `https://api.github.com${endpoint}`
	const response = await fetch(url, {
		method: options?.method || "GET",
		headers: {
			Authorization: `token ${token}`,
			Accept: "application/vnd.github.v3+json",
			"Content-Type": "application/json",
			"User-Agent": "Devil-AI-Code-Review",
		},
		body: options?.body ? JSON.stringify(options.body) : undefined,
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`GitHub API error ${response.status}: ${error}`)
	}

	return response.json()
}

export async function getGitHubPR(
	repository: string,
	prNumber: number,
	token: string,
): Promise<PRInfo> {
	const [owner, repo] = repository.split("/")

	// Get PR details
	const pr = (await githubFetch(`/repos/${owner}/${repo}/pulls/${prNumber}`, token)) as any

	// Get PR files
	const files = (await githubFetch(
		`/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
		token,
	)) as any[]

	const prFiles: PRFile[] = files.map((f: any) => ({
		path: f.filename,
		patch: f.patch,
		additions: f.additions,
		deletions: f.deletions,
		status: f.status as PRFile["status"],
	}))

	return {
		number: pr.number,
		title: pr.title,
		body: pr.body || "",
		headSha: pr.head.sha,
		headBranch: pr.head.ref,
		baseBranch: pr.base.ref,
		state: pr.state,
		files: prFiles,
		diff: pr.diff_url,
	}
}

export async function postGitHubReview(
	repository: string,
	prNumber: number,
	commitSha: string,
	token: string,
	review: ReviewSummary,
): Promise<void> {
	const [owner, repo] = repository.split("/")

	const body: Record<string, unknown> = {
		commit_id: commitSha,
		body: review.summary,
		event: review.approved ? "APPROVE" : "COMMENT",
	}

	// Add inline comments
	if (review.comments.length > 0) {
		body.comments = review.comments.map((c) => ({
			path: c.path,
			position: c.line,
			body: formatComment(c),
		}))
	}

	await githubFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, token, {
		method: "POST",
		body,
	})

	log.info("Posted GitHub review", { repository, prNumber, approved: review.approved })
}

export async function setGitHubStatus(
	repository: string,
	commitSha: string,
	token: string,
	state: "pending" | "success" | "failure" | "error",
	description: string,
	targetUrl?: string,
): Promise<void> {
	const [owner, repo] = repository.split("/")

	await githubFetch(`/repos/${owner}/${repo}/statuses/${commitSha}`, token, {
		method: "POST",
		body: {
			state,
			description,
			context: "Devil AI Code Review",
			target_url: targetUrl,
		},
	})
}

// ============================================================
// GitLab API
// ============================================================

async function gitlabFetch(
	endpoint: string,
	token: string,
	options?: { method?: string; body?: unknown },
): Promise<unknown> {
	const url = `https://gitlab.com/api/v4${endpoint}`
	const response = await fetch(url, {
		method: options?.method || "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: options?.body ? JSON.stringify(options.body) : undefined,
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`GitLab API error ${response.status}: ${error}`)
	}

	return response.json()
}

export async function getGitLabMR(
	projectPath: string,
	mrIid: number,
	token: string,
): Promise<PRInfo> {
	const encodedPath = encodeURIComponent(projectPath)

	// Get MR details
	const mr = (await gitlabFetch(
		`/projects/${encodedPath}/merge_requests/${mrIid}`,
		token,
	)) as any

	// Get MR changes
	const changes = (await gitlabFetch(
		`/projects/${encodedPath}/merge_requests/${mrIid}/changes`,
		token,
	)) as any

	const files: PRFile[] = changes.changes.map((c: any) => ({
		path: c.new_path,
		patch: c.diff,
		additions: c.new_path ? 1 : 0,
		deletions: c.old_path && !c.new_path ? 1 : 0,
		status: c.new_file ? "added" : c.deleted_file ? "removed" : "modified",
	}))

	return {
		number: mr.iid,
		title: mr.title,
		body: mr.description || "",
		headSha: mr.sha,
		headBranch: mr.source_branch,
		baseBranch: mr.target_branch,
		state: mr.state === "opened" ? "open" : mr.state === "merged" ? "merged" : "closed",
		files,
		diff: changes.diff_refs?.head_sha || "",
	}
}

export async function postGitLabReview(
	projectPath: string,
	mrIid: number,
	token: string,
	review: ReviewSummary,
): Promise<void> {
	const encodedPath = encodeURIComponent(projectPath)

	// Post a note (comment) on the MR
	await gitlabFetch(`/projects/${encodedPath}/merge_requests/${mrIid}/notes`, token, {
		method: "POST",
		body: {
			body: review.summary,
		},
	})

	// Post inline discussions for specific comments
	for (const comment of review.comments) {
		try {
			await gitlabFetch(
				`/projects/${encodedPath}/merge_requests/${mrIid}/discussions`,
				token,
				{
					method: "POST",
					body: {
						body: formatComment(comment),
						position: {
							position_type: "text",
							new_path: comment.path,
							old_path: comment.path,
							new_line: comment.line,
						},
					},
				},
			)
		} catch (err) {
			log.warn("Failed to post inline comment", { path: comment.path, error: String(err) })
		}
	}

	log.info("Posted GitLab review", { projectPath, mrIid, approved: review.approved })
}

// ============================================================
// Helpers
// ============================================================

function formatComment(comment: ReviewComment): string {
	const icon = {
		error: "🔴",
		warning: "🟡",
		info: "ℹ️",
		suggestion: "💡",
	}[comment.severity]

	return `${icon} **${comment.severity.toUpperCase()}**: ${comment.body}`
}

// ============================================================
// Unified API
// ============================================================

export async function getPR(
	provider: GitProvider,
	repository: string,
	prNumber: number,
	token: string,
): Promise<PRInfo> {
	if (provider === "github") return getGitHubPR(repository, prNumber, token)
	return getGitLabMR(repository, prNumber, token)
}

export async function postReview(
	provider: GitProvider,
	repository: string,
	prNumber: number,
	commitSha: string,
	token: string,
	review: ReviewSummary,
): Promise<void> {
	if (provider === "github") {
		await postGitHubReview(repository, prNumber, commitSha, token, review)
	} else {
		await postGitLabReview(repository, prNumber, token, review)
	}
}

export async function setStatus(
	provider: GitProvider,
	repository: string,
	commitSha: string,
	token: string,
	state: "pending" | "success" | "failure" | "error",
	description: string,
): Promise<void> {
	if (provider === "github") {
		await setGitHubStatus(repository, commitSha, token, state, description)
	}
	// GitLab doesn't have the same status API — uses pipeline labels instead
}
