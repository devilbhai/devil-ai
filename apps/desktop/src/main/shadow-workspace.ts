import { exec } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"
import fs from "node:fs/promises"

const execAsync = promisify(exec)

/**
 * Creates a hidden git worktree for safe AI refactoring.
 * @param projectDir The root directory of the project
 * @returns The path to the shadow workspace
 */
export async function createShadowWorkspace(projectDir: string): Promise<string> {
	const shadowDir = path.join(projectDir, ".devil-ai", "worktree")
	const branchName = `devil-ai-shadow-${Date.now()}`

	try {
		// Clean up existing if needed
		try { await execAsync(`git worktree remove -f ${shadowDir}`, { cwd: projectDir }) } catch (e) { /* ignore */ }
		try { await execAsync(`git branch -D ${branchName}`, { cwd: projectDir }) } catch (e) { /* ignore */ }
		
		await fs.mkdir(path.dirname(shadowDir), { recursive: true })
		
		// Create new worktree branched from current HEAD
		await execAsync(`git worktree add -b ${branchName} ${shadowDir}`, { cwd: projectDir })
		return shadowDir
	} catch (err: any) {
		try { console.error("[Shadow Workspace] Failed to create:", err) } catch {}
		throw new Error(`Failed to create shadow workspace: ${err.message}`)
	}
}

/**
 * Applies the changes from the shadow workspace back to the main branch.
 */
export async function applyShadowWorkspace(projectDir: string, shadowDir: string): Promise<void> {
	try {
		// Commit all changes in shadow
		await execAsync(`git add . && git commit -m "Devil AI automated refactor"`, { cwd: shadowDir })
		
		// Merge into main
		await execAsync(`git merge --ff-only HEAD@{1}`, { cwd: projectDir })
		
		// Cleanup
		await execAsync(`git worktree remove -f ${shadowDir}`, { cwd: projectDir })
	} catch (err: any) {
		throw new Error(`Failed to apply shadow workspace: ${err.message}`)
	}
}
