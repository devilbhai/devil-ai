/**
 * Agent Profiling Dashboard — behavior analysis and tuning.
 */
import { useAtom, useAtomValue } from "jotai"
import {
	agentProfileAtom,
	agentTuningAtom,
	toolUsageChartAtom,
} from "../../atoms/agent-profiling"

export function ProfilingDashboard() {
	const profile = useAtomValue(agentProfileAtom)
	const [tuning, setTuning] = useAtom(agentTuningAtom)
	const toolUsage = useAtomValue(toolUsageChartAtom)

	return (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold">Agent Profiling</h3>

			{/* Key Metrics */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<MetricCard
					label="Sessions Analyzed"
					value={profile.totalSessions.toString()}
				/>
				<MetricCard
					label="Total Cost"
					value={`$${profile.totalCost.toFixed(2)}`}
				/>
				<MetricCard
					label="Prompt Effectiveness"
					value={`${profile.promptEffectiveness}%`}
					color={
						profile.promptEffectiveness >= 70
							? "text-green-500"
							: profile.promptEffectiveness >= 40
								? "text-yellow-500"
								: "text-red-500"
					}
				/>
				<MetricCard
					label="Active Work Time"
					formatTime={profile.activeWorkTime}
				/>
			</div>

			{/* Tool Usage */}
			{toolUsage.length > 0 && (
				<div className="rounded-lg border border-border p-4">
					<h4 className="mb-3 text-sm font-medium">Tool Usage</h4>
					<div className="space-y-2">
						{toolUsage.slice(0, 8).map((item) => (
							<div key={item.tool} className="flex items-center gap-3">
								<span className="w-32 truncate font-mono text-xs">
									{item.tool}
								</span>
								<div className="flex-1">
									<div className="h-2 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full bg-primary"
											style={{ width: `${item.percent}%` }}
										/>
									</div>
								</div>
								<span className="w-12 text-right text-xs text-muted-foreground">
									{item.count}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Tuning Controls */}
			<div className="rounded-lg border border-border p-4">
				<h4 className="mb-3 text-sm font-medium">Behavior Tuning</h4>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{/* Aggressiveness */}
					<div>
						<label className="text-xs text-muted-foreground">
							Edit Aggressiveness
						</label>
						<div className="mt-2 flex gap-1">
							{(["conservative", "balanced", "aggressive"] as const).map(
								(level) => (
									<button
										key={level}
										type="button"
										onClick={() =>
											setTuning({ ...tuning, aggressiveness: level })
										}
										className={`flex-1 rounded py-1.5 text-xs transition-colors ${
											tuning.aggressiveness === level
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground hover:text-foreground"
										}`}
									>
										{level}
									</button>
								),
							)}
						</div>
					</div>

					{/* Auto-approve threshold */}
					<div>
						<label className="text-xs text-muted-foreground">
							Auto-Approve Threshold: {Math.round(tuning.autoApproveThreshold * 100)}%
						</label>
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={tuning.autoApproveThreshold}
							onChange={(e) =>
								setTuning({
									...tuning,
									autoApproveThreshold: Number.parseFloat(e.target.value),
								})
							}
							className="mt-2 w-full accent-primary"
						/>
					</div>

					{/* Max retries */}
					<div>
						<label className="text-xs text-muted-foreground">
							Max Retries: {tuning.maxRetries}
						</label>
						<input
							type="range"
							min="0"
							max="10"
							step="1"
							value={tuning.maxRetries}
							onChange={(e) =>
								setTuning({
									...tuning,
									maxRetries: Number.parseInt(e.target.value),
								})
							}
							className="mt-2 w-full accent-primary"
						/>
					</div>

					{/* Context target */}
					<div>
						<label className="text-xs text-muted-foreground">
							Context Utilization: {Math.round(tuning.contextTarget * 100)}%
						</label>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							value={tuning.contextTarget}
							onChange={(e) =>
								setTuning({
									...tuning,
									contextTarget: Number.parseFloat(e.target.value),
								})
							}
							className="mt-2 w-full accent-primary"
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

function MetricCard({
	label,
	value,
	color,
	formatTime,
}: {
	label: string
	value?: string
	color?: string
	formatTime?: number
}) {
	const display =
		formatTime !== undefined
			? `${Math.round(formatTime / 60)}m`
			: value ?? "—"

	return (
		<div className="rounded-lg border border-border p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className={`mt-1 text-xl font-bold ${color ?? ""}`}>{display}</p>
		</div>
	)
}
