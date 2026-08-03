import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@devil-ai/ui/components/ai-elements/message"
import {
	Reasoning,
	ReasoningContent,
	ReasoningText,
	ReasoningTrigger,
} from "@devil-ai/ui/components/ai-elements/reasoning"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@devil-ai/ui/components/dialog"

import {
	ArrowUpToLineIcon,
	BotIcon,
	CheckIcon,
	ChevronDownIcon,
	CopyIcon,
	FileIcon,
	GitForkIcon,
	ListOrderedIcon,
	Loader2Icon,
	PencilIcon,
	RotateCcwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	SendIcon,
	Undo2Icon,
	XIcon,
} from "lucide-react"
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useDisplayMode } from "../../hooks/use-agents"
import type { ChatMessageEntry, ChatTurn as ChatTurnType } from "../../hooks/use-session-chat"
import {
	computeTurnCost,
	computeTurnWorkTime,
	formatCost,
	formatWorkDuration,
	shortModelName,
} from "../../lib/session-metrics"
import type { FilePart, Part, ReasoningPart, TextPart, ToolPart } from "../../lib/types"
import { ChatToolCall, getToolInfo, getToolSubtitle } from "./chat-tool-call"
import { ThinkingIndicator } from "./thinking-indicator"
import { getToolCategory, TOOL_CATEGORY_COLORS, type ToolCategory } from "./tool-card"
import { PlugIcon, SparklesIcon } from "lucide-react"

// ============================================================
// Skills & MCP Usage Display Component
// ============================================================

interface SkillsMCPDisplayProps {
	parts: Part[]
}

function SkillsMCPDisplay({ parts }: SkillsMCPDisplayProps) {
	// Detect if Ponytail is actually being used (from skill tool calls)
	const ponytailUsed = useMemo(() => {
		const toolParts = parts.filter((p): p is ToolPart => p.type === "tool")
		return toolParts.some((p) =>
			p.tool === "skill" &&
			typeof p.state.input?.name === "string" &&
			p.state.input.name.toLowerCase().includes("ponytail")
		)
	}, [parts])

	// Also check if ponytail rules were injected into text
	const ponytailInText = useMemo(() => {
		const textParts = parts.filter((p): p is TextPart => p.type === "text")
		return textParts.some((p) =>
			p.text.includes("ponytail") || p.text.includes("Ponytail") || p.text.includes("YAGNI")
		)
	}, [parts])

	// Detect if CodeGraph is actually being used (from tool calls)
	const codegraphUsed = useMemo(() => {
		const toolParts = parts.filter((p): p is ToolPart => p.type === "tool")
		return toolParts.some((p) =>
			p.tool === "codegraph_explore" ||
			p.tool === "codegraph_search" ||
			p.tool === "codegraph_definition" ||
			p.tool === "codegraph_references" ||
			p.tool === "codegraph_query"
		)
	}, [parts])

	// Extract auto-detected skills from text parts
	const skills = useMemo(() => {
		const textParts = parts.filter((p): p is TextPart => p.type === "text")
		const detectedSkills: string[] = []

		for (const part of textParts) {
			const text = part.text
			const skillMatches = text.match(/## Auto-Detected Skills[\s\S]*?(?=##|$)/)
			if (skillMatches) {
				const skillSection = skillMatches[0]
				const skillNames = skillSection.match(/### (\w[\w-]*)/g)
				if (skillNames) {
					for (const name of skillNames) {
						detectedSkills.push(name.replace("### ", ""))
					}
				}
			}
		}
		return detectedSkills.slice(0, 5)
	}, [parts])

	// Extract MCP servers from tool calls
	const mcpServers = useMemo(() => {
		const toolParts = parts.filter((p): p is ToolPart => p.type === "tool")
		const servers: string[] = []

		for (const part of toolParts) {
			if (part.tool === "mcp") {
				const serverName = part.state.input?.server as string | undefined
				if (serverName && !servers.includes(serverName)) {
					servers.push(serverName)
				}
			}
		}
		return servers.slice(0, 3)
	}, [parts])

	// Don't render if nothing is actually being used
	if (!ponytailUsed && !ponytailInText && !codegraphUsed && skills.length === 0 && mcpServers.length === 0) {
		return null
	}

	const isAnySkillActive = ponytailUsed || ponytailInText || codegraphUsed || skills.length > 0

	return (
		<div className="flex items-center gap-2">
			{/* Spinner with status text when skills are active */}
			{isAnySkillActive && (
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<Loader2Icon className="size-3 animate-spin text-primary/60" />
					<span className="text-muted-foreground/80">Processing your request...</span>
				</div>
			)}

			{/* Skill badges */}
			<div className="flex flex-wrap gap-1.5 text-[11px]">
				{/* Ponytail - only when actually used */}
				{ponytailUsed && (
					<span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-green-600 dark:text-green-400">
						<SparklesIcon className="size-2.5" />
						Ponytail (Minimal Code)
					</span>
				)}

				{/* CodeGraph - only when actually used */}
				{codegraphUsed && (
					<span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-600 dark:text-orange-400">
						<SparklesIcon className="size-2.5" />
						CodeGraph (Code Intelligence)
					</span>
				)}

				{/* Detected skills */}
				{skills.map((skill) => (
					<span
						key={skill}
						className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-600 dark:text-purple-400"
					>
						<SparklesIcon className="size-2.5" />
						{skill}
					</span>
				))}

				{/* MCP servers */}
				{mcpServers.map((server) => (
					<span
						key={server}
						className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600 dark:text-blue-400"
					>
						<PlugIcon className="size-2.5" />
						{server}
					</span>
				))}
			</div>
		</div>
	)
}

// ============================================================
// Utility functions
// ============================================================

/**
 * Formats a timestamp (milliseconds) to relative or absolute time.
 */
export function formatTimestamp(ms: number): string {
	const date = new Date(ms)
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// ============================================================
// Status computation — follows into sub-agents
// ============================================================

/**
 * Claude Code CLI-style status labels — short "verb + target" strings
 * ("Reading package.json", "Running npm test"). Derived from the last active
 * part, following into sub-agents for deeper status. The trailing ellipsis is
 * rendered by the ThinkingIndicator, so labels never include one.
 */
function lastSegment(path: string): string {
	const parts = path.replace(/\\/g, "/").split("/").filter(Boolean)
	return parts.length > 1 ? parts[parts.length - 1] : path
}

/** Collapse a command to a single-line label, truncated for tight rows. */
function shortenCommand(command: string): string {
	const oneLine = command.replace(/\s+/g, " ").trim()
	return oneLine.length > 32 ? `${oneLine.slice(0, 29)}…` : oneLine
}

/** Host portion of a URL — used for "Fetching <host>". */
function urlHost(url: string): string {
	try {
		return new URL(url).host
	} catch {
		return url
	}
}

function computeStatus(parts: Part[]): string {
	// No activity yet — the model is still booting the reply.
	if (parts.length === 0) return "Warming up"
	for (let i = parts.length - 1; i >= 0; i--) {
		const part = parts[i]
		if (part.type === "tool") {
			switch (part.tool) {
				case "task": {
					// Show what the sub-agent is actually doing
					const desc = part.state.input?.description as string | undefined
					const shortDesc = desc && desc.length > 30 ? `${desc.slice(0, 27)}…` : desc
					return shortDesc ? `Agent: ${shortDesc}` : "Delegating"
				}
				case "todowrite":
				case "todoread":
					return "Planning"
				case "read": {
					const path = (part.state.input?.filePath as string) ?? (part.state.input?.path as string)
					return path ? `Reading ${lastSegment(path)}` : "Reading file"
				}
				case "list":
					return "Listing files"
				case "grep":
					return "Searching"
				case "glob":
					return "Finding files"
				case "webfetch": {
					const url = part.state.input?.url as string | undefined
					return url ? `Fetching ${urlHost(url)}` : "Fetching web content"
				}
				case "websearch":
					return "Searching the web"
				case "edit":
				case "write":
				case "apply_patch": {
					const path = (part.state.input?.filePath as string) ?? (part.state.input?.path as string)
					const verb = part.tool === "write" ? "Writing" : "Editing"
					return path ? `${verb} ${lastSegment(path)}` : `${verb} file`
				}
				case "bash": {
					const command = part.state.input?.command as string | undefined
					return command ? `Running ${shortenCommand(command)}` : "Running command"
				}
				case "question":
					return "Waiting for your answer"
				case "skill": {
					const name = part.state.input?.name as string | undefined
					return name ? `Using skill: ${name}` : "Loading skill"
				}
				case "memory":
					return "Accessing memory"
				case "mcp": {
					const server = part.state.input?.server as string | undefined
					return server ? `Using ${server}` : "Using MCP server"
				}
				default:
					return `Using ${part.tool}`
			}
		}
		if (part.type === "reasoning") return "Thinking"
		if (part.type === "text") return "Writing response"
	}
	return "Thinking"
}

// ============================================================
// Synthetic message helpers
// ============================================================

function isSyntheticMessage(entry: ChatMessageEntry): boolean {
	const textParts = entry.parts.filter((p): p is TextPart => p.type === "text")
	// All text parts are synthetic (e.g. compaction continuation, shell execution)
	if (textParts.length > 0 && textParts.every((p) => p.synthetic === true)) return true
	// No text parts at all — e.g. a user message with only a compaction part
	if (textParts.length === 0 && entry.parts.length > 0) return true
	return false
}

export function getUserText(entry: ChatMessageEntry): string {
	return entry.parts
		.filter((p): p is TextPart => p.type === "text" && !p.synthetic)
		.map((p) => p.text)
		.join("\n")
}

function HighlightedText({ text, query }: { text: string; query: string }) {
	if (!query) return <>{text}</>
	const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
	return (
		<>
			{parts.map((part, i) =>
				part.toLowerCase() === query.toLowerCase() ? (
					<mark key={i} className="bg-yellow-500/30 text-foreground rounded-sm px-0.5">
						{part}
					</mark>
				) : (
					part
				)
			)}
		</>
	)
}

function getSyntheticLabel(entry: ChatMessageEntry): string {
	const text = entry.parts
		.filter((p): p is TextPart => p.type === "text")
		.map((p) => p.text)
		.join("\n")
		.toLowerCase()

	if (text.includes("continue if you have next steps")) return "Auto-continued after compaction"
	if (text.includes("summarize the task tool output")) return "Auto-continued after task"
	if (text.includes("tool was executed by the user")) return "Shell command executed"
	if (text.includes("plan has been approved")) return "Plan approved"
	if (text.includes("enter plan mode")) return "Entered plan mode"
	if (text.includes("switch") && text.includes("plan")) return "Mode switched"
	// No text parts — check for compaction part (user message that triggers compaction)
	if (entry.parts.some((p) => p.type === "compaction")) return "Compacting conversation"
	return "Auto-continued"
}

function getFileParts(entry: ChatMessageEntry): FilePart[] {
	return entry.parts.filter(
		(p): p is FilePart =>
			p.type === "file" && (p.mime.startsWith("image/") || p.mime === "application/pdf"),
	)
}

// ============================================================
// Attachment grid
// ============================================================

const AttachmentGrid = memo(function AttachmentGrid({
	files,
	onDelete,
}: { files: FilePart[]; onDelete?: (file: FilePart) => void }) {
	if (files.length === 0) return null
	return (
		<div className="flex flex-wrap gap-2">
			{files.map((file) => (
				<AttachmentThumbnail key={file.id} file={file} onDelete={onDelete} />
			))}
		</div>
	)
})

function AttachmentThumbnail({
	file,
	onDelete,
}: { file: FilePart; onDelete?: (file: FilePart) => void }) {
	const isImage = file.mime.startsWith("image/")
	const [deleting, setDeleting] = useState(false)

	const handleDelete = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			if (!onDelete || deleting) return
			setDeleting(true)
			try {
				await onDelete(file)
			} finally {
				setDeleting(false)
			}
		},
		[onDelete, file, deleting],
	)

	return (
		<Dialog>
			<div className="group/thumb relative size-16 shrink-0">
				{onDelete && (
					<button
						type="button"
						onClick={handleDelete}
						disabled={deleting}
						className="absolute -right-1 -top-1 z-10 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive/90 group-hover/thumb:opacity-100 disabled:opacity-50"
						title="Remove attachment"
						aria-label="Remove attachment"
					>
						<XIcon className="size-2.5" />
					</button>
				)}
				<DialogTrigger
					render={
						<button
							type="button"
							className="size-full overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-muted-foreground/30"
						/>
					}
				>
					{isImage ? (
						<img
							src={file.url}
							alt={file.filename ?? "Image attachment"}
							className="size-full object-cover"
						/>
					) : (
						<div className="flex size-full items-center justify-center">
							<FileIcon className="size-6 text-muted-foreground" />
						</div>
					)}
					{file.filename && (
						<div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] leading-tight text-white opacity-0 transition-opacity group-hover/thumb:opacity-100">
							<span className="line-clamp-1">{file.filename}</span>
						</div>
					)}
				</DialogTrigger>
			</div>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-auto p-0">
				<DialogTitle className="sr-only">{file.filename ?? "Attachment preview"}</DialogTitle>
				{isImage ? (
					<img
						src={file.url}
						alt={file.filename ?? "Image attachment"}
						className="max-h-[85vh] w-full object-contain"
					/>
				) : (
					<div className="flex flex-col items-center justify-center gap-2 p-8">
						<FileIcon className="size-12 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">{file.filename ?? "PDF attachment"}</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}

// ============================================================
// Part extraction helpers
// ============================================================

/** A renderable part — either a tool call, an intermediate text block, or reasoning */
type RenderablePart =
	| { kind: "tool"; part: ToolPart }
	| { kind: "text"; id: string; text: string }
	| { kind: "reasoning"; part: ReasoningPart }

/**
 * Flattens all assistant parts into an ordered list of renderable items
 * AND extracts the tool-only subset in a single pass.
 * Preserves the natural order: text, reasoning, tool, text, tool, text...
 * Filters out synthetic text, todoread without output, and empty text.
 * Strips OpenRouter [REDACTED] chunks from reasoning and skips empty reasoning.
 */
function getPartsAndTools(assistantMessages: ChatMessageEntry[]): {
	ordered: RenderablePart[]
	tools: ToolPart[]
} {
	const ordered: RenderablePart[] = []
	const tools: ToolPart[] = []
	for (const msg of assistantMessages) {
		for (const part of msg.parts) {
			if (part.type === "tool") {
				tools.push(part)
				if (part.tool === "todoread" && part.state.status !== "completed") continue
				ordered.push({ kind: "tool", part })
			} else if (part.type === "text" && !part.synthetic && part.text.trim()) {
				let text = part.text
				try {
					const t = text.trim()
					if (t.startsWith("{") && t.endsWith("}")) {
						const parsed = JSON.parse(t)
						if (typeof parsed.response === "string") text = parsed.response
						else if (typeof parsed.text === "string") text = parsed.text
						else if (typeof parsed.content === "string") text = parsed.content
					}
				} catch (e) {}
				ordered.push({ kind: "text", id: part.id, text })
			} else if (part.type === "reasoning") {
				// Strip OpenRouter's encrypted [REDACTED] chunks
				const cleaned = part.text.replace("[REDACTED]", "").trim()
				if (cleaned) {
					ordered.push({ kind: "reasoning", part })
				}
			}
		}
	}
	return { ordered, tools }
}

/**
 * Gets the last text part's content — used for the final streaming response
 * and the copy action. Returns undefined if no text parts exist.
 */
function getLastResponseText(orderedParts: RenderablePart[]): string | undefined {
	for (let i = orderedParts.length - 1; i >= 0; i--) {
		const item = orderedParts[i]
		if (item.kind === "text") return item.text
	}
	return undefined
}

function getError(assistantMessages: ChatMessageEntry[]): string | undefined {
	for (const msg of assistantMessages) {
		if (msg.info.role === "assistant" && msg.info.error) {
			const error = msg.info.error
			const errorData = error.data
			// Most error types have a `message` string in data
			if ("message" in errorData && errorData.message) {
				return typeof errorData.message === "string" ? errorData.message : String(errorData.message)
			}
			// Fallback: use the error name (e.g. "MessageOutputLengthError") +
			// any stringifiable data for types like MessageOutputLengthError
			// whose data is { [key: string]: unknown }
			const dataStr = Object.keys(errorData).length > 0 ? JSON.stringify(errorData) : undefined
			return dataStr ? `${error.name}: ${dataStr}` : error.name
		}
	}
	return undefined
}

// ============================================================
// Turn comparison for memo
// ============================================================

/**
 * Lightweight fingerprint for a ChatMessageEntry to detect real content changes
 * without comparing the full object tree. Mirrors the logic in session-chat.ts
 * but kept local to avoid coupling.
 */
function messageEntryFingerprint(entry: ChatMessageEntry): string {
	const lastPart = entry.parts.at(-1)
	const completed = entry.info.role === "assistant" ? (entry.info.time.completed ?? 0) : 0
	let textLen = 0
	const toolSegments: string[] = []
	for (const part of entry.parts) {
		if (part.type === "text" || part.type === "reasoning") {
			textLen += part.text.length
		} else if (part.type === "tool") {
			const outLen =
				part.state.status === "completed"
					? part.state.output.length
					: part.state.status === "error"
						? part.state.error.length
						: 0
			toolSegments.push(`${part.id}:${part.state.status}:${outLen}`)
		}
	}
	return `${entry.info.id}:${completed}:${entry.parts.length}:${lastPart?.id ?? ""}:${textLen}:${toolSegments.join(",")}`
}

/** Compare two turns by content fingerprint rather than reference equality */
function areTurnsEqual(a: ChatTurnType, b: ChatTurnType): boolean {
	if (a === b) return true
	if (a.id !== b.id) return false
	if (messageEntryFingerprint(a.userMessage) !== messageEntryFingerprint(b.userMessage))
		return false
	if (a.assistantMessages.length !== b.assistantMessages.length) return false
	for (let i = 0; i < a.assistantMessages.length; i++) {
		if (
			messageEntryFingerprint(a.assistantMessages[i]) !==
			messageEntryFingerprint(b.assistantMessages[i])
		)
			return false
	}
	return true
}

// ============================================================
// Default mode helpers — tool grouping
// ============================================================

/**
 * Groups consecutive tool parts of the same category into summary items.
 * Interleaves text and reasoning between groups to preserve natural order.
 *
 * Example output:
 *   text: "Let me look at the code..."
 *   tool-group: { category: "explore", tools: [read, grep, glob] }
 *   text: "I found the issue, let me fix it..."
 *   tool-group: { category: "edit", tools: [edit, write] }
 *   tool-group: { category: "run", tools: [bash] }
 */
type StreamItem =
	| { kind: "text"; id: string; text: string }
	| { kind: "reasoning-process"; items: (RenderablePart & { kind: "reasoning" | "tool" })[] }
	| { kind: "tool-group"; category: ToolCategory; tools: ToolPart[] }

function groupPartsForStream(ordered: RenderablePart[]): StreamItem[] {
	const items: StreamItem[] = []
	let currentGroup: { category: ToolCategory; tools: ToolPart[] } | null = null
	let currentProcessGroup: (RenderablePart & { kind: "reasoning" | "tool" })[] = []

	const hasReasoning = ordered.some((p) => p.kind === "reasoning")

	const flushGroup = () => {
		if (currentGroup) {
			items.push({ kind: "tool-group", ...currentGroup })
			currentGroup = null
		}
	}

	const flushProcessGroup = () => {
		if (currentProcessGroup.length > 0) {
			items.push({ kind: "reasoning-process", items: currentProcessGroup })
			currentProcessGroup = []
		}
	}

	for (const part of ordered) {
		if (hasReasoning && (part.kind === "reasoning" || part.kind === "tool")) {
			currentProcessGroup.push(part)
		} else if (!hasReasoning && part.kind === "tool") {
			const category = getToolCategory(part.part.tool)
			if (currentGroup && currentGroup.category === category) {
				currentGroup.tools.push(part.part)
			} else {
				flushGroup()
				currentGroup = { category, tools: [part.part] }
			}
		} else {
			flushGroup()
			flushProcessGroup()
			if (part.kind === "text") {
				items.push({ kind: "text", id: part.id, text: part.text })
			}
		}
	}
	flushGroup()
	flushProcessGroup()
	return items
}

/**
 * Generates a human-readable summary for a group of tools in the same category.
 * Returns text like "Read 3 files", "Edited foo.tsx, bar.tsx", "Ran 2 commands".
 */
function describeToolGroup(category: ToolCategory, tools: ToolPart[]): string {
	const count = tools.length

	// For small groups, list specific targets
	if (count <= 3) {
		const details = tools
			.map((t) => getToolSubtitle(t))
			.filter(Boolean)
			.map((s) => {
				// Shorten file paths to just the filename
				const parts = s!.split("/")
				return parts.length > 1 ? parts[parts.length - 1] : s
			})

		if (details.length > 0) {
			switch (category) {
				case "explore":
					return count === 1 ? `Read ${details[0]}` : `Read ${details.join(", ")}`
				case "edit":
					return count === 1 ? `Edited ${details[0]}` : `Edited ${details.join(", ")}`
				case "run":
					return count === 1
						? `Ran ${details[0]}`
						: `Ran ${count} commands`
				case "delegate":
					return count === 1 ? `Delegated: ${details[0]}` : `Delegated ${count} tasks`
				case "fetch":
					return count === 1 ? `Fetched ${details[0]}` : `Fetched ${count} URLs`
				case "ask":
					return "Asked a question"
				case "plan":
					return "Updated plan"
				default:
					return `Ran ${details.join(", ")}`
			}
		}
	}

	// For larger groups, use count-based summaries
	switch (category) {
		case "explore":
			return `Explored ${count} files`
		case "edit":
			return `Edited ${count} files`
		case "run":
			return `Ran ${count} commands`
		case "delegate":
			return `Delegated ${count} tasks`
		case "fetch":
			return `Fetched ${count} URLs`
		case "ask":
			return `Asked ${count} questions`
		case "plan":
			return "Updated plan"
		default:
			return `Ran ${count} tools`
	}
}

/**
 * Returns true if any tool in the group is still running/pending.
 */
function isGroupRunning(tools: ToolPart[]): boolean {
	return tools.some((t) => t.state.status === "running" || t.state.status === "pending")
}

/**
 * Returns true if any tool in the group has an error.
 */
function isGroupError(tools: ToolPart[]): boolean {
	return tools.some((t) => t.state.status === "error")
}

/** Renders a single tool group summary as a collapsible disclosure row */
const ToolGroupSummary = memo(function ToolGroupSummary({
	category,
	tools,
	isActiveTurn,
}: {
	category: ToolCategory
	tools: ToolPart[]
	isActiveTurn: boolean
}) {
	const [expanded, setExpanded] = useState(false)
	const description = describeToolGroup(category, tools)
	const running = isGroupRunning(tools)
	const hasError = isGroupError(tools)
	const { icon: GroupIcon } = getToolInfo(tools[0].tool)
	const borderColor = TOOL_CATEGORY_COLORS[category]

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className={`flex w-full items-center gap-2 rounded-md border-l-2 bg-muted/20 px-3 py-1.5 text-[12px] transition-colors hover:bg-muted/40 ${borderColor}`}
			>
				<GroupIcon
					className={`size-3.5 shrink-0 ${
						hasError
							? "text-red-400"
							: running
								? "animate-pulse text-muted-foreground"
								: "text-muted-foreground/50"
					}`}
				/>
				<span className={`flex-1 text-left ${hasError ? "text-red-400" : "text-muted-foreground/70"}`}>
					{description}
				</span>
				{running && !expanded && (
					<Loader2Icon className="size-3 animate-spin text-muted-foreground/30" />
				)}
				<ChevronDownIcon
					className={`size-3 shrink-0 text-muted-foreground/30 transition-transform ${expanded ? "" : "-rotate-90"}`}
				/>
			</button>
			{expanded && (
				<div className="space-y-2 pl-3">
					{tools.map((tool) => (
						<ChatToolCall key={tool.id} part={tool} isActiveTurn={isActiveTurn} />
					))}
				</div>
			)}
		</div>
	)
})

// ============================================================
// ChatTurnComponent
// ============================================================

interface ChatTurnProps {
	turn: ChatTurnType
	isLast: boolean
	isWorking: boolean
	/** Revert to this turn's user message (for per-turn undo) */
	onRevertToMessage?: (messageId: string) => Promise<void>
	/** Interrupt the current work and send this queued message immediately */
	onSendNow?: (turn: ChatTurnType) => Promise<void>
	/** Fork the conversation from this turn boundary */
	onForkFromTurn?: () => Promise<void>
	/** Delete a specific part from a message (for error recovery) */
	onDeletePart?: (sessionId: string, messageId: string, partId: string) => Promise<void>
	/** Delete the entire turn (for queued messages) */
	onDeleteTurn?: (turn: ChatTurnType) => Promise<void>
	/** God Mode styling flag */
	isGodMode?: boolean
	/** Edit prompt - puts text back in input for editing */
	onEditPrompt?: (text: string) => void
	/** Regenerate the assistant response for this turn */
	onRegenerate?: (userMessageId: string) => void
	/** Search query for highlighting matching text */
	searchQuery?: string
}

/**
 * Renders a single turn: user message + assistant response.
 *
 * Two modes based on turn state:
 * - **Active turn** (last + working): tool calls are individually rendered with
 *   per-tool ToolCards, smart default expand/collapse, and live activity.
 * - **Completed turn**: icon-pill summary bar with one-click expand to show
 *   individual tools. Response text is always visible.
 *
 * Display mode preference (default/verbose) modifies behavior:
 * - default: interleaved text + grouped tool summaries as inline chips.
 *   Tool groups batch consecutive same-category calls (e.g., "Explored 3 files",
 *   "Edited foo.tsx, bar.tsx"). A "Show N steps" toggle reveals full tool cards.
 * - verbose: all turns show all tools expanded with full content (tool cards)
 */
export const ChatTurnComponent = memo(
	function ChatTurnComponent({
		turn,
		isLast,
		isWorking,
		onRevertToMessage,
		onSendNow,
		onForkFromTurn,
		onDeletePart,
		onDeleteTurn,
		isGodMode,
		onEditPrompt,
		onRegenerate,
		searchQuery,
	}: ChatTurnProps) {
		const [stepsExpanded, setStepsExpanded] = useState(false)
		const [copied, setCopied] = useState(false)
		const [reaction, setReaction] = useState<"thumbsup" | "thumbsdown" | null>(null)
		const displayMode = useDisplayMode()
		const turnRef = useRef<HTMLDivElement>(null)

		const isSynthetic = useMemo(() => isSyntheticMessage(turn.userMessage), [turn.userMessage])
		const userText = useMemo(() => getUserText(turn.userMessage), [turn.userMessage])
		const syntheticLabel = useMemo(
			() => (isSynthetic ? getSyntheticLabel(turn.userMessage) : ""),
			[isSynthetic, turn.userMessage],
		)
		const userFiles = useMemo(() => getFileParts(turn.userMessage), [turn.userMessage])

		// Ordered parts + tool-only subset in a single pass (avoids double iteration)
		const { ordered: orderedParts, tools: toolParts } = useMemo(
			() => getPartsAndTools(turn.assistantMessages),
			[turn.assistantMessages],
		)

		// Memoize flattened parts to avoid creating new array on every render
		const flatParts = useMemo(
			() => turn.assistantMessages.flatMap((m) => m.parts),
			[turn.assistantMessages],
		)

		// Add copy buttons to code blocks in the response
		useEffect(() => {
			if (!turnRef.current) return
			const codeBlocks = turnRef.current.querySelectorAll("pre code")
			codeBlocks.forEach((codeEl) => {
				const pre = codeEl.parentElement
				if (!pre || pre.querySelector("[data-copy-btn]")) return
				pre.style.position = "relative"
				const btn = document.createElement("button")
				btn.setAttribute("data-copy-btn", "true")
				btn.className = "absolute top-2 right-2 rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/code:opacity-100"
				btn.textContent = "Copy"
				btn.onclick = async () => {
					await navigator.clipboard.writeText(codeEl.textContent || "")
					btn.textContent = "Copied!"
					setTimeout(() => { btn.textContent = "Copy" }, 2000)
				}
				pre.classList.add("group/code")
				pre.appendChild(btn)
			})
		}, [orderedParts])

		// The last text for streaming display and copy action
		const rawResponseText = useMemo(() => getLastResponseText(orderedParts), [orderedParts])
		const responseText = useDeferredValue(rawResponseText)

		const errorText = useMemo(() => getError(turn.assistantMessages), [turn.assistantMessages])

		// Compute status from the last populated assistant message — empty
		// placeholder messages are skipped so we don't surface stale status.
		// A truly empty turn means the model is still booting → "Warming up".
		const statusText = useMemo(() => {
			for (let m = turn.assistantMessages.length - 1; m >= 0; m--) {
				const parts = turn.assistantMessages[m].parts
				if (parts.length === 0) continue
				return computeStatus(parts)
			}
			return "Warming up"
		}, [turn.assistantMessages])

		const working = isLast && isWorking
		const isQueued = isWorking && turn.assistantMessages.length === 0 && !isLast
		const isQueuedLast = isWorking && turn.assistantMessages.length === 0 && isLast

		// Mirror the live turn status into the window title (Claude Code style)
		// so progress is visible even when the app is in the background.
		useEffect(() => {
			if (!working) return
			document.title = `Devil AI — ${statusText}`
			return () => {
				document.title = "Devil-ai"
			}
		}, [working, statusText])
		const hasSteps = toolParts.length > 0
		const hasReasoning = orderedParts.some((p) => p.kind === "reasoning")

		const duration = useMemo(() => formatWorkDuration(computeTurnWorkTime(turn)), [turn])
		const turnCostStr = useMemo(() => {
			const cost = computeTurnCost(turn)
			return cost > 0 ? formatCost(cost) : ""
		}, [turn])
		const turnModel = useMemo(() => {
			for (let i = turn.assistantMessages.length - 1; i >= 0; i--) {
				const info = turn.assistantMessages[i].info
				if (info.role === "assistant" && info.modelID) {
					return shortModelName(info.modelID)
				}
			}
			return ""
		}, [turn.assistantMessages])

		// Determine if tools should be shown individually (active turn behavior)
		const isActiveTurn = working
		const isVerbose = displayMode === "verbose"

		// In default mode, we render a "stream" of grouped tool summaries + text.
		// In verbose mode, we render full tool cards.
		// stepsExpanded forces verbose rendering on a per-turn basis.
		const showVerboseTools = isVerbose || stepsExpanded

		// Grouped stream items for the default (non-verbose) rendering path
		const streamItems = useMemo(
			() => (showVerboseTools ? [] : groupPartsForStream(orderedParts)),
			[showVerboseTools, orderedParts],
		)

		// In default mode, the text is always rendered inline within the stream.
		// In verbose mode, the text is inline within the expanded ordered parts.
		// The standalone "final response" block only appears when no tools/reasoning
		// section is visible (pure text-only turn).
		const toolsSectionVisible = working || hasSteps || hasReasoning
		const textAlreadyInline =
			toolsSectionVisible && orderedParts.some((p) => p.kind === "text")

		const handleCopyResponse = useCallback(async () => {
			if (!responseText) return
			await navigator.clipboard.writeText(responseText)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}, [responseText])

		const handleRevertHere = useCallback(async () => {
			if (!onRevertToMessage) return
			await onRevertToMessage(turn.userMessage.info.id)
		}, [onRevertToMessage, turn.userMessage.info.id])

		const handleScrollToTop = useCallback(() => {
			turnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
		}, [])

		const [forking, setForking] = useState(false)
		const handleFork = useCallback(async () => {
			if (!onForkFromTurn || forking) return
			setForking(true)
			try {
				await onForkFromTurn()
			} finally {
				setForking(false)
			}
		}, [onForkFromTurn, forking])

		const [sendingNow, setSendingNow] = useState(false)
		const handleSendNow = useCallback(async () => {
			if (!onSendNow || sendingNow) return
			setSendingNow(true)
			try {
				await onSendNow(turn)
			} finally {
				setSendingNow(false)
			}
		}, [onSendNow, sendingNow, turn])

		const handleDeleteFile = useCallback(
			async (file: FilePart) => {
				if (!onDeletePart) return
				await onDeletePart(file.sessionID, file.messageID, file.id)
			},
			[onDeletePart],
		)

		const handleDeleteToolPart = useCallback(
			async (toolPart: ToolPart) => {
				if (!onDeletePart) return
				await onDeletePart(toolPart.sessionID, toolPart.messageID, toolPart.id)
			},
			[onDeletePart],
		)

		return (
			<div ref={turnRef} className="group/turn space-y-4">
				{/* User message */}
				{isSynthetic ? (
					<div className="flex items-center justify-end gap-1.5 text-[11px] italic text-muted-foreground/50">
						<BotIcon className="size-3" aria-hidden="true" />
						<span>{syntheticLabel}</span>
					</div>
				) : (
					<Message from="user">
						<MessageContent>
							{userFiles.length > 0 && (
								<AttachmentGrid
									files={userFiles}
									onDelete={onDeletePart ? handleDeleteFile : undefined}
								/>
							)}
							<p className="whitespace-pre-wrap">
								{searchQuery ? <HighlightedText text={userText} query={searchQuery} /> : userText}
							</p>
							<div className="mt-1.5 flex items-center justify-between">
								<span className="text-[10px] text-muted-foreground/30">{turn.userMessage.info.time?.created ? formatTimestamp(turn.userMessage.info.time.created) : ""}</span>
								<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => onEditPrompt?.(userText)}
									className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground/40 opacity-0 transition-all hover:bg-muted/80 hover:text-muted-foreground group-hover/turn:opacity-100"
									title="Edit prompt"
								>
									<PencilIcon className="size-3" />
									Edit
								</button>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(userText)
										setCopied(true)
										setTimeout(() => setCopied(false), 2000)
									}}
									className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground/40 opacity-0 transition-all hover:bg-muted/80 hover:text-muted-foreground group-hover/turn:opacity-100"
									title="Copy prompt"
								>
									{copied ? <CheckIcon className="size-3 text-green-500" /> : <CopyIcon className="size-3" />}
									{copied ? "Copied!" : "Copy"}
								</button>
								</div>
							</div>
							{(isQueued || isQueuedLast) && (
								<span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/60">
									<ListOrderedIcon className="size-3" />
									Queued
									{onSendNow && (
										<button
											type="button"
											onClick={handleSendNow}
											disabled={sendingNow}
											className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
										>
											<SendIcon className="size-2.5" />
											{sendingNow ? "Sending..." : "Send now"}
										</button>
									)}
									{onDeleteTurn && (
										<button
											type="button"
											onClick={() => onDeleteTurn(turn)}
											className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
										>
											<XIcon className="size-2.5" />
											Delete
										</button>
									)}
								</span>
							)}
						</MessageContent>
					</Message>
				)}

				{/* Tool calls + reasoning section */}
				{(working || hasSteps || hasReasoning) && (
					<div className="space-y-2">
						{/* Skills & MCP Usage Display */}
						{working && hasSteps && (
							<SkillsMCPDisplay 
								parts={flatParts} 
							/>
						)}

						{/* ── Default mode: interleaved text + grouped tool summaries ── */}
						{!showVerboseTools && (
							<div className="space-y-3">
								{streamItems.map((item, idx) => {
									if (item.kind === "text") {
										return (
											<div key={item.id} className="py-0.5">
												<Message from="assistant" className={isGodMode ? "ring-1 ring-indigo-500/25 shadow-[0_0_40px_rgba(99,102,241,0.08)] bg-gradient-to-br from-indigo-950/15 to-violet-950/10 rounded-xl p-3" : ""}>
													<MessageContent>
														<MessageResponse>{item.text}</MessageResponse>
													</MessageContent>
												</Message>
											</div>
										)
									}
									if (item.kind === "reasoning-process") {
										const firstReasoning = item.items.find((p) => p.kind === "reasoning") as { kind: "reasoning", part: ReasoningPart } | undefined
										const lastItem = item.items[item.items.length - 1]
										
										const durationSec = firstReasoning?.part.time.end
											? Math.ceil((firstReasoning.part.time.end - firstReasoning.part.time.start) / 1000)
											: undefined
										const isStreaming = working && (!lastItem || (lastItem.kind === "reasoning" && !lastItem.part.time.end))

										return (
											<Reasoning
												key={`process-${idx}`}
												isStreaming={isStreaming}
												duration={durationSec}
												defaultOpen={isStreaming ? undefined : false}
											>
												<ReasoningTrigger />
												<ReasoningContent animated={isStreaming}>
													<div className="flex flex-col gap-4">
														{item.items.map((processItem, i) => {
															if (processItem.kind === "reasoning") {
																const text = processItem.part.text.replace("[REDACTED]", "").trim()
																if (!text) return null
																return (
																	<div key={processItem.part.id} className="whitespace-pre-wrap">
																		<ReasoningText animated={isStreaming && i === item.items.length - 1}>
																			{text}
																		</ReasoningText>
																	</div>
																)
															}
															if (processItem.kind === "tool") {
																return (
																	<div key={processItem.part.id} className="border-l-2 border-muted/30 pl-3">
																		<ChatToolCall part={processItem.part} isActiveTurn={isActiveTurn} />
																	</div>
																)
															}
															return null
														})}
													</div>
												</ReasoningContent>
											</Reasoning>
										)
									}
									if (item.kind === "tool-group") {
										if (item.tools.length === 1) {
											return (
												<ChatToolCall
													key={item.tools[0].id}
													part={item.tools[0]}
													isActiveTurn={isActiveTurn}
												/>
											)
										}
										return (
											<ToolGroupSummary
												key={`group-${idx}-${item.tools[0].id}`}
												category={item.category}
												tools={item.tools}
												isActiveTurn={isActiveTurn}
											/>
										)
									}
									return null
								})}
								{/* Live status while the agent is still working */}
								{working && hasSteps && <ThinkingIndicator size="sm" label={statusText} />}
							</div>
						)}

						{/* Toggle to verbose view on completed turns in default mode */}
						{!showVerboseTools && !isActiveTurn && hasSteps && (
							<button
								type="button"
								onClick={() => setStepsExpanded(true)}
								className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-foreground"
							>
								<ChevronDownIcon className="size-3 -rotate-90" />
								<span>
									Show {toolParts.length} {toolParts.length === 1 ? "step" : "steps"}
								</span>
								<span>
									{turnModel && `· ${turnModel} `}
									{duration && `· ${duration} `}
									{turnCostStr && `· ${turnCostStr}`}
								</span>
							</button>
						)}

						{/* ── Verbose mode: full tool cards ──────────────────────── */}

						{/* Collapse back to default view */}
						{showVerboseTools && !isVerbose && !isActiveTurn && hasSteps && (
							<button
								type="button"
								onClick={() => setStepsExpanded(false)}
								className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-foreground"
							>
								<ChevronDownIcon className="size-3" />
								<span>
									Hide {toolParts.length} {toolParts.length === 1 ? "step" : "steps"}
								</span>
								<span>
									{turnModel && `· ${turnModel} `}
									{duration && `· ${duration} `}
									{turnCostStr && `· ${turnCostStr}`}
								</span>
							</button>
						)}

						{showVerboseTools && (
							<div className="space-y-3.5">
								{orderedParts.map((item) => {
									if (item.kind === "tool") {
										return (
											<ChatToolCall
												key={item.part.id}
												part={item.part}
												isActiveTurn={isActiveTurn}
												turnHasError={!!errorText}
												onDelete={onDeletePart ? handleDeleteToolPart : undefined}
											/>
										)
									}
									if (item.kind === "reasoning") {
										const reasoningText = item.part.text.replace("[REDACTED]", "").trim()
										if (!reasoningText) return null
										const durationSec = item.part.time.end
											? Math.ceil((item.part.time.end - item.part.time.start) / 1000)
											: undefined
										const isReasoningStreaming = !item.part.time.end && working
										return (
											<Reasoning
												key={item.part.id}
												isStreaming={isReasoningStreaming}
												duration={durationSec}
												defaultOpen={isReasoningStreaming ? undefined : false}
											>
												<ReasoningTrigger />
												<ReasoningContent animated={isReasoningStreaming}>
													<ReasoningText animated={isReasoningStreaming}>
														{reasoningText}
													</ReasoningText>
												</ReasoningContent>
											</Reasoning>
										)
									}
									return (
										<div key={item.id} className="py-0.5">
											<Message from="assistant" className={isGodMode ? "ring-1 ring-indigo-500/25 shadow-[0_0_40px_rgba(99,102,241,0.08)] bg-gradient-to-br from-indigo-950/15 to-violet-950/10 rounded-xl p-3" : ""}>
												<MessageContent>
													<MessageResponse>{item.text}</MessageResponse>
												</MessageContent>
											</Message>
										</div>
									)
								})}
							</div>
						)}
					</div>
				)}

				{/* Error */}
				{errorText && (
					<div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
						<span className="flex-1">{errorText.length > 300 ? `${errorText.slice(0, 300)}...` : errorText}</span>
						{onRegenerate && (
							<button
								type="button"
								onClick={() => onRegenerate(turn.userMessage.info.id)}
								className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-red-500/20"
								title="Retry"
							>
								Retry
							</button>
						)}
					</div>
				)}

				{/* Thinking shimmer — only for turns with no tools/reasoning section yet */}

				{/* Assistant response — shown when not working AND not already rendered inline */}
				{!working && responseText && !textAlreadyInline && (
					<Message from="assistant" className={isGodMode ? "ring-1 ring-indigo-500/25 shadow-[0_0_40px_rgba(99,102,241,0.08)] bg-gradient-to-br from-indigo-950/15 to-violet-950/10 rounded-xl p-3" : ""}>
						<MessageContent>
							<MessageResponse>{responseText}</MessageResponse>
							<div className="mt-1 text-[10px] text-muted-foreground/30">
								{"completed" in (turn.assistantMessages[0]?.info.time ?? {}) ? formatTimestamp((turn.assistantMessages[0]?.info.time as { completed: number }).completed) : ""}
							</div>
						</MessageContent>
					</Message>
				)}

				{/* Streaming response — visible while working, when text isn't already inline */}
				{working && responseText && !textAlreadyInline && (
					<Message from="assistant" className={isGodMode ? "ring-1 ring-indigo-500/25 shadow-[0_0_40px_rgba(99,102,241,0.08)] bg-gradient-to-br from-indigo-950/15 to-violet-950/10 rounded-xl p-3" : ""}>
						<MessageContent>
							<MessageResponse animated>{responseText}</MessageResponse>
						</MessageContent>
					</Message>
				)}

				{/* Per-turn metadata — shown on completed turns so badges are visible after long responses */}
				{!working &&
					turn.assistantMessages.length > 0 &&
					(turnModel || duration || turnCostStr) && (
						<div className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground/40">
							{turnModel && <span>{turnModel}</span>}
							{turnModel && duration && <span>·</span>}
							{duration && <span>{duration}</span>}
							{turnCostStr && <span>·</span>}
							{turnCostStr && <span>{turnCostStr}</span>}
						</div>
					)}

				{/* Turn-level message actions — visible on hover across all display modes */}
				{responseText && (
					<MessageActions className="opacity-0 transition-opacity group-hover/turn:opacity-100">
						<MessageAction tooltip="Scroll to top" onClick={handleScrollToTop}>
							<ArrowUpToLineIcon className="size-3" />
						</MessageAction>
					<MessageAction
						tooltip={copied ? "Copied" : "Copy response"}
						onClick={handleCopyResponse}
					>
						{copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
					</MessageAction>
					{onRegenerate && !working && (
						<MessageAction
							tooltip="Regenerate response"
							onClick={() => onRegenerate(turn.userMessage.info.id)}
						>
							<RotateCcwIcon className="size-3" />
						</MessageAction>
					)}
					{!working && (
						<>
							<MessageAction
								tooltip={reaction === "thumbsup" ? "Liked" : "Like"}
								onClick={() => setReaction(reaction === "thumbsup" ? null : "thumbsup")}
							>
								<ThumbsUpIcon className={`size-3 ${reaction === "thumbsup" ? "fill-current text-green-500" : ""}`} />
							</MessageAction>
							<MessageAction
								tooltip={reaction === "thumbsdown" ? "Disliked" : "Dislike"}
								onClick={() => setReaction(reaction === "thumbsdown" ? null : "thumbsdown")}
							>
								<ThumbsDownIcon className={`size-3 ${reaction === "thumbsdown" ? "fill-current text-red-500" : ""}`} />
							</MessageAction>
						</>
					)}
					{onForkFromTurn && !working && (
						<MessageAction
							tooltip={forking ? "Forking..." : "Fork from here"}
							onClick={handleFork}
							disabled={forking}
						>
							<GitForkIcon className="size-3" />
						</MessageAction>
					)}
					{onRevertToMessage && !working && (
						<MessageAction tooltip="Undo from here" onClick={handleRevertHere}>
							<Undo2Icon className="size-3" />
						</MessageAction>
					)}
					</MessageActions>
				)}

				{/* Claude Code CLI-style spinner while the AI is thinking */}
				{working && !responseText && !hasSteps && <ThinkingIndicator label={statusText} />}
			</div>
		)
	},
	(prev, next) => {
		if (!areTurnsEqual(prev.turn, next.turn)) return false
		if (prev.isLast !== next.isLast) return false
		if (prev.isWorking !== next.isWorking) return false
		// Skip reference comparison for callbacks - they close over stable values
		// and their identity changes don't affect rendered output
		return true
	},
)
