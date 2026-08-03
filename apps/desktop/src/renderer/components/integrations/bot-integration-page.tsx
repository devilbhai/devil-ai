/**
 * Slack/Discord Bot page — Configure bot for sharing session summaries.
 */

import { useCallback, useState } from "react"
import { SendIcon, AlertCircleIcon, MessageSquareIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Card, CardContent, CardHeader, CardTitle } from "@devil-ai/ui/components/card"
import { Badge } from "@devil-ai/ui/components/badge"
import { Switch } from "@devil-ai/ui/components/switch"

interface BotConfig {
	provider: "slack" | "discord"
	webhookUrl: string
	channelName: string
	isActive: boolean
	autoShare: boolean
}

export function BotIntegrationPage() {
	const [configs, setConfigs] = useState<BotConfig[]>([])
	const [newProvider, setNewProvider] = useState<"slack" | "discord">("slack")
	const [newWebhookUrl, setNewWebhookUrl] = useState("")
	const [newChannel, setNewChannel] = useState("")

	const handleAddConfig = useCallback(() => {
		if (!newWebhookUrl.trim()) return
		setConfigs((prev) => [
			...prev,
			{
				provider: newProvider,
				webhookUrl: newWebhookUrl,
				channelName: newChannel || "#general",
				isActive: true,
				autoShare: false,
			},
		])
		setNewWebhookUrl("")
		setNewChannel("")
	}, [newProvider, newWebhookUrl, newChannel])

	const handleToggleActive = useCallback((index: number) => {
		setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, isActive: !c.isActive } : c)))
	}, [])

	const handleToggleAutoShare = useCallback((index: number) => {
		setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, autoShare: !c.autoShare } : c)))
	}, [])

	const handleRemove = useCallback((index: number) => {
		setConfigs((prev) => prev.filter((_, i) => i !== index))
	}, [])

	return (
		<div className="mx-auto max-w-4xl space-y-6 pb-10">
			<div>
				<h2 className="text-2xl font-bold">Slack / Discord Bot</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Share session summaries and updates with your team via webhooks.
				</p>
			</div>

			{/* Add new config */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Add Webhook</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex gap-3">
						<select
							value={newProvider}
							onChange={(e) => setNewProvider(e.target.value as "slack" | "discord")}
							className="rounded-md border bg-background px-3 py-2 text-sm"
						>
							<option value="slack">Slack</option>
							<option value="discord">Discord</option>
						</select>
						<Input
							value={newWebhookUrl}
							onChange={(e) => setNewWebhookUrl(e.target.value)}
							placeholder="Webhook URL"
							className="flex-1"
						/>
						<Input
							value={newChannel}
							onChange={(e) => setNewChannel(e.target.value)}
							placeholder="Channel (e.g. #dev-updates)"
							className="w-48"
						/>
						<Button onClick={handleAddConfig}>
							<SendIcon className="mr-1 size-3" />
							Add
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Configured webhooks */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Configured Webhooks</CardTitle>
				</CardHeader>
				<CardContent>
					{configs.length === 0 ? (
						<div className="py-8 text-center text-sm text-muted-foreground">
							<MessageSquareIcon className="mx-auto mb-2 size-8 opacity-50" />
							<p>No webhooks configured</p>
							<p className="mt-1 text-xs">Add a Slack or Discord webhook to get started</p>
						</div>
					) : (
						<div className="space-y-3">
							{configs.map((config, index) => (
								<div key={index} className="flex items-center justify-between rounded-md border p-3">
									<div className="flex items-center gap-3">
										<Badge variant="outline">{config.provider}</Badge>
										<div>
											<p className="text-sm font-medium">{config.channelName}</p>
											<p className="text-xs text-muted-foreground truncate max-w-xs">{config.webhookUrl}</p>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground">Active</span>
											<Switch checked={config.isActive} onCheckedChange={() => handleToggleActive(index)} />
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground">Auto-share</span>
											<Switch checked={config.autoShare} onCheckedChange={() => handleToggleAutoShare(index)} />
										</div>
										<Button size="sm" variant="ghost" onClick={() => handleRemove(index)}>
											<AlertCircleIcon className="size-3 text-destructive" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
