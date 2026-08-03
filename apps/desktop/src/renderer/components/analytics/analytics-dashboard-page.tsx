/**
 * Analytics Dashboard page — Usage stats, cost breakdown, productivity metrics.
 */

import { useEffect, useState } from "react"
import { ClockIcon, CoinsIcon, ZapIcon, BrainIcon, CodeIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@devil-ai/ui/components/card"

interface AnalyticsData {
	totalSessions: number
	totalTokensUsed: number
	estimatedCost: number
	avgSessionDuration: number
	mostUsedSkills: { name: string; count: number }[]
	sessionsByDay: { date: string; count: number }[]
	topModels: { name: string; usage: number }[]
}

const MOCK_DATA: AnalyticsData = {
	totalSessions: 0,
	totalTokensUsed: 0,
	estimatedCost: 0,
	avgSessionDuration: 0,
	mostUsedSkills: [],
	sessionsByDay: [],
	topModels: [],
}

export function AnalyticsDashboardPage() {
	const [data, setData] = useState<AnalyticsData>(MOCK_DATA)

	useEffect(() => {
		async function fetchData() {
			try {
				const stats = await window.devilAi.analytics.getDashboardStats()
				setData(stats)
			} catch (err) {
				console.error("Failed to load analytics", err)
			}
		}
		fetchData()
	}, [])

	return (
		<div className="mx-auto max-w-6xl space-y-6 pb-10">
			<div>
				<h2 className="text-2xl font-bold">Analytics Dashboard</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Track your usage, costs, and productivity metrics.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
						<ZapIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.totalSessions}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
						<BrainIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.totalTokensUsed.toLocaleString()}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
						<CoinsIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${data.estimatedCost.toFixed(2)}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Avg Session</CardTitle>
						<ClockIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.avgSessionDuration}m</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Sessions Over Time</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex h-48 items-end gap-1">
							{data.sessionsByDay.length === 0 ? (
								<div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
									No session data yet
								</div>
							) : (
								data.sessionsByDay.map((d, i) => (
									<div
										key={i}
										className="flex-1 rounded-t bg-primary/20"
										style={{ height: `${(d.count / Math.max(...data.sessionsByDay.map((s) => s.count))) * 100}%` }}
										title={`${d.date}: ${d.count} sessions`}
									/>
								))
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Most Used Skills</CardTitle>
					</CardHeader>
					<CardContent>
						{data.mostUsedSkills.length === 0 ? (
							<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
								No skill usage data yet
							</div>
						) : (
							<div className="space-y-2">
								{data.mostUsedSkills.map((skill) => (
									<div key={skill.name} className="flex items-center gap-2">
										<span className="flex-1 text-sm">{skill.name}</span>
										<div className="h-2 w-32 rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-primary"
												style={{ width: `${(skill.count / data.mostUsedSkills[0].count) * 100}%` }}
											/>
										</div>
										<span className="text-xs text-muted-foreground">{skill.count}</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Top Models */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Top Models</CardTitle>
				</CardHeader>
				<CardContent>
					{data.topModels.length === 0 ? (
						<div className="py-8 text-center text-sm text-muted-foreground">
							No model usage data yet. Start a session to begin tracking.
						</div>
					) : (
						<div className="space-y-3">
							{data.topModels.map((model) => (
								<div key={model.name} className="flex items-center gap-3">
									<CodeIcon className="size-4 text-muted-foreground" />
									<span className="flex-1 text-sm">{model.name}</span>
									<div className="h-2 w-48 rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary"
											style={{ width: `${(model.usage / data.topModels[0].usage) * 100}%` }}
										/>
									</div>
									<span className="text-xs text-muted-foreground">{model.usage} sessions</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
