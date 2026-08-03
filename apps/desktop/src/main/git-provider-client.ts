/**
 * Git provider API clients for GitHub and GitLab.
 * Used to fetch PR diffs and post review comments.
 */

import { createLogger } from "./logger"
import { getCredential } from "./credential-store"

const log = createLogger("git-provider-client")

// ============================================================
// Types
// ============================================================

export interface GitProviderConfig {
	provider: "github" | "gitlab"
	// GitHub: Personal access token with repo scope
	// GitLab: Personal access token with api scope
	token: string
	// Optional: Custom API base URL for GitHub Enterprise or self-hosted GitLab
	baseUrl?: string
}

export interface PRDiff {
	files: PRFile[]
	commits: PRCommit[]
}

export interface PRFile {
	filename: string
	status: "added" | "removed" | "modified" | "renamed"
	additions: number
	deletions: number
	changes: number
	patch?: string
}

export interface PRCommit {
	sha: string
	message: string
	author: string
}

export interface ReviewComment {
	path: string
	line: number
	body: string
}

export interface Review {
	body: string
	event: "COMMENT" | "APPROVE" | "REQUEST_CHANGES"
	comments?: ReviewComment[]
}

// ============================================================
// GitHub Client
// ============================================================

async function githubFetch(
	config: GitProviderConfig,
	endpoint: string,
	options: RequestInit = {},
): Promise<any> {
	const baseUrl = config.baseUrl || "https://api.github.com"
	const url = `${baseUrl}${endpoint}`

	const response = await fetch(url, {
		...options,
		headers: {
			Accept: "application/vnd.github.v3+json",
			Authorization: `Bearer ${config.token}`,
			"X-GitHub-Api-Version": "2022-11-28",
			...options.headers,
		},
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`GitHub API error ${response.status}: ${error}`)
	}

	return response.json()
}

export async function getGitHubPRDiff(
	config: GitProviderConfig,
	repository: string,
	prNumber: number,
): Promise<PRDiff> {
	// Get PR files
	const files = await githubFetch(config, `/repos/${repository}/pulls/${prNumber}/files`)

	// Get PR commits
	const commits = await githubFetch(config, `/repos/${repository}/pulls/${prNumber}/commits`)

	return {
		files: files.map((f: any) => ({
			filename: f.filename,
			status: f.status,
			additions: f.additions,
			deletions: f.deletions,
			changes: f.changes,
			patch: f.patch,
		})),
		commits: commits.map((c: any) => ({
			sha: c.sha,
			message: c.commit.message,
			author: c.commit.author.name,
		})),
	}
}

export async function postGitHubReview(
	config: GitProviderConfig,
	repository: string,
	prNumber: number,
	review: Review,
): Promise<void> {
	await githubFetch(config, `/repos/${repository}/pulls/${prNumber}/reviews`, {
		method: "POST",
		body: JSON.stringify({
			body: review.body,
			event: review.event,
			comments: review.comments,
		}),
	})
}

export async function postGitHubPRComment(
	config: GitProviderConfig,
	repository: string,
	prNumber: number,
	body: string,
): Promise<void> {
	await githubFetch(config, `/repos/${repository}/issues/${prNumber}/comments`, {
		method: "POST",
		body: JSON.stringify({ body }),
	})
}

// ============================================================
// GitLab Client
// ============================================================

async function gitlabFetch(
	config: GitProviderConfig,
	endpoint: string,
	options: RequestInit = {},
): Promise<any> {
	const baseUrl = config.baseUrl || "https://gitlab.com/api/v4"
	const url = `${baseUrl}${endpoint}`

	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${config.token}`,
			...options.headers,
		},
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`GitLab API error ${response.status}: ${error}`)
	}

	return response.json()
}

export async function getGitLabMRDiff(
	config: GitProviderConfig,
	repository: string,
	mrIid: number,
): Promise<PRDiff> {
	// Get MR changes
	const changes = await gitlabFetch(
		config,
		`/projects/${encodeURIComponent(repository)}/merge_requests/${mrIid}/changes`,
	)

	return {
		files: changes.changes.map((c: any) => ({
			filename: c.new_path,
			status: c.new_file ? "added" : c.deleted_file ? "removed" : "modified",
			additions: 0, // GitLab doesn't provide this directly
			deletions: 0,
			changes: 0,
			patch: c.diff,
		})),
		commits: [], // GitLab doesn't return commits in changes endpoint
	}
}

export async function postGitLabMRNote(
	config: GitProviderConfig,
	repository: string,
	mrIid: number,
	body: string,
): Promise<void> {
	await gitlabFetch(
		config,
		`/projects/${encodeURIComponent(repository)}/merge_requests/${mrIid}/notes`,
		{
			method: "POST",
			body: JSON.stringify({ body }),
		},
	)
}

export async function postGitLabMRApproval(
	config: GitProviderConfig,
	repository: string,
	mrIid: number,
): Promise<void> {
	await gitlabFetch(
		config,
		`/projects/${encodeURIComponent(repository)}/merge_requests/${mrIid}/approve`,
		{
			method: "POST",
		},
	)
}

// ============================================================
// Unified Client
// ============================================================

export async function getPRDiff(
	config: GitProviderConfig,
	repository: string,
	prNumber: number,
): Promise<PRDiff> {
	if (config.provider === "github") {
		return getGitHubPRDiff(config, repository, prNumber)
	}
	return getGitLabMRDiff(config, repository, prNumber)
}

export async function postReview(
	config: GitProviderConfig,
	repository: string,
	prNumber: number,
	review: Review,
): Promise<void> {
	if (config.provider === "github") {
		return postGitHubReview(config, repository, prNumber, review)
	}
	return postGitLabMRNote(config, repository, prNumber, review.body)
}

export async function postPRComment(
	config: GitProviderConfig,
	repository: string,
	prNumber: number,
	body: string,
): Promise<void> {
	if (config.provider === "github") {
		return postGitHubPRComment(config, repository, prNumber, body)
	}
	return postGitLabMRNote(config, repository, prNumber, body)
}

// ============================================================
// Environment Helpers
// ============================================================

export function getGitHubConfig(): GitProviderConfig | null {
	const token = getCredential("github-token")
	if (!token) {
		log.warn("GitHub token not configured, GitHub integration disabled")
		return null
	}
	return { provider: "github", token }
}

export function getGitLabConfig(): GitProviderConfig | null {
	const token = getCredential("gitlab-token")
	if (!token) {
		log.warn("GitLab token not configured, GitLab integration disabled")
		return null
	}
	return { provider: "gitlab", token }
}

export function getProviderConfig(provider: "github" | "gitlab"): GitProviderConfig | null {
	return provider === "github" ? getGitHubConfig() : getGitLabConfig()
}
