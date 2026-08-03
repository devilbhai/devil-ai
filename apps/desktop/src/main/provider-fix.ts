import { createLogger } from "./logger"
import { getServerUrl } from "./opencode-manager"

const log = createLogger("provider-fix")

const DEVILROUTE_BASE_URL = process.env.DEVILROUTE_BASE_URL ?? "https://ai.agribee.in/v1"
// Prefer env var; fallback keeps old behavior working without a rebuild.
const DEVILROUTE_API_KEY = process.env.DEVILROUTE_API_KEY ?? "devil-ai-secure-2026"

const DEFAULT_DEVILROUTE_MODELS = [
	"auto/best-coding",
	"auto/best-reasoning",
	"auto/best-fast",
	"auto/best-vision",
	"auto/best-chat",
]

/**
 * Fetch the model list advertised by the DevilRoute proxy
 * (OpenAI-compatible GET /models endpoint).
 */
async function fetchDevilRouteModels(apiKey: string): Promise<string[]> {
	try {
		const res = await fetch(`${DEVILROUTE_BASE_URL}/models`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: AbortSignal.timeout(8000),
		})
		if (!res.ok) {
			log.warn("Failed to fetch DevilRoute models", { status: res.status })
			return DEFAULT_DEVILROUTE_MODELS
		}
		const data = (await res.json()) as { data: Array<{ id: string }> }
		const ids = (data.data ?? []).map((m) => m.id).filter(Boolean)
		return ids.length > 0 ? ids : DEFAULT_DEVILROUTE_MODELS
	} catch (err) {
		log.warn("Failed to fetch DevilRoute models", err)
		return DEFAULT_DEVILROUTE_MODELS
	}
}

/**
 * PATCH the running engine's global config.
 *
 * The opencode engine exposes:
 *   GET  /config            -> read config
 *   GET  /global/config     -> read config (v2, same data)
 *   PATCH /global/config    -> update config (body = config object directly)
 *   GET  /config/providers  -> list connected providers
 *
 * NOTE: `PATCH /config` (v1) is a READ-ONLY no-op on engine >=1.17 — it
 * returns 200 but changes nothing. Config mutation goes through the v2
 * route `/global/config`.
 */
async function patchEngineConfig(patch: Record<string, unknown>): Promise<boolean> {
	const serverUrl = getServerUrl()
	if (!serverUrl) {
		log.warn("Cannot patch engine config: engine server not running.")
		return false
	}
	try {
		const res = await fetch(`${serverUrl}/global/config`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		})
		if (!res.ok) {
			log.warn("Failed to patch engine config", { status: res.status })
			return false
		}
		return true
	} catch (err) {
		log.error("Failed to patch engine config", err)
		return false
	}
}

/**
 * Ensures the local 'privatemode-ai' provider is configured correctly
 * for Ollama or LM Studio by overriding its endpoint URL.
 *
 * Default engine SDK expects standard OpenAI endpoints.
 * This script forces the provider options to point to the correct local server.
 */
export async function applyLocalProviderFix(port: number = 11434): Promise<void> {
	const ok = await patchEngineConfig({
		provider: {
			"privatemode-ai": {
				api: "openai",
				options: {
					baseURL: `http://127.0.0.1:${port}/v1`,
					apiKey: "ollama-dummy-key", // Required by SDK even if unused locally
				},
			},
		},
	})
	if (ok) log.info("Local provider fix applied successfully.")
}

/**
 * Injects the native DevilRoute provider into the engine configuration so it
 * shows up in the provider list and chat model picker.
 */
export async function applyDevilRouteSetup(): Promise<void> {
	try {
		const modelIds = await fetchDevilRouteModels(DEVILROUTE_API_KEY)
		const models: Record<string, { name: string; tool_call: boolean }> = {}
		for (const id of modelIds) {
			models[id] = { name: id, tool_call: true }
		}

		// Ensure mimo aliases are present in the model map
		models["mimo-auto"] = { name: "MiMo V2.5 Free", tool_call: true }
		models["mimo"] = { name: "MiMo V2.5 Free", tool_call: true }

		// Ensure 'devil-ai' and 'mcode' are not hidden from the model picker.
		let disabled: string[] = []
		try {
			const serverUrl = getServerUrl()
			if (serverUrl) {
				const cfgRes = await fetch(`${serverUrl}/config`)
				if (cfgRes.ok) {
					const cfg = (await cfgRes.json()) as { disabled_providers?: unknown }
					if (Array.isArray(cfg.disabled_providers)) {
						disabled = cfg.disabled_providers
					}
				}
			}
		} catch {
			// Non-fatal: worst case the provider stays hidden until next run.
		}

		const patch: Record<string, unknown> = {
			provider: {
				"devil-ai": {
					name: "Devil-Ai",
					api: "openai",
					options: {
						baseURL: DEVILROUTE_BASE_URL,
						apiKey: DEVILROUTE_API_KEY,
					},
					models,
				},
				"mcode": {
					name: "MiMo Free",
					api: "openai",
					options: {
						baseURL: DEVILROUTE_BASE_URL,
						apiKey: DEVILROUTE_API_KEY,
					},
					models: {
						"mimo-auto": { name: "MiMo V2.5 Free", tool_call: true },
						"mimo": { name: "MiMo V2.5 Free", tool_call: true },
					},
				},
			},
		}
		if (disabled.includes("devil-ai") || disabled.includes("mcode")) {
			patch.disabled_providers = disabled.filter((id) => id !== "devil-ai" && id !== "mcode")
		}

		const ok = await patchEngineConfig(patch)
		if (ok) {
			log.info("DevilRoute & MiMo providers injected.", { modelCount: Object.keys(models).length })
		}
	} catch (err) {
		log.error("Failed to inject DevilRoute:", err)
	}
}
