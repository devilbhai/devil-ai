import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@devil-ai/ui/components/button"
import { DialogFooter } from "@devil-ai/ui/components/dialog"
import { Input } from "@devil-ai/ui/components/input"
import { Label } from "@devil-ai/ui/components/label"
import { Spinner } from "@devil-ai/ui/components/spinner"
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	CheckIcon,
	ClipboardIcon,
	ExternalLinkIcon,
	KeyIcon,
	SparklesIcon,
	TerminalIcon,
	ZapIcon,
} from "lucide-react"
import type { CatalogProvider, SdkProviderAuthMethod as ProviderAuthMethod } from "../../hooks/use-opencode-data"
import { createLogger } from "../../lib/logger"
import { PROVIDER_KEY_URLS, ZEN_SIGNUP_URL } from "../../lib/providers"
import { getBaseClient } from "../../services/connection-manager"
import {
	CONFIGURABLE_PROVIDER_MAP,
	fetchProviderModels,
	getProviderDocsUrl,
	type DialogState,
} from "./connect-provider-dialog"

const log = createLogger("connect-provider-views")

export function MethodSelectView({
	authMethods,
	onSelectApiKey,
	onSelectOAuth,
}: {
	authMethods: ProviderAuthMethod[]
	onSelectApiKey: () => void
	onSelectOAuth: (methodIndex: number) => void
}) {
	return (
		<div className="space-y-2 py-2">
			<p className="text-sm text-muted-foreground mb-3">Choose an authentication method:</p>
			{authMethods.map((method, index) => (
				<button
					key={`${method.type}-${index}`}
					type="button"
					onClick={() => {
						if (method.type === "api") {
							onSelectApiKey()
						} else {
							onSelectOAuth(index)
						}
					}}
					className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-accent"
				>
					{method.type === "api" ? (
						<KeyIcon className="size-4 text-muted-foreground" aria-hidden="true" />
					) : (
						<ExternalLinkIcon className="size-4 text-muted-foreground" aria-hidden="true" />
					)}
					<div>
						<div className="text-sm font-medium">{method.label}</div>
						<div className="text-xs text-muted-foreground">
							{method.type === "api" ? "Enter your API key" : "Sign in via your browser"}
						</div>
					</div>
				</button>
			))}
		</div>
	)
}

function CopyableEnvVar({ envVar }: { envVar: string }) {
	const [copied, setCopied] = useState(false)
	const exportLine = `export ${envVar}=`

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(exportLine).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		})
	}, [exportLine])

	return (
		<div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
			<code className="font-mono text-xs">export {envVar}=...</code>
			<button
				type="button"
				onClick={handleCopy}
				className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
				aria-label={`Copy ${envVar} export line`}
			>
				{copied ? (
					<CheckIcon className="size-3.5 text-emerald-500" aria-hidden="true" />
				) : (
					<ClipboardIcon className="size-3.5" aria-hidden="true" />
				)}
			</button>
		</div>
	)
}

export function EnvSetupView({ provider, onCancel }: { provider: CatalogProvider; onCancel: () => void }) {
	const docsUrl = getProviderDocsUrl(provider.id)

	return (
		<div className="space-y-4 py-2">
			<div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
				<TerminalIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
				<div className="space-y-2 text-sm">
					<p className="font-medium">Environment variable setup required</p>
					<p className="text-muted-foreground">
						{provider.name} requires credentials that must be set as environment variables before
						starting the app.
					</p>
				</div>
			</div>

			<div className="space-y-1.5">
				{provider.env.map((envVar) => (
					<CopyableEnvVar key={envVar} envVar={envVar} />
				))}
			</div>

			<p className="text-xs text-muted-foreground">
				Add these to your shell profile (e.g.{" "}
				<code className="rounded bg-muted px-1 py-0.5 text-[11px]">~/.zshrc</code>) or a{" "}
				<code className="rounded bg-muted px-1 py-0.5 text-[11px]">.env</code> file, then restart
				the app. The provider will be detected automatically.
			</p>

			{docsUrl && (
				<a
					href={docsUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1.5 text-xs text-primary hover:underline"
				>
					<ExternalLinkIcon className="size-3" aria-hidden="true" />
					View setup guide
				</a>
			)}

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Close
				</Button>
			</DialogFooter>
		</div>
	)
}

export function ConfigureProviderView({
	provider,
	state,
	setState,
	onCancel,
}: {
	provider: CatalogProvider
	state: DialogState
	setState: (state: DialogState) => void
	onCancel: () => void
}) {
	const config = CONFIGURABLE_PROVIDER_MAP.get(provider.id)
	const docsUrl = getProviderDocsUrl(provider.id)

	const [values, setValues] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {}
		for (const field of config?.fields ?? []) {
			initial[field.key] = ""
		}
		return initial
	})

	useEffect(() => {
		const initial: Record<string, string> = {}
		for (const field of config?.fields ?? []) {
			initial[field.key] = ""
		}
		setValues(initial)
	}, [config])

	const isLoading = state.status === "loading"

	const requiredFieldsFilled =
		config?.fields.every((f) => !f.required || values[f.key]?.trim()) ?? false

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			if (!config) return

			setState({ status: "loading" })
			try {
				const client = getBaseClient()
				if (!client) throw new Error("Not connected to server")

				const authField = config.fields.find((f) => f.persist === "auth")
				const configFields = config.fields.filter(
					(f) => f.persist === "config" && values[f.key]?.trim(),
				)

				const apiKey = authField && values[authField.key]?.trim() ? values[authField.key].trim() : null
				if (apiKey) {
					await client.auth.set({
						providerID: provider.id,
						auth: { type: "api", key: apiKey },
					})
				}

				const options: Record<string, string> = {}
				for (const field of configFields) {
					options[field.key] = values[field.key].trim()
				}

				const isOpenAICompatible =
					provider.id === "privatemode-ai" ||
					provider.id === "openai-compatible"

				let providerConfig: Record<string, unknown> = { options }

				if (isOpenAICompatible && apiKey && options.url) {
					providerConfig.api = "openai"

					const baseURL = options.url.replace(/\/+$/, "")
					const models = await fetchProviderModels(baseURL, apiKey)
					if (models && Object.keys(models).length > 0) {
						const existingConfig = await client.global.config.get().catch(() => null)
						const existingProvider = (existingConfig?.data as { provider?: Record<string, Record<string, unknown>> })?.provider?.[provider.id]
						const existingModels = existingProvider?.models ?? {}

						providerConfig.models = { ...existingModels, ...models }
						log.info("Auto-discovered models for provider", {
							provider: provider.id,
							modelCount: Object.keys(providerConfig.models as object).length,
						})
					}
				}

				await client.global.config.update({
					config: {
						provider: {
							[provider.id]: providerConfig,
						},
					},
				})

				const currentConfig = await client.global.config.get().catch(() => null)
				const currentDisabled = (currentConfig?.data as { disabled_providers?: string[] })?.disabled_providers ?? []
				if (currentDisabled.includes(provider.id)) {
					await client.global.config.update({
						config: {
							disabled_providers: currentDisabled.filter((id: string) => id !== provider.id),
						},
					}).catch(() => {})
				}

				await client.global.dispose()

				setState({ status: "success" })
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to connect"
				log.error("Failed to configure provider", {
					provider: provider.id,
					error: err,
				})
				setState({ status: "error", message })
			}
		},
		[config, values, provider.id, setState],
	)

	if (!config) return null

	return (
		<form onSubmit={handleSubmit}>
			<div className="space-y-4 py-2">
				{config.fields.map((field) => (
					<div key={field.key} className="space-y-2">
						<Label htmlFor={`field-${field.key}`}>
							{field.label}
							{!field.required && (
								<span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
							)}
						</Label>
						<Input
							id={`field-${field.key}`}
							type={field.secret ? "password" : "text"}
							placeholder={field.placeholder}
							value={values[field.key] ?? ""}
							onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
							disabled={isLoading}
						/>
						{field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
					</div>
				))}

				{docsUrl && (
					<a
						href={docsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-xs text-primary hover:underline"
					>
						<ExternalLinkIcon className="size-3" aria-hidden="true" />
						View setup guide
					</a>
				)}

				{state.status === "error" && (
					<div className="flex items-center gap-2 text-sm text-destructive">
						<AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
						<span>{state.message}</span>
					</div>
				)}
			</div>

			<DialogFooter className="mt-4">
				<Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
					Cancel
				</Button>
				<Button type="submit" disabled={!requiredFieldsFilled || isLoading}>
					{isLoading ? (
						<>
							<Spinner className="size-4" />
							Connecting...
						</>
					) : (
						"Connect"
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}

export function ApiKeyView({
	provider,
	state,
	onSubmit,
	onBack,
	onCancel,
}: {
	provider: CatalogProvider
	state: DialogState
	onSubmit: (apiKey: string) => void
	onBack?: () => void
	onCancel: () => void
}) {
	const [apiKey, setApiKey] = useState("")
	const isLoading = state.status === "loading"

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			if (apiKey.trim()) {
				onSubmit(apiKey.trim())
			}
		},
		[apiKey, onSubmit],
	)

	return (
		<form onSubmit={handleSubmit}>
			<div className="space-y-4 py-2">
				<div className="space-y-2">
					<Label htmlFor="api-key">API Key</Label>
					<Input
						id="api-key"
						type="password"
						placeholder="sk-..."
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						disabled={isLoading}
						autoFocus
					/>
					{PROVIDER_KEY_URLS[provider.id] && (
						<a
							href={PROVIDER_KEY_URLS[provider.id].url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
						>
							<ExternalLinkIcon className="size-2.5" aria-hidden="true" />
							{PROVIDER_KEY_URLS[provider.id].label} at{" "}
							{new URL(PROVIDER_KEY_URLS[provider.id].url).hostname}
						</a>
					)}
					{provider.env.length > 0 && (
						<p className="text-xs text-muted-foreground">
							You can also set this via the{" "}
							<code className="rounded bg-muted px-1 py-0.5 text-[11px]">{provider.env[0]}</code>{" "}
							environment variable
						</p>
					)}
				</div>

				{state.status === "error" && (
					<div className="flex items-center gap-2 text-sm text-destructive">
						<AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
						<span>{state.message}</span>
					</div>
				)}
			</div>

			<DialogFooter className="mt-4">
				{onBack && (
					<Button type="button" variant="ghost" onClick={onBack} disabled={isLoading}>
						Back
					</Button>
				)}
				<Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
					Cancel
				</Button>
				<Button type="submit" disabled={!apiKey.trim() || isLoading}>
					{isLoading ? (
						<>
							<Spinner className="size-4" />
							Connecting...
						</>
					) : (
						"Connect"
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}

function extractDeviceCode(instructions: string | null): string | null {
	if (!instructions) return null
	const match = instructions.match(/\b[A-Z0-9]{4}(?:[- ][A-Z0-9]{4})+\b/i)
	if (!match) return null
	return match[0].toUpperCase().replace(/\s+/g, "-")
}

async function pollForCompletion(
	client: ReturnType<typeof getBaseClient>,
	providerID: string,
	methodIndex: number,
	setState: (state: DialogState) => void,
	onSuccess: () => void,
	isCancelled: () => boolean,
) {
	if (!client) return

	const maxAttempts = 60
	const intervalMs = 2000

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		if (isCancelled()) return

		await new Promise((resolve) => setTimeout(resolve, intervalMs))
		if (isCancelled()) return

		try {
			await client.provider.oauth.callback({
				providerID,
				method: methodIndex,
			})
			if (isCancelled()) return

			// Remove from disabled_providers if it was disabled
			const currentConfig = await client.global.config.get().catch(() => null)
				const currentDisabled = (currentConfig?.data as { disabled_providers?: string[] })?.disabled_providers ?? []
				if (currentDisabled.includes(providerID)) {
					await client.global.config.update({
						config: {
							disabled_providers: currentDisabled.filter((id: string) => id !== providerID),
						},
					}).catch(() => {})
				}

			await client.global.dispose()
			onSuccess()
			return
		} catch {
		}
	}

	if (!isCancelled()) {
		setState({ status: "error", message: "Authentication timed out. Please try again." })
	}
}

export function OAuthView({
	provider,
	methodIndex,
	state,
	setState,
	onSuccess,
	onBack,
	onCancel,
}: {
	provider: CatalogProvider
	methodIndex: number
	state: DialogState
	setState: (state: DialogState) => void
	onSuccess: () => void
	onBack?: () => void
	onCancel: () => void
}) {
	const [authUrl, setAuthUrl] = useState<string | null>(null)
	const [oauthMethod, setOauthMethod] = useState<"auto" | "code" | null>(null)
	const [authInstructions, setAuthInstructions] = useState<string | null>(null)
	const [code, setCode] = useState("")
	const [copiedDeviceCode, setCopiedDeviceCode] = useState(false)
	const autoCopiedDeviceCodeRef = useRef<string | null>(null)

	const deviceCode = extractDeviceCode(authInstructions)

	const handleCopyDeviceCode = useCallback(async () => {
		if (!deviceCode) return
		await navigator.clipboard.writeText(deviceCode)
		setCopiedDeviceCode(true)
		setTimeout(() => setCopiedDeviceCode(false), 2000)
	}, [deviceCode])

	useEffect(() => {
		if (!authUrl) return

		const valueToCopy = deviceCode ?? authUrl
		if (!valueToCopy) return
		if (autoCopiedDeviceCodeRef.current === valueToCopy) return
		autoCopiedDeviceCodeRef.current = valueToCopy

		void navigator.clipboard
			.writeText(valueToCopy)
			.then(() => {
				setCopiedDeviceCode(true)
				setTimeout(() => setCopiedDeviceCode(false), 2000)
			})
			.catch(() => {
				autoCopiedDeviceCodeRef.current = null
			})
	}, [authUrl, deviceCode])

	useEffect(() => {
		let cancelled = false

		async function startOAuth() {
			setState({ status: "loading" })
			try {
				const client = getBaseClient()
				if (!client) throw new Error("Not connected to server")
				const result = await client.provider.oauth.authorize({
					providerID: provider.id,
					method: methodIndex,
				})
				if (cancelled) return

				const data = result.data as
					| {
							url: string
							method: "auto" | "code"
							instructions: string
					  }
					| undefined

				if (!data?.url) {
					throw new Error("No authorization URL returned")
				}

				setAuthUrl(data.url)
				setOauthMethod(data.method)
				setAuthInstructions(data.instructions)

				window.open(data.url, "_blank")

				setState({ status: "idle" })

				if (data.method === "auto") {
					pollForCompletion(client, provider.id, methodIndex, setState, onSuccess, () => cancelled)
				}
			} catch (err) {
				if (cancelled) return
				const message = err instanceof Error ? err.message : "Failed to start OAuth"
				log.error("Failed to start OAuth", { provider: provider.id, error: err })
				setState({ status: "error", message })
			}
		}

		startOAuth()
		return () => {
			cancelled = true
		}
	}, [provider.id, methodIndex, setState, onSuccess])

	const handleCodeSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			if (!code.trim()) return
			setState({ status: "loading" })
			try {
				const client = getBaseClient()
				if (!client) throw new Error("Not connected to server")
				await client.provider.oauth.callback({
					providerID: provider.id,
					method: methodIndex,
					code: code.trim(),
				})

				// Remove from disabled_providers if it was disabled
				const currentConfig = await client.global.config.get().catch(() => null)
				const currentDisabled = (currentConfig?.data as { disabled_providers?: string[] })?.disabled_providers ?? []
				if (currentDisabled.includes(provider.id)) {
					await client.global.config.update({
						config: {
							disabled_providers: currentDisabled.filter((id: string) => id !== provider.id),
						},
					}).catch(() => {})
				}

				await client.global.dispose()
				onSuccess()
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to complete OAuth"
				log.error("Failed to complete OAuth callback", {
					provider: provider.id,
					error: err,
				})
				setState({ status: "error", message })
			}
		},
		[code, provider.id, methodIndex, setState, onSuccess],
	)

	if (oauthMethod === "code" && authUrl) {
		return (
			<form onSubmit={handleCodeSubmit}>
				<div className="space-y-4 py-2">
					<p className="text-sm text-muted-foreground">
						A browser window has been opened. Sign in and paste the authorization code below.
					</p>
					{authInstructions && (
						<p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
							{authInstructions}
						</p>
					)}
					<div className="space-y-2">
						<Label htmlFor="oauth-code">Authorization Code</Label>
						<Input
							id="oauth-code"
							type="text"
							placeholder="Paste code here..."
							value={code}
							onChange={(e) => setCode(e.target.value)}
							disabled={state.status === "loading"}
							autoFocus
						/>
					</div>
					{state.status === "error" && (
						<div className="flex items-center gap-2 text-sm text-destructive">
							<AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
							<span>{state.message}</span>
						</div>
					)}
				</div>
				<DialogFooter className="mt-4">
					{onBack && (
						<Button
							type="button"
							variant="ghost"
							onClick={onBack}
							disabled={state.status === "loading"}
						>
							Back
						</Button>
					)}
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={state.status === "loading"}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!code.trim() || state.status === "loading"}>
						{state.status === "loading" ? (
							<>
								<Spinner className="size-4" />
								Verifying...
							</>
						) : (
							"Submit"
						)}
					</Button>
				</DialogFooter>
			</form>
		)
	}

	return (
		<div className="space-y-4 py-2">
			{state.status === "loading" && !authUrl ? (
				<div className="flex items-center justify-center gap-2 py-6">
					<Spinner className="size-4" />
					<span className="text-sm text-muted-foreground">Starting authentication...</span>
				</div>
			) : state.status === "error" ? (
				<>
					<div className="flex items-center gap-2 text-sm text-destructive">
						<AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
						<span>{state.message}</span>
					</div>
					<DialogFooter>
						{onBack && (
							<Button type="button" variant="ghost" onClick={onBack}>
								Back
							</Button>
						)}
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</DialogFooter>
				</>
			) : (
				<>
					<div className="flex flex-col items-center gap-3 py-6">
						<Spinner className="size-5" />
						{deviceCode && (
							<div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
								<p className="text-xs text-muted-foreground">Enter this code in the browser</p>
								<div className="flex items-center gap-2">
									<code className="rounded-md bg-background px-2.5 py-1.5 font-mono text-sm font-semibold tracking-[0.2em]">
										{deviceCode}
									</code>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0"
										onClick={handleCopyDeviceCode}
									>
										{copiedDeviceCode ? (
											<CheckIcon className="size-3.5 text-emerald-500" aria-hidden="true" />
										) : (
											<ClipboardIcon className="size-3.5" aria-hidden="true" />
										)}
									</Button>
								</div>
							</div>
						)}
						{authInstructions && !deviceCode && (
							<p className="max-w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
								{authInstructions}
							</p>
						)}
						<p className="text-sm text-muted-foreground text-center">
							Waiting for authentication to complete in your browser...
						</p>
						{authUrl && (
							<Button variant="link" size="sm" onClick={() => window.open(authUrl, "_blank")}>
								<ExternalLinkIcon className="size-3.5" aria-hidden="true" />
								Open link again
							</Button>
						)}
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</DialogFooter>
				</>
			)}
		</div>
	)
}

export function ZenSetupView({
	provider,
	state,
	onSubmit,
	onCancel,
}: {
	provider: CatalogProvider
	state: DialogState
	onSubmit: (apiKey: string) => void
	onCancel: () => void
}) {
	const [apiKey, setApiKey] = useState("")
	const isLoading = state.status === "loading"

	const freeModelCount = Object.values(provider.models).filter(
		(m) => (m as { cost?: { input?: number } }).cost?.input === 0,
	).length
	const totalModelCount = Object.keys(provider.models).length

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			if (apiKey.trim()) {
				onSubmit(apiKey.trim())
			}
		},
		[apiKey, onSubmit],
	)

	return (
		<form onSubmit={handleSubmit}>
			<div className="space-y-4 py-2">
				<div className="flex items-start gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
					<ZapIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
					<div className="space-y-0.5 text-sm">
						<p className="font-medium text-emerald-700 dark:text-emerald-400">
							{freeModelCount} free models included
						</p>
						<p className="text-xs text-muted-foreground">
							You can start coding immediately. Add an API key to unlock {totalModelCount}+ premium
							models from Claude, GPT, Gemini, and more.
						</p>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="zen-api-key">API Key</Label>
					<Input
						id="zen-api-key"
						type="password"
						placeholder="sk-..."
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						disabled={isLoading}
						autoFocus
					/>
					<a
						href={ZEN_SIGNUP_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
					>
						<SparklesIcon className="size-3" aria-hidden="true" />
						Get an API key
						<ExternalLinkIcon className="size-2.5" aria-hidden="true" />
					</a>
				</div>

				{state.status === "error" && (
					<div className="flex items-center gap-2 text-sm text-destructive">
						<AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
						<span>{state.message}</span>
					</div>
				)}
			</div>

			<DialogFooter className="mt-4">
				<Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
					{apiKey.trim() ? "Cancel" : "Use free models"}
				</Button>
				<Button type="submit" disabled={!apiKey.trim() || isLoading}>
					{isLoading ? (
						<>
							<Spinner className="size-4" />
							Connecting...
						</>
					) : (
						"Connect"
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}

export function SuccessView({ provider, onDone }: { provider: CatalogProvider; onDone: () => void }) {
	return (
		<>
			<div className="flex flex-col items-center gap-3 py-6">
				<CheckCircle2Icon className="size-8 text-green-500" aria-hidden="true" />
				<p className="text-sm font-medium">Connected to {provider.name}</p>
				<p className="text-xs text-muted-foreground">
					You can now use {provider.name} models in your conversations
				</p>
			</div>
			<DialogFooter>
				<Button onClick={onDone}>Done</Button>
			</DialogFooter>
		</>
	)
}
export function OllamaSetupView({
	onCancel,
	onSuccess,
}: {
	onCancel: () => void
	onSuccess: () => void
}) {
	const [isInstalled, setIsInstalled] = useState(false)
	const [isInstalling, setIsInstalling] = useState(false)
	const [isStarting, setIsStarting] = useState(false)
	const [isPulling, setIsPulling] = useState(false)
	const [logs, setLogs] = useState<string[]>([])
	const logsEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (logsEndRef.current) {
			logsEndRef.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [logs])

	useEffect(() => {
		window.devilAi.ollama.isInstalled().then(setIsInstalled)

		const unsubInstall = window.devilAi.ollama.onInstallOutput((text) => {
			setLogs((prev) => [...prev, text])
		})
		const unsubPull = window.devilAi.ollama.onPullOutput((text) => {
			setLogs((prev) => [...prev, text])
		})
		return () => {
			unsubInstall()
			unsubPull()
		}
	}, [])

	const handleInstall = async () => {
		setIsInstalling(true)
		setLogs(["Starting installation..."])
		try {
			await window.devilAi.ollama.install()
			setIsInstalled(true)
			setLogs((prev) => [...prev, "Installation complete!"])
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			setLogs((prev) => [...prev, `Error installing: ${msg}`])
		} finally {
			setIsInstalling(false)
		}
	}

	const handleConnect = async () => {
		setIsStarting(true)
		setLogs(["Starting background service..."])
		try {
			await window.devilAi.ollama.start()
			setLogs((prev) => [...prev, "Background service running!"])
			
			// Verify if default model is available
			const models = await window.devilAi.ollama.listModels()
			if (!models.includes("qwen:4b")) {
				setIsPulling(true)
				setLogs((prev) => [...prev, "Pulling default model: qwen:4b..."])
				await window.devilAi.ollama.pullModel("qwen:4b")
			}

			// Add to providers configuration
			setLogs((prev) => [...prev, "Updating provider configuration..."])
			const client = getBaseClient()
			if (client) {
				const ollamaModels: Record<string, { name: string; tool_call: boolean }> = {}
				const allModels = await window.devilAi.ollama.listModels()
				for (const m of allModels) {
					ollamaModels[m] = { name: m, tool_call: true }
				}
				if (Object.keys(ollamaModels).length === 0) {
					ollamaModels["qwen:4b"] = { name: "qwen:4b", tool_call: true }
				}
				
				await client.global.config.update({
					config: {
						model: "openai/qwen:4b",
						provider: {
							openai: {
								options: { baseURL: "http://127.0.0.1:11434/v1" },
								env: ["OPENAI_API_KEY=ollama"],
								models: ollamaModels
							}
						}
					}
				})
				
				const currentConfig = await client.global.config.get().catch(() => null)
				const currentDisabled = (currentConfig?.data as { disabled_providers?: string[] })?.disabled_providers ?? []
				if (!currentDisabled.includes("ollama")) {
					await client.global.config.update({
						config: {
							disabled_providers: [...currentDisabled, "ollama"],
						},
					}).catch(() => {})
				}
			}

			onSuccess()
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			setLogs((prev) => [...prev, `Error connecting: ${msg}`])
		} finally {
			setIsStarting(false)
			setIsPulling(false)
		}
	}

	return (
		<div className="space-y-4 py-2">
			{!isInstalled && !isInstalling && (
				<div className="flex flex-col gap-4 text-sm items-center py-4">
					<div className="text-center space-y-2">
						<p>Ollama is not installed on this system.</p>
						<p className="text-muted-foreground text-xs">
							Click below to download and install the Ollama CLI in the background. It will run completely hidden without any desktop apps.
						</p>
					</div>
					<Button onClick={handleInstall}>One-Click Install Ollama</Button>
				</div>
			)}
			{isInstalled && !isStarting && !isPulling && (
				<div className="flex flex-col gap-4 text-sm items-center py-4">
					<div className="text-center space-y-2">
						<p>Ollama is ready!</p>
						<p className="text-muted-foreground text-xs">
							Click below to start the background service. We will automatically download the recommended <code>qwen:4b</code> model if it's missing.
						</p>
					</div>
					<Button onClick={handleConnect}>Start Background Service & Connect</Button>
				</div>
			)}

			{(isInstalling || isStarting || isPulling) && (
				<div className="space-y-3">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Spinner className="size-4" />
						<span>{isInstalling ? "Installing Ollama..." : isStarting && !isPulling ? "Starting service..." : "Pulling model..."}</span>
					</div>
					<div className="bg-black/90 text-green-400 font-mono text-[11px] p-3 rounded-md h-40 overflow-y-auto whitespace-pre-wrap">
						{logs.length === 0 ? "Starting..." : logs.join("\n")}
						<div ref={logsEndRef} />
					</div>
				</div>
			)}
			
			<DialogFooter>
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
			</DialogFooter>
		</div>
	)
}
