import { useAtomValue } from "jotai"
import { useCallback } from "react"
import { connectionAtom } from "../atoms/connection"
import { codegraphEnabledAtom } from "../atoms/feature-flags"
import { sessionFamily, upsertSessionAtom, removeSessionAtom } from "../atoms/sessions"
import { appStore } from "../atoms/store"
import { createLogger } from "../lib/logger"
import { routeQuestion, type ProjectSession } from "../lib/session-organizer"
import type {
	FileAttachment,
	FilePartInput,
	QuestionAnswer,
	Session,
} from "../lib/types"
import { getProjectClient } from "../services/connection-manager"

const log = createLogger("use-server")

/**
 * Identity persona injected as the system prompt so the agent knows it is
 * Devil AI and identifies itself as such when asked (e.g. "who are you").
 */
export const DEVIL_AI_SYSTEM_PROMPT = [
	"You are Devil AI, an AI coding assistant built by the Devil AI team.",
	"You help users with software engineering tasks: exploring codebases, editing files, running commands, debugging, and automating workflows.",
	"CRITICAL INSTRUCTION: You have access to user's connected third-party platforms (Connectors) like Gmail, Slack, Telegram, Discord, GitHub, and WhatsApp via injected MCP tools.",
	"If the user asks you to check their email, read Slack messages, send a Telegram/WhatsApp message, DO NOT refuse.",
	"Instead, you MUST use your available MCP tools (like gmail_list_emails, gmail_read_email) to fulfill the request directly.",
	"When a user asks who you are or what you are, identify yourself as Devil AI and briefly describe that you are an AI coding assistant.",
	"If the user asks you to save a note or remember something, output the note using the exact format: <devil-ai-note title=\"Note Title\">Note Content</devil-ai-note>. The system will automatically extract and save this note to the user's database.",
	"",
].join("\n")

/**
 * Formats skill detection results for injection into the prompt.
 * Includes full SKILL.md content for high-confidence matches.
 */
function formatSkillsForPrompt(result: { skills: Array<{ name: string; confidence: number; reason: string; description?: string; fullContent?: string }>; keywords: string[] }): string {
	if (result.skills.length === 0) return ""

	const lines = ["## Auto-Detected Skills", ""]
	lines.push("The following skills have been automatically detected and loaded for this task.")
	lines.push("Follow the instructions in these skills to complete the task correctly.")
	lines.push("")

	for (const skill of result.skills.slice(0, 5)) {
		lines.push(`### ${skill.name}`)
		if (skill.description) {
			lines.push(skill.description)
		}
		lines.push(`Confidence: ${skill.confidence}% | Reason: ${skill.reason}`)
		// Include full SKILL.md content for high-confidence matches
		if (skill.confidence >= 70 && skill.fullContent) {
			lines.push("")
			lines.push("**Instructions:**")
			lines.push("")
			lines.push(skill.fullContent)
		}
		lines.push("")
	}

	return lines.join("\n")
}

/**
 * Hook for server connection state.
 */
export function useServerConnection() {
	const conn = useAtomValue(connectionAtom)
	return {
		connected: conn.connected,
		url: conn.url,
	}
}

/**
 * Hook for agent actions (stop, approve, deny, etc.).
 */
export function useAgentActions() {
	const abort = useCallback(async (directory: string, sessionId: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("abort", { sessionId })
		try {
			await client.session.abort({ sessionID: sessionId })
		} catch (err) {
			log.error("abort failed", { sessionId }, err)
			throw err
		}
	}, [])

	const sendPrompt = useCallback(
		async (
			directory: string,
			sessionId: string,
			text: string,
			options?: {
				model?: { providerID: string; modelID: string }
				agent?: string
				variant?: string
				files?: FileAttachment[]
				enableSubagentTools?: boolean
				isGodMode?: boolean
			},
		) => {
			log.debug("sendPrompt called", {
				directory,
				sessionId,
				textLength: text.length,
				agent: options?.agent,
				model: options?.model,
				variant: options?.variant,
				hasFiles: !!(options?.files && options.files.length > 0),
				isGodMode: options?.isGodMode,
			})

			const client = getProjectClient(directory)
			if (!client) {
				log.error("sendPrompt: no client for directory", { directory })
				throw new Error("Not connected to Devil AI server")
			}
			log.debug("sendPrompt: got client", { directory })

			// Query CodeGraph for relevant context (when enabled)
			let codeGraphContext = ""
			const codegraphEnabled = appStore.get(codegraphEnabledAtom)
			if (codegraphEnabled && typeof window !== "undefined" && "devilAi" in window) {
				try {
					const result = await window.devilAi.codegraph.query(text, directory)
					if (result.success && result.result?.result) {
						codeGraphContext = result.result.result
						log.debug("CodeGraph context retrieved", { length: codeGraphContext.length })
					}
				} catch (err) {
					log.debug("CodeGraph query failed, continuing without context", {}, err)
				}
			}

			// Query agent memory for cross-session context
			let memoryContext = ""
			if (typeof window !== "undefined" && "devilAi" in window) {
				try {
					memoryContext = await window.devilAi.memory.getContext(directory)
					if (memoryContext) {
						log.debug("Memory context retrieved", { length: memoryContext.length })
					}
				} catch (err) {
					log.debug("Memory context query failed, continuing without", {}, err)
				}
			}

			// Query Notes Context for global system prompt / user memory
			let notesContext = ""
			if (typeof window !== "undefined" && "devilAi" in window) {
				try {
					notesContext = await window.devilAi.notes.getContext(directory, text)
					if (notesContext) {
						log.debug("Notes context retrieved", { length: notesContext.length })
					}
				} catch (err) {
					log.debug("Notes context query failed, continuing without", {}, err)
				}
			}

			// Get Ponytail rules (built-in skill for minimal code)
			let ponytailRules = ""
			if (typeof window !== "undefined" && "devilAi" in window) {
				try {
					const ponytailEnabled = await window.devilAi.ponytail.isEnabled()
					if (ponytailEnabled) {
						ponytailRules = await window.devilAi.ponytail.getRules()
						if (ponytailRules) {
							log.debug("Ponytail rules retrieved", { length: ponytailRules.length })
						}
					}
				} catch (err) {
					log.debug("Ponytail rules retrieval failed, continuing without", {}, err)
				}
			}

			// Auto-detect skills from prompt with project context
			let skillContext = ""
			let detectedSkillNames: string[] = []
			if (typeof window !== "undefined" && "devilAi" in window) {
				try {
					const skillResult = await window.devilAi.skills.detect(text, directory)
					if (skillResult.skills.length > 0) {
						skillContext = formatSkillsForPrompt(skillResult)
						detectedSkillNames = skillResult.skills.map((s: { name: string }) => s.name)
						log.debug("Auto-detected skills", {
							skills: detectedSkillNames,
							keywords: skillResult.keywords,
						})
					}
				} catch (err) {
					log.debug("Skill detection failed, continuing without", {}, err)
				}
			}

			// Smart context switching - detect if question is project-related
			let contextSwitchMessage = ""
			let targetSessionId = sessionId
			
			if (typeof window !== "undefined" && "devilAi" in window) {
				try {
					// Get all available sessions
					const allSessions: ProjectSession[] = []
					// TODO: Get sessions from store when available
					
					// Route the question to the appropriate session
					const route = routeQuestion(text, allSessions, directory)
					
					if (route.createNew) {
						// Create a new session for this question
						log.debug("Creating new session for question", { 
							title: route.suggestedTitle,
							reason: route.reason 
						})
						contextSwitchMessage = `[Note: This question will be answered in a new session: "${route.suggestedTitle || 'New Chat'}"]`
					} else if (route.sessionId !== sessionId) {
						// Route to existing session
						log.debug("Routing to different session", { 
							sessionId: route.sessionId,
							reason: route.reason 
						})
						if (route.sessionId) {
							targetSessionId = route.sessionId
						}
						contextSwitchMessage = `[Note: This question is being routed to the appropriate project session]`
					}
				} catch (err) {
					log.debug("Session routing failed, continuing without", {}, err)
				}
			}

			// Build text with CodeGraph context + Memory context + Skills + Notes + Ponytail Rules + Context Switch
			const contextParts: string[] = []
			if (notesContext) {
				contextParts.push(`<system-notes>\n${notesContext}\n</system-notes>`)
			}
			if (ponytailRules) {
				contextParts.push(`<ponytail-skill>\n${ponytailRules}\n</ponytail-skill>`)
			}
			if (codeGraphContext) {
				contextParts.push(`<code-graph-context>\n${codeGraphContext}\n</code-graph-context>`)
			}
			if (memoryContext) {
				contextParts.push(`<agent-memory>\n${memoryContext}\n</agent-memory>`)
			}
			if (skillContext) {
				contextParts.push(skillContext)
			}
			if (contextSwitchMessage) {
				// Don't add ugly XML tags - just pass the context naturally
				// The system will handle routing internally
			}
			
			// User text remains clean
			const finalText = text

			// Build parts array for the API call
			const files = options?.files ?? []
			const parts: Array<{ type: "text"; text: string } | FilePartInput> = [{ type: "text", text: finalText }]
			for (const file of files) {
				parts.push({
					type: "file",
					mime: file.mediaType ?? "application/octet-stream",
					filename: file.filename,
					url: file.url,
				})
			}

			log.debug("sendPrompt: calling promptAsync", {
				sessionId: targetSessionId,
				agent: options?.agent,
				model: options?.model,
				partsCount: parts.length,
				hasCodeGraphContext: !!codeGraphContext,
			})
			
			// Build system prompt with God Mode instructions if enabled
			let systemPrompt = DEVIL_AI_SYSTEM_PROMPT
			if (options?.isGodMode) {
				systemPrompt += `
## GOD MODE ACTIVE
You are operating in GOD MODE - maximum capability mode with the following enhancements:

### Parallel Execution
- Use the Task tool to launch multiple agents simultaneously for complex tasks
- Break down large tasks into independent sub-tasks and execute them in parallel
- Always specify subagent_type: "general" or "explore" for optimal performance

### Aggressive Tool Usage
- ALWAYS use tools to verify your work - never assume code works without testing
- Run type checks, linting, and tests after every significant change
- Use grep/glob extensively to understand codebase context before making changes

### Code Quality Standards
- Write production-ready code with proper error handling
- Add TypeScript types for all new functions and interfaces
- Follow existing code conventions - check neighboring files for patterns
- Never leave TODO comments without creating actual implementation

### Proactive Behavior
- If you notice potential issues, fix them proactively
- Optimize code for performance and readability
- Suggest architectural improvements when appropriate
- Document complex logic with clear comments

### Response Format
- Always show what tools you're using and why
- Provide clear status updates on multi-step tasks
- Show before/after comparisons for code changes
`
			}

			// Append context parts to system prompt so they are hidden from the UI
			if (contextParts.length > 0) {
				systemPrompt += `\n\n## Dynamic Context (from system, do not mention to user unless asked)\n${contextParts.join("\n\n")}`
			}

			try {
				const result = await client.session.promptAsync({
					sessionID: targetSessionId,
					parts,
					model: options?.model
						? { providerID: options.model.providerID, modelID: options.model.modelID }
						: undefined,
				agent: options?.agent,
				variant: options?.variant,
				system: systemPrompt,
				// @ts-ignore - Subagent tools support
				enable_subagent_tools: options?.enableSubagentTools,
			})
				log.debug("sendPrompt: promptAsync returned", {
					sessionId: targetSessionId,
					result: JSON.stringify(result).slice(0, 200),
				})
			} catch (err) {
				log.error("sendPrompt: promptAsync failed", { sessionId: targetSessionId, agent: options?.agent }, err)
				throw err
			}
		},
		[],
	)

	const createSession = useCallback(async (directory: string, title?: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("createSession", { directory, title })
		try {
			const result = await client.session.create({ title })
			const session = result.data
			if (session) {
				appStore.set(upsertSessionAtom, { session, directory })
			}
			log.debug("createSession succeeded", { sessionId: session?.id })
			return session
		} catch (err) {
			log.error("createSession failed", { directory, title }, err)
			throw err
		}
	}, [])

	const renameSession = useCallback(async (directory: string, sessionId: string, title: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("renameSession", { sessionId, title })

		// Optimistic update
		const entry = appStore.get(sessionFamily(sessionId))
		if (entry) {
			appStore.set(upsertSessionAtom, {
				session: { ...entry.session, title },
				directory: entry.directory,
			})
		}

		try {
			await client.session.update({ sessionID: sessionId, title })
		} catch (err) {
			log.error("renameSession failed", { sessionId, title }, err)
			throw err
		}
	}, [])

	const deleteSession = useCallback(async (directory: string, sessionId: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("deleteSession", { sessionId })

		// Optimistic update
		appStore.set(removeSessionAtom, sessionId)

		try {
			await client.session.delete({ sessionID: sessionId })
		} catch (err) {
			log.error("deleteSession failed", { sessionId }, err)
			throw err
		}
	}, [])

	const respondToPermission = useCallback(
		async (
			directory: string,
			sessionId: string,
			permissionId: string,
			response: "once" | "always" | "reject",
		) => {
			const client = getProjectClient(directory)
if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("respondToPermission", { sessionId, permissionId, response })
			try {
				await client.permission.respond({
					sessionID: sessionId,
					permissionID: permissionId,
					response,
				})
			} catch (err) {
				log.error("respondToPermission failed", { sessionId, permissionId, response }, err)
				throw err
			}
		},
		[],
	)

	const replyToQuestion = useCallback(
		async (directory: string, requestId: string, answers: QuestionAnswer[]) => {
			const client = getProjectClient(directory)
if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("replyToQuestion", { requestId })
			try {
				await client.question.reply({ requestID: requestId, answers })
			} catch (err) {
				log.error("replyToQuestion failed", { requestId }, err)
				throw err
			}
		},
		[],
	)

	const rejectQuestion = useCallback(async (directory: string, requestId: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("rejectQuestion", { requestId })
		try {
			await client.question.reject({ requestID: requestId })
		} catch (err) {
			log.error("rejectQuestion failed", { requestId }, err)
			throw err
		}
	}, [])

	const revert = useCallback(async (directory: string, sessionId: string, messageId: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("revert", { sessionId, messageId })
		try {
			const entry = appStore.get(sessionFamily(sessionId))
			if (entry?.status?.type === "busy") {
				log.debug("revert: aborting busy session first", { sessionId })
				await client.session.abort({ sessionID: sessionId })
			}
			await client.session.revert({ sessionID: sessionId, messageID: messageId })
		} catch (err) {
			log.error("revert failed", { sessionId, messageId }, err)
			throw err
		}
	}, [])

	const unrevert = useCallback(async (directory: string, sessionId: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("unrevert", { sessionId })
		try {
			await client.session.unrevert({ sessionID: sessionId })
		} catch (err) {
			log.error("unrevert failed", { sessionId }, err)
			throw err
		}
	}, [])

	const executeCommand = useCallback(
		async (directory: string, sessionId: string, command: string, args: string) => {
			const client = getProjectClient(directory)
if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("executeCommand", { sessionId, command })
			try {
				await client.session.command({
					sessionID: sessionId,
					command,
					arguments: args,
				})
			} catch (err) {
				log.error("executeCommand failed", { sessionId, command }, err)
				throw err
			}
		},
		[],
	)

	const summarize = useCallback(async (directory: string, sessionId: string) => {
		const client = getProjectClient(directory)
		if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("summarize", { sessionId })
		try {
			await client.session.summarize({ sessionID: sessionId })
		} catch (err) {
			log.error("summarize failed", { sessionId }, err)
			throw err
		}
	}, [])

	const deletePart = useCallback(
		async (directory: string, sessionId: string, messageId: string, partId: string) => {
			const client = getProjectClient(directory)
if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("deletePart", { sessionId, messageId, partId })
			try {
				await client.part.delete({ sessionID: sessionId, messageID: messageId, partID: partId })
			} catch (err) {
				log.error("deletePart failed", { sessionId, messageId, partId }, err)
				throw err
			}
		},
		[],
	)

	const forkSession = useCallback(
		async (directory: string, sessionId: string, messageId?: string): Promise<Session> => {
			const client = getProjectClient(directory)
if (!client) throw new Error("Not connected to Devil AI server")
		log.debug("forkSession", { sessionId, messageId })
			try {
				const result = await client.session.fork({
					sessionID: sessionId,
					messageID: messageId,
				})
				const session = result.data as Session | undefined
				if (!session) {
					throw new Error("Fork failed: no session returned from server")
				}
				appStore.set(upsertSessionAtom, { session, directory })
				log.debug("forkSession succeeded", { forkedSessionId: session.id })
				return session
			} catch (err) {
				log.error("forkSession failed", { sessionId, messageId }, err)
				throw err
			}
		},
		[],
	)

	return {
		abort,
		sendPrompt,
		createSession,
		renameSession,
		deleteSession,
		deletePart,
		respondToPermission,
		replyToQuestion,
		rejectQuestion,
		revert,
		unrevert,
		executeCommand,
		summarize,
		forkSession,
	}
}
