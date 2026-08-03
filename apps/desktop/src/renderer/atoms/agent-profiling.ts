/**
 * Agent Profiling atoms — behavior analysis and tuning dashboard.
 */
import { atom } from "jotai"

export interface AgentProfile {
	/** Tool usage breakdown */
	toolUsage: Record<string, number>
	/** Average turns to completion by task type */
	avgTurnsByTask: Record<string, number>
	/** Success rate by model */
	successRateByModel: Record<string, number>
	/** Time spent waiting for permissions vs working */
	permissionWaitTime: number
	activeWorkTime: number
	/** Prompt effectiveness score (0-100) */
	promptEffectiveness: number
	/** Total sessions analyzed */
	totalSessions: number
	/** Total cost across all sessions */
	totalCost: number
}

export interface AgentTuning {
	/** Aggressiveness: "conservative" | "balanced" | "aggressive" */
	aggressiveness: "conservative" | "balanced" | "aggressive"
	/** Auto-approve permission threshold */
	autoApproveThreshold: number
	/** Max retries on failure */
	maxRetries: number
	/** Context window utilization target */
	contextTarget: number
}

export const agentProfileAtom = atom<AgentProfile>({
	toolUsage: {},
	avgTurnsByTask: {},
	successRateByModel: {},
	permissionWaitTime: 0,
	activeWorkTime: 0,
	promptEffectiveness: 0,
	totalSessions: 0,
	totalCost: 0,
})

export const agentTuningAtom = atom<AgentTuning>({
	aggressiveness: "balanced",
	autoApproveThreshold: 0.8,
	maxRetries: 3,
	contextTarget: 0.7,
})

export const profileLoadingAtom = atom<boolean>(false)

export const toolUsageChartAtom = atom((get) => {
	const { toolUsage } = get(agentProfileAtom)
	const total = Object.values(toolUsage).reduce((sum, count) => sum + count, 0)
	if (!total) return []
	return Object.entries(toolUsage)
		.map(([tool, count]) => ({
			tool,
			count,
			percent: (count / total) * 100,
		}))
		.sort((a, b) => b.count - a.count)
})
