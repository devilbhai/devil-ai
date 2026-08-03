/**
 * Visual Workflow Builder - Drag-drop automation workflow creation.
 *
 * Features:
 * - Drag-and-drop node placement
 * - Visual node connections
 * - Multiple node types (trigger, action, condition)
 * - Export to automation config
 */

import { useCallback, useRef, useState } from "react"
import {
	PlayIcon,
	TrashIcon,
	GitBranchIcon,
	TimerIcon,
	BellIcon,
	CodeIcon,
	MessageSquareIcon,
	GlobeIcon,
	FileTextIcon,
	DatabaseIcon,
	ZapIcon,
} from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Badge } from "@devil-ai/ui/components/badge"
import { Tooltip, TooltipTrigger } from "@devil-ai/ui/components/tooltip"
import { cn } from "@devil-ai/ui/lib/utils"

// ============================================================
// Types
// ============================================================

export type NodeType = "trigger" | "action" | "condition"

export interface WorkflowNode {
	id: string
	type: NodeType
	label: string
	icon: string
	config: Record<string, unknown>
	x: number
	y: number
}

export interface WorkflowConnection {
	id: string
	from: string
	to: string
	fromPort?: string
	toPort?: string
}

export interface Workflow {
	id: string
	name: string
	description: string
	nodes: WorkflowNode[]
	connections: WorkflowConnection[]
	createdAt: string
	updatedAt: string
}

// ============================================================
// Node type definitions
// ============================================================

export const NODE_TYPES: Record<
	NodeType,
	{ label: string; color: string; icon: typeof PlayIcon; availableNodes: Array<{ type: string; label: string; icon: typeof PlayIcon }> }
> = {
	trigger: {
		label: "Trigger",
		color: "bg-blue-500/15 text-blue-500 border-blue-500/30",
		icon: PlayIcon,
		availableNodes: [
			{ type: "schedule", label: "Schedule (Cron)", icon: TimerIcon },
			{ type: "webhook", label: "Webhook", icon: GlobeIcon },
			{ type: "file-change", label: "File Change", icon: FileTextIcon },
			{ type: "git-push", label: "Git Push", icon: GitBranchIcon },
			{ type: "manual", label: "Manual", icon: PlayIcon },
		],
	},
	action: {
		label: "Action",
		color: "bg-green-500/15 text-green-500 border-green-500/30",
		icon: ZapIcon,
		availableNodes: [
			{ type: "run-code", label: "Run Code", icon: CodeIcon },
			{ type: "send-message", label: "Send Message", icon: MessageSquareIcon },
			{ type: "api-call", label: "API Call", icon: GlobeIcon },
			{ type: "database", label: "Database Query", icon: DatabaseIcon },
			{ type: "notification", label: "Send Notification", icon: BellIcon },
			{ type: "ai-agent", label: "AI Agent Task", icon: ZapIcon },
		],
	},
	condition: {
		label: "Condition",
		color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
		icon: GitBranchIcon,
		availableNodes: [
			{ type: "if-else", label: "If/Else", icon: GitBranchIcon },
			{ type: "switch", label: "Switch", icon: GitBranchIcon },
			{ type: "loop", label: "Loop", icon: GitBranchIcon },
		],
	},
}

// ============================================================
// Workflow Node Component
// ============================================================

interface WorkflowNodeProps {
	node: WorkflowNode
	isSelected: boolean
	onSelect: (id: string) => void
	onDelete: (id: string) => void
	onDragStart: (e: React.DragEvent, node: WorkflowNode) => void
	onDrag: (e: React.DragEvent, node: WorkflowNode) => void
	onDragEnd: (e: React.DragEvent, node: WorkflowNode) => void
}

function WorkflowNodeComponent({
	node,
	isSelected,
	onSelect,
	onDelete,
	onDragStart,
	onDrag,
	onDragEnd,
}: WorkflowNodeProps) {
	const nodeType = NODE_TYPES[node.type]
	const Icon = nodeType.icon

	return (
		<div
			draggable
			onDragStart={(e) => onDragStart(e, node)}
			onDrag={(e) => onDrag(e, node)}
			onDragEnd={(e) => onDragEnd(e, node)}
			onClick={() => onSelect(node.id)}
			className={cn(
				"absolute cursor-move select-none rounded-lg border-2 p-3 shadow-sm transition-all hover:shadow-md",
				nodeType.color,
				isSelected && "ring-2 ring-primary ring-offset-2",
			)}
			style={{ left: node.x, top: node.y }}
		>
			<div className="flex items-center gap-2">
				<Icon className="size-4" />
				<span className="font-medium text-sm">{node.label}</span>
			</div>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="ghost"
							size="sm"
							className="absolute -top-2 -right-2 size-6 rounded-full p-0"
							onClick={(e) => {
								e.stopPropagation()
								onDelete(node.id)
							}}
						>
							<TrashIcon className="size-3" />
						</Button>
					}
				>
					Delete
				</TooltipTrigger>
			</Tooltip>
		</div>
	)
}

// ============================================================
// Node Palette Component
// ============================================================

interface NodePaletteProps {
	onAddNode: (type: NodeType, nodeType: string, label: string) => void
}

function NodePalette({ onAddNode }: NodePaletteProps) {
	return (
		<div className="space-y-4">
			{(Object.entries(NODE_TYPES) as Array<[NodeType, (typeof NODE_TYPES)[NodeType]]>).map(
				([type, config]) => (
					<div key={type}>
						<h4 className="mb-2 text-sm font-medium">{config.label}</h4>
						<div className="grid grid-cols-2 gap-2">
							{config.availableNodes.map((node) => (
								<Button
									key={node.type}
									variant="outline"
									size="sm"
									className="justify-start"
									onClick={() => onAddNode(type, node.type, node.label)}
								>
									<node.icon className="mr-2 size-3" />
									{node.label}
								</Button>
							))}
						</div>
					</div>
				),
			)}
		</div>
	)
}

// ============================================================
// Main Workflow Builder Component
// ============================================================

export interface WorkflowBuilderProps {
	initialWorkflow?: Workflow
	onSave: (workflow: Workflow) => void
	onCancel: () => void
}

export function WorkflowBuilder({ initialWorkflow, onSave, onCancel }: WorkflowBuilderProps) {
	const canvasRef = useRef<HTMLDivElement>(null)
	const [workflow, setWorkflow] = useState<Workflow>(
		initialWorkflow || {
			id: crypto.randomUUID(),
			name: "New Workflow",
			description: "",
			nodes: [],
			connections: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	)
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
	const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null)

	const addNode = useCallback((type: NodeType, nodeType: string, label: string) => {
		const newNode: WorkflowNode = {
			id: crypto.randomUUID(),
			type,
			label,
			icon: nodeType,
			config: {},
			x: 100 + Math.random() * 200,
			y: 100 + Math.random() * 200,
		}
		setWorkflow((prev) => ({
			...prev,
			nodes: [...prev.nodes, newNode],
			updatedAt: new Date().toISOString(),
		}))
	}, [])

	const deleteNode = useCallback((nodeId: string) => {
		setWorkflow((prev) => ({
			...prev,
			nodes: prev.nodes.filter((n) => n.id !== nodeId),
			connections: prev.connections.filter(
				(c) => c.from !== nodeId && c.to !== nodeId,
			),
			updatedAt: new Date().toISOString(),
		}))
	}, [])

	const handleDragStart = useCallback(
		(e: React.DragEvent, node: WorkflowNode) => {
			setDraggedNode(node)
			e.dataTransfer.effectAllowed = "move"
		},
		[],
	)

	const handleDrag = useCallback(
		(e: React.DragEvent, node: WorkflowNode) => {
			if (!draggedNode) return
			const rect = canvasRef.current?.getBoundingClientRect()
			if (!rect) return

			const x = e.clientX - rect.left + (draggedNode.x - e.clientX)
			const y = e.clientY - rect.top + (draggedNode.y - e.clientY)

			setWorkflow((prev) => ({
				...prev,
				nodes: prev.nodes.map((n) =>
					n.id === node.id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n,
				),
			}))
		},
		[draggedNode],
	)

	const handleDragEnd = useCallback(() => {
		setDraggedNode(null)
	}, [])

	const handleSave = useCallback(() => {
		onSave(workflow)
	}, [workflow, onSave])

	return (
		<div className="flex h-full gap-4">
			{/* Node Palette */}
			<div className="w-64 shrink-0 overflow-y-auto border-r p-4">
				<h3 className="mb-4 text-lg font-semibold">Add Nodes</h3>
				<NodePalette onAddNode={addNode} />
			</div>

			{/* Canvas */}
			<div className="flex-1 overflow-hidden">
				<div className="mb-4 flex items-center justify-between border-b p-4">
					<div className="flex items-center gap-4">
						<input
							type="text"
							value={workflow.name}
							onChange={(e) =>
								setWorkflow((prev) => ({
									...prev,
									name: e.target.value,
									updatedAt: new Date().toISOString(),
								}))
							}
							className="border-none bg-transparent text-lg font-semibold focus:outline-none"
							placeholder="Workflow name"
						/>
						<Badge variant="outline">
							{workflow.nodes.length} nodes
						</Badge>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button onClick={handleSave}>
							Save Workflow
						</Button>
					</div>
				</div>

				<div
					ref={canvasRef}
					className="relative h-[calc(100%-60px)] overflow-auto bg-muted/20"
					onClick={() => setSelectedNodeId(null)}
				>
					{workflow.nodes.length === 0 ? (
						<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
							<div className="text-center">
								<ZapIcon className="mx-auto mb-4 size-12" />
								<p className="text-lg font-medium">Drag nodes here to build your workflow</p>
								<p className="text-sm">Or click "Add Nodes" from the palette</p>
							</div>
						</div>
					) : (
						workflow.nodes.map((node) => (
							<WorkflowNodeComponent
								key={node.id}
								node={node}
								isSelected={selectedNodeId === node.id}
								onSelect={setSelectedNodeId}
								onDelete={deleteNode}
								onDragStart={handleDragStart}
								onDrag={handleDrag}
								onDragEnd={handleDragEnd}
							/>
						))
					)}

					{/* SVG layer for connections */}
					<svg className="pointer-events-none absolute inset-0 size-full">
						{workflow.connections.map((conn) => {
							const fromNode = workflow.nodes.find((n) => n.id === conn.from)
							const toNode = workflow.nodes.find((n) => n.id === conn.to)
							if (!fromNode || !toNode) return null

							const fromX = fromNode.x + 60
							const fromY = fromNode.y + 20
							const toX = toNode.x
							const toY = toNode.y + 20

							return (
								<path
									key={conn.id}
									d={`M ${fromX} ${fromY} C ${fromX + 50} ${fromY}, ${toX - 50} ${toY}, ${toX} ${toY}`}
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									className="text-muted-foreground/50"
								/>
							)
						})}
					</svg>
				</div>
			</div>
		</div>
	)
}
