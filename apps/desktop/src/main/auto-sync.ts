import { getAllProjectRepos } from "./project-repo-map"
import { simpleGit } from "simple-git"
import { createLogger } from "./logger"
import { existsSync } from "fs"

const log = createLogger("auto-sync")

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

let interval: NodeJS.Timeout | null = null
let isSyncing = false

export function startAutoSyncDaemon() {
	if (interval) return
	
	log.info("Starting Auto-Sync daemon (Interval: 5m)")
	
	interval = setInterval(async () => {
		if (isSyncing) return
		isSyncing = true
		
		try {
			await runSyncCycle()
		} catch (error) {
			log.error("Error during auto-sync cycle:", error)
		} finally {
			isSyncing = false
		}
	}, SYNC_INTERVAL_MS)
}

export function stopAutoSyncDaemon() {
	if (interval) {
		clearInterval(interval)
		interval = null
		log.info("Stopped Auto-Sync daemon")
	}
}

async function runSyncCycle() {
	const repos = getAllProjectRepos()
	
	for (const [projectDir, repoInfo] of Object.entries(repos)) {
		if (!existsSync(projectDir)) {
			log.warn(`Skipping auto-sync: directory not found ${projectDir}`)
			continue
		}
		
		try {
			const git = simpleGit(projectDir)
			
			// Ensure it's a git repository
			const isRepo = await git.checkIsRepo()
			if (!isRepo) {
				log.warn(`Skipping auto-sync: Not a git repository ${projectDir}`)
				continue
			}
			
			// Check if there are any uncommitted changes
			const status = await git.status()
			
			if (status.isClean()) {
				// Check if there are unpushed commits
				const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"])
				await git.diffSummary([`origin/${currentBranch}`])
					.catch(() => ({ changed: 0 })) // If no remote branch or error, assume no diff or handle later
				
				// simple-git status.ahead can also check unpushed commits
				if (status.ahead === 0) {
					continue // Nothing to commit or push
				}
			}
			
			log.info(`Auto-syncing changes in ${projectDir} to ${repoInfo.owner}/${repoInfo.repo}`)
			
			// Add all changes
			await git.add(".")
			
			// Commit only if there are staged changes
			if (!status.isClean()) {
				await git.commit("Auto-sync changes by Devil AI")
			}
			
			// Push changes
			await git.push()
			
			log.info(`Successfully auto-synced ${projectDir}`)
			
		} catch (err) {
			log.error(`Failed to auto-sync project ${projectDir}:`, err)
		}
	}
}
