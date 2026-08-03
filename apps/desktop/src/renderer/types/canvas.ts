/**
 * Canvas/Notebook Types
 * 
 * Block-based notebook interface for Devil AI.
 * Similar to Jupyter/Observable/Notion - mix of markdown, code, and output blocks.
 */

export type BlockType = "markdown" | "code" | "output" | "thinking" | "tool"

export interface BaseBlock {
	id: string
	type: BlockType
	createdAt: number
	updatedAt: number
}

export interface MarkdownBlock extends BaseBlock {
	type: "markdown"
	content: string
}

export interface CodeBlock extends BaseBlock {
	type: "code"
	language: string
	content: string
	outputId?: string // Links to output block
	isRunning?: boolean
}

export interface OutputBlock extends BaseBlock {
	type: "output"
	content: string
	mimeType?: string // "text/plain", "application/json", "image/png", etc.
	parentCodeBlockId?: string
	isStreaming?: boolean
}

export interface ThinkingBlock extends BaseBlock {
	type: "thinking"
	content: string
	duration?: number
	isStreaming?: boolean
}

export interface ToolBlock extends BaseBlock {
	type: "tool"
	toolName: string
	input: unknown
	output?: unknown
	status: "pending" | "running" | "success" | "error"
}

export type CanvasBlock = MarkdownBlock | CodeBlock | OutputBlock | ThinkingBlock | ToolBlock

export interface CanvasState {
	blocks: CanvasBlock[]
	selectedBlockId?: string
	version: number
}

export interface CanvasActions {
	addBlock: (type: BlockType, index?: number, content?: string) => string
	removeBlock: (id: string) => void
	moveBlock: (id: string, newIndex: number) => void
	updateBlock: (id: string, updates: Partial<CanvasBlock>) => void
	duplicateBlock: (id: string) => string
	runCodeBlock: (id: string) => Promise<void>
	setSelectedBlock: (id: string | undefined) => void
	undo: () => void
	redo: () => void
}

export interface CanvasFile {
	id: string
	name: string
	state: CanvasState
	createdAt: number
	updatedAt: number
	projectPath?: string
}