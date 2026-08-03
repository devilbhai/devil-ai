/**
 * GitHub Actions Runner - Manages GitHub Actions workflows.
 *
 * Features:
 * - List workflows for a repository
 * - Trigger workflow runs
 * - Monitor run status and logs
 * - Auto-run on push/PR events
 */

// GitHub Actions Runner - no additional imports needed

// ============================================================
// Types
// ============================================================

export interface GitHubActionsConfig {
	token: string
	owner: string
	repo: string
	baseUrl?: string
}

export interface Workflow {
	id: number
	name: string
	path: string
	state: "active" | "disabled" | "deleted"
	createdAt: string
	updatedAt: string
	badgeUrl: string
	htmlUrl: string
}

export interface WorkflowRun {
	id: number
	name: string
	headBranch: string
	headSha: string
	event: string
	status: "queued" | "in_progress" | "completed"
	conclusion: "success" | "failure" | "cancelled" | "skipped" | "timed_out" | null
	createdAt: string
	updatedAt: string
	runNumber: number
	htmlUrl: string
	artifactsUrl: string
	logsUrl: string
}

export interface WorkflowRunLog {
	totalCount: number
	complete: boolean
	logs: Array<{
		name: string
		content: string
	}>
}

export interface ActionsConfig {
	enabled: boolean
	autoRunOnPush: boolean
	autoRunOnPR: boolean
	selectedWorkflows: number[]
	notifyOnComplete: boolean
}

// ============================================================
// GitHub API helpers
// ============================================================

async function githubFetch(
	config: GitHubActionsConfig,
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
		throw new Error(`GitHub Actions API error ${response.status}: ${error}`)
	}

	return response.json()
}

// ============================================================
// Public API
// ============================================================

/**
 * Lists all workflows for a repository.
 */
export async function listWorkflows(
	config: GitHubActionsConfig,
	page = 1,
	perPage = 30,
): Promise<{ workflows: Workflow[]; totalCount: number }> {
	const data = await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/workflows?page=${page}&per_page=${perPage}`,
	)

	return {
		workflows: data.workflows.map((w: any) => ({
			id: w.id,
			name: w.name,
			path: w.path,
			state: w.state,
			createdAt: w.created_at,
			updatedAt: w.updated_at,
			badgeUrl: w.badge_url,
			htmlUrl: w.html_url,
		})),
		totalCount: data.total_count,
	}
}

/**
 * Lists recent workflow runs for a repository or specific workflow.
 */
export async function listWorkflowRuns(
	config: GitHubActionsConfig,
	workflowId?: number,
	page = 1,
	perPage = 30,
): Promise<{ runs: WorkflowRun[]; totalCount: number }> {
	const workflowPath = workflowId
		? `/repos/${config.owner}/${config.repo}/actions/workflows/${workflowId}/runs`
		: `/repos/${config.owner}/${config.repo}/actions/runs`

	const data = await githubFetch(
		config,
		`${workflowPath}?page=${page}&per_page=${perPage}`,
	)

	return {
		runs: data.workflow_runs.map((r: any) => ({
			id: r.id,
			name: r.name,
			headBranch: r.head_branch,
			headSha: r.head_sha,
			event: r.event,
			status: r.status,
			conclusion: r.conclusion,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
			runNumber: r.run_number,
			htmlUrl: r.html_url,
			artifactsUrl: r.artifacts_url,
			logsUrl: r.logs_url,
		})),
		totalCount: data.total_count,
	}
}

/**
 * Triggers a workflow run.
 */
export async function triggerWorkflow(
	config: GitHubActionsConfig,
	workflowId: number,
	ref: string = "main",
	inputs?: Record<string, string>,
): Promise<WorkflowRun> {
	await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/workflows/${workflowId}/dispatches`,
		{
			method: "POST",
			body: JSON.stringify({
				ref,
				inputs: inputs || {},
			}),
		},
	)

	// GitHub returns 204 No Content on success, so we fetch the latest run
	const { runs } = await listWorkflowRuns(config, workflowId, 1, 1)
	if (runs.length > 0) {
		return runs[0]
	}

	throw new Error("Workflow triggered but could not fetch run details")
}

/**
 * Gets the status of a specific workflow run.
 */
export async function getWorkflowRunStatus(
	config: GitHubActionsConfig,
	runId: number,
): Promise<WorkflowRun> {
	const data = await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/runs/${runId}`,
	)

	return {
		id: data.id,
		name: data.name,
		headBranch: data.head_branch,
		headSha: data.head_sha,
		event: data.event,
		status: data.status,
		conclusion: data.conclusion,
		createdAt: data.created_at,
		updatedAt: data.updated_at,
		runNumber: data.run_number,
		htmlUrl: data.html_url,
		artifactsUrl: data.artifacts_url,
		logsUrl: data.logs_url,
	}
}

/**
 * Gets logs for a workflow run.
 */
export async function getWorkflowRunLogs(
	config: GitHubActionsConfig,
	runId: number,
): Promise<WorkflowRunLog> {
	// GitHub logs endpoint returns a zip file, but we can use the jobs endpoint
	const data = await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/runs/${runId}/jobs`,
	)

	const logs: WorkflowRunLog["logs"] = []

	for (const job of data.jobs || []) {
		logs.push({
			name: job.name,
			content: `Status: ${job.status}\nConclusion: ${job.conclusion || "N/A"}\nStarted: ${job.started_at}\nCompleted: ${job.completed_at || "N/A"}`,
		})
	}

	return {
		totalCount: data.total_count,
		complete: data.jobs?.every((j: any) => j.status === "completed") ?? true,
		logs,
	}
}

/**
 * Cancels a workflow run.
 */
export async function cancelWorkflowRun(
	config: GitHubActionsConfig,
	runId: number,
): Promise<void> {
	await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/runs/${runId}/cancel`,
		{
			method: "POST",
		},
	)
}

/**
 * Re-runs a failed workflow.
 */
export async function rerunWorkflow(
	config: GitHubActionsConfig,
	runId: number,
): Promise<void> {
	await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/runs/${runId}/rerun`,
		{
			method: "POST",
		},
	)
}

/**
 * Gets workflow run artifacts.
 */
export async function getWorkflowRunArtifacts(
	config: GitHubActionsConfig,
	runId: number,
): Promise<Array<{ id: number; name: string; sizeInBytes: number; expired: boolean; createdAt: string }>> {
	const data = await githubFetch(
		config,
		`/repos/${config.owner}/${config.repo}/actions/runs/${runId}/artifacts`,
	)

	return data.artifacts.map((a: any) => ({
		id: a.id,
		name: a.name,
		sizeInBytes: a.size_in_bytes,
		expired: a.expired,
		createdAt: a.created_at,
	}))
}

/**
 * Extracts owner/repo from a git remote URL.
 */
export function parseGitRemoteUrl(remoteUrl: string): { owner: string; repo: string } | null {
	// Handle SSH: git@github.com:owner/repo.git
	const sshMatch = remoteUrl.match(/git@github\.com:(.+?)\/(.+?)(?:\.git)?$/)
	if (sshMatch) {
		return { owner: sshMatch[1], repo: sshMatch[2] }
	}

	// Handle HTTPS: https://github.com/owner/repo.git
	const httpsMatch = remoteUrl.match(/https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/)
	if (httpsMatch) {
		return { owner: httpsMatch[1], repo: httpsMatch[2] }
	}

	return null
}

export interface GitHubRepository {
	id: number
	name: string
	fullName: string
	owner: {
		login: string
		avatarUrl: string
	}
	private: boolean
	htmlUrl: string
	description: string | null
	updatedAt: string
}

/**
 * Lists all repositories accessible by the authenticated user.
 */
export async function listUserRepositories(
	config: GitHubActionsConfig,
	page = 1,
	perPage = 100,
): Promise<{ repositories: GitHubRepository[]; totalCount: number }> {
	const data = await githubFetch(
		config,
		`/user/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`,
	)

	return {
		repositories: data.map((r: any) => ({
			id: r.id,
			name: r.name,
			fullName: r.full_name,
			owner: {
				login: r.owner.login,
				avatarUrl: r.owner.avatar_url,
			},
			private: r.private,
			htmlUrl: r.html_url,
			description: r.description,
			updatedAt: r.updated_at,
		})),
		totalCount: data.length,
	}
}

/**
 * Creates a new GitHub repository.
 */
export async function createRepository(
	config: GitHubActionsConfig,
	options: {
		name: string
		description?: string
		private?: boolean
		autoInit?: boolean
	},
): Promise<GitHubRepository> {
	const data = await githubFetch(
		config,
		"/user/repos",
		{
			method: "POST",
			body: JSON.stringify({
				name: options.name,
				description: options.description || "",
				private: options.private !== false,
				auto_init: options.autoInit !== false,
			}),
		},
	)

	return {
		id: data.id,
		name: data.name,
		fullName: data.full_name,
		owner: {
			login: data.owner.login,
			avatarUrl: data.owner.avatar_url,
		},
		private: data.private,
		htmlUrl: data.html_url,
		description: data.description,
		updatedAt: data.updated_at,
	}
}

/**
 * Checks if a repository exists for the authenticated user.
 */
export async function checkRepositoryExists(
	config: GitHubActionsConfig,
	owner: string,
	repo: string,
): Promise<boolean> {
	try {
		await githubFetch(config, `/repos/${owner}/${repo}`)
		return true
	} catch {
		return false
	}
}

/**
 * Gets the authenticated user's login.
 */
export async function getAuthenticatedUser(config: GitHubActionsConfig): Promise<string> {
	const data = await githubFetch(config, "/user")
	return data.login
}
