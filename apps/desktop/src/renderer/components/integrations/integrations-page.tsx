/**
 * Jira/Linear Integration page — Link sessions to tickets.
 * 
 * Requires API tokens stored in credential store.
 */

import { useCallback, useEffect, useState } from "react"
import { LinkIcon, CheckIcon, RefreshCwIcon, Loader2Icon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Card, CardContent, CardHeader, CardTitle } from "@devil-ai/ui/components/card"
import { Badge } from "@devil-ai/ui/components/badge"

interface TicketLink {
	id: string
	provider: "jira" | "linear"
	ticketId: string
	title: string
	status: string
	sessionId?: string
}

export function IntegrationsPage() {
	const [jiraUrl, setJiraUrl] = useState("")
	const [jiraEmail, setJiraEmail] = useState("")
	const [jiraToken, setJiraToken] = useState("")
	const [linearToken, setLinearToken] = useState("")
	
	const [activeTasks, setActiveTasks] = useState<TicketLink[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		// Load config on mount
		window.devilAi.integrations.getConfig().then((config) => {
			setJiraUrl(config.jiraUrl || "")
			setJiraEmail(config.jiraEmail || "")
			setJiraToken(config.jiraToken || "")
			setLinearToken(config.linearToken || "")
		})
		
		fetchTasks()
	}, [])

	const fetchTasks = useCallback(async () => {
		setIsLoading(true)
		try {
			const tasks = await window.devilAi.integrations.fetchTasks()
			setActiveTasks(tasks)
		} catch (err) {
			console.error("Failed to fetch tasks", err)
		} finally {
			setIsLoading(false)
		}
	}, [])

	const handleSaveConfig = useCallback(async () => {
		setIsSaving(true)
		try {
			await window.devilAi.integrations.setConfig({
				jiraUrl,
				jiraEmail,
				jiraToken,
				linearToken
			})
			await fetchTasks() // Refresh tasks after saving new config
		} catch (err) {
			console.error("Failed to save config", err)
		} finally {
			setIsSaving(false)
		}
	}, [jiraUrl, jiraEmail, jiraToken, linearToken, fetchTasks])

	return (
		<div className="mx-auto max-w-4xl space-y-6 pb-10 mt-6 px-6">
			<div>
				<h2 className="text-2xl font-bold">Integrations</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Connect with project management tools to link sessions to tickets.
				</p>
			</div>

			{/* Configuration */}
			<div className="grid grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Jira</Badge>
							Configuration
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<label className="mb-1 block text-xs font-medium">Jira URL</label>
							<Input
								value={jiraUrl}
								onChange={(e) => setJiraUrl(e.target.value)}
								placeholder="your-domain.atlassian.net"
								className="text-sm"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium">Email Address</label>
							<Input
								value={jiraEmail}
								onChange={(e) => setJiraEmail(e.target.value)}
								type="email"
								placeholder="you@company.com"
								className="text-sm"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium">API Token</label>
							<Input
								value={jiraToken}
								onChange={(e) => setJiraToken(e.target.value)}
								type="password"
								placeholder="Your Jira API token"
								className="text-sm"
							/>
						</div>
						<Button size="sm" onClick={handleSaveConfig} disabled={isSaving}>
							{isSaving ? <Loader2Icon className="mr-1 size-3 animate-spin" /> : <CheckIcon className="mr-1 size-3" />}
							Save
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<Badge variant="outline" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">Linear</Badge>
							Configuration
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<label className="mb-1 block text-xs font-medium">Personal API Key</label>
							<Input
								value={linearToken}
								onChange={(e) => setLinearToken(e.target.value)}
								type="password"
								placeholder="lin_api_..."
								className="text-sm"
							/>
						</div>
						<Button size="sm" onClick={handleSaveConfig} disabled={isSaving}>
							{isSaving ? <Loader2Icon className="mr-1 size-3 animate-spin" /> : <CheckIcon className="mr-1 size-3" />}
							Save
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Linked Tickets / Active Tasks */}
			<div className="pt-4">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-medium">Active Assigned Tasks</h3>
					<Button size="sm" variant="outline" onClick={fetchTasks} disabled={isLoading}>
						<RefreshCwIcon className={`mr-1 size-3 ${isLoading ? "animate-spin" : ""}`} />
						Refresh
					</Button>
				</div>
				
				<div className="space-y-2">
					{isLoading && activeTasks.length === 0 ? (
						<div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
							<Loader2Icon className="mr-2 size-4 animate-spin" /> Fetching tasks...
						</div>
					) : activeTasks.length === 0 ? (
						<div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
							No active tasks found. Configure your integration or check your assignments.
						</div>
					) : (
						activeTasks.map((ticket) => (
							<div
								key={ticket.id}
								className="flex items-center justify-between rounded-md border bg-card p-3 shadow-sm transition-colors hover:bg-accent/50"
							>
								<div className="flex items-center gap-3">
									<Badge variant={ticket.provider === "jira" ? "default" : "secondary"}>
										{ticket.provider.toUpperCase()}
									</Badge>
									<span className="font-mono text-xs text-muted-foreground">
										{ticket.ticketId}
									</span>
									<span className="text-sm font-medium">{ticket.title}</span>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline">{ticket.status}</Badge>
									<Button size="sm" variant="ghost" className="h-8 w-8 p-0">
										<LinkIcon className="size-4" />
									</Button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}
