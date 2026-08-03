/**
 * Worktree management settings page.
 *
 * Lists all worktrees across connected projects using the OpenCode worktree API.
 * Provides create, remove, and reset actions for each worktree.
 */

import { Button } from "@devil-ai/ui/components/button"
import { GitForkIcon, Loader2Icon, PlusIcon, RotateCcwIcon, TrashIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useProjectList } from "../../hooks/use-agents"
import {
	createWorktree,
	listWorktrees,
	removeWorktree,
	resetWorktree,
	randomWorktreeName,
} from "../../services/worktree-service"
import { SettingsSection } from "./settings-section"

// ============================================================
// Types
// ============================================================

interface WorktreeEntry {
	/** The worktree directory path */
	directory: string
	/** The project directory this worktree belongs to */
	projectDir: string
	/** Human-readable project name */
	projectName: string
	/** Branch name */
	branch?: string
}

// ============================================================
// Helpers
// ============================================================

/** Extracts the last path segment as a display name */
function dirName(dir: string): string {
	return dir.split("/").filter(Boolean).pop() ?? dir
}

// ============================================================
// Main component
// ============================================================

export function WorktreeSettings() {
	const projects = useProjectList()
	const [worktrees, setWorktrees] = useState<WorktreeEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [removing, setRemoving] = useState<string | null>(null)
	const [resetting, setResetting] = useState<string | null>(null)
	const [creating, setCreating] = useState<string | null>(null)
	const [creatingAll, setCreatingAll] = useState(false)

	// Keep a ref so the stable callback always reads the latest project list
	// without needing it as a dependency.
	const projectsRef = useRef(projects)
	projectsRef.current = projects

	// Stable key: only changes when the set of project directories changes,
	// NOT when volatile fields like agentCount or lastActiveAt update.
	const projectDirKey = useMemo(
		() => projects.map((p) => p.directory).sort().join("\0"),
		[projects],
	)

	const loadWorktrees = useCallback(async () => {
		const currentProjects = projectsRef.current
		setLoading(true)
		try {
			const results = await Promise.allSettled(
				currentProjects.map(async (project) => {
					const dirs = await listWorktrees(project.directory)
					return dirs.map(
						(dir): WorktreeEntry => ({
							directory: dir,
							projectDir: project.directory,
							projectName: project.name,
						}),
					)
				}),
			)

			const entries: WorktreeEntry[] = []
			for (const result of results) {
				if (result.status === "fulfilled") {
					entries.push(...result.value)
				}
			}
			setWorktrees(entries)
		} catch {
			// Silently fail
		} finally {
			setLoading(false)
		}
	}, [])

	// Only refetch when the set of project directories actually changes (or on mount).
	useEffect(() => {
		loadWorktrees()
	}, [projectDirKey, loadWorktrees])

	// Group worktrees by project
	const worktreesByProject = useMemo(() => {
		const map = new Map<string, WorktreeEntry[]>()
		for (const wt of worktrees) {
			const existing = map.get(wt.projectDir) ?? []
			existing.push(wt)
			map.set(wt.projectDir, existing)
		}
		return map
	}, [worktrees])

	// Create worktree for a project
	const handleCreate = useCallback(
		async (projectDir: string) => {
			setCreating(projectDir)
			try {
				const slug = randomWorktreeName()
				await createWorktree(projectDir, projectDir, slug)
				await loadWorktrees()
			} catch (err) {
				console.error("Failed to create worktree:", err)
			} finally {
				setCreating(null)
			}
		},
		[loadWorktrees],
	)

	// Create worktrees for all projects
	const handleCreateAll = useCallback(async () => {
		setCreatingAll(true)
		try {
			for (const project of projects) {
				// Skip if already has worktree
				const existing = worktreesByProject.get(project.directory) ?? []
				if (existing.length === 0) {
					const slug = randomWorktreeName()
					await createWorktree(project.directory, project.directory, slug)
				}
			}
			await loadWorktrees()
		} catch (err) {
			console.error("Failed to create worktrees:", err)
		} finally {
			setCreatingAll(false)
		}
	}, [projects, worktreesByProject, loadWorktrees])

	const handleRemove = useCallback(
		async (wt: WorktreeEntry) => {
			setRemoving(wt.directory)
			try {
				await removeWorktree(wt.projectDir, wt.directory)
				await loadWorktrees()
			} catch {
				// Silently fail
			} finally {
				setRemoving(null)
			}
		},
		[loadWorktrees],
	)

	const handleReset = useCallback(
		async (wt: WorktreeEntry) => {
			setResetting(wt.directory)
			try {
				await resetWorktree(wt.projectDir, wt.directory)
				await loadWorktrees()
			} catch {
				// Silently fail
			} finally {
				setResetting(null)
			}
		},
		[loadWorktrees],
	)

	const projectCount = projects.length

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold">Worktrees</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Manage git worktrees created for isolated agent sessions.
				</p>
			</div>

			{/* Summary */}
			<SettingsSection title="Overview">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-2">
						<GitForkIcon className="size-4 text-muted-foreground" aria-hidden="true" />
						<span className="text-sm">
							{worktrees.length} worktree{worktrees.length !== 1 ? "s" : ""}
							{projectCount > 0 && (
								<span className="text-muted-foreground">
									{" "}
									across {projectCount} project{projectCount !== 1 ? "s" : ""}
								</span>
							)}
						</span>
					</div>
					{projectCount > 0 && worktrees.length < projectCount && (
						<Button
							size="sm"
							variant="outline"
							onClick={handleCreateAll}
							disabled={creatingAll}
						>
							{creatingAll ? (
								<Loader2Icon className="size-3.5 animate-spin mr-1" />
							) : (
								<PlusIcon className="size-3.5 mr-1" />
							)}
							Create All
						</Button>
					)}
				</div>
			</SettingsSection>

			{/* Per-project worktrees */}
			{loading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
				</div>
			) : projects.length === 0 ? (
				<div className="rounded-lg border border-dashed border-border py-8 text-center">
					<GitForkIcon className="mx-auto size-8 text-muted-foreground/30" aria-hidden="true" />
					<p className="mt-2 text-sm text-muted-foreground">No projects connected</p>
					<p className="text-xs text-muted-foreground/60">
						Add a project to start creating worktrees.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{projects.map((project) => {
						const projectWorktrees = worktreesByProject.get(project.directory) ?? []
						const isCreating = creating === project.directory

						return (
							<SettingsSection key={project.directory} title={project.name}>
								<div className="px-4 py-3">
									{/* Project info & create button */}
									<div className="flex items-center justify-between mb-3">
										<div className="text-xs text-muted-foreground truncate max-w-[60%]">
											{project.directory}
										</div>
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleCreate(project.directory)}
											disabled={isCreating}
										>
											{isCreating ? (
												<Loader2Icon className="size-3.5 animate-spin mr-1" />
											) : (
												<PlusIcon className="size-3.5 mr-1" />
											)}
											Create Worktree
										</Button>
									</div>

									{/* Worktrees for this project */}
									{projectWorktrees.length === 0 ? (
										<div className="rounded-lg border border-dashed border-border py-4 text-center">
											<p className="text-xs text-muted-foreground/60">
												No worktrees yet. Click "Create Worktree" to start an isolated session.
											</p>
										</div>
									) : (
										<div className="space-y-2">
											{projectWorktrees.map((wt) => (
												<WorktreeRow
													key={wt.directory}
													worktree={wt}
													isRemoving={removing === wt.directory}
													isResetting={resetting === wt.directory}
													onRemove={() => handleRemove(wt)}
													onReset={() => handleReset(wt)}
												/>
											))}
										</div>
									)}
								</div>
							</SettingsSection>
						)
					})}
				</div>
			)}
		</div>
	)
}

// ============================================================
// Sub-components
// ============================================================

function WorktreeRow({
	worktree,
	isRemoving,
	isResetting,
	onRemove,
	onReset,
}: {
	worktree: WorktreeEntry
	isRemoving: boolean
	isResetting: boolean
	onRemove: () => void
	onReset: () => void
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg border border-border p-3">
			<GitForkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate text-sm font-medium">{dirName(worktree.directory)}</span>
					{worktree.branch && (
						<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
							{worktree.branch}
						</span>
					)}
				</div>
				<div className="text-xs text-muted-foreground/60 truncate">
					{worktree.directory}
				</div>
			</div>

			<Button
				size="sm"
				variant="ghost"
				onClick={onReset}
				disabled={isResetting || isRemoving}
				className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
				title="Reset worktree to default branch"
			>
				{isResetting ? (
					<Loader2Icon className="size-3.5 animate-spin" />
				) : (
					<RotateCcwIcon className="size-3.5" />
				)}
			</Button>

			<Button
				size="sm"
				variant="ghost"
				onClick={onRemove}
				disabled={isRemoving || isResetting}
				className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-red-500"
				title="Remove worktree"
			>
				{isRemoving ? (
					<Loader2Icon className="size-3.5 animate-spin" />
				) : (
					<TrashIcon className="size-3.5" />
				)}
			</Button>
		</div>
	)
}
