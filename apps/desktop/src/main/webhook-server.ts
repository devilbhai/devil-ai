/**
 * Webhook server for GitHub/GitLab PR events.
 * Receives webhook events and triggers code reviews.
 *
 * Supports:
 * - GitHub: pull_request events (opened, synchronize, reopened)
 * - GitLab: merge_request events (open, update, reopen)
 *
 * Requires environment variables:
 * - GITHUB_WEBHOOK_SECRET: Secret for verifying GitHub webhook signatures
 * - GITLAB_WEBHOOK_SECRET: Secret for verifying GitLab webhook tokens
 */

import crypto from "node:crypto"
import { createServer } from "node:http"
import { createLogger } from "./logger"

const log = createLogger("webhook-server")

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024

// ============================================================
// Types
// ============================================================

export interface WebhookConfig {
	port: number
	secret?: string
	enabled: boolean
}

export interface PRReviewRequest {
	provider: "github" | "gitlab"
	repository: string
	branch: string
	prNumber: number
	prTitle: string
	prUrl: string
	commitSha: string
	files?: string[]
}

export interface WebhookEvent {
	type: "pr_opened" | "pr_updated" | "pr_closed"
	provider: "github" | "gitlab"
	timestamp: number
	data: PRReviewRequest
}

// ============================================================
// Webhook Server
// ============================================================

let server: ReturnType<typeof import("node:http").createServer> | null = null
let config: WebhookConfig = { port: 9876, enabled: false }

/**
 * Start the webhook server.
 */
export function startWebhookServer(webhookConfig: WebhookConfig): Promise<void> {
	return new Promise((resolve, reject) => {
		if (server) {
			log.warn("Webhook server already running")
			resolve()
			return
		}

		config = webhookConfig

		if (!config.enabled) {
			log.info("Webhook server disabled")
			resolve()
			return
		}

		const http = createServer(handleRequest)
		server = http

		if (!server) {
			reject(new Error("Failed to create webhook server"))
			return
		}

		server.listen(config.port, () => {
			log.info("Webhook server started", { port: config.port })
			resolve()
		})

		server.on("error", (err: Error) => {
			log.error("Webhook server error", err)
			reject(err)
		})
	})
}

/**
 * Stop the webhook server.
 */
export function stopWebhookServer(): Promise<void> {
	return new Promise((resolve) => {
		if (!server) {
			resolve()
			return
		}

		server.close(() => {
			server = null
			log.info("Webhook server stopped")
			resolve()
		})
	})
}

/**
 * Check if webhook server is running.
 */
export function isWebhookServerRunning(): boolean {
	return server !== null
}

/**
 * Get webhook server status.
 */
export function getWebhookServerStatus(): { running: boolean; port: number } {
	return {
		running: server !== null,
		port: config.port,
	}
}

// ============================================================
// Request Handler
// ============================================================

async function handleRequest(
	req: import("node:http").IncomingMessage,
	res: import("node:http").ServerResponse,
): Promise<void> {
	// Only accept POST requests
	if (req.method !== "POST") {
		res.writeHead(405, { "Content-Type": "application/json" })
		res.end(JSON.stringify({ error: "Method not allowed" }))
		return
	}

	// Read the request body
	const body = await readBody(req)

	try {
		// Detect provider from headers
		const provider = detectProvider(req)

		if (!provider) {
			log.warn("Unknown webhook provider", {
				headers: Object.keys(req.headers),
			})
			res.writeHead(400, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ error: "Unknown provider" }))
			return
		}

		// Verify webhook signature. Fail closed: if no secret is configured
		// we cannot trust the source, so reject outright.
		if (!config.secret) {
			log.warn("Webhook secret not configured — refusing unsigned events")
			res.writeHead(503, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ error: "Webhook signature verification not configured" }))
			return
		}

		const isValid = verifySignature(req, body, provider, config.secret)
		if (!isValid) {
			log.warn("Invalid webhook signature")
			res.writeHead(401, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ error: "Invalid signature" }))
			return
		}

		// Parse the event
		const event = parseWebhookEvent(req, body, provider)

		if (!event) {
			log.debug("Ignored webhook event", {
				type: req.headers["x-github-event"] || req.headers["x-gitlab-event"],
			})
			res.writeHead(200, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ received: true, ignored: true }))
			return
		}

		// Emit the event for the code review agent to process
		emitWebhookEvent(event)

		res.writeHead(200, { "Content-Type": "application/json" })
		res.end(JSON.stringify({ received: true, event: event.type }))
	} catch (err) {
		log.error("Webhook handler error", err)
		res.writeHead(500, { "Content-Type": "application/json" })
		res.end(JSON.stringify({ error: "Internal server error" }))
	}
}

// ============================================================
// Utility Functions
// ============================================================

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = ""
		req.on("data", (chunk) => {
			body += chunk.toString()
			if (body.length > MAX_WEBHOOK_BODY_BYTES) {
				reject(new Error("Body too large"))
			}
		})
		req.on("end", () => resolve(body))
		req.on("error", reject)
	})
}

function detectProvider(
	req: import("node:http").IncomingMessage,
): "github" | "gitlab" | null {
	const githubEvent = req.headers["x-github-event"]
	if (githubEvent) return "github"

	const gitlabEvent = req.headers["x-gitlab-event"]
	if (gitlabEvent) return "gitlab"

	return null
}

function verifySignature(
	req: import("node:http").IncomingMessage,
	body: string,
	provider: "github" | "gitlab",
	secret: string,
): boolean {
	if (provider === "github") {
		const signature = req.headers["x-hub-signature-256"]
		if (!signature || Array.isArray(signature)) return false

		const hmac = crypto.createHmac("sha256", secret)
		hmac.update(body)
		const expected = `sha256=${hmac.digest("hex")}`

		const sigBuf = Buffer.from(signature)
		const expBuf = Buffer.from(expected)
		if (sigBuf.length !== expBuf.length) return false
		return crypto.timingSafeEqual(sigBuf, expBuf)
	}

	if (provider === "gitlab") {
		const token = req.headers["x-gitlab-token"]
		if (!token || Array.isArray(token)) return false

		const tokenBuf = Buffer.from(token)
		const secretBuf = Buffer.from(secret)
		if (tokenBuf.length !== secretBuf.length) return false
		return crypto.timingSafeEqual(tokenBuf, secretBuf)
	}

	return false
}

function parseWebhookEvent(
	req: import("node:http").IncomingMessage,
	body: string,
	provider: "github" | "gitlab",
): WebhookEvent | null {
	try {
		const payload = JSON.parse(body)

		if (provider === "github") {
			return parseGitHubEvent(req, payload)
		}

		if (provider === "gitlab") {
			return parseGitLabEvent(req, payload)
		}

		return null
	} catch (err) {
		log.error("Failed to parse webhook payload", err)
		return null
	}
}

function parseGitHubEvent(
	req: import("node:http").IncomingMessage,
	payload: any,
): WebhookEvent | null {
	const eventType = req.headers["x-github-event"] as string

	if (eventType !== "pull_request") return null

	const action = payload.action
	if (!["opened", "synchronize", "reopened"].includes(action)) return null

	const pr = payload.pull_request
	if (!pr) return null

	return {
		type: action === "opened" ? "pr_opened" : "pr_updated",
		provider: "github",
		timestamp: Date.now(),
		data: {
			provider: "github",
			repository: payload.repository.full_name,
			branch: pr.head.ref,
			prNumber: pr.number,
			prTitle: pr.title,
			prUrl: pr.html_url,
			commitSha: pr.head.sha,
			files: [], // Will be fetched from GitHub API if needed
		},
	}
}

function parseGitLabEvent(
	req: import("node:http").IncomingMessage,
	payload: any,
): WebhookEvent | null {
	const eventType = req.headers["x-gitlab-event"] as string

	if (eventType !== "Merge Request Hook") return null

	const mr = payload.object_attributes
	if (!mr) return null

	const action = mr.action
	if (!["open", "update", "reopen"].includes(action)) return null

	return {
		type: action === "open" ? "pr_opened" : "pr_updated",
		provider: "gitlab",
		timestamp: Date.now(),
		data: {
			provider: "gitlab",
			repository: payload.project.path_with_namespace,
			branch: mr.source_branch,
			prNumber: mr.iid,
			prTitle: mr.title,
			prUrl: mr.url,
			commitSha: mr.last_commit.id,
			files: [],
		},
	}
}

// ============================================================
// Event Emitter
// ============================================================

type WebhookEventListener = (event: WebhookEvent) => void

const listeners = new Set<WebhookEventListener>()

/**
 * Subscribe to webhook events.
 */
export function onWebhookEvent(listener: WebhookEventListener): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

function emitWebhookEvent(event: WebhookEvent): void {
	log.info("Webhook event received", {
		type: event.type,
		provider: event.provider,
		pr: event.data.prNumber,
	})

	for (const listener of listeners) {
		try {
			listener(event)
		} catch (err) {
			log.error("Webhook listener error", err)
		}
	}
}
