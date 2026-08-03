/**
 * Multi-Agent Orchestrator — enables agent-to-agent communication and
 * task delegation for Devil AI's swarm mode.
 *
 * Agents can:
 * - Delegate subtasks to other agents
 * - Share context and results
 * - Coordinate via a message bus
 * - Run in parallel or sequential pipelines
 */

import { createLogger } from "./logger"

const log = createLogger("multi-agent-orchestrator")

// ============================================================
// Types
// ============================================================

export type AgentRole = "architect" | "coder" | "reviewer" | "tester" | "planner" | "custom"

export type AgentStatus = "idle" | "working" | "waiting" | "completed" | "failed" | "paused"

export type MessageType =
	| "task_delegation"
	| "task_result"
	| "context_share"
	| "question"
	| "answer"
	| "feedback"
	| "status_update"
	| "error"

export interface AgentMessage {
	id: string
	from: string
	to: string
	type: MessageType
	payload: Record<string, unknown>
	timestamp: number
	correlationId?: string
}

export interface SwarmAgent {
	id: string
	role: AgentRole
	name: string
	status: AgentStatus
	sessionId?: string
	capabilities: string[]
	context: Record<string, unknown>
	parentId?: string
}

export interface SwarmTask {
	id: string
	title: string
	description: string
	assignedTo: string
	assignedBy?: string
	status: "pending" | "in_progress" | "completed" | "failed" | "blocked"
	result?: unknown
	dependencies: string[]
	priority: number
	createdAt: number
	completedAt?: number
}

export interface SwarmState {
	id: string
	agents: Map<string, SwarmAgent>
	tasks: Map<string, SwarmTask>
	messages: AgentMessage[]
	createdBy: string
	createdAt: number
	status: "active" | "completed" | "failed"
}

// ============================================================
// Message Bus
// ============================================================

type MessageHandler = (message: AgentMessage) => void

class MessageBus {
	private handlers = new Map<string, Set<MessageHandler>>()
	private messageLog: AgentMessage[] = []

	subscribe(agentId: string, handler: MessageHandler): () => void {
		if (!this.handlers.has(agentId)) {
			this.handlers.set(agentId, new Set())
		}
		this.handlers.get(agentId)!.add(handler)
		return () => {
			this.handlers.get(agentId)?.delete(handler)
		}
	}

	publish(message: AgentMessage): void {
		this.messageLog.push(message)
		log.info("Message published", {
			from: message.from,
			to: message.to,
			type: message.type,
		})

		// Route to target agent
		const targetHandlers = this.handlers.get(message.to)
		if (targetHandlers) {
			for (const handler of targetHandlers) {
				try {
					handler(message)
				} catch (err) {
					log.error("Message handler error", { agentId: message.to, error: String(err) }
					)
				}
			}
		}

		// Also notify broadcast listeners (to = "*")
		const broadcastHandlers = this.handlers.get("*")
		if (broadcastHandlers) {
			for (const handler of broadcastHandlers) {
				try {
					handler(message)
				} catch (err) {
					log.error("Broadcast handler error", { error: String(err) })
				}
			}
		}
	}

	getHistory(agentId?: string): AgentMessage[] {
		if (!agentId) return [...this.messageLog]
		return this.messageLog.filter((m) => m.from === agentId || m.to === agentId)
	}

	clear(): void {
		this.messageLog = []
	}
}

// ============================================================
// Orchestrator
// ============================================================

let globalBus: MessageBus | null = null

function getBus(): MessageBus {
	if (!globalBus) globalBus = new MessageBus()
	return globalBus
}

let swarmCounter = 0

/**
 * Create a new swarm with an initial set of agents.
 */
export function createSwarm(
	agents: Array<{ role: AgentRole; name: string; capabilities?: string[] }>,
	createdBy: string,
): SwarmState {
	const swarmId = `swarm-${++swarmCounter}-${Date.now()}`

	const agentMap = new Map<string, SwarmAgent>()
	for (const agent of agents) {
		const id = `${swarmId}-${agent.role}`
		agentMap.set(id, {
			id,
			role: agent.role,
			name: agent.name,
			status: "idle",
			capabilities: agent.capabilities ?? [],
			context: {},
		})
	}

	const state: SwarmState = {
		id: swarmId,
		agents: agentMap,
		tasks: new Map(),
		messages: [],
		createdBy,
		createdAt: Date.now(),
		status: "active",
	}

	log.info("Swarm created", { swarmId, agentCount: agents.length })
	return state
}

/**
 * Delegate a task from one agent to another.
 */
export function delegateTask(
	swarm: SwarmState,
	fromAgentId: string,
	toAgentId: string,
	task: Omit<SwarmTask, "id" | "assignedTo" | "assignedBy" | "status" | "createdAt" | "dependencies"> & {
		dependencies?: string[]
	},
): SwarmTask {
	const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
	const newTask: SwarmTask = {
		...task,
		id: taskId,
		assignedTo: toAgentId,
		assignedBy: fromAgentId,
		status: "pending",
		dependencies: task.dependencies ?? [],
		createdAt: Date.now(),
	}

	swarm.tasks.set(taskId, newTask)

	// Update agent status
	const agent = swarm.agents.get(toAgentId)
	if (agent) agent.status = "waiting"

	// Send delegation message
	const bus = getBus()
	const message: AgentMessage = {
		id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		from: fromAgentId,
		to: toAgentId,
		type: "task_delegation",
		payload: { task: newTask },
		timestamp: Date.now(),
		correlationId: taskId,
	}
	swarm.messages.push(message)
	bus.publish(message)

	log.info("Task delegated", { taskId, from: fromAgentId, to: toAgentId, title: task.title })
	return newTask
}

/**
 * Complete a task and report results back to the delegating agent.
 */
export function completeTask(
	swarm: SwarmState,
	taskId: string,
	result: unknown,
): void {
	const task = swarm.tasks.get(taskId)
	if (!task) return

	task.status = "completed"
	task.result = result
	task.completedAt = Date.now()

	// Update agent status
	const agent = swarm.agents.get(task.assignedTo)
	if (agent) agent.status = "completed"

	// Notify the delegating agent
	if (task.assignedBy) {
		const bus = getBus()
		const message: AgentMessage = {
			id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			from: task.assignedTo,
			to: task.assignedBy,
			type: "task_result",
			payload: { taskId, result },
			timestamp: Date.now(),
			correlationId: taskId,
		}
		swarm.messages.push(message)
		bus.publish(message)
	}

	log.info("Task completed", { taskId, assignedTo: task.assignedTo })
}

/**
 * Share context between agents.
 */
export function shareContext(
	swarm: SwarmState,
	fromAgentId: string,
	toAgentId: string,
	context: Record<string, unknown>,
): void {
	const bus = getBus()
	const message: AgentMessage = {
		id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		from: fromAgentId,
		to: toAgentId,
		type: "context_share",
		payload: context,
		timestamp: Date.now(),
	}
	swarm.messages.push(message)
	bus.publish(message)
}

/**
 * Get all pending tasks for an agent.
 */
export function getPendingTasks(swarm: SwarmState, agentId: string): SwarmTask[] {
	return Array.from(swarm.tasks.values()).filter(
		(t) => t.assignedTo === agentId && t.status === "pending",
	)
}

/**
 * Check if all dependencies for a task are completed.
 */
export function areDependenciesMet(swarm: SwarmState, taskId: string): boolean {
	const task = swarm.tasks.get(taskId)
	if (!task) return false
	return task.dependencies.every((depId) => {
		const dep = swarm.tasks.get(depId)
		return dep?.status === "completed"
	})
}

/**
 * Get swarm status summary.
 */
export function getSwarmSummary(swarm: SwarmState): {
	totalAgents: number
	totalTasks: number
	completedTasks: number
	failedTasks: number
	pendingTasks: number
	agentStatuses: Array<{ id: string; role: AgentRole; status: AgentStatus }>
} {
	const agents = Array.from(swarm.agents.values())
	const tasks = Array.from(swarm.tasks.values())

	return {
		totalAgents: agents.length,
		totalTasks: tasks.length,
		completedTasks: tasks.filter((t) => t.status === "completed").length,
		failedTasks: tasks.filter((t) => t.status === "failed").length,
		pendingTasks: tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
		agentStatuses: agents.map((a) => ({ id: a.id, role: a.role, status: a.status })),
	}
}

/**
 * Create a standard code review swarm:
 * Architect designs → Coder implements → Reviewer reviews → Tester tests
 */
export function createCodeReviewSwarm(createdBy: string): SwarmState {
	return createSwarm(
		[
			{ role: "architect", name: "Architect", capabilities: ["design", "planning", "refactor"] },
			{ role: "coder", name: "Coder", capabilities: ["implementation", "bug-fix", "optimization"] },
			{ role: "reviewer", name: "Reviewer", capabilities: ["code-review", "security", "best-practices"] },
			{ role: "tester", name: "Tester", capabilities: ["testing", "validation", "edge-cases"] },
		],
		createdBy,
	)
}

/**
 * Cleanup swarm resources.
 */
export function destroySwarm(swarm: SwarmState): void {
	swarm.status = "completed"
	swarm.agents.clear()
	swarm.tasks.clear()
	swarm.messages = []
	log.info("Swarm destroyed", { swarmId: swarm.id })
}
