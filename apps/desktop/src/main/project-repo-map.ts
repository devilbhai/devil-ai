/**
 * Project-Repo Mapping Store
 * 
 * Tracks which GitHub repository is linked to each project.
 * Ensures one project = one repo (no duplicates).
 */

import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { createLogger } from "./logger"

const log = createLogger("project-repo-map")

let mappingPath: string | null = null
let projectRepoMap: Record<string, { owner: string; repo: string; createdAt: string }> = {}

/** Initialize the mapping store. Call once from app.whenReady(). */
export function initProjectRepoMap(): void {
	mappingPath = path.join(app.getPath("userData"), "project-repo-map.json")

	try {
		if (fs.existsSync(mappingPath)) {
			const raw = fs.readFileSync(mappingPath, "utf-8")
			projectRepoMap = JSON.parse(raw)
			log.info("Project-repo mapping loaded", { count: Object.keys(projectRepoMap).length })
		} else {
			log.info("No project-repo mapping found, starting empty")
			projectRepoMap = {}
		}
	} catch (err) {
		log.error("Failed to load project-repo mapping, starting empty", err)
		projectRepoMap = {}
	}
}

/** Get the repo linked to a project directory. */
export function getProjectRepo(projectDir: string): { owner: string; repo: string } | null {
	const normalizedDir = path.resolve(projectDir)
	return projectRepoMap[normalizedDir] || null
}

/** Link a project directory to a GitHub repository. */
export function setProjectRepo(projectDir: string, owner: string, repo: string): void {
	const normalizedDir = path.resolve(projectDir)
	projectRepoMap[normalizedDir] = {
		owner,
		repo,
		createdAt: new Date().toISOString(),
	}
	persist()
	log.info("Project linked to repo", { projectDir: normalizedDir, owner, repo })
}

/** Remove a project-repo link. */
export function deleteProjectRepo(projectDir: string): void {
	const normalizedDir = path.resolve(projectDir)
	delete projectRepoMap[normalizedDir]
	persist()
	log.info("Project-repo link removed", { projectDir: normalizedDir })
}

/** Get all project-repo mappings. */
export function getAllProjectRepos(): Record<string, { owner: string; repo: string; createdAt: string }> {
	return { ...projectRepoMap }
}

/** Check if a repo is already linked to any project. */
export function isRepoLinked(owner: string, repo: string): string | null {
	for (const [projectDir, mapping] of Object.entries(projectRepoMap)) {
		if (mapping.owner === owner && mapping.repo === repo) {
			return projectDir
		}
	}
	return null
}

/** Persist mappings to disk. */
function persist(): void {
	if (!mappingPath) return
	try {
		const tmpPath = `${mappingPath}.tmp`
		fs.writeFileSync(tmpPath, JSON.stringify(projectRepoMap, null, "\t"), { encoding: "utf-8", mode: 0o600 })
		fs.renameSync(tmpPath, mappingPath)
		log.debug("Project-repo mapping persisted", { path: mappingPath })
	} catch (err) {
		log.error("Failed to persist project-repo mapping", err)
	}
}