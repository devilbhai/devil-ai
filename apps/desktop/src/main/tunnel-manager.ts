/**
 * Tunnel Manager — creates temporary Cloudflare tunnels for session sharing.
 *
 * When a user clicks "Share Session", this module:
 * 1. Finds a free port
 * 2. Starts a lightweight HTTP server that serves a sharing page
 * 3. Spawns cloudflared to create a temporary tunnel
 * 4. Returns the *.trycloudflare.com URL
 */

import { renderTunnelTemplate } from "./tunnel-template"
import crypto from "node:crypto"
import { type ChildProcess, spawn, execSync } from "node:child_process"
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http"
import { createLogger } from "./logger"
import { getSettings } from "./settings-store"
import { DEFAULT_PORT } from "../shared/server-config"

const MAX_BODY_BYTES = 1024 * 1024

/** True if the request carries an authorized viewer id (OTP/master verified). */
function isAuthorized(req: IncomingMessage): boolean {
	const url = new URL(req.url || "/", `http://${req.headers.host}`)
	const viewerId = url.searchParams.get("viewerId")
	if (viewerId && authorizedSessions.has(viewerId)) return true
	const cookie = req.headers.cookie || ""
	for (const part of cookie.split(";")) {
		const [k, v] = part.trim().split("=")
		if (k === "viewerId" && v && authorizedSessions.has(v)) return true
	}
	return false
}

const log = createLogger("tunnel-manager")

// ============================================================
// State
// ============================================================

let tunnelProcess: ChildProcess | null = null
let httpServer: Server | null = null
let currentUrl: string | null = null
let currentOtp: string | null = null

// Viewer tracking
interface Viewer {
	id: string
	joinedAt: number
	lastSeen: number
	userAgent: string
}

const viewers = new Map<string, Viewer>()

// Authorized sessions - set after OTP or master password verification
const authorizedSessions = new Set<string>()

/**
 * Generates a 6-digit OTP for session sharing.
 */
function generateOtp(): string {
	return crypto.randomInt(100000, 1000000).toString()
}

/**
 * Returns the current OTP (for display in app).
 */
export function getCurrentOtp(): string | null {
	return currentOtp
}

// ============================================================
// Cloudflared path detection
// ============================================================

/**
 * Finds the cloudflared binary path.
 * Works on macOS, Windows, and Linux.
 */
function findCloudflaredPath(): string | null {
	const platform = process.platform

	try {
		if (platform === "win32") {
			// Windows: check common installation paths
			const paths = [
				`${process.env.LOCALAPPDATA}\\cloudflared\\cloudflared.exe`,
				`${process.env.PROGRAMFILES}\\cloudflared\\cloudflared.exe`,
				`${process.env["PROGRAMFILES(X86)"]}\\cloudflared\\cloudflared.exe`,
			]
			for (const p of paths) {
				try {
					execSync(`"${p}" --version`, { stdio: "ignore" })
					return p
				} catch {
					// not found, continue
				}
			}
			// Try PATH
			try {
				execSync("cloudflared --version", { stdio: "ignore" })
				return "cloudflared"
			} catch {
				return null
			}
		} else {
			// macOS/Linux: use which or common paths
			try {
				const result = execSync("which cloudflared", { encoding: "utf-8" }).trim()
				return result || null
			} catch {
				// Try common paths
				const paths = [
					"/opt/homebrew/bin/cloudflared",
					"/usr/local/bin/cloudflared",
					"/usr/bin/cloudflared",
				]
				for (const p of paths) {
					try {
						execSync(`"${p}" --version`, { stdio: "ignore" })
						return p
					} catch {
						continue
					}
				}
				return null
			}
		}
	} catch {
		return null
	}
}

/**
 * Checks if cloudflared is installed and returns its path.
 */
export function isCloudflaredInstalled(): boolean {
	return findCloudflaredPath() !== null
}

/**
 * Returns installation instructions based on platform.
 */
export function getCloudflaredInstallCommand(): string {
	const platform = process.platform
	if (platform === "darwin") {
		return "brew install cloudflare/cloudflare/cloudflared"
	} else if (platform === "win32") {
		return "winget install Cloudflare.cloudflared"
	} else {
		return "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared"
	}
}

// ============================================================
// Viewer Management
// ============================================================

/**
 * Returns list of active viewers (seen in last 30 seconds).
 */
export function getActiveViewers(): Viewer[] {
	const now = Date.now()
	const active: Viewer[] = []
	for (const viewer of viewers.values()) {
		if (now - viewer.lastSeen < 30_000) {
			active.push(viewer)
		}
	}
	return active
}

/**
 * Returns viewer count.
 */
export function getViewerCount(): number {
	return getActiveViewers().length
}

// ============================================================
// HTTP Server
// ============================================================

/** Reads a request body, rejecting/capping beyond MAX_BODY_BYTES. */
function readBodyCapped(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = ""
		let exceeded = false
		req.on("data", (chunk: Buffer) => {
			if (exceeded) return
			body += chunk.toString()
			if (body.length > MAX_BODY_BYTES) {
				exceeded = true
				reject(new Error("Body too large"))
			}
		})
		req.on("end", () => (exceeded ? null : resolve(body)))
		req.on("error", reject)
	})
}

/**
 * Fetches session data from the engine server.
 */
async function fetchSessionData(sessionId: string) {
	try {
		// Fetch all sessions for sidebar
		const allRes = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session`)
		const allSessions = allRes.ok ? await allRes.json() as Array<{
			id: string
			title?: string
			time?: { created?: number; updated?: number }
			agent?: string
			model?: { id?: string; providerID?: string }
		}> : []

		// Fetch session info
		const sessionRes = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session/${sessionId}`)
		if (!sessionRes.ok) {
			return { title: "Shared Session", messages: [], sessions: [], currentSessionId: sessionId }
		}
		const session = await sessionRes.json() as { title?: string }

		// Fetch messages
		const messages = await fetchSessionMessages(sessionId)

		return {
			title: session?.title || "Shared Session",
			messages,
			sessions: allSessions.slice(0, 20),
			currentSessionId: sessionId,
		}
	} catch (err) {
		log.warn("Failed to fetch session data", { error: String(err) })
		return { title: "Shared Session", messages: [], sessions: [], currentSessionId: sessionId }
	}
}

/**
 * Formats a timestamp to relative time string.
 */
function formatTimeAgo(timestamp: number): string {
	const diff = Date.now() - timestamp
	const minutes = Math.floor(diff / 60000)
	const hours = Math.floor(diff / 3600000)
	const days = Math.floor(diff / 86400000)
	if (minutes < 1) return "just now"
	if (minutes < 60) return `${minutes}m ago`
	if (hours < 24) return `${hours}h ago`
	return `${days}d ago`
}

/**
 * Fetches raw messages from engine server for a session.
 */
async function fetchSessionMessages(sessionId: string): Promise<Array<{ role: string; content: string }>> {
	try {
		const msgRes = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session/${sessionId}/message`)
		if (!msgRes.ok) return []
		const rawMessages = await msgRes.json() as Array<{
			info: { role?: string }
			parts?: Array<{ type?: string; text?: string }>
		}>

		return rawMessages
			.filter((msg) => msg.info?.role === "user" || msg.info?.role === "assistant")
			.map((msg) => {
				const textParts = (msg.parts || [])
					.filter((p) => p.type === "text" && p.text)
					.map((p) => p.text!)
				return {
					role: msg.info!.role!,
					content: textParts.join("\n"),
				}
			})
			.filter((m) => m.content.length > 0)
	} catch {
		return []
	}
}

/**
 * Creates a simple HTTP server that serves a sharing page.
 * Fetches fresh session data on every request for live updates.
 */
async function createSharingServer(sessionId: string): Promise<Server> {
	return new Promise((resolve, reject) => {
		const server = async (req: IncomingMessage, res: ServerResponse) => {
			const url = new URL(req.url || "/", `http://${req.headers.host}`)
			const pathname = url.pathname

			// CORS headers for API calls
			res.setHeader("Access-Control-Allow-Origin", "*")
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			res.setHeader("Access-Control-Allow-Headers", "Content-Type")

			if (req.method === "OPTIONS") {
				res.writeHead(204)
				res.end()
				return
			}

			// API: Viewer join/heartbeat
			if (pathname === "/api/join" && req.method === "POST") {
				readBodyCapped(req).then((body) => {
					try {
						const data = JSON.parse(body) as { viewerId?: string }
						const viewerId = data.viewerId || `viewer-${Date.now()}`
						const now = Date.now()

						viewers.set(viewerId, {
							id: viewerId,
							joinedAt: viewers.get(viewerId)?.joinedAt ?? now,
							lastSeen: now,
							userAgent: req.headers["user-agent"] || "Unknown",
						})

						log.info("Viewer joined/heartbeat", { viewerId, total: viewers.size })

						res.writeHead(200, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ ok: true, viewerCount: getViewerCount() }))
					} catch {
						res.writeHead(400, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ error: "Invalid request" }))
					}
				}).catch(() => {
					res.writeHead(400, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ error: "Invalid request" }))
				})
				return
			}

			// API: Get active viewers (for host)
			if (pathname === "/api/viewers") {
				const active = getActiveViewers()
				res.writeHead(200, { "Content-Type": "application/json" })
				res.end(JSON.stringify({ viewers: active, count: active.length }))
				return
			}

			// API: Leave
			if (pathname === "/api/leave" && req.method === "POST") {
				readBodyCapped(req).then((body) => {
					try {
						const data = JSON.parse(body) as { viewerId?: string }
						if (data.viewerId) {
							viewers.delete(data.viewerId)
						}
						res.writeHead(200, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ ok: true }))
					} catch {
						res.writeHead(400, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ error: "Invalid request" }))
					}
				}).catch(() => {
					res.writeHead(400, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ error: "Invalid request" }))
				})
				return
			}

			// API: Send message from viewer to engine session
			if (pathname === "/api/message" && req.method === "POST") {
				readBodyCapped(req).then(async (body) => {
					try {
						const data = JSON.parse(body) as { text?: string; viewerId?: string }
						if (!data.text || data.text.trim().length === 0) {
							res.writeHead(400, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ error: "Message text is required" }))
							return
						}

						log.info("Viewer message received", { viewerId: data.viewerId, text: data.text.slice(0, 50) })

						// Forward to engine server
						const promptRes = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session/${sessionId}/message`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								parts: [{ type: "text", text: data.text }],
							}),
						})

						if (!promptRes.ok) {
							const errText = await promptRes.text()
							log.warn("Engine prompt failed", { status: promptRes.status, error: errText.slice(0, 200) })
							res.writeHead(502, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ error: "Failed to send message to AI" }))
							return
						}

						// Wait up to 60s for the AI response by polling messages
						const startTime = Date.now()
						const initialMsgs = await fetchSessionMessages(sessionId)
						const initialCount = initialMsgs.length
						let responseText = ""

						while (Date.now() - startTime < 60_000) {
							await new Promise((r) => setTimeout(r, 1500))
							const currentMsgs = await fetchSessionMessages(sessionId)
							if (currentMsgs.length > initialCount) {
								// New message(s) arrived — get the last assistant message
								const lastMsg = currentMsgs[currentMsgs.length - 1]
								if (lastMsg.role === "assistant" && lastMsg.content) {
									responseText = lastMsg.content
									break
								}
							}
						}

						res.writeHead(200, { "Content-Type": "application/json" })
						res.end(JSON.stringify({
							ok: true,
							response: responseText || "(AI is still processing...)",
						}))
					} catch (err) {
						log.warn("Message send failed", { error: String(err) })
						res.writeHead(500, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ error: "Internal error" }))
					}
				}).catch(() => {
					res.writeHead(400, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ error: "Invalid request" }))
				})
				return
			}

			// API: Get current messages (for polling)
			if (pathname === "/api/messages" && req.method === "GET") {
				if (!isAuthorized(req)) {
					res.writeHead(401, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ error: "Unauthorized" }))
					return
				}
				const msgs = await fetchSessionMessages(sessionId)
				res.writeHead(200, { "Content-Type": "application/json" })
				res.end(JSON.stringify({ messages: msgs }))
				return
			}

			// API: SSE stream for live typing effect
			if (pathname === "/api/stream" && req.method === "GET") {
				if (!isAuthorized(req)) {
					res.writeHead(401, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ error: "Unauthorized" }))
					return
				}
				res.writeHead(200, {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					"Connection": "keep-alive",
					"Access-Control-Allow-Origin": "*",
				})

				// Proxy SSE from engine server
				let aborted = false
				let controller: AbortController | null = null

				const cleanup = () => {
					aborted = true
					controller?.abort()
				}

				req.on("close", cleanup)

				const forwardEvent = (eventName: string, data: string) => {
					if (aborted) return
					try {
						const parsed = JSON.parse(data)
						// Filter events for this session only
						const eventSessionId = parsed.properties?.sessionID || parsed.properties?.info?.sessionID
						if (eventSessionId === sessionId) {
							res.write(`event: ${eventName}\ndata: ${data}\n\n`)
						}
					} catch {
						// Forward all events if parsing fails
						if (!aborted) {
							res.write(`event: ${eventName}\ndata: ${data}\n\n`)
						}
					}
				}

				// Connect to engine's SSE endpoint
				try {
					controller = new AbortController()
					const response = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/global/event`, {
						headers: { Accept: "text/event-stream" },
						signal: controller.signal,
					})

					if (!response.ok || !response.body) {
						res.write(`event: error\ndata: {"error":"Failed to connect"}\n\n`)
						res.end()
						return
					}

					const reader = response.body.getReader()
					const decoder = new TextDecoder()
					let buffer = ""

					while (!aborted) {
						const { done, value } = await reader.read()
						if (done) break

						buffer += decoder.decode(value, { stream: true })
						const lines = buffer.split("\n")
						buffer = lines.pop() || ""

						let currentEvent = ""
						let currentData = ""

						for (const line of lines) {
							if (line.startsWith("event: ")) {
								currentEvent = line.slice(7)
							} else if (line.startsWith("data: ")) {
								currentData = line.slice(6)
							} else if (line === "" && currentEvent && currentData) {
								forwardEvent(currentEvent, currentData)
								currentEvent = ""
								currentData = ""
							}
						}
					}
				} catch (err) {
					if (!aborted) {
						log.warn("SSE proxy error", { error: String(err) })
						res.write(`event: error\ndata: {"error":"Connection lost"}\n\n`)
					}
				} finally {
					res.end()
				}
				return
			}

			// API: Verify OTP or master password
			if (pathname === "/api/auth" && req.method === "POST") {
				readBodyCapped(req).then((body) => {
					try {
						const data = JSON.parse(body) as { password?: string; viewerId?: string }
						const password = data.password?.trim()

						if (!password) {
							res.writeHead(400, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: false, error: "Password required" }))
							return
						}

						// Check OTP
						let otpValid = false
						if (currentOtp && password.length === currentOtp.length) {
							otpValid = crypto.timingSafeEqual(Buffer.from(password), Buffer.from(currentOtp))
						}

						// Check master password from settings
						let masterValid = false
						try {
							const settings = getSettings()
							if (settings.masterPassword && settings.masterPasswordSalt) {
								const hashedAttempt = crypto.pbkdf2Sync(password, settings.masterPasswordSalt, 100000, 64, "sha512").toString("hex")
								if (hashedAttempt.length === settings.masterPassword.length) {
									masterValid = crypto.timingSafeEqual(Buffer.from(hashedAttempt), Buffer.from(settings.masterPassword))
								}
							} else if (settings.masterPassword && !settings.masterPasswordSalt) {
								// Legacy un-salted sha256
								const hashedAttempt = crypto.createHash("sha256").update(password).digest("hex")
								if (hashedAttempt.length === settings.masterPassword.length) {
									masterValid = crypto.timingSafeEqual(Buffer.from(hashedAttempt), Buffer.from(settings.masterPassword))
								}
							}
						} catch {
							// Settings file doesn't exist or no master password set
						}

						if (otpValid || masterValid) {
							// Authorize this viewer
							if (data.viewerId) {
								authorizedSessions.add(data.viewerId)
							}
							log.info("Viewer authenticated", { viewerId: data.viewerId, method: otpValid ? "otp" : "master" })
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
						} else {
							res.writeHead(401, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: false, error: "Invalid password" }))
						}
					} catch {
						res.writeHead(400, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ ok: false, error: "Invalid request" }))
					}
				}).catch(() => {
					res.writeHead(400, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ ok: false, error: "Invalid request" }))
				})
				return
			}

			// Main page: Fetch FRESH session data on every request
			// Allow switching sessions via ?session= query parameter
			const requestedSessionId = url.searchParams.get("session") || sessionId
			const sessionData = await fetchSessionData(requestedSessionId)

			// Escape HTML to prevent XSS
			const escapeHtml = (text: string) => text
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;")

			// Build session list for sidebar
			const sessionListHtml = sessionData.sessions.map(s => {
				const isActive = s.id === sessionData.currentSessionId
				const title = escapeHtml(s.title || "Untitled")
				const timeAgo = s.time?.updated ? formatTimeAgo(s.time.updated) : ""
				return `<div class="sidebar-item ${isActive ? 'active' : ''}" data-session-id="${s.id}" style="cursor:pointer">
					<div class="sidebar-item-icon">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
						</svg>
					</div>
					<div class="sidebar-item-content">
						<div class="sidebar-item-title">${title}</div>
						<div class="sidebar-item-meta">${s.agent || "build"} \u2022 ${timeAgo}</div>
					</div>
					${isActive ? '<div class="sidebar-active-dot"></div>' : ''}
				</div>`
			}).join('')

			const html = renderTunnelTemplate(sessionData, sessionListHtml, requestedSessionId, escapeHtml)


			res.writeHead(200, { "Content-Type": "text/html" })
			res.end(html)
		}

		const httpServer = createServer(server)

		httpServer.on("error", reject)

		// Start on free port
		httpServer.listen(0, "127.0.0.1", () => {
			const addr = httpServer.address()
			if (addr && typeof addr === "object") {
				log.info("Sharing server started", { port: addr.port })
				resolve(httpServer)
			} else {
				reject(new Error("Failed to get server address"))
			}
		})
	})
}

// ============================================================
// Tunnel Management
// ============================================================

/**
 * Starts a temporary Cloudflare tunnel for session sharing.
 * Returns the public URL that can be used to view the session.
 */
export async function startTunnel(sessionId: string): Promise<{ url: string; otp: string }> {
	// Stop any existing tunnel
	stopTunnel()

	// Generate OTP
	currentOtp = generateOtp()
	authorizedSessions.clear()

	// Find cloudflared
	const cloudflaredPath = findCloudflaredPath()
	if (!cloudflaredPath) {
		throw new Error(
			`cloudflared is not installed. Please install it:\n${getCloudflaredInstallCommand()}`,
		)
	}

	// Start sharing server with session data
	httpServer = await createSharingServer(sessionId)

	// Get the port the server is listening on
	const addr = httpServer.address()
	const actualPort = addr && typeof addr === "object" ? addr.port : 0

	log.info("Starting tunnel", { sessionId, port: actualPort })

	return new Promise((resolve, reject) => {
		// Spawn cloudflared
		const args = ["tunnel", "--url", `http://127.0.0.1:${actualPort}`]

		tunnelProcess = spawn(cloudflaredPath, args, {
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		})

		let stderr = ""
		let urlFound = false

		// cloudflared outputs the URL to stderr, not stdout
		tunnelProcess.stderr?.on("data", (data: Buffer) => {
			const chunk = data.toString()
			stderr += chunk
			log.debug("cloudflared stderr", { chunk: chunk.trim() })

			// Look for the trycloudflare.com URL in stderr
			const urlMatch = stderr.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/)
			if (urlMatch && !urlFound) {
				urlFound = true
				currentUrl = urlMatch[1]
				log.info("Tunnel URL found", { url: currentUrl })
				resolve({ url: currentUrl, otp: currentOtp! })
			}
		})

		// Handle stdout (usually just connection info)
		tunnelProcess.stdout?.on("data", (data: Buffer) => {
			const chunk = data.toString()
			log.debug("cloudflared stdout", { chunk: chunk.trim() })
		})

		// Handle process exit
		tunnelProcess.on("exit", (code) => {
			log.info("Tunnel process exited", { code })
			if (!urlFound) {
				reject(new Error(`cloudflared exited with code ${code}`))
			}
			cleanup()
		})

		// Handle spawn error
		tunnelProcess.on("error", (err) => {
			log.error("Failed to spawn cloudflared", { error: err.message })
			cleanup()
			reject(new Error(`Failed to start cloudflared: ${err.message}`))
		})

		// Timeout after 15 seconds
		setTimeout(() => {
			if (!urlFound) {
				stopTunnel()
				reject(new Error("Tunnel timed out waiting for URL"))
			}
		}, 15_000)
	})
}

/**
 * Stops the current tunnel and cleans up resources.
 */
export function stopTunnel(): void {
	log.info("Stopping tunnel")

	if (tunnelProcess) {
		try {
			// Kill the process group on Unix, or the process on Windows
			if (process.platform !== "win32") {
				tunnelProcess.kill("SIGTERM")
			} else {
				tunnelProcess.kill()
			}
		} catch (err) {
			log.warn("Error killing tunnel process", { error: String(err) })
		}
		tunnelProcess = null
	}

	cleanup()
}

/**
 * Returns the current tunnel URL, or null if not active.
 */
export function getTunnelUrl(): string | null {
	return currentUrl
}

/**
 * Checks if a tunnel is currently active.
 */
export function isTunnelActive(): boolean {
	return tunnelProcess !== null && currentUrl !== null
}

// ============================================================
// Cleanup
// ============================================================

function cleanup(): void {
	if (httpServer) {
		httpServer.close()
		httpServer = null
	}
	currentUrl = null
	currentOtp = null
	tunnelProcess = null
	viewers.clear()
	authorizedSessions.clear()
}
