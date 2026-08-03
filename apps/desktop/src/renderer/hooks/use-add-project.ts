import { useNavigate } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { useCallback, useState } from "react"
import { activeServerConfigAtom } from "../atoms/connection"
import { discoveryAtom, ignoredProjectsAtom } from "../atoms/discovery"
import { appStore } from "../atoms/store"
import { projectSlugMapAtom } from "../atoms/derived/agents"
import { createLogger } from "../lib/logger"
import { useAgentActions } from "./use-server"
import { pickDirectory } from "../services/backend"
import { loadProjectSessions, loadAllProjects } from "../services/connection-manager"

const log = createLogger("add-project")

export function useAddProject() {
	const navigate = useNavigate()
	const activeServer = useAtomValue(activeServerConfigAtom)
	const [addProjectOpen, setAddProjectOpen] = useState(false)
	const { createSession } = useAgentActions()

	const handleAddProject = useCallback(async () => {
		if (activeServer.type === "local") {
			const directory = await pickDirectory()
			if (!directory) return
			
			appStore.set(ignoredProjectsAtom, (prev) => prev.filter(p => p !== directory))
			
			appStore.set(discoveryAtom, (prev) => {
				if (prev.projects.some((p) => p.worktree === directory)) return prev
				const cleanDir = directory.replace(/[/\\]+$/, "")
				const name = cleanDir.split(/[/\\]/).pop() || directory
				return {
					...prev,
					projects: [
						...prev.projects,
						{ id: `temp-${Date.now()}`, worktree: directory, name, lastActiveAt: Date.now() } as any
					],
				}
			})
			
			await loadProjectSessions(directory)

			// Refresh project list from server to replace temp project with real one
			try {
				const serverProjects = await loadAllProjects()
				if (serverProjects.length > 0) {
					appStore.set(discoveryAtom, (prev) => {
						// Merge server projects, replacing any temp project with matching worktree
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
				log.warn("Failed to refresh projects after add", err)
			}

			// Create new session and navigate to it
			try {
				const session = await createSession(directory)
				if (session) {
					const slugMap = appStore.get(projectSlugMapAtom)
					const projectSlug = slugMap.get(directory)?.slug ?? directory.split(/[/\\]/).pop() ?? directory
					navigate({ to: "/project/$projectSlug/session/$sessionId", params: { projectSlug, sessionId: session.id } })
					return
				}
			} catch (e) {
				log.error("Failed to create session on new project", e)
			}
			
			navigate({ to: "/" })
		} else {
			setAddProjectOpen(true)
		}
	}, [activeServer.type, navigate, createSession])

	return { handleAddProject, addProjectOpen, setAddProjectOpen }
}
