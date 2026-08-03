/**
 * Canvas View - Main Notebook Interface
 * 
 * Full-featured notebook/canvas mode with block-based editing.
 */

import { memo, useCallback, useState, useEffect } from "react"
import { cn } from "@devil-ai/ui/lib/utils"
import { PlusIcon, FileTextIcon, TerminalIcon, BrainIcon, WrenchIcon, SaveIcon, Undo2Icon, Redo2Icon, SearchIcon, XIcon, FilePlusIcon, ListIcon, ChevronDownIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@devil-ai/ui/components/dropdown-menu"
import { Separator } from "@devil-ai/ui/components/separator"
import { useAtom, useAtomValue } from "jotai"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { CanvasBlock } from "../../types/canvas"
import { 
	canvasStateAtom, 
	selectedBlockIdAtom, 
	canvasActionsAtom,
	canUndoAtom,
	canRedoAtom,
	canvasFilesAtom,
} from "../../atoms/canvas"
import { MarkdownBlock, CodeBlock, OutputBlock, ThinkingBlock, ToolBlock } from "./canvas-blocks"
import { initializeCanvasActions } from "../../stores/canvas-store"
import { createLogger } from "../../lib/logger"

const log = createLogger("canvas-view")

interface CanvasViewProps {
	className?: string
	projectPath?: string
}

export const CanvasView = memo(function CanvasView({ className, projectPath }: CanvasViewProps) {
	const [canvasState] = useAtom(canvasStateAtom)
	const selectedBlockId = useAtomValue(selectedBlockIdAtom)
	const [canvasActions, setCanvasActions] = useAtom(canvasActionsAtom)
	const canUndo = useAtomValue(canUndoAtom)
	const canRedo = useAtomValue(canRedoAtom)
	const [canvasFiles] = useAtom(canvasFilesAtom)
	const [showFilePanel, setShowFilePanel] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [filteredBlocks, setFilteredBlocks] = useState<CanvasBlock[]>(canvasState.blocks)
	
	// Initialize actions on mount - FORCE initialize
	useEffect(() => {
		const actions = initializeCanvasActions()
		if (actions) {
			setCanvasActions(actions)
		}
	}, [setCanvasActions])
	
	// Filter blocks based on search
	useEffect(() => {
		if (!searchQuery) {
			setFilteredBlocks(canvasState.blocks)
		} else {
			const query = searchQuery.toLowerCase()
			setFilteredBlocks(canvasState.blocks.filter((b) => {
				if (b.type === "markdown" || b.type === "code") {
					return b.content.toLowerCase().includes(query)
				}
				return false
			}))
		}
	}, [canvasState.blocks, searchQuery])
	
	const handleDragEnd = useCallback((result: DropResult) => {
		const { destination, source, draggableId } = result
		if (!destination) return
		if (destination.index === source.index) return
		
		canvasActions?.moveBlock(draggableId, destination.index)
	}, [canvasActions])
	
	const handleAddBlock = useCallback((type: "markdown" | "code" | "output" | "thinking" | "tool") => {
		// If canvasActions not available, force re-initialize
		if (!canvasActions) {
			const actions = initializeCanvasActions()
			if (actions) {
				setCanvasActions(actions)
				actions.addBlock(type)
			}
		} else {
			canvasActions.addBlock(type)
		}
	}, [canvasActions, setCanvasActions])
	
	const handleUpdateBlock = useCallback((id: string, updates: any) => {
		canvasActions?.updateBlock(id, updates)
	}, [canvasActions])
	
	const handleDeleteBlock = useCallback((id: string) => {
		canvasActions?.removeBlock(id)
	}, [canvasActions])
	
	const handleRunCode = useCallback((id: string) => {
		canvasActions?.runCodeBlock(id)
	}, [canvasActions])
	
	const handleLanguageChange = useCallback((id: string, language: string) => {
		canvasActions?.updateBlock(id, { language })
	}, [canvasActions])
	
	const handleSelectionChange = useCallback((id: string | undefined) => {
		canvasActions?.setSelectedBlock(id)
	}, [canvasActions])
	
	const handleUndo = useCallback(() => canvasActions?.undo(), [canvasActions])
	const handleRedo = useCallback(() => canvasActions?.redo(), [canvasActions])
	
	const handleSave = useCallback(() => {
		const state = canvasState
		const newFile = {
			id: `canvas-${Date.now()}`,
			name: `Canvas ${new Date().toLocaleDateString()}`,
			state: { blocks: state.blocks, selectedBlockId: state.selectedBlockId, version: state.version },
			createdAt: Date.now(),
			updatedAt: Date.now(),
			projectPath,
		}
		// Would save to canvasFilesAtom in real implementation
		log.info("Canvas saved", { fileName: newFile.name })
	}, [canvasState, projectPath])
	
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}
	
	const handleNewCanvas = () => {
		// Reset to empty canvas
	}
	
	const handleOpenFile = (fileId: string) => {
		const file = canvasFiles.find(f => f.id === fileId)
		if (file) {
			// Load file state
		}
	}
	
	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "z") {
				if (e.shiftKey) handleRedo()
				else handleUndo()
				e.preventDefault()
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				handleSave()
				e.preventDefault()
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				// Run selected code block
				const selectedBlock = canvasState.blocks.find(b => b.id === selectedBlockId)
				if (selectedBlock?.type === "code") {
					handleRunCode(selectedBlock.id)
				}
				e.preventDefault()
			}
			if (e.key === "Escape") {
				handleSelectionChange(undefined)
			}
		}
		
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [canvasState, selectedBlockId, handleRedo, handleUndo, handleSave, handleRunCode])
	
	const renderBlock = (block: any, _index: number) => {
		const isSelected = block.id === selectedBlockId
		
		const commonProps = {
			block,
			isSelected,
			onUpdate: (content: string) => handleUpdateBlock(block.id, { content }),
			onSelect: () => handleSelectionChange(block.id),
			onDelete: () => handleDeleteBlock(block.id),
			onDuplicate: () => canvasActions?.duplicateBlock(block.id),
			onMoveUp: () => canvasActions?.moveBlock(block.id, Math.max(0, filteredBlocks.findIndex(b => b.id === block.id) - 1)),
			onMoveDown: () => canvasActions?.moveBlock(block.id, Math.min(filteredBlocks.length - 1, filteredBlocks.findIndex(b => b.id === block.id) + 1)),
		}
		
		switch (block.type) {
			case "markdown":
				return <MarkdownBlock key={block.id} {...commonProps} block={block} />
			case "code":
				return (
					<CodeBlock
						key={block.id}
						{...commonProps}
						block={block}
						onLanguageChange={(lang) => handleLanguageChange(block.id, lang)}
						onRun={() => handleRunCode(block.id)}
						isRunning={block.isRunning}
					/>
				)
			case "output":
				return <OutputBlock key={block.id} {...commonProps} block={block} />
			case "thinking":
				return <ThinkingBlock key={block.id} {...commonProps} block={block} />
			case "tool":
				return <ToolBlock key={block.id} {...commonProps} block={block} />
			default:
				return null
		}
	}
	
	return (
		<div className={cn("flex h-full flex-col bg-background", className)}>
			{/* Toolbar */}
			<div className="flex h-12 items-center gap-2 border-b border-border px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				{/* File actions */}
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" onClick={handleNewCanvas} aria-label="New canvas">
						<FilePlusIcon className="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save canvas">
						<SaveIcon className="w-4 h-4" />
					</Button>
				</div>
				
				<Separator className="h-6 mx-2" />
				
				{/* Edit actions */}
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo} aria-label="Undo">
						<Undo2Icon className="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo} aria-label="Redo">
						<Redo2Icon className="w-4 h-4" />
					</Button>
				</div>
				
				<Separator className="h-6 mx-2" />
				
				{/* Add block menu */}
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="outline" size="sm" className="gap-1">
							<PlusIcon className="w-4 h-4" />
							Add Block
							<ChevronDownIcon className="w-3.5 h-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56" align="start">
						<DropdownMenuItem 
							onMouseDown={(e) => {
								e.preventDefault()
								e.stopPropagation()
								handleAddBlock("markdown")
							}} 
							className="flex items-center gap-2 cursor-pointer"
						>
							<FileTextIcon className="w-4 h-4" />
							Markdown
						</DropdownMenuItem>
						<DropdownMenuItem 
							onMouseDown={(e) => {
								e.preventDefault()
								e.stopPropagation()
								handleAddBlock("code")
							}} 
							className="flex items-center gap-2 cursor-pointer"
						>
							<TerminalIcon className="w-4 h-4" />
							Code
						</DropdownMenuItem>
						<DropdownMenuItem 
							onMouseDown={(e) => {
								e.preventDefault()
								e.stopPropagation()
								handleAddBlock("thinking")
							}} 
							className="flex items-center gap-2 cursor-pointer"
						>
							<BrainIcon className="w-4 h-4" />
							Thinking
						</DropdownMenuItem>
						<DropdownMenuItem 
							onMouseDown={(e) => {
								e.preventDefault()
								e.stopPropagation()
								handleAddBlock("tool")
							}} 
							className="flex items-center gap-2 cursor-pointer"
						>
							<WrenchIcon className="w-4 h-4" />
							Tool
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				
				<Separator className="h-6 mx-2" />
				
				{/* Search */}
				<div className="flex-1 max-w-md mx-4">
					<div className="relative">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<input
							type="text"
							value={searchQuery}
							onChange={handleSearchChange}
							placeholder="Search blocks..."
							className="w-full pl-10 pr-4 py-1.5 text-sm bg-muted border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<XIcon className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>
				
				<Separator className="h-6 mx-2" />
				
				{/* View toggles */}
				<div className="flex items-center gap-1 ml-auto">
					<Button variant="ghost" size="icon" onClick={() => setShowFilePanel(!showFilePanel)} aria-label={showFilePanel ? "Hide files" : "Show files"}>
						<ListIcon className="w-4 h-4" />
					</Button>
				</div>
			</div>
			
			{/* Main content area */}
			<div className="flex-1 flex overflow-hidden">
				{/* File panel */}
				{showFilePanel && (
					<div className="w-64 border-r border-border bg-muted/30 flex flex-col">
						<div className="p-3 border-b border-border flex items-center justify-between">
							<h3 className="font-medium text-sm">Canvas Files</h3>
							<Button variant="ghost" size="icon" onClick={handleNewCanvas} aria-label="New canvas">
								<PlusIcon className="w-4 h-4" />
							</Button>
						</div>
						<div className="flex-1 overflow-y-auto p-2 space-y-1">
							{canvasFiles.length === 0 ? (
								<p className="text-xs text-muted-foreground text-center py-4">No saved canvases</p>
							) : (
								canvasFiles.map((file) => (
									<button
										key={file.id}
										onClick={() => handleOpenFile(file.id)}
										className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
									>
										<p className="font-medium text-sm truncate">{file.name}</p>
										<p className="text-xs text-muted-foreground truncate">
											{new Date(file.updatedAt).toLocaleDateString()}
										</p>
									</button>
								))
							)}
						</div>
					</div>
				)}
				
				{/* Canvas area */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{searchQuery && filteredBlocks.length === 0 && canvasState.blocks.length > 0 && (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							<p className="text-center">No blocks match "{searchQuery}"</p>
						</div>
					)}
					
					{filteredBlocks.length === 0 && !searchQuery && (
						<div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
							<FileTextIcon className="w-16 h-16 mb-4 opacity-50" />
							<h3 className="text-lg font-medium mb-2">Empty Canvas</h3>
							<p className="text-sm mb-4">Add your first block to get started</p>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Button variant="outline" size="sm" className="gap-1">
										<PlusIcon className="w-4 h-4" />
										Add Block
									</Button>
								</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="start">
								<DropdownMenuItem 
									onMouseDown={(e) => {
										e.preventDefault()
										e.stopPropagation()
										handleAddBlock("markdown")
									}} 
									className="flex items-center gap-2 cursor-pointer"
								>
									<FileTextIcon className="w-4 h-4" />
									Markdown
								</DropdownMenuItem>
								<DropdownMenuItem 
									onMouseDown={(e) => {
										e.preventDefault()
										e.stopPropagation()
										handleAddBlock("code")
									}} 
									className="flex items-center gap-2 cursor-pointer"
								>
									<TerminalIcon className="w-4 h-4" />
									Code
								</DropdownMenuItem>
								<DropdownMenuItem 
									onMouseDown={(e) => {
										e.preventDefault()
										e.stopPropagation()
										handleAddBlock("thinking")
									}} 
									className="flex items-center gap-2 cursor-pointer"
								>
									<BrainIcon className="w-4 h-4" />
									Thinking
								</DropdownMenuItem>
								<DropdownMenuItem 
									onMouseDown={(e) => {
										e.preventDefault()
										e.stopPropagation()
										handleAddBlock("tool")
									}} 
									className="flex items-center gap-2 cursor-pointer"
								>
									<WrenchIcon className="w-4 h-4" />
									Tool
								</DropdownMenuItem>
							</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
					
					{/* Draggable blocks list */}
					<DragDropContext onDragEnd={handleDragEnd}>
						<Droppable droppableId="canvas-blocks">
							{(provided, snapshot) => (
								<div
									ref={provided.innerRef}
									{...provided.droppableProps}
									className={cn(
										"flex-1 overflow-y-auto p-4 space-y-4",
										snapshot.isDraggingOver && "bg-primary/5"
									)}
								>
									{filteredBlocks.map((block, index) => (
										<Draggable key={block.id} draggableId={block.id} index={index}>
											{(provided) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
												>
													{renderBlock(block, index)}
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</div>
			</div>
		</div>
	)
})

CanvasView.displayName = "CanvasView"