/**
 * Git Context Service — history-aware prompting.
 * Enriches agent prompts with git history, blame, and context.
 */


export interface GitContext {
	/** Last N commits that touched the file */
	recentCommits: GitCommit[]
	/** Git blame info */
	blame: GitBlameLine[]
	/** Whether the file was recently modified */
	recentlyModified: boolean
	/** Related PR info */
	relatedPRs: string[]
}

export interface GitCommit {
	sha: string
	message: string
	author: string
	date: string
}

export interface GitBlameLine {
	line: number
	author: string
	commit: string
	content: string
}

/**
 * Get git context for a file to enrich agent prompts.
 * Uses the IPC bridge to fetch git history and blame from the main process.
 */
export async function getGitContext(
	dir: string,
	filePath: string,
): Promise<GitContext> {
	try {
		if (!window.devilAi?.git) {
			return { recentCommits: [], blame: [], recentlyModified: false, relatedPRs: [] }
		}

		const [commits, blame, recentlyModified] = await Promise.all([
			window.devilAi.git.getLog(dir, filePath, 10).catch(() => []),
			window.devilAi.git.getBlame(dir, filePath).catch(() => []),
			window.devilAi.git.wasRecentlyModified(dir, filePath).catch(() => false),
		])

		return {
			recentCommits: commits.map((c) => ({
				sha: c.sha,
				message: c.message,
				author: c.author,
				date: c.date,
			})),
			blame: blame.map((b) => ({
				line: b.line,
				author: b.author,
				commit: b.commit,
				content: b.content,
			})),
			recentlyModified,
			relatedPRs: [],
		}
	} catch {
		return { recentCommits: [], blame: [], recentlyModified: false, relatedPRs: [] }
	}
}

/**
 * Build a context string from git info for injection into prompts.
 */
export function buildGitContextPrompt(context: GitContext): string {
	if (!context.recentCommits.length && !context.blame.length) {
		return ""
	}

	const lines: string[] = ["## Git Context"]

	if (context.recentCommits.length > 0) {
		lines.push("\n### Recent Commits")
		for (const commit of context.recentCommits.slice(0, 5)) {
			lines.push(
				`- ${commit.sha.slice(0, 7)} by ${commit.author} (${commit.date}): ${commit.message}`,
			)
		}
	}

	if (context.blame.length > 0) {
		lines.push("\n### Ownership (Blame)")
		const authorCounts = new Map<string, number>()
		for (const line of context.blame) {
			authorCounts.set(line.author, (authorCounts.get(line.author) ?? 0) + 1)
		}
		for (const [author, count] of [...authorCounts.entries()].sort(
			(a, b) => b[1] - a[1],
		)) {
			lines.push(`- ${author}: ${count} lines`)
		}
	}

	if (context.recentlyModified) {
		lines.push("\n⚠️ This file was modified in the last 24 hours")
	}

	return lines.join("\n")
}
