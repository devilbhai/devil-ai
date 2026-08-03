/**
 * Dialog for adding a project directory on a remote server.
 *
 * When connected to a remote server, shows a text input for typing
 * the remote directory path (since the native picker shows the local
 * filesystem which is irrelevant for a remote machine).
 *
 * For local servers, the caller should use `pickDirectory()` directly
 * instead of opening this dialog.
 */

import { Button } from "@devil-ai/ui/components/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@devil-ai/ui/components/dialog"
import { Input } from "@devil-ai/ui/components/input"
import { Label } from "@devil-ai/ui/components/label"
import { useAtomValue } from "jotai"
import { FolderOpenIcon, Loader2Icon } from "lucide-react"
import { useCallback, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { activeServerConfigAtom } from "../atoms/connection"
import { appStore } from "../atoms/store"
import { discoveryAtom, ignoredProjectsAtom } from "../atoms/discovery"
import { projectSlugMapAtom } from "../atoms/derived/agents"
import { loadProjectSessions, loadAllProjects } from "../services/connection-manager"
import { useAgentActions } from "../hooks/use-server"

interface AddProjectDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Called after a project directory is successfully added. */
	onAdded?: (directory: string) => void
}

/**
 * Dialog for entering a remote project directory path.
 * Only renders when connected to a non-local server.
 */
export function AddProjectDialog({ open, onOpenChange, onAdded }: AddProjectDialogProps) {
	const activeServer = useAtomValue(activeServerConfigAtom)
	const navigate = useNavigate()
	const { createSession } = useAgentActions()

	const [remotePath, setRemotePath] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (nextOpen) {
				setRemotePath("")
				setError(null)
				setLoading(false)
			}
			onOpenChange(nextOpen)
		},
		[onOpenChange],
	)

	const handleAdd = useCallback(async () => {
		const trimmed = remotePath.trim()
		if (!trimmed) return

		setLoading(true)
		setError(null)
		try {
			appStore.set(ignoredProjectsAtom, (prev) => prev.filter(p => p !== trimmed))
			
			appStore.set(discoveryAtom, (prev) => {
				if (prev.projects.some((p) => p.worktree === trimmed)) return prev
				const cleanDir = trimmed.replace(/[/\\]+$/, "")
				const name = cleanDir.split(/[/\\]/).pop() || trimmed
				return {
					...prev,
					projects: [
						...prev.projects,
						{ id: `temp-${Date.now()}`, worktree: trimmed, name, lastActiveAt: Date.now() } as any
					],
				}
			})
			
			await loadProjectSessions(trimmed)

			// Refresh project list from server to replace temp project with real one
			try {
				const serverProjects = await loadAllProjects()
				if (serverProjects.length > 0) {
					appStore.set(discoveryAtom, (prev) => {
						const merged = [...prev.projects]
						for (const sp of serverProjects) {
							const idx = merged.findIndex((p) => p.worktree === sp.worktree)
							if (idx >= 0) {
								merged[idx] = sp
							} else {
								merged.push(sp)
							}
						}
						return { ...prev, projects: merged }
					})
				}
			} catch (err) {
				console.warn("Failed to refresh projects after add", err)
			}

			onAdded?.(trimmed)
			onOpenChange(false)
			
			try {
				const session = await createSession(trimmed)
				if (session) {
					const slugMap = appStore.get(projectSlugMapAtom)
					const projectSlug = slugMap.get(trimmed)?.slug ?? trimmed.split(/[/\\]/).pop() ?? trimmed
					navigate({ to: "/project/$projectSlug/session/$sessionId", params: { projectSlug, sessionId: session.id } })
				}
			} catch (e) {
				console.error("Failed to create session on new remote project", e)
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to load project. Check that the path exists on the remote server.",
			)
		} finally {
			setLoading(false)
		}
	}, [remotePath, onAdded, onOpenChange, navigate, createSession])

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Remote Project</DialogTitle>
					<DialogDescription>
						Enter the absolute path to a project directory on{" "}
						<span className="font-medium text-foreground">{activeServer.name}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="remote-project-path">Directory Path</Label>
						<div className="relative">
							<FolderOpenIcon
								aria-hidden="true"
								className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="remote-project-path"
								placeholder="/home/user/projects/my-app"
								value={remotePath}
								onChange={(e) => {
									setRemotePath(e.target.value)
									setError(null)
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" && remotePath.trim()) {
										handleAdd()
									}
								}}
								className="pl-9"
								autoFocus
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							The path must exist on the remote server. Sessions and project data will be loaded
							from this directory.
						</p>
					</div>

					{error && (
						<div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}
				</div>

				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
					<Button disabled={!remotePath.trim() || loading} onClick={handleAdd}>
						{loading && <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />}
						Add Project
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
