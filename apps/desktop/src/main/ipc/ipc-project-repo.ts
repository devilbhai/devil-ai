/**
 * IPC handlers for Project-Repo Mapping.
 */

import { ipcMain } from "electron"
import {
	initProjectRepoMap,
	getProjectRepo,
	setProjectRepo,
	deleteProjectRepo,
	getAllProjectRepos,
	isRepoLinked,
} from "../project-repo-map"
import { withLogging } from "./utils"

const HANDLER_PREFIX = "project-repo"

// Guard against double registration (HMR in dev)
let projectRepoIpcRegistered = false

export function registerProjectRepoMapIpc(): void {
	if (projectRepoIpcRegistered) return
	projectRepoIpcRegistered = true

	// Initialize the mapping store
	ipcMain.handle(
		`${HANDLER_PREFIX}:init`,
		withLogging(`${HANDLER_PREFIX}:init`, async () => {
			initProjectRepoMap()
			return { success: true }
		}),
	)

	// Get repo for a project
	ipcMain.handle(
		`${HANDLER_PREFIX}:get`,
		withLogging(`${HANDLER_PREFIX}:get`, async (_, projectDir: string) => {
			return getProjectRepo(projectDir)
		}),
	)

	// Link project to repo
	ipcMain.handle(
		`${HANDLER_PREFIX}:set`,
		withLogging(`${HANDLER_PREFIX}:set`, async (_, projectDir: string, owner: string, repo: string) => {
			setProjectRepo(projectDir, owner, repo)
			return { success: true }
		}),
	)

	// Remove project-repo link
	ipcMain.handle(
		`${HANDLER_PREFIX}:delete`,
		withLogging(`${HANDLER_PREFIX}:delete`, async (_, projectDir: string) => {
			deleteProjectRepo(projectDir)
			return { success: true }
		}),
	)

	// List all mappings
	ipcMain.handle(
		`${HANDLER_PREFIX}:list`,
		withLogging(`${HANDLER_PREFIX}:list`, async () => {
			return getAllProjectRepos()
		}),
	)

	// Check if repo is already linked
	ipcMain.handle(
		`${HANDLER_PREFIX}:check-linked`,
		withLogging(`${HANDLER_PREFIX}:check-linked`, async (_, owner: string, repo: string) => {
			const projectDir = isRepoLinked(owner, repo)
			return { linked: !!projectDir, projectDir }
		}),
	)
}