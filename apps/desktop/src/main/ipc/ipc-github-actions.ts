/**
 * IPC handlers for GitHub Actions Runner.
 */

import { ipcMain } from "electron"
import {
	listWorkflows,
	listWorkflowRuns,
	triggerWorkflow,
	getWorkflowRunStatus,
	getWorkflowRunLogs,
	cancelWorkflowRun,
	rerunWorkflow,
	getWorkflowRunArtifacts,
	parseGitRemoteUrl,
	listUserRepositories,
	createRepository,
	checkRepositoryExists,
	getAuthenticatedUser,
} from "../github-actions-runner"
import { withLogging } from "./utils"
import { getCredential, setCredential, deleteCredential } from "../credential-store"

const HANDLER_PREFIX = "github-actions"

export function registerGitHubActionsIpc(): void {
	// List workflows
	ipcMain.handle(
		`${HANDLER_PREFIX}:list-workflows`,
		withLogging(`${HANDLER_PREFIX}:list-workflows`, async (_, owner: string, repo: string, page?: number, perPage?: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return listWorkflows({ token, owner, repo }, page, perPage)
		}),
	)

	// List runs
	ipcMain.handle(
		`${HANDLER_PREFIX}:list-runs`,
		withLogging(`${HANDLER_PREFIX}:list-runs`, async (_, owner: string, repo: string, workflowId?: number, page?: number, perPage?: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return listWorkflowRuns({ token, owner, repo }, workflowId, page, perPage)
		}),
	)

	// Trigger workflow
	ipcMain.handle(
		`${HANDLER_PREFIX}:trigger`,
		withLogging(`${HANDLER_PREFIX}:trigger`, async (_, owner: string, repo: string, workflowId: number, ref?: string, inputs?: Record<string, string>) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return triggerWorkflow({ token, owner, repo }, workflowId, ref, inputs)
		}),
	)

	// Get run status
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-run-status`,
		withLogging(`${HANDLER_PREFIX}:get-run-status`, async (_, owner: string, repo: string, runId: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return getWorkflowRunStatus({ token, owner, repo }, runId)
		}),
	)

	// Get run logs
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-run-logs`,
		withLogging(`${HANDLER_PREFIX}:get-run-logs`, async (_, owner: string, repo: string, runId: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return getWorkflowRunLogs({ token, owner, repo }, runId)
		}),
	)

	// Cancel run
	ipcMain.handle(
		`${HANDLER_PREFIX}:cancel-run`,
		withLogging(`${HANDLER_PREFIX}:cancel-run`, async (_, owner: string, repo: string, runId: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return cancelWorkflowRun({ token, owner, repo }, runId)
		}),
	)

	// Rerun run
	ipcMain.handle(
		`${HANDLER_PREFIX}:rerun-run`,
		withLogging(`${HANDLER_PREFIX}:rerun-run`, async (_, owner: string, repo: string, runId: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return rerunWorkflow({ token, owner, repo }, runId)
		}),
	)

	// Get artifacts
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-artifacts`,
		withLogging(`${HANDLER_PREFIX}:get-artifacts`, async (_, owner: string, repo: string, runId: number) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return getWorkflowRunArtifacts({ token, owner, repo }, runId)
		}),
	)

	// Parse remote URL
	ipcMain.handle(
		`${HANDLER_PREFIX}:parse-remote-url`,
		withLogging(`${HANDLER_PREFIX}:parse-remote-url`, async (_, remoteUrl: string) => {
			return parseGitRemoteUrl(remoteUrl)
		}),
	)

	// List user repositories
	ipcMain.handle(
		`${HANDLER_PREFIX}:list-repos`,
		withLogging(`${HANDLER_PREFIX}:list-repos`, async () => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			return listUserRepositories({ token, owner: "", repo: "" })
		}),
	)

	// Save GitHub token
	ipcMain.handle(
		`${HANDLER_PREFIX}:save-token`,
		withLogging(`${HANDLER_PREFIX}:save-token`, async (_, token: string) => {
			await setCredential("github-token", token)
			return { success: true }
		}),
	)

	// Delete GitHub token
	ipcMain.handle(
		`${HANDLER_PREFIX}:delete-token`,
		withLogging(`${HANDLER_PREFIX}:delete-token`, async () => {
			await deleteCredential("github-token")
			return { success: true }
		}),
	)

	// Check if token exists
	ipcMain.handle(
		`${HANDLER_PREFIX}:has-token`,
		withLogging(`${HANDLER_PREFIX}:has-token`, async () => {
			const token = await getCredential("github-token")
			return { hasToken: !!token }
		}),
	)

	// Create repository
	ipcMain.handle(
		`${HANDLER_PREFIX}:create-repo`,
		withLogging(`${HANDLER_PREFIX}:create-repo`, async (_, options: { name: string; description?: string; private?: boolean; autoInit?: boolean }) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			const config = { token, owner: "", repo: "" }
			return createRepository(config, options)
		}),
	)

	// Check if repository exists
	ipcMain.handle(
		`${HANDLER_PREFIX}:check-repo`,
		withLogging(`${HANDLER_PREFIX}:check-repo`, async (_, owner: string, repo: string) => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			const config = { token, owner, repo }
			return checkRepositoryExists(config, owner, repo)
		}),
	)

	// Get authenticated user
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-user`,
		withLogging(`${HANDLER_PREFIX}:get-user`, async () => {
			const token = await getCredential("github-token")
			if (!token) throw new Error("GitHub token not configured. Go to Settings → Setup to add your token.")
			const config = { token, owner: "", repo: "" }
			return getAuthenticatedUser(config)
		}),
	)
}
