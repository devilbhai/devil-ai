/**
 * IPC handlers for Multi-Agent Orchestrator.
 */

import { ipcMain } from "electron"
import { createLogger } from "../logger"
import { withLogging } from "./utils"
import {
	createSwarm,
	createCodeReviewSwarm,
	delegateTask,
	completeTask,
	shareContext,
	getPendingTasks,
	getSwarmSummary,
	destroySwarm,
	type AgentRole,
	type SwarmState,
} from "../multi-agent-orchestrator"

const log = createLogger("ipc-multi-agent")

// Active swarms registry
const activeSwarms = new Map<string, SwarmState>()

function getSwarm(id: string): SwarmState | undefined {
	return activeSwarms.get(id)
}

export function registerMultiAgentIpc(): void {
	ipcMain.handle(
		"multi-agent:createSwarm",
		withLogging("multi-agent:createSwarm", (_event, args: {
			agents: Array<{ role: AgentRole; name: string; capabilities?: string[] }>
			createdBy: string
		}) => {
			const swarm = createSwarm(args.agents, args.createdBy)
			activeSwarms.set(swarm.id, swarm)
			return { success: true, swarmId: swarm.id, agents: Array.from(swarm.agents.values()) }
		}),
	)

	ipcMain.handle(
		"multi-agent:createCodeReviewSwarm",
		withLogging("multi-agent:createCodeReviewSwarm", (_event, args: { createdBy: string }) => {
			const swarm = createCodeReviewSwarm(args.createdBy)
			activeSwarms.set(swarm.id, swarm)
			return { success: true, swarmId: swarm.id, agents: Array.from(swarm.agents.values()) }
		}),
	)

	ipcMain.handle(
		"multi-agent:delegateTask",
		withLogging("multi-agent:delegateTask", (_event, args: {
			swarmId: string
			fromAgentId: string
			toAgentId: string
			title: string
			description: string
			priority?: number
		}) => {
			const swarm = getSwarm(args.swarmId)
			if (!swarm) return { success: false, error: "Swarm not found" }
			const task = delegateTask(swarm, args.fromAgentId, args.toAgentId, {
				title: args.title,
				description: args.description,
				priority: args.priority ?? 0,
			})
			return { success: true, task }
		}),
	)

	ipcMain.handle(
		"multi-agent:completeTask",
		withLogging("multi-agent:completeTask", (_event, args: {
			swarmId: string
			taskId: string
			result: unknown
		}) => {
			const swarm = getSwarm(args.swarmId)
			if (!swarm) return { success: false, error: "Swarm not found" }
			completeTask(swarm, args.taskId, args.result)
			return { success: true }
		}),
	)

	ipcMain.handle(
		"multi-agent:shareContext",
		withLogging("multi-agent:shareContext", (_event, args: {
			swarmId: string
			fromAgentId: string
			toAgentId: string
			context: Record<string, unknown>
		}) => {
			const swarm = getSwarm(args.swarmId)
			if (!swarm) return { success: false, error: "Swarm not found" }
			shareContext(swarm, args.fromAgentId, args.toAgentId, args.context)
			return { success: true }
		}),
	)

	ipcMain.handle(
		"multi-agent:getPendingTasks",
		withLogging("multi-agent:getPendingTasks", (_event, args: {
			swarmId: string
			agentId: string
		}) => {
			const swarm = getSwarm(args.swarmId)
			if (!swarm) return { success: false, error: "Swarm not found" }
			return { success: true, tasks: getPendingTasks(swarm, args.agentId) }
		}),
	)

	ipcMain.handle(
		"multi-agent:getSummary",
		withLogging("multi-agent:getSummary", (_event, args: { swarmId: string }) => {
			const swarm = getSwarm(args.swarmId)
			if (!swarm) return { success: false, error: "Swarm not found" }
			return { success: true, summary: getSwarmSummary(swarm) }
		}),
	)

	ipcMain.handle(
		"multi-agent:destroy",
		withLogging("multi-agent:destroy", (_event, args: { swarmId: string }) => {
			const swarm = getSwarm(args.swarmId)
			if (!swarm) return { success: false, error: "Swarm not found" }
			destroySwarm(swarm)
			activeSwarms.delete(args.swarmId)
			return { success: true }
		}),
	)

	ipcMain.handle(
		"multi-agent:listSwarms",
		withLogging("multi-agent:listSwarms", () => {
			const swarms = Array.from(activeSwarms.values()).map((s) => ({
				id: s.id,
				status: s.status,
				agentCount: s.agents.size,
				taskCount: s.tasks.size,
				createdAt: s.createdAt,
			}))
			return { success: true, swarms }
		}),
	)

	log.info("Multi-Agent IPC handlers registered")
}
