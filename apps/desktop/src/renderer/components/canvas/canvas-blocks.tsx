/**
 * Canvas Block Components
 * 
 * Individual block renderers for the notebook interface.
 */

import { cn } from "@devil-ai/ui/lib/utils"
import { Button } from "@devil-ai/ui/components/button"
import { Textarea } from "@devil-ai/ui/components/textarea"
import { CopyIcon, Trash2Icon, GripVerticalIcon, PlayIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import { memo, useRef, useState, useEffect } from "react"
import { useMarkdown } from "../../hooks/use-markdown"

// Base block wrapper with drag handle and actions
interface BlockWrapperProps {
	children: React.ReactNode
	isSelected: boolean
	onSelect: () => void
	onDelete: () => void
	onDuplicate: () => void
	onMoveUp: () => void
	onMoveDown: () => void
	draggable?: boolean
}

export const BlockWrapper = memo(function BlockWrapper({
	children,
	isSelected,
	onSelect,
	onDelete,
	onDuplicate,
	onMoveUp,
	onMoveDown,
	draggable = true,
}: BlockWrapperProps) {
	return (
		<div
			className={cn(
				"relative w-full transition-all duration-150",
				isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
			)}
			onClick={onSelect}
			draggable={draggable}
		>
			{/* Drag handle */}
			<div
				className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 w-8 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
				draggable={draggable}
			>
				<GripVerticalIcon className="w-4 h-4" />
			</div>
			
			{/* Block content */}
			<div className="ml-8">
				{children}
			</div>
			
			{/* Block actions - appear on hover or selection */}
			<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
				<button
					onClick={(e) => { e.stopPropagation(); onMoveUp() }}
					className="p-1.5 rounded hover:bg-muted transition-colors"
					aria-label="Move up"
				>
					<ChevronUpIcon className="w-3.5 h-3.5" />
				</button>
				<button
					onClick={(e) => { e.stopPropagation(); onMoveDown() }}
					className="p-1.5 rounded hover:bg-muted transition-colors"
					aria-label="Move down"
				>
					<ChevronDownIcon className="w-3.5 h-3.5" />
				</button>
				<button
					onClick={(e) => { e.stopPropagation(); onDuplicate() }}
					className="p-1.5 rounded hover:bg-muted transition-colors"
					aria-label="Duplicate"
				>
					<CopyIcon className="w-3.5 h-3.5" />
				</button>
				<button
					onClick={(e) => { e.stopPropagation(); onDelete() }}
					className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors text-muted-foreground"
					aria-label="Delete"
				>
					<Trash2Icon className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	)
})

BlockWrapper.displayName = "BlockWrapper"


// Markdown Block

interface MarkdownBlockProps {
	block: any
	onUpdate: (content: string) => void
	isSelected: boolean
}

export const MarkdownBlock = memo(function MarkdownBlock({ block, onUpdate, isSelected }: MarkdownBlockProps) {
	const [isEditing, setIsEditing] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	
	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.focus()
		}
	}, [isEditing])
	
	const handleBlur = () => {
		setIsEditing(false)
	}
	
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onUpdate(e.target.value)
	}
	
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Escape") {
			setIsEditing(false)
		}
	}
	
	if (isEditing) {
		return (
			<BlockWrapper
				isSelected={true}
				onSelect={() => {}}
				onDelete={() => {}}
				onDuplicate={() => {}}
				onMoveUp={() => {}}
				onMoveDown={() => {}}
				draggable={false}
			>
				<Textarea
					ref={textareaRef}
					value={block.content}
					onChange={handleChange}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
					className="min-h-[100px] resize-y font-mono text-sm"
					placeholder="Write markdown..."
				/>
			</BlockWrapper>
		)
	}
	
	const { html } = useMarkdown(block.content)
	
	return (
		<BlockWrapper
			isSelected={isSelected}
			onSelect={() => setIsEditing(true)}
			onDelete={() => {}}
			onDuplicate={() => {}}
			onMoveUp={() => {}}
			onMoveDown={() => {}}
		>
			<div 
				className="prose prose-sm max-w-none dark:prose-invert p-2"
				dangerouslySetInnerHTML={{ __html: html }}
				onDoubleClick={() => setIsEditing(true)}
			/>
		</BlockWrapper>
	)
})

MarkdownBlock.displayName = "MarkdownBlock"


// Code Block
import { CodeBlock as Highlight } from "@devil-ai/ui/components/ai-elements/code-block"

interface CodeBlockProps {
	block: any
	onUpdate: (content: string) => void
	onLanguageChange: (lang: string) => void
	onRun: () => void
	isSelected: boolean
	isRunning: boolean
}

const SUPPORTED_LANGUAGES = [
	"typescript", "javascript", "python", "rust", "go", "rust",
	"cpp", "c", "csharp", "java", "kotlin", "swift",
	"ruby", "php", "perl", "lua", "r",
	"sql", "bash", "powershell", "fish",
	"json", "yaml", "toml", "xml", "html", "css", "scss",
	"markdown", "dockerfile", "nginx", "graphql",
]

export const CodeBlock = memo(function CodeBlock({ 
	block, 
	onUpdate: _onUpdate, 
	onLanguageChange, 
	onRun, 
	isSelected, 
	isRunning 
}: CodeBlockProps) {
	const [showLanguagePicker, setShowLanguagePicker] = useState(false)
	
	return (
		<BlockWrapper
			isSelected={isSelected}
			onSelect={() => {}}
			onDelete={() => {}}
			onDuplicate={() => {}}
			onMoveUp={() => {}}
			onMoveDown={() => {}}
		>
			<div className="border border-border rounded-lg overflow-hidden bg-background">
				{/* Toolbar */}
				<div className="flex items-center gap-2 p-2 border-b border-border bg-muted/50">
					{/* Language selector */}
					<div className="relative">
						<button
							onClick={() => setShowLanguagePicker(!showLanguagePicker)}
							className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							{block.language}
							<ChevronDownIcon className="w-3 h-3" />
						</button>
						{showLanguagePicker && (
							<div className="absolute top-full left-0 mt-1 z-10 w-40 rounded-md border border-border bg-popover p-1 shadow-lg">
								{SUPPORTED_LANGUAGES.map((lang) => (
									<button
										key={lang}
										onClick={() => {
											onLanguageChange(lang)
											setShowLanguagePicker(false)
										}}
										className={cn(
											"w-full text-left px-2 py-1 text-xs rounded transition-colors",
											block.language === lang && "bg-primary text-primary-foreground"
										)}
									>
										{lang}
									</button>
								))}
							</div>
						)}
					</div>
					
					<div className="flex-1" />
					
					{/* Run button */}
					<Button
						size="icon"
						variant={isRunning ? "secondary" : "default"}
						onClick={onRun}
						disabled={isRunning}
						aria-label={isRunning ? "Running..." : "Run code"}
					>
						{isRunning ? (
							<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : (
							<PlayIcon className="w-4 h-4" />
						)}
					</Button>
				</div>
				
				{/* Code editor */}
				<div className="relative">
					<Highlight
						code={block.content}
						language={block.language}
						showLineNumbers={true}
					/>
				</div>
			</div>
		</BlockWrapper>
	)
})

CodeBlock.displayName = "CodeBlock"


// Output Block
interface OutputBlockProps {
	block: any
	isSelected: boolean
}

export const OutputBlock = memo(function OutputBlock({ block, isSelected }: OutputBlockProps) {
	return (
		<BlockWrapper
			isSelected={isSelected}
			onSelect={() => {}}
			onDelete={() => {}}
			onDuplicate={() => {}}
			onMoveUp={() => {}}
			onMoveDown={() => {}}
		>
			<div className="border border-border rounded-lg overflow-hidden bg-background">
				<div className="flex items-center gap-2 p-2 border-b border-border bg-muted/50">
					<span className="text-xs text-muted-foreground font-mono">
						Output {block.mimeType ? `(${block.mimeType})` : ""}
					</span>
					<div className="flex-1" />
					{block.isStreaming && (
						<div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
					)}
				</div>
				<div className="p-4 font-mono text-sm overflow-x-auto bg-black/5 dark:bg-white/5 rounded-b-lg">
					<pre className="m-0 whitespace-pre-wrap word-break-break-word">
						{block.content}
					</pre>
				</div>
			</div>
		</BlockWrapper>
	)
})

OutputBlock.displayName = "OutputBlock"


// Thinking Block
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@devil-ai/ui/components/ai-elements/reasoning"

interface ThinkingBlockProps {
	block: any
	isSelected: boolean
}

export const ThinkingBlock = memo(function ThinkingBlock({ block, isSelected }: ThinkingBlockProps) {
	return (
		<BlockWrapper
			isSelected={isSelected}
			onSelect={() => {}}
			onDelete={() => {}}
			onDuplicate={() => {}}
			onMoveUp={() => {}}
			onMoveDown={() => {}}
		>
			<Reasoning
				isStreaming={block.isStreaming}
				duration={block.duration}
				defaultOpen={block.isStreaming}
			>
				<ReasoningTrigger />
				<ReasoningContent animated={block.isStreaming}>
					{block.content}
				</ReasoningContent>
			</Reasoning>
		</BlockWrapper>
	)
})

ThinkingBlock.displayName = "ThinkingBlock"


// Tool Block
interface ToolBlockProps {
	block: any
	isSelected: boolean
}

export const ToolBlock = memo(function ToolBlock({ block, isSelected }: ToolBlockProps) {
	const statusColors = {
		pending: "text-yellow-500",
		running: "text-blue-500 animate-pulse",
		success: "text-green-500",
		error: "text-red-500",
	}
	
	const statusIcons = {
		pending: "⏳",
		running: "⚙️",
		success: "✅",
		error: "❌",
	}
	
	return (
		<BlockWrapper
			isSelected={isSelected}
			onSelect={() => {}}
			onDelete={() => {}}
			onDuplicate={() => {}}
			onMoveUp={() => {}}
			onMoveDown={() => {}}
		>
			<div className="border border-border rounded-lg overflow-hidden bg-background">
				<div className="flex items-center gap-2 p-2 border-b border-border bg-muted/50">
					<span className="text-xs font-mono text-muted-foreground">
						{statusIcons[block.status as keyof typeof statusIcons]} {block.toolName}
					</span>
					<div className="flex-1" />
					<span className={cn("text-xs font-medium", statusColors[block.status as keyof typeof statusColors])}>
						{block.status}
					</span>
				</div>
				<div className="p-4 font-mono text-sm">
					<div className="mb-2 text-muted-foreground">Input:</div>
					<pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(block.input, null, 2)}</pre>
					{block.output && (
						<div className="mt-2">
							<div className="mb-1 text-muted-foreground">Output:</div>
							<pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(block.output, null, 2)}</pre>
						</div>
					)}
				</div>
			</div>
		</BlockWrapper>
	)
})

ToolBlock.displayName = "ToolBlock"