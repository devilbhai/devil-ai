/**
 * Cost Budget atoms — per-task spending limits with real-time tracking.
 */
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export interface BudgetConfig {
	/** Maximum allowed cost in USD. null = no limit. */
	maxCost: number | null
	/** Action when limit reached: "warn" | "abort" | "pause" */
	onExceed: "warn" | "abort" | "pause"
}

export interface CostBudgetState {
	/** Current session budget config */
	sessionBudget: BudgetConfig
	/** Accumulated cost for current session (USD) */
	currentCost: number
	/** Whether budget limit was hit */
	exceeded: boolean
	/** Alert shown to user */
	alertMessage: string | null
}

export const DEFAULT_BUDGET: BudgetConfig = {
	maxCost: null,
	onExceed: "warn",
}

export const costBudgetAtom = atom<CostBudgetState>({
	sessionBudget: DEFAULT_BUDGET,
	currentCost: 0,
	exceeded: false,
	alertMessage: null,
})

export const globalBudgetAtom = atomWithStorage<BudgetConfig>("devil-ai:budget", DEFAULT_BUDGET)

export const setSessionBudgetAtom = atom(
	null,
	(_get, set, budget: BudgetConfig) => {
		set(costBudgetAtom, (prev) => ({
			...prev,
			sessionBudget: budget,
			exceeded: false,
			alertMessage: null,
		}))
	},
)

export const addCostAtom = atom(
	null,
	(get, set, amount: number) => {
		const state = get(costBudgetAtom)
		const newCost = state.currentCost + amount
		const exceeded =
			state.sessionBudget.maxCost !== null && newCost >= state.sessionBudget.maxCost

		let alertMessage = state.alertMessage
		if (exceeded && !state.exceeded) {
			switch (state.sessionBudget.onExceed) {
				case "abort":
					alertMessage = `Budget limit $${state.sessionBudget.maxCost} exceeded. Session will be aborted.`
					break
				case "pause":
					alertMessage = `Budget limit $${state.sessionBudget.maxCost} exceeded. Session paused.`
					break
				default:
					alertMessage = `Warning: Budget $${newCost.toFixed(2)} exceeds limit $${state.sessionBudget.maxCost}`
			}
		}

		set(costBudgetAtom, (prev) => ({
			...prev,
			currentCost: newCost,
			exceeded,
			alertMessage,
		}))
	},
)

export const resetBudgetAtom = atom(null, (_get, set) => {
	set(costBudgetAtom, {
		sessionBudget: DEFAULT_BUDGET,
		currentCost: 0,
		exceeded: false,
		alertMessage: null,
	})
})

export const budgetBarPercentAtom = atom((get) => {
	const { sessionBudget, currentCost } = get(costBudgetAtom)
	if (!sessionBudget.maxCost) return null
	return Math.min(100, (currentCost / sessionBudget.maxCost) * 100)
})
