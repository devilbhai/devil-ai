import { createLogger } from "../../lib/logger"
import { queryClient } from "../../lib/query-client"
import type { Event } from "../../lib/types"
import { serverConnectedAtom } from "../connection"
import { discoveryAtom } from "../discovery"
import { removeMessageAtom, upsertMessageAtom } from "../messages"
import { applyPartDeltaAtom, removePartAtom, upsertPartAtom } from "../parts"
import {
	addPermissionAtom,
	addQuestionAtom,
	removePermissionAtom,
	removeQuestionAtom,
	removeSessionAtom,
	setSessionErrorAtom,
	setSessionStatusAtom,
	upsertSessionAtom,
} from "../sessions"
import { appStore } from "../store"
import { isStreamingField, isStreamingPartType, streamingVersionFamily } from "../streaming"
import { todosFamily } from "../todos"
import { setSessionDiffAtom } from "../ui"
import { addCostAtom } from "../cost-budget"
import { enableTDDAtom } from "../tdd-mode"

const log = createLogger("event-processor")

// Throttled cost accumulator — batches cost updates to avoid per-delta Jotai writes
let pendingCost = 0
let costFlushScheduled = false
const COST_FLUSH_INTERVAL_MS = 500

function scheduleCostFlush() {
	if (costFlushScheduled) return
	costFlushScheduled = true
	setTimeout(() => {
		costFlushScheduled = false
		if (pendingCost > 0) {
			const amount = pendingCost
			pendingCost = 0
			appStore.set(addCostAtom, amount)
		}
	}, COST_FLUSH_INTERVAL_MS)
}

/**
 * Invalidate all engine data queries for a specific directory.
 * Called when an instance is disposed so the UI re-fetches config, agents, providers, etc.
 */
function invalidateDirectoryQueries(directory: string): void {
	log.info("Invalidating queries for disposed instance", { directory })
	for (const key of ["config", "providers", "agents", "commands", "vcs"]) {
		queryClient.invalidateQueries({ queryKey: [key, directory] })
	}
}

/**
 * Invalidate all engine data queries across all directories.
 * Called when a global dispose event occurs (e.g. global config change).
 */
function invalidateAllQueries(): void {
	log.info("Invalidating all engine queries (global dispose)")
	for (const key of ["config", "providers", "agents", "commands", "vcs"]) {
		queryClient.invalidateQueries({ queryKey: [key] })
	}
}

/**
 * Central SSE event dispatcher.
 * A standalone function that writes to Jotai atoms via the store API.
 * Called by the event batcher in connection-manager.
 */
export function processEvent(event: Event): void {
	const { set } = appStore

	switch (event.type) {
		case "server.connected":
			set(serverConnectedAtom, true)
			break

		case "server.instance.disposed": {
			const directory = event.properties.directory
			if (directory) {
				invalidateDirectoryQueries(directory)
			}
			break
		}

		case "global.disposed":
			invalidateAllQueries()
			break

		case "project.updated": {
			const project = event.properties
			if (project.id && project.worktree) {
				const current = appStore.get(discoveryAtom)
				// Match by worktree (directory) first to handle temp projects that
				// were injected with a synthetic ID like "temp-..." when re-adding.
				// Fall back to ID match for real projects.
				const existing = current.projects.findIndex(
					(p) => p.worktree === project.worktree || p.id === project.id,
				)
				const nextProjects =
					existing >= 0
						? current.projects.map((p, i) => (i === existing ? project : p))
						: [...current.projects, project]
				set(discoveryAtom, { ...current, projects: nextProjects })
			}
			break
		}

		case "session.created": {
			const info = event.properties.info
			set(upsertSessionAtom, { session: info, directory: info.directory ?? "" })

			// Ensure the project is in discovery data so it shows in sidebar
			if (info.directory) {
				const current = appStore.get(discoveryAtom)
				const dir = info.directory
				const exists = current.projects.some((p) => p.worktree === dir || p.id === dir)
				if (!exists && current.loaded) {
					// Add a synthetic project entry so the sidebar shows this project
					const projectName = dir.split("/").filter(Boolean).pop() ?? dir
					const newProject = {
						id: dir,
						name: projectName,
						worktree: dir,
						sandboxes: [],
						time: { created: Date.now(), updated: Date.now() },
						path: dir,
					}
					set(discoveryAtom, {
						...current,
						projects: [...current.projects, newProject],
					})
				}
			}

			if (window.devilAi?.analytics) {
				window.devilAi.analytics.trackSessionStart(info.id, info.directory, (info as any).model || (info as any).modelID).catch(console.error)
			}
			break
		}

		case "session.updated": {
			const info = event.properties.info
			set(upsertSessionAtom, { session: info, directory: info.directory ?? "" })
			break
		}

		case "session.deleted":
			set(removeSessionAtom, event.properties.info.id)
			if (window.devilAi?.analytics) {
				window.devilAi.analytics.trackSessionEnd(event.properties.info.id).catch(console.error)
			}
			break

		case "session.status":
			set(setSessionStatusAtom, {
				sessionId: event.properties.sessionID,
				status: event.properties.status,
			})
			// Clear error when session starts working again
			if (event.properties.status.type !== "idle") {
				set(setSessionErrorAtom, {
					sessionId: event.properties.sessionID,
					error: undefined,
				})
			} else {
				if (window.devilAi?.analytics) {
					window.devilAi.analytics.trackSessionEnd(event.properties.sessionID).catch(console.error)
				}
			}
			break

		case "session.error": {
			const { sessionID, error } = event.properties
			if (sessionID && error) {
				set(setSessionErrorAtom, {
					sessionId: sessionID,
					error: { name: error.name, data: error.data },
				})
			}
			break
		}

		case "permission.asked":
			set(addPermissionAtom, {
				sessionId: event.properties.sessionID,
				permission: event.properties,
			})
			break

		case "permission.replied":
			set(removePermissionAtom, {
				sessionId: event.properties.sessionID,
				permissionId: event.properties.requestID,
			})
			break

		case "question.asked":
			set(addQuestionAtom, {
				sessionId: event.properties.sessionID,
				question: event.properties,
			})
			break

		case "question.replied":
			set(removeQuestionAtom, {
				sessionId: event.properties.sessionID,
				requestId: event.properties.requestID,
			})
			break

		case "question.rejected":
			set(removeQuestionAtom, {
				sessionId: event.properties.sessionID,
				requestId: event.properties.requestID,
			})
			break

		case "message.updated":
			set(upsertMessageAtom, event.properties.info)
			break

		case "message.removed":
			set(removeMessageAtom, {
				sessionId: event.properties.sessionID,
				messageId: event.properties.messageID,
			})
			break

		case "message.part.updated": {
			const part = event.properties.part
			set(upsertPartAtom, part)
			// Non-streaming parts (tool calls, files) bypass the streaming buffer
			// and update partsFamily directly. Since useSessionChat reads parts
			// imperatively (appStore.get) rather than subscribing, we must bump
			// the per-session streaming version to trigger a re-render so the UI
			// picks up newly added or updated tool call cards.
			if (!isStreamingPartType(part)) {
				set(streamingVersionFamily(part.sessionID), (v) => v + 1)
			}
			
			// Auto-enable TDD Indicator when test-related tool calls are made
			if (part.type === "tool" && part.tool?.includes("test")) {
				set(enableTDDAtom)
			}
			break
		}

		case "message.part.delta": {
			const { messageID, partID, field, delta, sessionID } = event.properties
			set(applyPartDeltaAtom, { messageId: messageID, partId: partID, field, delta })
			// Non-streaming field deltas (e.g. tool input) bypass the streaming
			// buffer and land directly in partsFamily. Bump the version so the
			// UI re-renders to show the updated content.
			if (!isStreamingField(field)) {
				set(streamingVersionFamily(sessionID), (v) => v + 1)
			}
			
			// Throttled cost accumulation — batch updates to avoid per-delta Jotai writes
			pendingCost += 0.0002
			scheduleCostFlush()
			break
		}

		case "message.part.removed": {
			const { messageID, partID, sessionID } = event.properties
			set(removePartAtom, { messageId: messageID, partId: partID })
			// Part removal changes the visible part list, so notify the session.
			set(streamingVersionFamily(sessionID), (v) => v + 1)
			break
		}

		case "todo.updated": {
			const rawTodos = event.properties.todos
			set(todosFamily(event.properties.sessionID), Array.isArray(rawTodos) ? rawTodos : [])
			break
		}

		case "session.diff": {
			const { sessionID, diff } = event.properties as {
				sessionID: string
				diff: import("../../lib/types").FileDiff[]
			}
			if (sessionID && diff) {
				set(setSessionDiffAtom, { sessionId: sessionID, diffs: diff })
			}
			break
		}

		// --- Worktree lifecycle events (from engine experimental API) ---

		case "worktree.ready":
			log.info("Worktree ready", {
				name: event.properties.name,
				branch: event.properties.branch,
			})
			break

		case "worktree.failed":
			log.warn("Worktree creation failed", {
				message: event.properties.message,
			})
			break
	}
}
