/**
 * REST API Server - Exposes Devil AI capabilities via HTTP API.
 *
 * Features:
 * - RESTful API endpoints for AI chat, sessions, automations
 * - Cloudflare tunnel integration for external access
 * - Authentication via API keys
 * - Rate limiting and CORS support
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http"
import crypto from "node:crypto"
import { app } from "electron"
import { createLogger } from "./logger"
import { getSettings } from "./settings-store"
import { isCloudflaredInstalled, startTunnel, stopTunnel, getTunnelUrl } from "./tunnel-manager"
import { executeOsAutomation } from "./os-automation"
import { handleBrowserSubagent, handleGenerateImage, handleMultiReplace, handleInvokeSubagent } from "./desktop-tools"
import { getAllTasks } from "./background-tasks"

const log = createLogger("rest-api")

// ============================================================
// Types
// ============================================================

export interface RestApiConfig {
	enabled: boolean
	port: number
	enableCors: boolean
	allowedOrigins: string[]
	requireAuth: boolean
	apiKey: string
	enableTunnel: boolean
	tunnelSubdomain?: string
}

export interface ApiKey {
	id: string
	name: string
	key: string
	createdAt: string
	lastUsedAt?: string
	expiresAt?: string
}

// ============================================================
// State
// ============================================================

let httpServer: Server | null = null
let tunnelProcess: any = null
let currentConfig: RestApiConfig | null = null
const apiKeys = new Map<string, ApiKey>()

// ============================================================
// Request parsing
// ============================================================

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		let body = ""
		req.on("data", (chunk) => {
			body += chunk.toString()
		})
		req.on("end", () => {
			try {
				resolve(body ? JSON.parse(body) : {})
			} catch (err) {
				reject(new Error("Invalid JSON"))
			}
		})
		req.on("error", reject)
	})
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { "Content-Type": "application/json" })
	res.end(JSON.stringify(data))
}

function sendError(res: ServerResponse, status: number, message: string): void {
	sendJson(res, status, { error: message })
}

// ============================================================
// Authentication middleware
// ============================================================

function authenticate(req: IncomingMessage, config: RestApiConfig): boolean {
	if (!config.requireAuth) return true

	const authHeader = req.headers.authorization
	if (!authHeader?.startsWith("Bearer ")) return false

	const token = authHeader.slice(7)
	const key = apiKeys.get(token)

	if (!key) return false

	// Check expiry
	if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
		return false
	}

	// Update last used
	key.lastUsedAt = new Date().toISOString()

	return true
}

// ============================================================
// CORS middleware
// ============================================================

function handleCors(req: IncomingMessage, res: ServerResponse, config: RestApiConfig): boolean {
	if (config.enableCors) {
		res.setHeader("Access-Control-Allow-Origin", "*")
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
		res.setHeader("Access-Control-Max-Age", "86400")
	}

	if (req.method === "OPTIONS") {
		res.writeHead(204)
		res.end()
		return true
	}

	return false
}

// ============================================================
// API Routes
// ============================================================

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const url = new URL(req.url || "/", `http://${req.headers.host}`)
	const path = url.pathname
	const method = req.method || "GET"

	// CORS
	if (!currentConfig || handleCors(req, res, currentConfig)) return

	// Health check (no auth required)
	if (path === "/health") {
		sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() })
		return
	}

	// Internal PC Control (Localhost only, no auth required)
	if (path === "/api/pc-control" && method === "POST") {
		const host = req.headers.host || ""
		if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
			sendError(res, 403, "Forbidden")
			return
		}
		
		try {
			const body = await parseBody(req) as { script: string; platform: "mac" | "win" }
			if (!body.script || !body.platform) {
				sendError(res, 400, "Missing script or platform")
				return
			}
			
			const result = await executeOsAutomation(body.script, body.platform)
			sendJson(res, 200, result)
		} catch (err) {
			log.error("pc-control error", err)
			sendError(res, 500, "Automation failed")
		}
		return
	}

		// Advanced Tool Endpoints (Localhost only)
		if (path.startsWith("/api/tools/")) {
			const host = req.headers.host || ""
			if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
				sendError(res, 403, "Forbidden")
				return
			}
			
			if (method === "GET" && path === "/api/tools/tasks") {
				sendJson(res, 200, getAllTasks())
				return
			}

			if (method === "POST") {
				const body = await parseBody(req) as any
				
				if (path === "/api/tools/browser") {
				const result = await handleBrowserSubagent(body.action, body.url, body.selector, body.text)
				sendJson(res, 200, result)
				return
			}
			
			if (path === "/api/tools/image") {
				const result = await handleGenerateImage(body.prompt)
				sendJson(res, 200, result)
				return
			}
			
			if (path === "/api/tools/multi-replace") {
				const result = await handleMultiReplace(body.filePath, body.chunks)
				sendJson(res, 200, result)
				return
			}
			
			if (path === "/api/tools/subagent") {
				const result = await handleInvokeSubagent(body.prompt)
				sendJson(res, 200, result)
				return
			}
			}
		}

	// Authentication
	if (!authenticate(req, currentConfig)) {
		sendError(res, 401, "Unauthorized")
		return
	}

	// API routes
	try {
		// Chat endpoint
		if (path === "/api/chat" && method === "POST") {
			const body = await parseBody(req)
			const { prompt, code, language } = body as { prompt: string; code?: string; language?: string }

			if (!prompt) {
				sendError(res, 400, "Prompt is required")
				return
			}

			// Forward to engine server
			const settings = getSettings()
			const localServer = settings.servers.servers.find((s: any) => s.type === "local") as any
			const serverUrl = localServer?.url || "http://localhost:3100"

			const response = await fetch(`${serverUrl}/api/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt, code, language }),
			})

			const data = await response.json()
			sendJson(res, 200, data)
			return
		}

		// Sessions endpoint
		if (path === "/api/sessions" && method === "GET") {
			// List sessions
			sendJson(res, 200, { sessions: [] })
			return
		}

		// Automations endpoint
		if (path === "/api/automations" && method === "GET") {
			// List automations
			sendJson(res, 200, { automations: [] })
			return
		}

		// Workflows endpoint
		if (path === "/api/workflows" && method === "GET") {
			// List workflows
			sendJson(res, 200, { workflows: [] })
			return
		}

		// Status endpoint
		if (path === "/api/status" && method === "GET") {
		sendJson(res, 200, {
			version: app.getVersion(),
				features: {
					githubActions: true,
					workflowBuilder: true,
					vscodeExtension: true,
					customThemes: true,
					restApi: true,
				},
			})
			return
		}

		// 404
		sendError(res, 404, "Not found")
	} catch (err) {
		log.error("API error", err)
		sendError(res, 500, "Internal server error")
	}
}

// ============================================================
// Server management
// ============================================================

/**
 * Start the REST API server.
 */
export async function startRestApi(config: RestApiConfig): Promise<{ url: string; tunnelUrl?: string }> {
	if (httpServer) {
		await stopRestApi()
	}

	currentConfig = config

	return new Promise((resolve, reject) => {
		httpServer = createServer(handleRequest)

		httpServer.on("error", (err) => {
			log.error("REST API server error", err)
			reject(err)
		})

		httpServer.listen(config.port, "0.0.0.0", async () => {
			log.info("REST API server started", { port: config.port })
			const url = `http://localhost:${config.port}`

			let tunnelUrl: string | undefined

			// Start Cloudflare tunnel if enabled
			if (config.enableTunnel && isCloudflaredInstalled()) {
				try {
					const tunnel = await startTunnel(`rest-api-${config.port}`)
					if (tunnel) {
						tunnelUrl = tunnel.url
						log.info("Cloudflare tunnel started", { url: tunnelUrl })
					}
				} catch (err) {
					log.error("Failed to start tunnel", err)
				}
			}

			resolve({ url, tunnelUrl })
		})
	})
}

/**
 * Stop the REST API server.
 */
export async function stopRestApi(): Promise<void> {
	if (tunnelProcess) {
		await stopTunnel()
		tunnelProcess = null
	}

	return new Promise((resolve) => {
		if (httpServer) {
			httpServer.close(() => {
				httpServer = null
				currentConfig = null
				log.info("REST API server stopped")
				resolve()
			})
		} else {
			resolve()
		}
	})
}

/**
 * Get REST API status.
 */
export function getRestApiStatus(): { running: boolean; url?: string; tunnelUrl?: string } {
	const running = httpServer !== null
	const url = running ? `http://localhost:${currentConfig?.port}` : undefined
	const tunnelUrl = getTunnelUrl() || undefined

	return { running, url, tunnelUrl }
}

/**
 * Generate a new API key.
 */
export function generateApiKey(name: string, expiresAt?: string): ApiKey {
	const key = `dai_${crypto.randomBytes(32).toString("hex")}`
	const apiKey: ApiKey = {
		id: crypto.randomUUID(),
		name,
		key,
		createdAt: new Date().toISOString(),
		expiresAt,
	}
	apiKeys.set(key, apiKey)
	log.info("API key generated", { name, id: apiKey.id })
	return apiKey
}

/**
 * Revoke an API key.
 */
export function revokeApiKey(key: string): boolean {
	const deleted = apiKeys.delete(key)
	if (deleted) {
		log.info("API key revoked")
	}
	return deleted
}

/**
 * List all API keys (without the actual key).
 */
export function listApiKeys(): Omit<ApiKey, "key">[] {
	return Array.from(apiKeys.values()).map(({ key: _, ...rest }) => rest)
}
