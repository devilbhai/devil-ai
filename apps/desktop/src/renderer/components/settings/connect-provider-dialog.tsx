/**
 * Dialog for connecting an AI provider via API key or OAuth.
 *
 * Supports multi-step flows: method selection -> authentication.
 * For multi-env providers, shows either a structured credential form
 * (when auth.set + config options can cover all fields) or improved
 * env-var instructions with copy buttons and docs links.
 */

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@devil-ai/ui/components/dialog"

import { useCallback, useEffect, useState } from "react"
import type {
	CatalogProvider,
	SdkProviderAuthMethod as ProviderAuthMethod,
} from "../../hooks/use-opencode-data"
import { createLogger } from "../../lib/logger"
import { ZEN_PROVIDER_ID } from "../../lib/providers"
import { getBaseClient } from "../../services/connection-manager"
import { ProviderIcon } from "./provider-icon"
import {
	ApiKeyView,
	ConfigureProviderView,
	EnvSetupView,
	MethodSelectView,
	OAuthView,
	OllamaSetupView,
	SuccessView,
	ZenSetupView,
} from "./provider-views"

const log = createLogger("connect-provider-dialog")

// ============================================================
// Types
// ============================================================

export type DialogStep =
	| { type: "select-method" }
	| { type: "api-key" }
	| { type: "configure" }
	| { type: "env-setup" }
	| { type: "zen-setup" }
	| { type: "ollama-setup" }
	| {
			type: "oauth"
			method: number
			url?: string
			oauthMethod?: "auto" | "code"
			instructions?: string
	  }

export type DialogState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success" }
	| { status: "error"; message: string }

// ============================================================
// Provider configuration definitions
// ============================================================

/** A field in the provider configuration form */
interface ProviderField {
	/** Unique key -- used as the config option key or "apiKey" for auth.set */
	key: string
	/** Display label */
	label: string
	/** Placeholder text */
	placeholder: string
	/** Whether this is a secret (password input) */
	secret?: boolean
	/** Whether this field is required */
	required?: boolean
	/** How to persist this value */
	persist: "auth" | "config"
	/** Help text shown below the field */
	help?: string
}

/** Configuration for a provider that can be set up via a form */
interface ConfigurableProvider {
	/** Provider ID */
	id: string
	/** Form fields in display order */
	fields: ProviderField[]
	/** OpenCode docs anchor (appended to https://opencode.ai/docs/providers/#) */
	docsAnchor?: string
}

/**
 * Providers that can be fully configured via auth.set() + config.update().
 * These show a multi-field form instead of env-var instructions.
 */
const CONFIGURABLE_PROVIDERS: ConfigurableProvider[] = [
	{
		id: "azure",
		docsAnchor: "azure-openai",
		fields: [
			{
				key: "apiKey",
				label: "API Key",
				placeholder: "your-azure-api-key",
				secret: true,
				required: true,
				persist: "auth",
			},
			{
				key: "baseURL",
				label: "Endpoint URL",
				placeholder: "https://your-resource.openai.azure.com/openai",
				required: true,
				persist: "config",
				help: "Your Azure OpenAI resource endpoint",
			},
		],
	},
	{
		id: "azure-cognitive-services",
		docsAnchor: "azure-cognitive-services",
		fields: [
			{
				key: "apiKey",
				label: "API Key",
				placeholder: "your-azure-api-key",
				secret: true,
				required: true,
				persist: "auth",
			},
			{
				key: "baseURL",
				label: "Endpoint URL",
				placeholder: "https://your-resource.cognitiveservices.azure.com/openai",
				required: true,
				persist: "config",
				help: "Your Azure Cognitive Services resource endpoint",
			},
		],
	},
	{
		id: "amazon-bedrock",
		docsAnchor: "amazon-bedrock",
		fields: [
			{
				key: "apiKey",
				label: "Bearer Token",
				placeholder: "your-bearer-token",
				secret: true,
				required: true,
				persist: "auth",
				help: "AWS bearer token for Bedrock access",
			},
			{
				key: "region",
				label: "AWS Region",
				placeholder: "us-east-1",
				required: true,
				persist: "config",
			},
			{
				key: "profile",
				label: "AWS Profile",
				placeholder: "default",
				persist: "config",
				help: "Optional AWS profile name",
			},
		],
	},
	{
		id: "privatemode-ai",
		docsAnchor: "custom-provider",
		fields: [
			{
				key: "apiKey",
				label: "Agent Router API Key",
				placeholder: "your-api-key",
				secret: true,
				required: true,
				persist: "auth",
			},
			{
				key: "url",
				label: "Base URL",
				placeholder: "https://agentrouter.org/v1",
				required: true,
				persist: "config",
			},
		],
	},
]

export const CONFIGURABLE_PROVIDER_MAP = new Map(CONFIGURABLE_PROVIDERS.map((p) => [p.id, p]))

// ============================================================
// Dynamic model fetch for OpenAI-compatible providers
// ============================================================

interface OpenAIModel {
	id: string
	object?: string
	created?: number
	owned_by?: string
	supported_endpoint_types?: string[]
}

interface OpenAIModelsResponse {
	data: OpenAIModel[]
	success?: boolean
}

/**
 * Fetch available models from an OpenAI-compatible /v1/models endpoint.
 * Uses the IPC fetch proxy (window.devilAi.fetch) to bypass CORS restrictions.
 * Returns models mapped to opencode.json config format, or null on failure.
 */
export async function fetchProviderModels(
	baseURL: string,
	apiKey: string,
): Promise<Record<string, { name: string; tool_call: boolean; attachment: boolean }> | null> {
	try {
		const url = `${baseURL.replace(/\/+$/, "")}/models`
		const headers: Record<string, string> = {
			Authorization: `Bearer ${apiKey}`,
			"User-Agent": "DevilAI/1.0",
			AGENT_ROUTER_TOKEN: apiKey,
		}

		// Use IPC fetch proxy to bypass CORS (renderer cannot make cross-origin requests)
		const result = await window.devilAi.fetch({
			url,
			method: "GET",
			headers,
			body: null,
		})

		if (result.status !== 200) {
			log.warn("Failed to fetch models from provider", { url, status: result.status })
			return null
		}

		if (!result.body) {
			log.warn("Empty response from models endpoint", { url })
			return null
		}

		const json = JSON.parse(result.body) as OpenAIModelsResponse
		if (!json.data || !Array.isArray(json.data)) {
			log.warn("Invalid models response format", { url })
			return null
		}

		const models: Record<string, { name: string; tool_call: boolean; attachment: boolean }> = {}
		for (const m of json.data) {
			if (!m.id) continue
			models[m.id] = {
				name: m.id,
				tool_call: true,
				attachment: true,
			}
		}

		log.info("Fetched provider models", { url, count: Object.keys(models).length })
		return models
	} catch (err) {
		log.warn("Could not fetch models from provider", {
			url: baseURL,
			error: err instanceof Error ? err.message : String(err),
		})
		return null
	}
}

/**
 * OpenCode docs anchors for providers that are NOT configurable via form.
 * Used to link to provider-specific setup instructions.
 */
const PROVIDER_DOCS_ANCHORS: Record<string, string> = {
	"cloudflare-workers-ai": "cloudflare-workers-ai",
	"cloudflare-ai-gateway": "cloudflare-ai-gateway",
	"google-vertex": "google-vertex-ai",
	"google-vertex-anthropic": "google-vertex-ai",
	"sap-ai-core": "sap-ai-core",
	"amazon-bedrock": "amazon-bedrock",
	azure: "azure-openai",
	"azure-cognitive-services": "azure-cognitive-services",
	gitlab: "gitlab-duo",
	"privatemode-ai": "custom-provider",
	agentrouter: "custom-provider",
}

/** Build a provider docs URL from an anchor */
export function getProviderDocsUrl(providerId: string): string | null {
	const configurable = CONFIGURABLE_PROVIDER_MAP.get(providerId)
	const anchor = configurable?.docsAnchor ?? PROVIDER_DOCS_ANCHORS[providerId]
	if (!anchor) return null
	return `https://docs.devil-ai.com/providers/#${anchor}`
}

// ============================================================
// Main component
// ============================================================

/** Default auth method when no plugin provides methods for a provider */
const DEFAULT_API_KEY_METHOD: ProviderAuthMethod[] = [{ type: "api", label: "API Key" }]

/**
 * Providers whose env arrays list alternative names for the same credential.
 * These should show a single API key input, not an env-setup view.
 * All other providers with env.length > 1 are treated as co-required.
 */
const ALTERNATIVE_ENV_PROVIDERS = new Set(["google"])

/**
 * Determines the setup type for a multi-env provider:
 * - "configure": can be fully set up via auth.set() + config options
 * - "env-setup": must use environment variables (at least partially)
 * - null: not a multi-env provider
 */
function getMultiEnvSetupType(provider: CatalogProvider): "configure" | "env-setup" | null {
	if (provider.env.length <= 1 || ALTERNATIVE_ENV_PROVIDERS.has(provider.id)) return null
	if (CONFIGURABLE_PROVIDER_MAP.has(provider.id)) return "configure"
	return "env-setup"
}

interface ConnectProviderDialogProps {
	provider: CatalogProvider | null
	/** Plugin-provided auth methods. Falls back to API key if empty/undefined. */
	pluginAuthMethods?: ProviderAuthMethod[]
	onClose: () => void
	onConnected: () => void
}

export function ConnectProviderDialog({
	provider,
	pluginAuthMethods,
	onClose,
	onConnected,
}: ConnectProviderDialogProps) {
	const open = provider !== null
	const [step, setStep] = useState<DialogStep>({ type: "select-method" })
	const [state, setState] = useState<DialogState>({ status: "idle" })

	// Use plugin methods if available, otherwise default to API key
	const authMethods =
		pluginAuthMethods && pluginAuthMethods.length > 0 ? pluginAuthMethods : DEFAULT_API_KEY_METHOD

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (open) {
			setState({ status: "idle" })

			// OpenCode Zen: show the special Zen setup view
			if (provider?.id === ZEN_PROVIDER_ID) {
				setStep({ type: "zen-setup" })
				return
			}

			if (provider?.id === "ollama") {
				setStep({ type: "ollama-setup" })
				return
			}

			// Multi-env providers: route to either a form or env-var instructions
			if (provider && authMethods === DEFAULT_API_KEY_METHOD) {
				const setupType = getMultiEnvSetupType(provider)
				if (setupType === "configure") {
					setStep({ type: "configure" })
					return
				}
				if (setupType === "env-setup") {
					setStep({ type: "env-setup" })
					return
				}
			}

			// Auto-select method if only one available
			if (authMethods.length === 1) {
				const method = authMethods[0]
				if (method.type === "api") {
					setStep({ type: "api-key" })
				} else {
					setStep({ type: "oauth", method: 0 })
				}
			} else {
				setStep({ type: "select-method" })
			}
		}
	}, [open, authMethods, provider])

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) onClose()
		},
		[onClose],
	)

	const handleOAuthSuccess = useCallback(() => {
		setState({ status: "success" })
	}, [])

	if (!provider) return null

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						<ProviderIcon id={provider.id} name={provider.name} />
						{provider.id === ZEN_PROVIDER_ID ? provider.name : `Connect ${provider.name}`}
					</DialogTitle>
					<DialogDescription>
						{provider.id === ZEN_PROVIDER_ID
							? "Curated, optimized models for coding agents with a single API key."
							: `Add your credentials to start using ${provider.name} models`}
					</DialogDescription>
				</DialogHeader>

				{state.status === "success" ? (
					<SuccessView provider={provider} onDone={onConnected} />
				) : step.type === "zen-setup" ? (
				<ZenSetupView
					provider={provider}
					state={state}
					onSubmit={async (apiKey) => {
						setState({ status: "loading" })
						try {
							const client = getBaseClient()
							if (!client) throw new Error("Not connected to server")
							await client.auth.set({
								providerID: provider.id,
								auth: { type: "api", key: apiKey },
							})

							// Remove from disabled_providers if it was disabled (reconnecting)
							const currentConfig = await client.global.config.get().catch(() => null)
							const currentDisabled = (currentConfig?.data as any)?.disabled_providers ?? []
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
							log.error("Failed to set API key", {
								provider: provider.id,
								error: err,
							})
							setState({ status: "error", message })
						}
					}}
						onCancel={onClose}
					/>
				) : step.type === "ollama-setup" ? (
					<OllamaSetupView
						onCancel={onClose}
						onSuccess={() => {
							setState({ status: "success" })
						}}
					/>
				) : step.type === "configure" ? (
					<ConfigureProviderView
						provider={provider}
						state={state}
						setState={setState}
						onCancel={onClose}
					/>
				) : step.type === "env-setup" ? (
					<EnvSetupView provider={provider} onCancel={onClose} />
				) : step.type === "select-method" ? (
					<MethodSelectView
						authMethods={authMethods ?? []}
						onSelectApiKey={() => setStep({ type: "api-key" })}
						onSelectOAuth={(methodIndex) => setStep({ type: "oauth", method: methodIndex })}
					/>
					) : step.type === "api-key" ? (
					<ApiKeyView
						provider={provider}
						state={state}
						onSubmit={async (apiKey) => {
							setState({ status: "loading" })
							try {
								const client = getBaseClient()
								if (!client) throw new Error("Not connected to server")
								await client.auth.set({
									providerID: provider.id,
									auth: { type: "api", key: apiKey },
								})

								// Remove from disabled_providers if it was disabled (reconnecting)
								const currentConfig = await client.global.config.get().catch(() => null)
								const currentDisabled = (currentConfig?.data as any)?.disabled_providers ?? []
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
								log.error("Failed to set API key", {
									provider: provider.id,
									error: err,
								})
								setState({ status: "error", message })
							}
						}}
						onBack={
							authMethods && authMethods.length > 1
								? () => {
										setStep({ type: "select-method" })
										setState({ status: "idle" })
									}
								: undefined
						}
						onCancel={onClose}
					/>
				) : step.type === "oauth" ? (
					<OAuthView
						provider={provider}
						methodIndex={step.method}
						state={state}
						setState={setState}
						onSuccess={handleOAuthSuccess}
						onBack={
							authMethods && authMethods.length > 1
								? () => {
										setStep({ type: "select-method" })
										setState({ status: "idle" })
									}
								: undefined
						}
						onCancel={onClose}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	)
}


