import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
	useStickToBottomContext,
} from "@devil-ai/ui/components/ai-elements/conversation"
import {
	PromptInput,
	PromptInputFooter,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@devil-ai/ui/components/ai-elements/prompt-input"
import { cn } from "@devil-ai/ui/lib/utils"
import { useAtomValue, useSetAtom } from "jotai"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
	ChevronUpIcon,
	GitForkIcon,
	Loader2Icon,
	MonitorIcon,
	Redo2Icon,
	SearchIcon,
	SkullIcon,
	Undo2Icon,
	XIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import { messagesFamily, upsertMessageAtom, removeMessageAtom } from "../../atoms/messages"
import { partsFamily } from "../../atoms/parts"
import { projectModelsAtom, setProjectModelAtom } from "../../atoms/preferences"
import { sessionFamily, setSessionGodModeAtom, setSessionSandboxAtom } from "../../atoms/sessions"
import {
	effectivePermissionFamily,
	effectiveQuestionFamily,
} from "../../atoms/derived/session-requests"
import { appStore } from "../../atoms/store"
import { useDraftActions, useDraftSnapshot } from "../../hooks/use-draft"
import type {
	ConfigData,
	ModelRef,
	ProvidersData,
	SdkAgent,
	VcsData,
} from "../../hooks/use-opencode-data"
import {
	getModelInputCapabilities,
	getModelVariants,
	resolveEffectiveModel,
	useModelState,
} from "../../hooks/use-opencode-data"
import type { ChatTurn } from "../../hooks/use-session-chat"
import { createLogger } from "../../lib/logger"
import { computeTurnWorkTimeSplit } from "../../lib/session-metrics"
import type { Agent, FileAttachment, FilePart, QuestionAnswer, TextPart } from "../../lib/types"
import { getProjectClient } from "../../services/connection-manager"

const log = createLogger("chat-view")

import {
	diffCommentsFamily,
	serializeCommentsForChat,
} from "../review/review-comments"
import { PermissionItem } from "./chat-permission"
import { ChatQuestionFlow } from "./chat-question"
import { ChatTurnComponent, getUserText } from "./chat-turn"
import { ContextItems } from "./context-items"
import { PonytailReviewWrapper } from "./ponytail-review-wrapper"
import type { MentionOption } from "./mention-popover"
import { MentionPopover, type MentionPopoverHandle } from "./mention-popover"
import { PromptAttachmentPreview } from "./prompt-attachments"
import {
	createAgentMention,
	createFileMention,
	getMentionMarker,
	insertMentionIntoText,
	type PromptMention,
} from "./prompt-mentions"
import { PromptToolbar, StatusBar } from "./prompt-toolbar"
import { SessionTaskList } from "./session-task-list"
import { SkillPickerDialog } from "./skill-picker-dialog"
import { SlashCommandPopover, type SlashCommandPopoverHandle } from "./slash-command-popover"
import { SmartSwarmDashboard } from "../swarm-dashboard"
import { InlineCodeActions } from "@devil-ai/ui/components/ai-elements/inline-code-actions"
import { useRagIngestion } from "../../hooks/use-rag-ingestion"
import { detectRequiredMCPs } from "../../lib/mcp-auto-detect"


import { AttachButton } from "../chat-view-parts/attach-button"
import { ScrollOnLoad, ScrollBridge, ScrollToResponseStart, type ScrollHandle } from "../chat-view-parts/chat-scroll-helpers"
import { VoicePairProgrammingButton } from "../chat-view-parts/chat-voice-tools"
import { JarvisVoiceOverlay } from "./jarvis-voice-overlay"
import { DraftSync, SlashCommandBridge, TriggerDetector, MentionReconciler } from "../chat-view-parts/chat-input-bridges"
import { LiveTurnTimer } from "../chat-view-parts/live-turn-timer"
import { WorktreeSetupProgress } from "../chat-view-parts/worktree-setup-progress"
import { DiffCommentChips } from "../chat-view-parts/diff-comment-chips"
import { useSubscriptionStatus } from "../../hooks/use-subscription"
import { Button } from "@devil-ai/ui/components/button"
import { DevilAiWordmark } from "../devil-ai-wordmark"
import { useNavigate } from "@tanstack/react-router"

interface VirtualMessageListProps {
	turns: ChatTurn[]
	isWorking: boolean
	onRevertToMessage?: (messageId: string) => Promise<void>
	handleSendNow: (turn: ChatTurn) => Promise<void>
	handleDeleteTurn: (turn: ChatTurn) => Promise<void>
	onForkFromTurn?: (messageId?: string) => Promise<void>
	onDeletePart?: (sessionId: string, messageId: string, partId: string) => Promise<void>
	isGodMode?: boolean
	onEditPrompt?: (text: string) => void
	onRegenerate?: (userMessageId: string) => void
	searchQuery?: string
}

function VirtualMessageListInner({ turns, isWorking, onRevertToMessage, handleSendNow, handleDeleteTurn, onForkFromTurn, onDeletePart, isGodMode, onEditPrompt, onRegenerate, searchQuery }: VirtualMessageListProps) {
	const { scrollRef } = useStickToBottomContext()
	const virtualizer = useVirtualizer({
		count: turns.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => 200,
	})

	return (
		<div
			style={{
				height: `${virtualizer.getTotalSize()}px`,
				width: "100%",
				position: "relative",
			}}
		>
			{virtualizer.getVirtualItems().map((virtualItem) => {
				const index = virtualItem.index
				const turn = turns[index]
				return (
					<div
						key={virtualItem.key}
						data-index={index}
						ref={virtualizer.measureElement}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${virtualItem.start}px)`,
							paddingBottom: index === turns.length - 1 ? 0 : "2.5rem",
						}}
					>
						<ChatTurnComponent
							turn={turn}
							isLast={index === turns.length - 1}
							isWorking={isWorking}
							onRevertToMessage={onRevertToMessage}
							onSendNow={isWorking ? handleSendNow : undefined}
							onDeleteTurn={isWorking ? handleDeleteTurn : undefined}
							onForkFromTurn={
								onForkFromTurn
									? () => {
											const nextTurn = turns[index + 1]
											return onForkFromTurn(nextTurn?.userMessage.info.id)
									  }
									: undefined
							}
							onDeletePart={onDeletePart}
							isGodMode={isGodMode}
							onEditPrompt={onEditPrompt}
							onRegenerate={onRegenerate}
							searchQuery={searchQuery}
						/>
					</div>
				)
			})}
		</div>
	)
}

const VirtualMessageList = memo(VirtualMessageListInner, (prev, next) => {
	return (
		prev.turns === next.turns &&
		prev.isWorking === next.isWorking &&
		prev.isGodMode === next.isGodMode &&
		prev.onRevertToMessage === next.onRevertToMessage &&
		prev.handleSendNow === next.handleSendNow &&
		prev.handleDeleteTurn === next.handleDeleteTurn &&
		prev.onForkFromTurn === next.onForkFromTurn &&
		prev.onDeletePart === next.onDeletePart &&
		prev.onEditPrompt === next.onEditPrompt &&
		prev.onRegenerate === next.onRegenerate &&
		prev.searchQuery === next.searchQuery
	)
})
interface ChatViewProps {
	turns: ChatTurn[]
	loading: boolean
	/** Whether earlier messages are currently being loaded */
	loadingEarlier: boolean
	/** Whether there are earlier messages that can be loaded */
	hasEarlierMessages: boolean
	/** Callback to load earlier messages */
	onLoadEarlier?: () => void
	agent: Agent
	isConnected: boolean
	onSendMessage?: (
		agent: Agent,
		message: string,
		options?: { model?: ModelRef; agentName?: string; variant?: string; files?: FileAttachment[]; isGodMode?: boolean },
	) => Promise<void>
	/** Callback to stop/abort the running session */
	onStop?: (agent: Agent) => Promise<void>
	/** Provider data for model selector */
	providers?: ProvidersData | null
	/** Config data (default model, default agent) */
	config?: ConfigData | null
	/** VCS data for status bar */
	vcs?: VcsData | null
	/** Available OpenCode agents */
	openCodeAgents?: SdkAgent[]
	/** Permission handlers */
	onApprove?: (
		agent: Agent,
		permissionSessionId: string,
		permissionId: string,
		response?: "once" | "always",
	) => Promise<void>
	onDeny?: (agent: Agent, permissionSessionId: string, permissionId: string) => Promise<void>
	/** Question handlers */
	onReplyQuestion?: (agent: Agent, requestId: string, answers: QuestionAnswer[]) => Promise<void>
	onRejectQuestion?: (agent: Agent, requestId: string) => Promise<void>
	/** Undo/redo */
	canUndo?: boolean
	canRedo?: boolean
	onUndo?: () => Promise<string | undefined>
	onRedo?: () => Promise<void>
	isReverted?: boolean
	/** Revert to a specific message (for per-turn undo) */
	onRevertToMessage?: (messageId: string) => Promise<void>
	/** Fork from a turn boundary (messageId of the next turn's user message, or undefined for full fork) */
	onForkFromTurn?: (messageId?: string) => Promise<void>
	/** Delete a specific part from a message (for error recovery) */
	onDeletePart?: (sessionId: string, messageId: string, partId: string) => Promise<void>
	/** Whether the review panel is open (removes max-w constraint) */
	reviewPanelOpen?: boolean
}

/**
 * Main chat view component.
 * Renders the full conversation as turns with auto-scroll,
 * plus a card-style input with agent/model/variant toolbar and status bar.
 *
 * The input section (toolbar, popovers, mentions, model/agent/variant state)
 * is extracted into `ChatInputSection` so that state changes in the input area
 * don't cause re-renders of the conversation turn list.
 */
export function ChatView({
	turns,
	loading,
	loadingEarlier,
	hasEarlierMessages,
	onLoadEarlier,
	agent,
	isConnected,
	onSendMessage,
	onStop,
	providers,
	config,
	vcs,
	openCodeAgents,
	onApprove,
	onDeny,
	onReplyQuestion,
	onRejectQuestion,
	canUndo,
	canRedo,
	onUndo,
	onRedo,
	isReverted,
	onRevertToMessage,
	onForkFromTurn,
	onDeletePart,
	reviewPanelOpen,
}: ChatViewProps) {
	const isWorking = agent.status === "running" || agent.status === "retry"

	// Search state
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const searchInputRef = useRef<HTMLInputElement>(null)

	// Summary state
	const [summaryOpen, setSummaryOpen] = useState(false)
	const [summaryLoading, setSummaryLoading] = useState(false)
	const [summaryText, setSummaryText] = useState("")

	// Ingest session messages into RAG for context retrieval
	useRagIngestion({ sessionId: agent.sessionId })

	// Ref to imperatively scroll the conversation to bottom from outside the
	// <Conversation> tree (e.g. after sending a message or answering a question).
	const scrollRef = useRef<ScrollHandle | null>(null)

	// Session-level error and setup phase from the session atom
	const sessionEntry = useAtomValue(sessionFamily(agent.sessionId))
	const sessionError = sessionEntry?.error
	const setupPhase = sessionEntry?.setupPhase
	// Format the session-level error for display. Only shown when the last
	// turn doesn't already carry an assistant-level error (the server emits
	// both session.error and message.updated for the same failure, so showing
	// both would duplicate the message).
	const sessionErrorText = useMemo(() => {
		if (!sessionError) return undefined
		if ("message" in sessionError.data && sessionError.data.message) {
			return String(sessionError.data.message)
		}
		return `${sessionError.name}: ${JSON.stringify(sessionError.data)}`
	}, [sessionError])

	const lastTurnHasError = useMemo(() => {
		const lastTurn = turns.at(-1)
		if (!lastTurn) return false
		return lastTurn.assistantMessages.some(
			(m) => m.info.role === "assistant" && m.info.error != null,
		)
	}, [turns])

	const showSessionError = !!sessionErrorText && !lastTurnHasError

	// Stable callbacks for question/permission handlers — agent is stable
	// per render, but wrapping in useCallback avoids creating new inline
	// closures inside the JSX .map() that would defeat memo() on children.
	const handleApprovePermission = useCallback(
		async (
			a: Agent,
			permissionSessionId: string,
			permissionId: string,
			response?: "once" | "always",
		) => {
			await onApprove?.(a, permissionSessionId, permissionId, response)
			// Permission card disappears after approval — scroll to keep content visible.
			requestAnimationFrame(() => {
				scrollRef.current?.forceScrollToBottom()
			})
		},
		[onApprove],
	)

	const handleDenyPermission = useCallback(
		async (a: Agent, permissionSessionId: string, permissionId: string) => {
			await onDeny?.(a, permissionSessionId, permissionId)
			requestAnimationFrame(() => {
				scrollRef.current?.forceScrollToBottom()
			})
		},
		[onDeny],
	)

	const handleSendNow = useCallback(
		async (turn: ChatTurn) => {
			if (!isWorking) return

			// Extract text and files from the queued turn BEFORE aborting, because
			// the abort may clean up state that we need.
			const text = turn.userMessage.parts
				.filter((p): p is TextPart => p.type === "text" && !p.synthetic)
				.map((p) => p.text)
				.join("\n")
			const files: FileAttachment[] = turn.userMessage.parts
				.filter((p): p is FilePart => p.type === "file")
				.map((p) => ({
					type: "file" as const,
					url: p.url,
					mediaType: p.mime,
					filename: p.filename,
				}))

			if (!text.trim()) return

			// 1. Abort the currently running turn
			if (onStop) {
				await onStop(agent)
			}

			// 2. Remove the orphaned message from the local store to prevent
			// duplicates. After an abort the server discards queued prompt
			// callbacks, so the user message is persisted on the server but no
			// response will be generated. When we re-send below, a new user
			// message + optimistic entry will be created. The server's loop
			// reads full history and will respond to the newest user message,
			// effectively ignoring the orphaned one in the context.
			appStore.set(removeMessageAtom, {
				sessionId: agent.sessionId,
				messageId: turn.userMessage.info.id,
			})

			// 3. Re-send the queued message so the server actually processes it.
			if (onSendMessage) {
				await onSendMessage(agent, text, { files: files.length > 0 ? files : undefined })
			}
		},
		[onStop, onSendMessage, isWorking, agent],
	)

	const handleDeleteTurn = useCallback(
		async (turn: ChatTurn) => {
			if (!turn.userMessage?.info?.id) return

			// Remove the user message from local store
			appStore.set(removeMessageAtom, {
				sessionId: agent.sessionId,
				messageId: turn.userMessage.info.id,
			})

			// Also try to cancel on server if there's an active turn
			if (onStop && isWorking) {
				await onStop(agent)
			}
		},
		[onStop, isWorking, agent],
	)

	// Keyboard shortcuts for undo/redo
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd+F / Ctrl+F — Search
			if ((e.metaKey || e.ctrlKey) && e.key === "f") {
				e.preventDefault()
				setSearchOpen(true)
				setTimeout(() => searchInputRef.current?.focus(), 0)
				return
			}

			// Escape — Close search
			if (e.key === "Escape" && searchOpen) {
				setSearchOpen(false)
				setSearchQuery("")
				return
			}

			// Don't intercept Cmd/Ctrl+Z in any text input — let the browser
			// handle native undo/redo. Session undo/redo is still available via
			// /undo, /redo slash commands and the command palette.
			const target = e.target as HTMLElement
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

			// Cmd+Z / Ctrl+Z — Undo
			if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
				if (canUndo && onUndo) {
					e.preventDefault()
					onUndo()
				}
				return
			}

			// Cmd+Shift+Z / Ctrl+Shift+Z — Redo
			if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
				if (canRedo && onRedo) {
					e.preventDefault()
					onRedo()
				}
				return
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [canUndo, canRedo, onUndo, onRedo, searchOpen])

	// Width constraint class: remove max-w when review panel is open
	const contentWidthClass = reviewPanelOpen
		? "mx-auto w-full min-w-0"
		: "mx-auto w-full min-w-0 max-w-4xl"

	// God mode container styles — premium developer aesthetic
	const godModeStyles = sessionEntry?.isGodMode 
		? "ring-1 ring-indigo-500/20 shadow-[inset_0_0_150px_rgba(99,102,241,0.06)] bg-gradient-to-b from-indigo-950/20 via-transparent to-violet-950/10 transition-all duration-1000 ease-in-out" 
		: "transition-all duration-1000 ease-in-out"

	const inputControllerRef = useRef<{
		setText: (text: string) => void
		getText: () => string
	} | null>(null)

	const handleEditPrompt = useCallback(
		(text: string) => {
			inputControllerRef.current?.setText(text)
			const ta = document.querySelector<HTMLTextAreaElement>("textarea[data-prompt-input]")
			ta?.focus()
		},
		[]
	)

	const handleRegenerate = useCallback(
		(userMessageId: string) => {
			const turn = turns.find((t) => t.userMessage.info.id === userMessageId)
			if (!turn) return
			const userText = getUserText(turn.userMessage)
			if (userText && onSendMessage) {
				onSendMessage(agent, userText)
			}
		},
		[turns, onSendMessage, agent]
	)

	const handleExportChat = useCallback(() => {
		const lines: string[] = []
		for (const turn of turns) {
			const userText = getUserText(turn.userMessage)
			if (userText) {
				lines.push(`## You\n${userText}\n`)
			}
			for (const msg of turn.assistantMessages) {
				const parts = msg.parts.filter((p) => p.type === "text" && !p.synthetic) as Array<{ type: "text"; text: string }>
				const text = parts.map((p) => p.text).join("\n")
				if (text) {
					lines.push(`## Assistant\n${text}\n`)
				}
			}
		}
		const content = lines.join("\n")
		const blob = new Blob([content], { type: "text/markdown" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `chat-${agent.sessionId.slice(0, 8)}.md`
		a.click()
		URL.revokeObjectURL(url)
	}, [turns, agent.sessionId])

	const handleSummarize = useCallback(async () => {
		setSummaryOpen(true)
		setSummaryLoading(true)
		setSummaryText("")

		// Collect all messages
		const chatContent: string[] = []
		for (const turn of turns) {
			const userText = getUserText(turn.userMessage)
			if (userText) chatContent.push(`User: ${userText}`)
			for (const msg of turn.assistantMessages) {
				const parts = msg.parts.filter((p) => p.type === "text" && !p.synthetic) as Array<{ type: "text"; text: string }>
				const text = parts.map((p) => p.text).join("\n")
				if (text) chatContent.push(`Assistant: ${text}`)
			}
		}

		if (chatContent.length === 0) {
			setSummaryText("No messages to summarize.")
			setSummaryLoading(false)
			return
		}

		try {
			// Send summary request to OpenCode
			const response = await fetch("/global/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{
							role: "user",
							content: `Summarize this conversation in clear bullet points. Include:\n- Key topics discussed\n- Important decisions made\n- Action items or next steps\n- Any issues encountered and solutions\n\nConversation:\n${chatContent.join("\n\n")}`,
						},
					],
				}),
			})

			if (!response.ok) throw new Error("Failed to get summary")

			const reader = response.body?.getReader()
			const decoder = new TextDecoder()
			let summary = ""

			if (reader) {
				while (true) {
					const { done, value } = await reader.read()
					if (done) break
					const chunk = decoder.decode(value, { stream: true })
					// Parse SSE events
					const lines = chunk.split("\n")
					for (const line of lines) {
						if (line.startsWith("data: ")) {
							try {
								const data = JSON.parse(line.slice(6))
								if (data.type === "message" && data.content) {
									summary += data.content
									setSummaryText(summary)
								}
							} catch {
								// Skip malformed JSON
							}
						}
					}
				}
			}

			if (!summary) {
				setSummaryText("Could not generate summary. Please try again.")
			}
		} catch (err) {
			setSummaryText(`Error: ${err instanceof Error ? err.message : "Failed to generate summary"}`)
		} finally {
			setSummaryLoading(false)
		}
	}, [turns])

	return (
		<div className={cn("flex h-full min-w-0 flex-col overflow-hidden", godModeStyles)}>
			{/* Search bar */}
			{searchOpen && (
				<div className="flex items-center gap-2 border-b border-border px-4 py-2">
					<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
					<input
						ref={searchInputRef}
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search messages..."
						className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="text-muted-foreground/50 hover:text-muted-foreground"
						>
							<XIcon className="size-3" />
						</button>
					)}
					<button
						type="button"
						onClick={() => { setSearchOpen(false); setSearchQuery("") }}
						className="text-muted-foreground/50 hover:text-muted-foreground"
					>
						<kbd className="rounded border border-border px-1 py-0.5 text-[10px]">esc</kbd>
					</button>
				</div>
			)}
			{/* Inline code actions floating menu */}
			<InlineCodeActions
				onAction={(prompt, code) => {
					if (onSendMessage) {
						const fullPrompt = `${prompt}\n\n\`\`\`\n${code}\n\`\`\``
						onSendMessage(agent, fullPrompt)
					}
				}}
			/>
			{/* Chat messages -- constrained width for readability */}
			<div className="relative min-h-0 min-w-0 flex-1">
				<Conversation key={agent.sessionId} className="h-full scrollbar-auto">
					<ScrollOnLoad loading={loading} sessionId={agent.sessionId} />
					<ScrollBridge scrollRef={scrollRef} />
					<ConversationContent className="gap-10 px-0 py-2 sm:px-4 sm:py-6">
						<div className={cn(contentWidthClass, "space-y-10")}>
							{/* God Mode Dashboard (at the top of the scrollable chat area) */}
							{sessionEntry?.isGodMode && (
								<SmartSwarmDashboard 
									sessionId={agent.sessionId} 
									isWorking={isWorking}
								/>
							)}

							{/* Load earlier messages button */}
							{hasEarlierMessages && (
								<div className="flex justify-center pb-4">
									<button
										type="button"
										onClick={onLoadEarlier}
										disabled={loadingEarlier}
										className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
									>
										{loadingEarlier ? (
											<Loader2Icon className="size-3 animate-spin" />
										) : (
											<ChevronUpIcon className="size-3" />
										)}
										{loadingEarlier ? "Loading..." : "Load earlier messages"}
									</button>
								</div>
							)}

							{loading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
									<span className="ml-2 text-sm text-muted-foreground">Loading chat...</span>
								</div>
							) : turns.length > 0 ? (
								<VirtualMessageList
									turns={turns}
									isWorking={isWorking}
									onRevertToMessage={onRevertToMessage}
									handleSendNow={handleSendNow}
									handleDeleteTurn={handleDeleteTurn}
									onForkFromTurn={onForkFromTurn}
									onDeletePart={onDeletePart}
									isGodMode={sessionEntry?.isGodMode}
									onEditPrompt={handleEditPrompt}
									onRegenerate={handleRegenerate}
									searchQuery={searchQuery}
								/>
							) : setupPhase ? (
								<WorktreeSetupProgress phase={setupPhase} />
							) : (
								<div className="flex flex-col items-center justify-center py-16 px-4">
									<div className="mb-6 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20">
										<SkullIcon className="size-8 text-red-500" />
									</div>
									<h2 className="mb-2 text-xl font-semibold">Devil AI</h2>
									<p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
										Your AI coding assistant. Ask me anything about code, debugging, or building features.
									</p>
									<div className="grid w-full max-w-lg grid-cols-2 gap-3">
										{[
											{ text: "Explain this codebase", icon: "🔍" },
											{ text: "Fix a bug in my code", icon: "🐛" },
											{ text: "Add a new feature", icon: "✨" },
											{ text: "Refactor this function", icon: "♻️" },
										].map((suggestion) => (
											<button
												key={suggestion.text}
												type="button"
												onClick={() => onSendMessage?.(agent, suggestion.text)}
												className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors hover:bg-muted"
											>
												<span>{suggestion.icon}</span>
												<span>{suggestion.text}</span>
											</button>
										))}
									</div>
								</div>
							)}

							{/* Session-level error from session.error events */}
							{showSessionError && sessionErrorText && (
								<div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
									{sessionErrorText}
								</div>
							)}
						</div>
					</ConversationContent>
					<ScrollToResponseStart isWorking={isWorking} scrollRef={scrollRef} />
					<ConversationScrollButton />
				</Conversation>

				{/* Top fade */}
				<div
					data-slot="scroll-fade"
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-background/30 to-transparent"
				/>
				{/* Bottom fade */}
				<div
					data-slot="scroll-fade"
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-background/30 to-transparent"
				/>
			</div>


			{/* Bottom input section — hidden during worktree setup since the stub session
			   cannot accept prompts yet. Extracted into its own component so toolbar,
			   popover, mention, and model-selection state changes don't re-render the
			   conversation turn list above. */}
			{!setupPhase && (
				<ChatInputSection
					agent={agent}
					turns={turns}
					isConnected={isConnected}
					isWorking={isWorking}
					onSendMessage={onSendMessage}
					onStop={onStop}
					providers={providers}
					config={config}
					vcs={vcs}
					openCodeAgents={openCodeAgents}
					onApprove={handleApprovePermission}
					onDeny={handleDenyPermission}
					onReplyQuestion={onReplyQuestion}
					onRejectQuestion={onRejectQuestion}
					canRedo={canRedo}
					onUndo={onUndo}
					onRedo={onRedo}
					isReverted={isReverted}
					scrollRef={scrollRef}
					reviewPanelOpen={reviewPanelOpen}
					onForkFromTurn={onForkFromTurn}
					inputControllerRef={inputControllerRef}
					onExportChat={handleExportChat}
					onSearch={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 0) }}
					onSummarize={handleSummarize}
				/>
			)}

			{/* Chat Summary Dialog */}
			{summaryOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-2xl rounded-lg border border-border bg-background p-6 shadow-lg">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold">Chat Summary</h2>
							<button
								type="button"
								onClick={() => setSummaryOpen(false)}
								className="text-muted-foreground hover:text-foreground"
							>
								<XIcon className="size-5" />
							</button>
						</div>
						<div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
							{summaryLoading && !summaryText && (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Loader2Icon className="size-4 animate-spin" />
									<span>Generating summary...</span>
								</div>
							)}
							{summaryText && (
								<div className="whitespace-pre-wrap text-sm">{summaryText}</div>
							)}
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(summaryText)
								}}
								className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
							>
								Copy
							</button>
							<button
								type="button"
								onClick={() => setSummaryOpen(false)}
								className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// ============================================================
// ChatInputSection — owns all input/toolbar/popover/mention state
// ============================================================

interface ChatInputSectionProps {
	agent: Agent
	turns: ChatTurn[]
	isConnected: boolean
	isWorking: boolean
	onSendMessage?: ChatViewProps["onSendMessage"]
	onStop?: ChatViewProps["onStop"]
	providers?: ProvidersData | null
	config?: ConfigData | null
	vcs?: VcsData | null
	openCodeAgents?: SdkAgent[]
	onApprove?: (
		agent: Agent,
		permissionSessionId: string,
		permissionId: string,
		response?: "once" | "always",
	) => Promise<void>
	onDeny?: (agent: Agent, permissionSessionId: string, permissionId: string) => Promise<void>
	onReplyQuestion?: ChatViewProps["onReplyQuestion"]
	onRejectQuestion?: ChatViewProps["onRejectQuestion"]
	canRedo?: boolean
	onUndo?: () => Promise<string | undefined>
	onRedo?: () => Promise<void>
	isReverted?: boolean
	scrollRef: React.RefObject<ScrollHandle | null>
	reviewPanelOpen?: boolean
	/** Fork the current session (full fork, no cutoff) */
	onForkFromTurn?: (messageId?: string) => Promise<void>
	/** Expose input controller (setText/getText) to parent */
	inputControllerRef?: React.RefObject<{ setText: (text: string) => void; getText: () => string } | null>
	/** Export chat as markdown */
	onExportChat?: () => void
	/** Open search */
	onSearch?: () => void
	/** Generate chat summary */
	onSummarize?: () => void
}

function ChatInputSection({
	agent,
	turns,
	isConnected,
	isWorking: isWorkingProp,
	onSendMessage,
	onStop,
	providers,
	config,
	vcs,
	openCodeAgents,
	onApprove,
	onDeny,
	onReplyQuestion,
	onRejectQuestion,
	canRedo,
	onUndo,
	onRedo,
	isReverted,
	scrollRef,
	reviewPanelOpen,
	onForkFromTurn,
	inputControllerRef,
	onExportChat,
	onSearch,
	onSummarize,
}: ChatInputSectionProps) {
	const [sending, setSending] = useState(false)
	const isWorking = isWorkingProp || sending
	const isSubActive = useSubscriptionStatus()
	const navigate = useNavigate()

	// Tree-scoped interactive requests — bubbles up from sub-agent sessions.
	// These replace the direct `agent.permissions` / `agent.questions` arrays
	// so the parent session's UI can respond on behalf of any descendant.
	const effectivePermission = useAtomValue(effectivePermissionFamily(agent.sessionId))
	const effectiveQuestion = useAtomValue(effectiveQuestionFamily(agent.sessionId))

	// Diff comments integration
	const diffComments = useAtomValue(diffCommentsFamily(agent.sessionId))
	const setDiffComments = useSetAtom(diffCommentsFamily(agent.sessionId))

	// Feature Toggles (God Mode, Sandbox)
	const sessionEntry = useAtomValue(sessionFamily(agent.sessionId))
	const setGodMode = useSetAtom(setSessionGodModeAtom)
	const setSandbox = useSetAtom(setSessionSandboxAtom)

	// Work time split for the current (last) turn — used for the live timer on the submit button.
	const currentTurnWorkSplit = useMemo(() => {
		if (!isWorking || turns.length === 0) return null
		const lastTurn = turns[turns.length - 1]
		if (lastTurn.assistantMessages.length === 0) return null
		return computeTurnWorkTimeSplit(lastTurn)
	}, [isWorking, turns])

	// Mention tracking — files and agents referenced via @
	const [mentions, setMentions] = useState<PromptMention[]>([])

	// Reset mentions when session changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — clear on session switch
	useEffect(() => {
		setMentions([])
	}, [agent.sessionId])

	// Stable callbacks for question/permission handlers
	const handleReplyQuestion = useCallback(
		async (requestId: string, answers: QuestionAnswer[]) => {
			await onReplyQuestion?.(agent, requestId, answers)
			requestAnimationFrame(() => {
				scrollRef.current?.forceScrollToBottom()
			})
		},
		[onReplyQuestion, agent, scrollRef],
	)

	const handleRejectQuestion = useCallback(
		async (requestId: string) => {
			await onRejectQuestion?.(agent, requestId)
			requestAnimationFrame(() => {
				scrollRef.current?.forceScrollToBottom()
			})
		},
		[onRejectQuestion, agent, scrollRef],
	)

	// Draft persistence
	const draft = useDraftSnapshot(agent.sessionId)
	const { setDraft, clearDraft } = useDraftActions(agent.sessionId)

	// Escape-to-abort: double-press within 3s
	const [interruptCount, setInterruptCount] = useState(0)
	const interruptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Toolbar state
	const [selectedModel, setSelectedModel] = useState<ModelRef | null>(null)
	const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
	const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined)

	// Initialize model, variant, and agent from the session's last user message.
	// Read imperatively via appStore.get() instead of subscribing reactively —
	// this avoids re-rendering ChatInputSection on every streaming delta.
	const projectModels = useAtomValue(projectModelsAtom)
	const initializedForSessionRef = useRef<string | null>(null)
	const resetForSessionRef = useRef<string | null>(null)
	useEffect(() => {
		if (resetForSessionRef.current !== agent.sessionId) {
			resetForSessionRef.current = agent.sessionId
			initializedForSessionRef.current = null
			const stored = agent.directory ? projectModels[agent.directory] : undefined
			if (stored?.providerID && stored?.modelID) {
				setSelectedModel(stored)
				setSelectedVariant(stored.variant)
			} else {
				setSelectedModel(null)
				setSelectedVariant(undefined)
			}
			setSelectedAgent(stored?.agent || null)
		}

		if (initializedForSessionRef.current === agent.sessionId) return
		const sessionMessages = appStore.get(messagesFamily(agent.sessionId))
		if (!sessionMessages || sessionMessages.length === 0) return
		initializedForSessionRef.current = agent.sessionId

		let foundModel = false
		let foundAgent = false
		for (let i = sessionMessages.length - 1; i >= 0; i--) {
			const msg = sessionMessages[i]
			if (msg.role !== "user") continue
			const dynamic = msg as Record<string, unknown>

			if (!foundModel && "model" in msg && msg.model) {
				const model = msg.model as { providerID: string; modelID: string }
				if (model.providerID && model.modelID) {
					setSelectedModel(model)
					foundModel = true
					const variant = dynamic.variant as string | undefined
					if (variant) {
						setSelectedVariant(variant)
					} else {
						setSelectedVariant(undefined)
					}
				}
			}

			if (
				!foundAgent &&
				dynamic.agent &&
				typeof dynamic.agent === "string" &&
				dynamic.agent.length > 0
			) {
				setSelectedAgent(dynamic.agent)
				foundAgent = true
			}

			if (foundModel && foundAgent) break
		}
	}, [agent.sessionId, agent.directory, projectModels])

	const { recentModels, addRecent: addRecentModel } = useModelState()

	const activeOpenCodeAgent = useMemo(() => {
		const agentName = selectedAgent ?? config?.defaultAgent
		return openCodeAgents?.find((a) => a.name === agentName) ?? null
	}, [selectedAgent, config?.defaultAgent, openCodeAgents])

	const effectiveModel = useMemo(
		() =>
			resolveEffectiveModel(
				selectedModel,
				activeOpenCodeAgent,
				config?.model,
				providers?.defaults ?? {},
				providers?.providers ?? [],
			),
		[selectedModel, activeOpenCodeAgent, config?.model, providers],
	)

	useEffect(() => {
		if (!selectedVariant || !effectiveModel || !providers) return
		const available = getModelVariants(
			effectiveModel.providerID,
			effectiveModel.modelID,
			providers.providers,
		)
		if (!available.includes(selectedVariant)) {
			setSelectedVariant(undefined)
		}
	}, [selectedVariant, effectiveModel, providers])

	const modelCapabilities = useMemo(
		() => getModelInputCapabilities(effectiveModel, providers?.providers ?? []),
		[effectiveModel, providers],
	)

	const handleModelSelect = useCallback(
		(model: ModelRef | null) => {
			setSelectedModel(model)
			setSelectedVariant(undefined)
			if (model) addRecentModel(model)
		},
		[addRecentModel],
	)

	const slashCommandRef = useRef<{
		setText: (text: string) => void
		getText: () => string
	} | null>(null)

	// Expose input controller to parent via ref
	useEffect(() => {
		if (inputControllerRef) {
			inputControllerRef.current = slashCommandRef.current
		}
	})

	const handleSlashCommand = useCallback(
		async (text: string): Promise<boolean> => {
			const trimmed = text.trim()
			if (!trimmed.startsWith("/")) return false

			const spaceIndex = trimmed.indexOf(" ")
			const cmdName = spaceIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIndex)
			const cmdArgs = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1).trim()

			// Client-only commands that don't go through the server
			switch (cmdName.toLowerCase()) {
				case "undo":
					if (onUndo) await onUndo()
					return true
				case "redo":
					if (onRedo) await onRedo()
					return true
				case "compact":
				case "summarize":
					if (agent.directory && effectiveModel) {
						const client = getProjectClient(agent.directory)
						if (client) {
							try {
								await client.session.summarize({
									sessionID: agent.sessionId,
									providerID: effectiveModel.providerID,
									modelID: effectiveModel.modelID,
								})
							} catch (err) {
								log.error("session.summarize failed", { sessionId: agent.sessionId }, err)
							}
						}
					}
					return true
				default:
					break
			}

			if (agent.directory) {
				const client = getProjectClient(agent.directory)
				if (client) {
					try {
						await client.session.command({
							sessionID: agent.sessionId,
							command: cmdName,
							arguments: cmdArgs,
						})
						return true
					} catch {
						// Not a recognized server command
					}
				}
			}

			return false
		},
		[agent, onUndo, onRedo, effectiveModel],
	)

	const [addedMCPs, setAddedMCPs] = useState<Array<{ id: string; name: string }>>([])

	const handleSend = useCallback(
		async (text: string, files?: FileAttachment[]) => {
			log.debug("handleSend called", {
				textLength: text.trim().length,
				hasOnSendMessage: !!onSendMessage,
				sending,
				sessionId: agent.sessionId,
			})
			if (!text.trim() || !onSendMessage || sending) {
				log.warn("handleSend bailed", {
					emptyText: !text.trim(),
					noOnSendMessage: !onSendMessage,
					sending,
				})
				return
			}

			// Optimistic update: show user message IMMEDIATELY (before any async work)
			const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
			const optimisticMsg = {
				id: optimisticId,
				sessionID: agent.sessionId,
				role: "user" as const,
				time: { created: Date.now() },
				agent: selectedAgent || "build",
				model: effectiveModel ?? { providerID: "", modelID: "" },
			}
			appStore.set(upsertMessageAtom, optimisticMsg as any)
			appStore.set(partsFamily(optimisticId), [{
				id: `${optimisticId}-text`,
				sessionID: agent.sessionId,
				messageID: optimisticId,
				type: "text",
				text: text.trim(),
			}])

			if (text.trim().startsWith("/")) {
				const handled = await handleSlashCommand(text)
				if (handled) {
					slashCommandRef.current?.setText("")
					clearDraft()
					setMentions([])
					return
				}
			}

			// Detect required MCPs before sending
			const mcpDetection = detectRequiredMCPs(text)
			const requiredMCPs = mcpDetection.servers
			if (requiredMCPs.length > 0) {
				// Check which MCPs are not yet added
				const newMCPs = requiredMCPs.filter(
					(mcp) => !addedMCPs.some((added) => added.id === mcp.id)
				)
				
				if (newMCPs.length > 0) {
					// Auto-add MCP servers
					for (const mcp of newMCPs) {
						try {
							if (mcp.github) {
								await window.devilAi.pluginInstaller.install(mcp.github, "mcp")
								setAddedMCPs((prev) => [...prev, { id: mcp.id, name: mcp.name }])
								log.info("Auto-added MCP server", { server: mcp.name })
							}
						} catch (err) {
							log.error("Failed to auto-add MCP server", { server: mcp.name }, err)
						}
					}
				}
			}

			setSending(true)
			try {
				// Check if model is available
				if (!effectiveModel) {
					log.warn("No model available - showing error to user")
					toast.error("No model selected. Please select a model from the toolbar above before sending a message.")
					setSending(false)
					return
				}

				if (agent.directory) {
					appStore.set(setProjectModelAtom, {
						directory: agent.directory,
						model: {
							...effectiveModel,
							variant: selectedVariant,
							agent: selectedAgent || undefined,
						},
					})
				}

				log.debug("handleSend calling onSendMessage", {
					sessionId: agent.sessionId,
					directory: agent.directory,
					model: effectiveModel,
					agentName: selectedAgent,
					variant: selectedVariant,
					hasFiles: !!(files && files.length > 0),
				})

				// Prepend diff comments as structured context if any exist
				const commentPrefix = serializeCommentsForChat(diffComments)
				const finalText = commentPrefix ? `${commentPrefix}${text.trim()}` : text.trim()

				await onSendMessage(agent, finalText, {
					model: effectiveModel ?? undefined,
					agentName: selectedAgent || undefined,
					variant: selectedVariant,
					files,
					isGodMode: sessionEntry?.isGodMode,
				})
				log.debug("handleSend onSendMessage completed", { sessionId: agent.sessionId })
				clearDraft()
				setMentions([])
				// Clear diff comments after successful send
				if (diffComments.length > 0) {
					setDiffComments([])
				}
				// Force scroll to bottom after sending — even if user was scrolled up
				requestAnimationFrame(() => {
					scrollRef.current?.forceScrollToBottom()
				})
			} catch (err) {
				log.error("handleSend failed", { sessionId: agent.sessionId }, err)
			} finally {
				setSending(false)
			}
		},
		[
			onSendMessage,
			sending,
			agent,
			effectiveModel,
			selectedAgent,
			selectedVariant,
			clearDraft,
			handleSlashCommand,
			scrollRef,
			diffComments,
			setDiffComments,
			addedMCPs,
		],
	)

	const canSend = isConnected && !sending

	const handleStop = useCallback(() => {
		if (onStop && isWorking) {
			onStop(agent)
		}
	}, [onStop, isWorking, agent])

	const handleEscapeAbort = useCallback(() => {
		if (!isWorking) return

		setInterruptCount((prev) => {
			const next = prev + 1
			if (next >= 2) {
				handleStop()
				if (interruptTimerRef.current) clearTimeout(interruptTimerRef.current)
				return 0
			}
			if (interruptTimerRef.current) clearTimeout(interruptTimerRef.current)
			interruptTimerRef.current = setTimeout(() => setInterruptCount(0), 3000)
			return next
		})
	}, [isWorking, handleStop])

	// Cleanup interrupt timer on unmount
	useEffect(() => {
		return () => {
			if (interruptTimerRef.current) clearTimeout(interruptTimerRef.current)
		}
	}, [])

	// --- Popover state (slash commands + mentions) ---
	const [slashOpen, setSlashOpen] = useState(false)
	const [slashQuery, setSlashQuery] = useState("")
	const [mentionOpen, setMentionOpen] = useState(false)
	const [mentionQuery, setMentionQuery] = useState("")

	// --- Skills picker dialog ---
	const [skillsDialogOpen, setSkillsDialogOpen] = useState(false)

	// --- Jarvis Voice Overlay ---
	const [showJarvis, setShowJarvis] = useState(false)
	const latestTurn = turns[turns.length - 1]
	const latestAssistantMessages = latestTurn?.assistantMessages || []
	const latestReply = latestAssistantMessages[latestAssistantMessages.length - 1]?.parts.map((p) => ("text" in p ? p.text : "") || "").join("") || ""

	const handleForkViaSlash = useCallback(async () => {
		const ctrl = slashCommandRef.current
		if (ctrl) ctrl.setText("")
		await onForkFromTurn?.()
	}, [onForkFromTurn])

	const handleSkillsOpen = useCallback(() => {
		const ctrl = slashCommandRef.current
		if (ctrl) ctrl.setText("")
		setSkillsDialogOpen(true)
	}, [])

	const handleSkillSelect = useCallback((skillName: string) => {
		const ctrl = slashCommandRef.current
		if (ctrl) {
			ctrl.setText(`/${skillName} `)
		}
		requestAnimationFrame(() => {
			const ta = document.querySelector<HTMLTextAreaElement>("textarea[data-prompt-input]")
			if (ta) {
				ta.focus()
				const len = `/${skillName} `.length
				ta.setSelectionRange(len, len)
			}
		})
	}, [])

	const slashPopoverRef = useRef<SlashCommandPopoverHandle>(null)
	const mentionPopoverRef = useRef<MentionPopoverHandle>(null)

	const handleSlashTriggerChange = useCallback((open: boolean, query: string) => {
		setSlashOpen(open)
		setSlashQuery(query)
	}, [])

	const handleMentionTriggerChange = useCallback((open: boolean, query: string) => {
		setMentionOpen(open)
		setMentionQuery(query)
	}, [])

	const handleSlashClose = useCallback(() => {
		setSlashOpen(false)
		setSlashQuery("")
	}, [])

	const handleMentionClose = useCallback(() => {
		setMentionOpen(false)
		setMentionQuery("")
	}, [])

	const handleSlashSelect = useCallback(
		(command: string) => {
			handleSlashClose()
			const ctrl = slashCommandRef.current
			// Use the command string directly instead of setText + getText round-trip,
			// which races with React's asynchronous state batching and sometimes reads
			// stale text (e.g. "/un" instead of "/undo").
			if (command.startsWith("/")) {
				handleSlashCommand(command).then((handled) => {
					if (handled) {
						if (ctrl) ctrl.setText("")
						clearDraft()
					} else if (ctrl) {
						// Not a recognized command — leave it in the input for the user
						ctrl.setText(command)
					}
				})
			} else if (ctrl) {
				ctrl.setText(command)
			}
		},
		[handleSlashClose, handleSlashCommand, clearDraft],
	)

	const handleMentionSelect = useCallback(
		(option: MentionOption) => {
			handleMentionClose()
			const ctrl = slashCommandRef.current
			if (!ctrl) return

			const currentText = ctrl.getText()
			const textarea = document.querySelector<HTMLTextAreaElement>("textarea[data-prompt-input]")
			const cursorPos = textarea?.selectionStart ?? currentText.length

			const mention =
				option.type === "file" ? createFileMention(option.path) : createAgentMention(option.name)

			const { text: newText, cursorPosition: newCursor } = insertMentionIntoText(
				currentText,
				cursorPos,
				mention,
			)

			ctrl.setText(newText)

			setMentions((prev) => {
				const key = mention.type === "file" ? `file:${mention.path}` : `agent:${mention.name}`
				if (prev.some((m) => (m.type === "file" ? `file:${m.path}` : `agent:${m.name}`) === key))
					return prev
				return [...prev, mention]
			})

			requestAnimationFrame(() => {
				const ta = document.querySelector<HTMLTextAreaElement>("textarea[data-prompt-input]")
				if (ta) {
					ta.focus()
					ta.setSelectionRange(newCursor, newCursor)
				}
			})
		},
		[handleMentionClose],
	)

	const handleMentionRemove = useCallback((mention: PromptMention) => {
		const ctrl = slashCommandRef.current
		if (ctrl) {
			const marker = getMentionMarker(mention)
			const currentText = ctrl.getText()
			ctrl.setText(currentText.replace(`${marker} `, "").replace(marker, ""))
		}
		setMentions((prev) => {
			const key = mention.type === "file" ? `file:${mention.path}` : `agent:${mention.name}`
			return prev.filter((m) => (m.type === "file" ? `file:${m.path}` : `agent:${m.name}`) !== key)
		})
	}, [])

	const handleTextareaKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			// Always delegate to popovers first — they guard on their own `open` prop
			// internally, so we don't need to check slashOpen/mentionOpen here.
			// This avoids stale-closure issues where the parent's boolean lags behind
			// the popover's actual state (due to async TriggerDetector effects).
			if (slashPopoverRef.current?.handleKeyDown(e)) return
			if (mentionPopoverRef.current?.handleKeyDown(e)) return

			if (e.key === "Escape") {
				handleEscapeAbort()
			}
		},
		[handleEscapeAbort],
	)

	// Width constraint class: remove max-w when review panel is open
	const inputWidthClass = reviewPanelOpen
		? "mx-auto w-full min-w-0"
		: "mx-auto w-full min-w-0 max-w-4xl"

	return (
		<>
			{showJarvis && (
				<JarvisVoiceOverlay
					onClose={() => setShowJarvis(false)}
					onSubmitCommand={(text) => handleSend(text)}
					latestReply={latestReply}
					isWorking={isWorking}
				/>
			)}
			<div className="min-w-0 px-0 pb-0 pt-1 sm:px-4 sm:pb-4 sm:pt-2">
				<div className={inputWidthClass}>
					{/* Session task list — collapsible todo progress */}
					<SessionTaskList sessionId={agent.sessionId} />

					{/* Revert banner — shown when session is in undo state */}
					{isReverted && (
						<div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400">
							<Undo2Icon className="size-3.5 shrink-0" />
							<span className="flex-1">
								Session reverted — type to continue from here, or redo to restore
							</span>
							{canRedo && onRedo && (
								<button
									type="button"
									onClick={() => onRedo()}
									className="flex items-center gap-1 rounded-md bg-amber-200/60 px-2 py-1 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
								>
									<Redo2Icon className="size-3" />
									Redo
								</button>
							)}
						</div>
					)}

					{/* Pending permissions — tree-scoped: shows own OR any sub-agent's permission */}
					{effectivePermission && (
						<div className="pb-2">
							<PermissionItem
								key={effectivePermission.request.id}
								agent={agent}
								permission={effectivePermission.request}
								onApprove={onApprove}
								onDeny={onDeny}
								isConnected={isConnected}
								isFromSubAgent={effectivePermission.sessionId !== agent.sessionId}
							/>
						</div>
					)}

					{/* When questions are pending, render a global blocking modal over the entire screen. */}
					{effectiveQuestion && (
						<div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
							<div className="max-w-xl w-full shadow-2xl rounded-xl ring-1 ring-border/50">
								<ChatQuestionFlow
									questions={[effectiveQuestion.request]}
									isFromSubAgent={effectiveQuestion.sessionId !== agent.sessionId}
									onReply={handleReplyQuestion}
									onReject={handleRejectQuestion}
									disabled={!isConnected}
								/>
							</div>
						</div>
					)}

					{/* Input card — PromptInputProvider wraps everything,
					    popovers positioned relative to the card wrapper,
					    textarea as a direct child of InputGroup inside PromptInput */}
					{!isSubActive ? (
						<div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm p-8 mx-4 mb-4">
							<DevilAiWordmark className="h-6 w-auto text-foreground opacity-50 mb-4" />
							<h2 className="text-xl font-semibold">Subscription Required</h2>
							<p className="text-muted-foreground text-center max-w-md">
								Your subscription is not active or has expired. Please purchase a subscription to continue using Devil AI.
							</p>
							<Button onClick={() => navigate({ to: "/settings/account" })}>
								View Plans
							</Button>
						</div>
					) : (
						<PromptInputProvider key={agent.sessionId} initialInput={draft}>
							<DraftSync setDraft={setDraft} />
							<SlashCommandBridge controllerRef={slashCommandRef} />
							<TriggerDetector
								onSlashChange={handleSlashTriggerChange}
								onMentionChange={handleMentionTriggerChange}
							/>
							<MentionReconciler mentions={mentions} onReconcile={setMentions} />
							{/* Relative wrapper for absolutely-positioned popovers */}
							<div className="relative">
								{/* Popovers render above the card via bottom-full */}
							<SlashCommandPopover
								ref={slashPopoverRef}
								query={slashQuery}
								open={slashOpen}
								enabled={isConnected}
								directory={agent.directory}
								onSelect={handleSlashSelect}
								onSkillsOpen={handleSkillsOpen}
								onFork={handleForkViaSlash}
								onClose={handleSlashClose}
							/>
								<MentionPopover
									ref={mentionPopoverRef}
									query={mentionQuery}
									open={mentionOpen}
									directory={agent.directory}
									agents={openCodeAgents ?? []}
									onSelect={handleMentionSelect}
									onClose={handleMentionClose}
								/>
							<PromptInput
								className="rounded-xl has-[[data-slot=input-group-control]:focus-visible]:border-input has-[[data-slot=input-group-control]:focus-visible]:ring-0"
									accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
									multiple
									maxFileSize={10 * 1024 * 1024}
									onSubmit={(message) => {
										if (message.text.trim() && canSend)
											handleSend(message.text, message.files.length > 0 ? message.files : undefined)
									}}
								>
									{/* Mention chips above the textarea */}
									<ContextItems mentions={mentions} onRemove={handleMentionRemove} />
									{/* Diff comment chips above the textarea */}
									{diffComments.length > 0 && (
										<DiffCommentChips
											comments={diffComments}
											onRemove={(id) => setDiffComments((prev) => prev.filter((c) => c.id !== id))}
										/>
									)}
									<PromptAttachmentPreview
										supportsImages={modelCapabilities?.image}
										supportsPdf={modelCapabilities?.pdf}
									/>
									<PromptInputTextarea
										data-prompt-input
										onKeyDown={handleTextareaKeyDown}
										disabled={!isConnected}
										placeholder={
											isWorking ? "Send a follow-up message..." : "What would you like to do?"
										}
									/>

									{/* Toolbar inside the card — agent + model + variant selectors + submit */}
									<PromptInputFooter>
										<PromptInputTools>
											<AttachButton disabled={!isConnected} />
											<VoicePairProgrammingButton disabled={!isConnected} />
											{/* <Tooltip>
												<TooltipTrigger render={
													<button
														type="button"
														onClick={() => setShowJarvis(true)}
														disabled={!isConnected}
														className="flex h-7 items-center justify-center rounded-md px-2 text-primary hover:bg-primary/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
													>
														<AudioWaveformIcon className="size-4 shrink-0" />
													</button>
												} />
												<TooltipContent side="top">Jarvis Voice Mode</TooltipContent>
											</Tooltip> */}
											<PromptToolbar
												agents={openCodeAgents ?? []}
												selectedAgent={selectedAgent}
												defaultAgent={config?.defaultAgent}
												onSelectAgent={setSelectedAgent}
												providers={providers ?? null}
												effectiveModel={effectiveModel}
												hasModelOverride={!!selectedModel}
												onSelectModel={handleModelSelect}
												recentModels={recentModels}
												selectedVariant={selectedVariant}
												onSelectVariant={setSelectedVariant}
												isGodMode={sessionEntry?.isGodMode}
												onToggleGodMode={(val) => setGodMode({ sessionId: agent.sessionId, isGodMode: val })}
												isSandbox={sessionEntry?.isSandbox}
												onToggleSandbox={(val) => setSandbox({ sessionId: agent.sessionId, isSandbox: val })}
												disabled={!isConnected}
											/>
										</PromptInputTools>
										<PromptInputSubmit
											disabled={!canSend}
											status={isWorking ? "streaming" : undefined}
											onStop={handleStop}
											size={isWorking && currentTurnWorkSplit ? "xs" : "icon-sm"}
											variant={isWorking && currentTurnWorkSplit ? "ghost" : "default"}
										>
											{isWorking && currentTurnWorkSplit ? (
												<LiveTurnTimer
													completedMs={currentTurnWorkSplit.completedMs}
													activeStartMs={currentTurnWorkSplit.activeStartMs}
												/>
											) : undefined}
										</PromptInputSubmit>
									</PromptInputFooter>
								</PromptInput>
							</div>
						</PromptInputProvider>
					)}

				{/* Status bar — outside the card */}
				<StatusBar
					vcs={vcs ?? null}
					isConnected={isConnected}
					isWorking={isWorking}
					interruptCount={interruptCount}
					sessionId={agent.sessionId}
					providers={providers}
					compaction={config?.compaction}
					onExportChat={onExportChat}
					onSearch={onSearch}
					onSummarize={onSummarize}
					extraSlot={
						agent.worktreePath ? (
							<div className="flex items-center gap-1">
								<GitForkIcon className="size-3" />
								<span>Worktree</span>
							</div>
						) : (
							<div className="flex items-center gap-1">
								<MonitorIcon className="size-3" />
								<span>Local</span>
							</div>
						)
					}
				/>
			<PonytailReviewWrapper sessionId={agent.sessionId} />
			</div>
		</div>



		{/* Skills picker dialog — triggered by /skills command */}
			<SkillPickerDialog
				open={skillsDialogOpen}
				onOpenChange={setSkillsDialogOpen}
				directory={agent.directory}
				onSelect={handleSkillSelect}
			/>
		</>
	)
}


