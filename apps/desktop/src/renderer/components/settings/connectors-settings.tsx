import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Button } from "@devil-ai/ui/components/button"
import { Badge } from "@devil-ai/ui/components/badge"
import { Input } from "@devil-ai/ui/components/input"
import { CONNECTORS, CATEGORIES, type ConnectorDef, type ApiKeyField } from "../../lib/connectors-data"
import { getConnectorStatuses, setConnectorCredential, deleteConnectorCredential, testConnectorConnection } from "../../services/backend"
import { createLogger } from "../../lib/logger"
import { SearchIcon, PlugIcon, CheckCircle2Icon, XCircleIcon, ChevronRightIcon, SparklesIcon, ShieldIcon, GlobeIcon, MessageSquareIcon, MailIcon, CalendarIcon, CodeIcon, FolderIcon, LayoutIcon, BarChart3Icon, CreditCardIcon, WorkflowIcon, DatabaseIcon, ActivityIcon, Loader2Icon } from "lucide-react"

const log = createLogger("connectors")

// ============================================================
// Types
// ============================================================

interface ConnectorStatus {
	connected: boolean
	connectedAt?: number
	credentials?: Record<string, string>
}

// ============================================================
// Category Icons
// ============================================================

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
	messaging: MessageSquareIcon,
	email: MailIcon,
	calendar: CalendarIcon,
	dev: CodeIcon,
	project: FolderIcon,
	crm: LayoutIcon,
	storage: FolderIcon,
	design: SparklesIcon,
	analytics: BarChart3Icon,
	payments: CreditCardIcon,
	automation: WorkflowIcon,
	database: DatabaseIcon,
	web: GlobeIcon,
	monitoring: ActivityIcon,
}

// ============================================================
// OAuth flow handler
// ============================================================

async function startOAuthFlow(connector: ConnectorDef): Promise<void> {
	if (connector.auth.type !== "oauth") return

	const auth = connector.auth

	let url = auth.authorizationUrl
	if (auth.needsBackendProxy && (url.includes("localhost:3100") || url.includes("devil-ai.agribee.in"))) {
		// Use proxy URL directly
	} else {
		const clientId = localStorage.getItem(`connector_client_id_${connector.id}`)
		if (clientId && clientId.trim() !== "") {
			url = auth.authorizationUrl.replace(
				/client_id=([^&]+)/,
				(_m, _v) => `client_id=${clientId}`
			)
		}
	}

	log.info("Starting OAuth flow", { connector: connector.id })
	window.open(url, "_blank")

	// Poll server for pending token (deep link fallback)
	const stored = localStorage.getItem("devil-ai-user")
	const userEmail = stored ? (JSON.parse(stored).email || "") : ""
	if (userEmail) {
		const pollInterval = setInterval(async () => {
			try {
				const res = await fetch(
					`https://devil-ai.agribee.in/api/connectors/pending-tokens/poll?email=${encodeURIComponent(userEmail)}&provider=${connector.id}`
				)
				const data = await res.json()
				if (data.pending) {
					clearInterval(pollInterval)
					const credentials: Record<string, string> = { apiToken: data.accessToken }
					if (data.refreshToken) credentials.refreshToken = data.refreshToken
					if (data.expiresAt) credentials.expiry = data.expiresAt.toString()
					await setConnectorCredential(connector.id, credentials)
					log.info(`Got pending token for ${connector.id} via polling`)
					window.dispatchEvent(new CustomEvent("connector-authenticated", { detail: connector.id }))
				}
			} catch {
				// ignore poll errors
			}
		}, 2000)
		// Stop polling after 2 minutes
		setTimeout(() => clearInterval(pollInterval), 120000)
	}
}

// ============================================================
// Detailed API Key Dialog
// ============================================================

function ApiKeyDialog({
	connector,
	open,
	onClose,
	onSave,
}: {
	connector: ConnectorDef
	open: boolean
	onClose: () => void
	onSave: (credentials: Record<string, string>) => void
}) {
	const [values, setValues] = useState<Record<string, string>>({})
	const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
	const [testing, setTesting] = useState(false)
	const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

	if (!open || connector.auth.type === "oauth") return null

	const fields = "fields" in connector.auth ? connector.auth.fields : []

	const handleFieldChange = (name: string, value: string) => {
		setValues((prev) => ({ ...prev, [name]: value }))
		setTestResult(null)
	}

	const togglePassword = (name: string) => {
		setShowPasswords((prev) => ({ ...prev, [name]: !prev[name] }))
	}

	const allRequiredFilled = fields
		.filter((f) => f.required)
		.every((f) => values[f.name]?.trim())

	const handleTest = async () => {
		setTesting(true)
		setTestResult(null)
		try {
			const res = await testConnectorConnection(connector.id, values)
			setTestResult(res)
		} catch (err: any) {
			setTestResult({ success: false, message: err.message || "Test failed" })
		}
		setTesting(false)
	}

	const handleConnect = () => {
		onSave(values)
		setValues({})
		setTestResult(null)
	}

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
			<div
				className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-2xl border border-border/50 p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center gap-4 mb-6">
					<div
						className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg"
						style={{ backgroundColor: connector.iconBg }}
					>
						{connector.iconText}
					</div>
					<div>
						<h3 className="text-xl font-semibold">Connect {connector.name}</h3>
						<p className="text-sm text-muted-foreground">{connector.description}</p>
					</div>
				</div>

				{/* Fields */}
				<div className="space-y-4 mb-6">
					{fields.map((field: ApiKeyField) => (
						<div key={field.name}>
							<label className="block text-sm font-medium mb-2">
								{field.label}
								{field.required && <span className="text-red-500 ml-1">*</span>}
							</label>
							<div className="relative">
								<Input
									type={field.type === "password" && !showPasswords[field.name] ? "password" : "text"}
									placeholder={field.placeholder}
									value={values[field.name] || ""}
									onChange={(e) => handleFieldChange(field.name, e.target.value)}
									className={field.type === "password" ? "pr-20" : ""}
								/>
								{field.type === "password" && (
									<button
										type="button"
										onClick={() => togglePassword(field.name)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
									>
										{showPasswords[field.name] ? "Hide" : "Show"}
									</button>
								)}
							</div>
							{field.helpText && (
								<p className="text-xs text-muted-foreground mt-2">
									{field.helpText}
									{field.helpUrl && (
										<>
											{" "}
											<a
												href={field.helpUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												Open docs ↗
											</a>
										</>
									)}
								</p>
							)}
						</div>
					))}
				</div>

				{/* Test Result */}
				{testResult && (
					<div
						className={`p-4 rounded-xl text-sm mb-6 ${
							testResult.success
								? "bg-green-500/10 text-green-600 border border-green-500/20"
								: "bg-red-500/10 text-red-600 border border-red-500/20"
						}`}
					>
						<div className="flex items-center gap-2">
							{testResult.success ? (
								<CheckCircle2Icon className="size-4 shrink-0" />
							) : (
								<XCircleIcon className="size-4 shrink-0" />
							)}
							{testResult.message}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-between">
					<Button variant="ghost" onClick={handleTest} disabled={!allRequiredFilled || testing}>
						{testing ? (
							<>
								<Loader2Icon className="size-4 animate-spin mr-2" />
								Testing...
							</>
						) : (
							"Test Connection"
						)}
					</Button>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button disabled={!allRequiredFilled} onClick={handleConnect}>
							Connect
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

// ============================================================
// OAuth Instructions Dialog
// ============================================================

function OAuthInstructionsDialog({
	connector,
	open,
	onClose,
}: {
	connector: ConnectorDef
	open: boolean
	onClose: () => void
}) {
	const [clientId, setClientId] = useState(
		() => localStorage.getItem(`connector_client_id_${connector.id}`) || ""
	)

	if (!open || connector.auth.type !== "oauth") return null

	const auth = connector.auth

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
			<div
				className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-2xl border border-border/50 p-6 w-full max-w-lg shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-4 mb-6">
					<div
						className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg"
						style={{ backgroundColor: connector.iconBg }}
					>
						{connector.iconText}
					</div>
					<div>
						<h3 className="text-xl font-semibold">Connect {connector.name}</h3>
						<p className="text-sm text-muted-foreground">OAuth Authorization</p>
					</div>
				</div>

				<div className="space-y-4 mb-6 text-sm">
					{auth.needsBackendProxy && (auth.authorizationUrl.includes("localhost:3100") || auth.authorizationUrl.includes("devil-ai.agribee.in")) ? (
						<>
							<div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600">
								<div className="flex items-center gap-2">
									<ShieldIcon className="size-4 shrink-0" />
									This service uses Devil AI's secure backend for authentication.
								</div>
							</div>
							<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
								<li>Click "Open Authorization URL" below</li>
								<li>Log in with your Google account</li>
								<li>The app will connect automatically</li>
							</ol>
						</>
					) : auth.needsBackendProxy ? (
						<>
							<div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
								<div className="flex items-center gap-2">
									<ShieldIcon className="size-4 shrink-0" />
									This service requires a backend proxy for OAuth token exchange.
								</div>
							</div>
							<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
								<li>Create an OAuth app at the {connector.name} developer console</li>
								<li>Set the callback URL to: <code className="text-xs bg-muted px-1 rounded">{auth.redirectUri}</code></li>
								<li>Copy your Client ID and enter it below</li>
								<li>Click "Open Authorization URL" to authorize</li>
								<li>After authorization, the app will connect automatically</li>
							</ol>
						</>
					) : (
						<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
							<li>Create an OAuth app at the {connector.name} developer console</li>
							<li>Set the callback URL to: <code className="text-xs bg-muted px-1 rounded">{auth.redirectUri}</code></li>
							<li>Copy your Client ID and enter it below</li>
							<li>Click "Open Authorization URL" below</li>
							<li>Log in to your {connector.name} account</li>
							<li>Authorize Devil AI to access your data</li>
						</ol>
					)}

					{!(auth.needsBackendProxy && (auth.authorizationUrl.includes("localhost:3100") || auth.authorizationUrl.includes("devil-ai.agribee.in"))) && (
						<div className="mt-4 mb-2">
							<label className="block text-sm font-medium mb-2">Client ID</label>
							<Input
								placeholder={`Enter your ${connector.name} Client ID`}
								value={clientId}
								onChange={(e) => {
									setClientId(e.target.value)
									localStorage.setItem(`connector_client_id_${connector.id}`, e.target.value)
								}}
							/>
						</div>
					)}

					<div className="p-4 rounded-xl bg-muted text-xs mt-4">
						<div className="font-medium mb-2">Required permissions:</div>
						<div className="flex flex-wrap gap-1.5">
							{auth.scopes.map((scope) => (
								<Badge key={scope} variant="secondary" className="text-xs">
									{scope}
								</Badge>
							))}
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={() => { startOAuthFlow(connector); onClose() }}>
						Open Authorization URL
					</Button>
				</div>
			</div>
		</div>
	)
}

// ============================================================
// ConnectorCard - Redesigned
// ============================================================

function ConnectorCard({
	connector,
	status,
	onConnect,
	onDisconnect,
	index,
}: {
	connector: ConnectorDef
	status: ConnectorStatus
	onConnect: (c: ConnectorDef) => void
	onDisconnect: (id: string) => void
	index: number
}) {
	const isConnected = status.connected
	const CategoryIcon = CATEGORY_ICONS[connector.category] || PlugIcon

	return (
		<div
			className="group relative flex items-center gap-4 p-4 rounded-2xl border border-border/30 bg-card/30 hover:bg-card/60 hover:border-border/60 transition-all duration-200 cursor-pointer"
			style={{ animationDelay: `${index * 30}ms` }}
			onClick={() => (isConnected ? onDisconnect(connector.id) : onConnect(connector))}
		>
			{/* Icon */}
			<div
				className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md group-hover:shadow-lg transition-shadow"
				style={{ backgroundColor: connector.iconBg }}
			>
				{connector.iconText}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<h3 className="font-medium text-foreground truncate">{connector.name}</h3>
					{isConnected ? (
						<Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs shrink-0">
							<CheckCircle2Icon className="size-3 mr-1" />
							Connected
						</Badge>
					) : (
						<Badge variant="secondary" className="text-xs shrink-0">
							<CategoryIcon className="size-3 mr-1" />
							{connector.auth.type === "oauth" ? "OAuth" : connector.auth.type === "api-key" ? "API Key" : "Token"}
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{connector.description}</p>
				{isConnected && status.connectedAt && (
					<p className="text-xs text-muted-foreground mt-1">
						Connected {new Date(status.connectedAt).toLocaleDateString()}
					</p>
				)}
			</div>

			{/* Action */}
			<div className="shrink-0">
				{isConnected ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-red-500 hover:bg-red-500/10 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => {
							e.stopPropagation()
							onDisconnect(connector.id)
						}}
					>
						Disconnect
					</Button>
				) : (
					<ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
				)}
			</div>
		</div>
	)
}

// ============================================================
// Stats Card
// ============================================================

function StatsCard({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<div className="flex-1 p-4 rounded-xl bg-card/50 border border-border/30">
			<div className={`text-2xl font-bold ${color}`}>{value}</div>
			<div className="text-xs text-muted-foreground mt-0.5">{label}</div>
		</div>
	)
}

// ============================================================
// Main ConnectorsPage - Redesigned
// ============================================================

export function ConnectorsPage() {
	const [statuses, setStatuses] = useState<Record<string, ConnectorStatus>>({})
	const [filter, setFilter] = useState<string>("all")
	const [search, setSearch] = useState("")
	const [dialogConnector, setDialogConnector] = useState<ConnectorDef | null>(null)
	const [dialogType, setDialogType] = useState<"api-key" | "oauth" | null>(null)

	useEffect(() => {
		getConnectorStatuses().then((res) => {
			setStatuses(res)
		}).catch(err => {
			log.error("Failed to load connectors statuses", err)
		})

		const handleAuthenticated = (provider: string) => {
			log.info(`Received connector-authenticated IPC for ${provider}`)
			setStatuses(prev => ({
				...prev,
				[provider]: {
					connected: true,
					connectedAt: Date.now(),
					credentials: { masked: "true" },
				}
			}))
		}

		const handleDomEvent = (e: Event) => {
			const ce = e as CustomEvent<string>
			if (ce.detail) handleAuthenticated(ce.detail)
		}
		window.addEventListener("connector-authenticated", handleDomEvent)

		if (window.devilAi?.onConnectorAuthenticated) {
			const unsubscribe = window.devilAi.onConnectorAuthenticated(handleAuthenticated)
			return () => {
				unsubscribe()
				window.removeEventListener("connector-authenticated", handleDomEvent)
			}
		}

		return () => {
			window.removeEventListener("connector-authenticated", handleDomEvent)
		}
	}, [])

	const connectedCount = Object.values(statuses).filter((s) => s.connected).length

	const filteredConnectors = useMemo(() => {
		return CONNECTORS.filter((c) => {
			if (filter !== "all" && c.category !== filter) return false
			if (search) {
				const q = search.toLowerCase()
				return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
			}
			return true
		})
	}, [filter, search])

	const handleConnect = useCallback((connector: ConnectorDef) => {
		if (connector.auth.type === "api-key" || connector.auth.type === "token") {
			setDialogConnector(connector)
			setDialogType("api-key")
			return
		}
		setDialogConnector(connector)
		setDialogType("oauth")
	}, [])

	const handleDisconnect = useCallback(async (id: string) => {
		try {
			await deleteConnectorCredential(id)
			const newStatuses = { ...statuses }
			delete newStatuses[id]
			setStatuses(newStatuses)
		} catch (err) {
			log.error("Failed to delete connector credential", err)
		}
	}, [statuses])

	const handleApiKeySave = useCallback(async (credentials: Record<string, string>) => {
		if (!dialogConnector) return
		try {
			await setConnectorCredential(dialogConnector.id, credentials)
			const newStatuses = {
				...statuses,
				[dialogConnector.id]: {
					connected: true,
					connectedAt: Date.now(),
					credentials: { masked: "true" },
				},
			}
			setStatuses(newStatuses)
			setDialogConnector(null)
			setDialogType(null)
		} catch (err) {
			log.error("Failed to save connector credential", err)
		}
	}, [dialogConnector, statuses])

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl font-semibold">Connectors</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Connect third-party services to Devil AI. Connections stay active until you disconnect.
				</p>
			</div>

			{/* Stats */}
			<div className="flex gap-3">
				<StatsCard label="Available" value={CONNECTORS.length} color="text-foreground" />
				<StatsCard label="Connected" value={connectedCount} color="text-green-500" />
				<StatsCard label="Not Connected" value={CONNECTORS.length - connectedCount} color="text-muted-foreground" />
			</div>

			{/* Search + Filter */}
			<div className="relative">
				<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					placeholder="Search connectors..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Category Tabs */}
			<div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
				<button
					onClick={() => setFilter("all")}
					className={`px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 ${
						filter === "all"
							? "bg-primary text-primary-foreground border-primary"
							: "bg-card text-muted-foreground border-border/50 hover:bg-card/80"
					}`}
				>
					All
				</button>
				{CATEGORIES.map((cat) => (
					<button
						key={cat.id}
						onClick={() => setFilter(cat.id)}
						className={`px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 ${
							filter === cat.id
								? "bg-primary text-primary-foreground border-primary"
								: "bg-card text-muted-foreground border-border/50 hover:bg-card/80"
						}`}
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* Connector List */}
			<div className="space-y-1.5">
				{filteredConnectors.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						<PlugIcon className="size-8 mx-auto mb-3 opacity-50" />
						<p>No connectors found.</p>
					</div>
				) : (
					filteredConnectors.map((connector, index) => (
						<ConnectorCard
							key={connector.id}
							connector={connector}
							status={statuses[connector.id] || { connected: false }}
							onConnect={handleConnect}
							onDisconnect={handleDisconnect}
							index={index}
						/>
					))
				)}
			</div>

			{/* API Key Dialog */}
			{dialogConnector && dialogType === "api-key" && createPortal(
				<ApiKeyDialog
					connector={dialogConnector}
					open={true}
					onClose={() => { setDialogConnector(null); setDialogType(null) }}
					onSave={handleApiKeySave}
				/>,
				document.body
			)}

			{/* OAuth Dialog */}
			{dialogConnector && dialogType === "oauth" && createPortal(
				<OAuthInstructionsDialog
					connector={dialogConnector}
					open={true}
					onClose={() => { setDialogConnector(null); setDialogType(null) }}
				/>,
				document.body
			)}
		</div>
	)
}
