/**
 * REST API Settings - Configure REST API and Cloudflare Tunnel.
 * Premium design matching theme tokens.
 */

import { useCallback, useEffect, useState } from "react"
import {
	KeyIcon,
	PlusIcon,
	TrashIcon,
	CopyIcon,
	CheckIcon,
	ExternalLinkIcon,
	ServerIcon,
	GlobeIcon,
	ShieldIcon,
	ZapIcon,
} from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Switch } from "@devil-ai/ui/components/switch"
import { Badge } from "@devil-ai/ui/components/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@devil-ai/ui/components/tooltip"
import { SettingsSection } from "./settings-section"
import { SettingsRow } from "./settings-row"

interface ApiKeyInfo {
	id: string
	name: string
	key?: string
	createdAt: string
	lastUsedAt?: string
	expiresAt?: string
}

interface RestApiStatus {
	running: boolean
	url?: string
	tunnelUrl?: string
}

export function RestApiSettings() {
	const [status, setStatus] = useState<RestApiStatus>({ running: false })
	const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [newKeyName, setNewKeyName] = useState("")
	const [showNewKey, setShowNewKey] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	const [config, setConfig] = useState({
		enabled: true,
		port: 3100,
		enableCors: true,
		allowedOrigins: [] as string[],
		requireAuth: true,
		apiKey: "",
		enableTunnel: true,
	})

	const loadStatus = useCallback(async () => {
		try {
			const s = await window.devilAi?.restApi?.getStatus?.()
			if (s) setStatus(s)
		} catch (err) {
			console.error("Failed to load status", err)
		}
	}, [])

	const loadKeys = useCallback(async () => {
		try {
			const keys = await window.devilAi?.restApi?.listKeys?.()
			if (keys) setApiKeys(keys)
		} catch (err) {
			console.error("Failed to load keys", err)
		}
	}, [])

	useEffect(() => {
		loadStatus()
		loadKeys()
	}, [loadStatus, loadKeys])

	const handleStart = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await window.devilAi?.restApi?.start?.(config)
			if (result) {
				setStatus({ running: true, url: result.url, tunnelUrl: result.tunnelUrl })
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start REST API")
		} finally {
			setLoading(false)
		}
	}, [config])

	const handleStop = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			await window.devilAi?.restApi?.stop?.()
			setStatus({ running: false })
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to stop REST API")
		} finally {
			setLoading(false)
		}
	}, [])

	const handleGenerateKey = useCallback(async () => {
		if (!newKeyName.trim()) return
		try {
			const key = await window.devilAi?.restApi?.generateKey?.(newKeyName)
			if (key) {
				setShowNewKey(key.key)
				setNewKeyName("")
				await loadKeys()
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate key")
		}
	}, [newKeyName, loadKeys])

	const handleRevokeKey = useCallback(
		async (key: string) => {
			try {
				await window.devilAi?.restApi?.revokeKey?.(key)
				await loadKeys()
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to revoke key")
			}
		},
		[loadKeys],
	)

	const handleCopyKey = useCallback(() => {
		if (showNewKey) {
			navigator.clipboard.writeText(showNewKey)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}, [showNewKey])

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleString()
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl font-semibold">REST API & Cloudflare Tunnel</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Expose Devil AI via REST API with optional Cloudflare tunnel for external access
				</p>
			</div>

			{/* Status & Quick Actions */}
			<SettingsSection title="Server Status" description="Start or stop the REST API server">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className={`flex items-center justify-center size-10 rounded-lg ${status.running ? "bg-emerald-500/10" : "bg-muted"}`}>
							<ServerIcon className={`size-5 ${status.running ? "text-emerald-500" : "text-muted-foreground"}`} />
						</div>
						<div>
							<p className="text-sm font-medium">
								{status.running ? "Server Running" : "Server Stopped"}
							</p>
							<p className="text-xs text-muted-foreground">
								Port {config.port} • {config.enableTunnel ? "Tunnel enabled" : "Local only"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant={status.running ? "default" : "secondary"}>
							{status.running ? "Active" : "Inactive"}
						</Badge>
						{status.running ? (
							<Button variant="destructive" size="sm" onClick={handleStop} disabled={loading}>
								Stop
							</Button>
						) : (
							<Button size="sm" onClick={handleStart} disabled={loading}>
								<ZapIcon className="mr-1.5 size-3.5" />
								Start
							</Button>
						)}
					</div>
				</div>

				{error && (
					<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}

				{status.running && (
					<div className="rounded-lg bg-muted/50 p-4 space-y-3">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoints</p>
						<div className="flex items-center gap-2">
							<code className="text-xs font-mono flex-1 truncate">{status.url}</code>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											variant="ghost"
											size="sm"
											className="h-7 px-2"
											onClick={() => navigator.clipboard.writeText(status.url || "")}
										>
											<CopyIcon className="size-3" />
										</Button>
									}
								>
									Copy
								</TooltipTrigger>
								<TooltipContent>Copy URL</TooltipContent>
							</Tooltip>
						</div>
						{status.tunnelUrl && (
							<div className="flex items-center gap-2">
								<code className="text-xs font-mono flex-1 truncate">{status.tunnelUrl}</code>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2"
												onClick={() => window.open(status.tunnelUrl, "_blank")}
											>
												<ExternalLinkIcon className="size-3" />
											</Button>
										}
									>
										Open
									</TooltipTrigger>
									<TooltipContent>Open tunnel URL</TooltipContent>
								</Tooltip>
							</div>
						)}
					</div>
				)}
			</SettingsSection>

			{/* Configuration */}
			<SettingsSection title="Configuration" description="Server settings (stop server to change)">
				<SettingsRow label="Port" description="Local port for the REST API server">
					<Input
						type="number"
						value={config.port}
						onChange={(e) => setConfig((prev) => ({ ...prev, port: Number(e.target.value) }))}
						disabled={status.running}
						className="w-24 h-8 text-sm"
					/>
				</SettingsRow>

				<SettingsRow label="API Key" description="Custom API key for authentication (optional)">
					<Input
						type="password"
						placeholder="Custom key"
						value={config.apiKey}
						onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
						disabled={status.running}
						className="w-48 h-8 text-sm"
					/>
				</SettingsRow>

				<SettingsRow label="Enable CORS" description="Allow cross-origin requests from web browsers">
					<Switch
						checked={config.enableCors}
						onCheckedChange={(v) => setConfig((prev) => ({ ...prev, enableCors: v }))}
						disabled={status.running}
					/>
				</SettingsRow>

				<SettingsRow label="Require Authentication" description="Require API key for all requests">
					<Switch
						checked={config.requireAuth}
						onCheckedChange={(v) => setConfig((prev) => ({ ...prev, requireAuth: v }))}
						disabled={status.running}
					/>
				</SettingsRow>

				<SettingsRow label="Cloudflare Tunnel" description="Expose server via Cloudflare tunnel for external access">
					<Switch
						checked={config.enableTunnel}
						onCheckedChange={(v) => setConfig((prev) => ({ ...prev, enableTunnel: v }))}
						disabled={status.running}
					/>
				</SettingsRow>
			</SettingsSection>

			{/* API Keys */}
			<SettingsSection title="API Keys" description="Manage keys for authenticating with the API">
				{showNewKey && (
					<div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
						<div className="flex items-center gap-2">
							<KeyIcon className="size-4 text-emerald-500" />
							<p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Key Generated</p>
						</div>
						<code className="text-xs font-mono break-all block">{showNewKey}</code>
						<p className="text-xs text-muted-foreground">Copy this key now — it won't be shown again.</p>
						<div className="flex gap-2">
							<Button size="sm" onClick={handleCopyKey}>
								{copied ? <CheckIcon className="mr-1.5 size-3.5" /> : <CopyIcon className="mr-1.5 size-3.5" />}
								{copied ? "Copied" : "Copy Key"}
							</Button>
							<Button size="sm" variant="ghost" onClick={() => setShowNewKey(null)}>
								Done
							</Button>
						</div>
					</div>
				)}

				<div className="flex items-center gap-2">
					<Input
						placeholder="Key name"
						value={newKeyName}
						onChange={(e) => setNewKeyName(e.target.value)}
						className="h-8 text-sm"
					/>
					<Button size="sm" onClick={handleGenerateKey} disabled={!newKeyName.trim()}>
						<PlusIcon className="mr-1.5 size-3.5" />
						Generate
					</Button>
				</div>

				{apiKeys.length > 0 ? (
					<div className="space-y-2">
						{apiKeys.map((key) => (
							<div
								key={key.id}
								className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
							>
								<div>
									<p className="text-sm font-medium">{key.name}</p>
									<p className="text-xs text-muted-foreground">
										Created {formatDate(key.createdAt)}
										{key.lastUsedAt && ` • Last used ${formatDate(key.lastUsedAt)}`}
									</p>
								</div>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
												onClick={() => handleRevokeKey(key.id)}
											>
												<TrashIcon className="size-3.5" />
											</Button>
										}
									>
										Revoke
									</TooltipTrigger>
									<TooltipContent>Revoke key</TooltipContent>
								</Tooltip>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-muted-foreground py-2">No API keys generated yet</p>
				)}
			</SettingsSection>

			{/* Documentation */}
			<SettingsSection title="API Documentation" description="Quick reference for using the REST API">
				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<ShieldIcon className="size-4 text-muted-foreground" />
							<h3 className="text-sm font-medium">Authentication</h3>
						</div>
						<p className="text-xs text-muted-foreground">
							Include your API key in the request header:
						</p>
						<pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
							Authorization: Bearer dai_your_api_key_here
						</pre>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<GlobeIcon className="size-4 text-muted-foreground" />
							<h3 className="text-sm font-medium">Endpoints</h3>
						</div>
						<div className="grid gap-1.5">
							<div className="flex items-center gap-3 text-xs">
								<code className="font-mono bg-muted px-1.5 py-0.5 rounded">GET</code>
								<code className="font-mono">/health</code>
								<span className="text-muted-foreground">Health check (no auth)</span>
							</div>
							<div className="flex items-center gap-3 text-xs">
								<code className="font-mono bg-muted px-1.5 py-0.5 rounded">GET</code>
								<code className="font-mono">/api/status</code>
								<span className="text-muted-foreground">Version and features</span>
							</div>
							<div className="flex items-center gap-3 text-xs">
								<code className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">POST</code>
								<code className="font-mono">/api/chat</code>
								<span className="text-muted-foreground">Send chat prompt</span>
							</div>
							<div className="flex items-center gap-3 text-xs">
								<code className="font-mono bg-muted px-1.5 py-0.5 rounded">GET</code>
								<code className="font-mono">/api/sessions</code>
								<span className="text-muted-foreground">List active sessions</span>
							</div>
							<div className="flex items-center gap-3 text-xs">
								<code className="font-mono bg-muted px-1.5 py-0.5 rounded">GET</code>
								<code className="font-mono">/api/automations</code>
								<span className="text-muted-foreground">List automations</span>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="text-sm font-medium">Example: Chat Request</h3>
						<pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${status.url || "http://localhost:3100"}/api/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello Devil AI"}'`}
						</pre>
					</div>
				</div>
			</SettingsSection>
		</div>
	)
}
