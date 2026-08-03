/**
 * Cost Budget Bar — real-time spending tracker with budget limits.
 */
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import {
	budgetBarPercentAtom,
	costBudgetAtom,
	resetBudgetAtom,
	setSessionBudgetAtom,
	type BudgetConfig,
} from "../../atoms/cost-budget"
import { Button } from "@devil-ai/ui/components/button"

export function BudgetBar() {
	const budget = useAtomValue(costBudgetAtom)
	const percent = useAtomValue(budgetBarPercentAtom)
	const setBudget = useSetAtom(setSessionBudgetAtom)
	const reset = useSetAtom(resetBudgetAtom)
	const [showSettings, setShowSettings] = useState(false)

	if (!budget.sessionBudget.maxCost && !budget.currentCost) return null

	const getColor = () => {
		if (!percent) return "bg-primary"
		if (percent >= 100) return "bg-red-500"
		if (percent >= 80) return "bg-yellow-500"
		return "bg-primary"
	}

	return (
		<div className="flex items-center gap-3">
			{/* Cost display */}
			<div className="flex items-center gap-2 text-sm">
				<span className="text-muted-foreground">Cost:</span>
				<span className="font-mono font-medium">
					${budget.currentCost.toFixed(4)}
				</span>
				{budget.sessionBudget.maxCost && (
					<>
						<span className="text-muted-foreground">/</span>
						<span className="font-mono text-muted-foreground">
							${budget.sessionBudget.maxCost}
						</span>
					</>
				)}
			</div>

			{/* Progress bar */}
			{percent !== null && (
				<div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
					<div
						className={`h-full transition-all duration-300 ${getColor()}`}
						style={{ width: `${Math.min(percent, 100)}%` }}
					/>
				</div>
			)}

			{/* Alert badge */}
			{budget.exceeded && (
				<span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-500">
					LIMIT EXCEEDED
				</span>
			)}

			{/* Settings toggle */}
			<Button
				variant="ghost"
				size="sm"
				className="h-6 px-2 text-xs"
				onClick={() => setShowSettings(!showSettings)}
			>
				Budget
			</Button>

			{/* Settings dropdown */}
			{showSettings && (
				<div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg">
					<h4 className="mb-2 text-sm font-medium">Cost Budget</h4>
					<div className="space-y-2">
						<div>
							<label className="text-xs text-muted-foreground">
								Max Cost ($)
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								placeholder="No limit"
								defaultValue={budget.sessionBudget.maxCost ?? ""}
								onChange={(e) => {
									const val = e.target.value
										? Number.parseFloat(e.target.value)
										: null
									setBudget({ ...budget.sessionBudget, maxCost: val })
								}}
								className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
							/>
						</div>
						<div>
							<label className="text-xs text-muted-foreground">
								On Limit Exceeded
							</label>
							<select
								defaultValue={budget.sessionBudget.onExceed}
								onChange={(e) =>
									setBudget({
										...budget.sessionBudget,
										onExceed: e.target.value as BudgetConfig["onExceed"],
									})
								}
								className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
							>
								<option value="warn">Warn only</option>
								<option value="pause">Pause session</option>
								<option value="abort">Abort session</option>
							</select>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={() => {
								reset()
								setShowSettings(false)
							}}
						>
							Reset
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
