/**
 * IPC handlers for skill auto-fetcher.
 */

import { ipcMain } from "electron"
import path from "node:path"
import { app } from "electron"
import {
	detectProjectContext,
	fetchSkillsForProject,
	getCachedSkills,
	clearExpiredCache,
	getRelevantSources,
} from "../skills/skill-auto-fetcher"
import { withLogging } from "./utils"
import { createLogger } from "../logger"

const log = createLogger("ipc-skills")

function getCacheDir(): string {
	return path.join(app.getPath("userData"), "skills-cache")
}

export function registerSkillsIpc() {
	/**
	 * Detect project context and fetch relevant skills
	 */
	ipcMain.handle(
		"skills:fetch-for-project",
		withLogging("skills:fetch-for-project", async (_event: Electron.IpcMainInvokeEvent, projectDir: string) => {
			try {
				const context = await detectProjectContext(projectDir)
				const cacheDir = getCacheDir()
				const skills = await fetchSkillsForProject(context, cacheDir)
				return {
					context,
					skills,
					sources: getRelevantSources(context).map((s) => ({
						repo: s.repo,
						description: s.description,
						priority: s.priority,
					})),
				}
			} catch (err) {
				log.error("Failed to fetch skills for project:", err)
				return { context: { type: "unknown", dependencies: [], extensions: [] }, skills: [], sources: [] }
			}
		}),
	)

	/**
	 * Get cached skills (no network fetch)
	 */
	ipcMain.handle(
		"skills:get-cached",
		withLogging("skills:get-cached", async () => {
			try {
				const cacheDir = getCacheDir()
				return await getCachedSkills(cacheDir)
			} catch (err) {
				log.error("Failed to get cached skills:", err)
				return []
			}
		}),
	)

	/**
	 * Clear expired cache entries
	 */
	ipcMain.handle(
		"skills:clear-cache",
		withLogging("skills:clear-cache", async () => {
			try {
				const cacheDir = getCacheDir()
				await clearExpiredCache(cacheDir)
				return { success: true }
			} catch (err) {
				log.error("Failed to clear cache:", err)
				return { success: false }
			}
		}),
	)

	/**
	 * Detect project context only (no fetch)
	 */
	ipcMain.handle(
		"skills:detect-context",
		withLogging("skills:detect-context", async (_event: Electron.IpcMainInvokeEvent, projectDir: string) => {
			try {
				return await detectProjectContext(projectDir)
			} catch (err) {
				log.error("Failed to detect project context:", err)
				return { type: "unknown", dependencies: [], extensions: [] }
			}
		}),
	)

	log.info("Skills IPC handlers registered")
}
