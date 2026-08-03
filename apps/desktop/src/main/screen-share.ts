/**
 * Screen Sharing Module — AnyDesk-like remote screen sharing via Cloudflare Tunnel.
 *
 * Flow:
 * 1. Host presses Shift+Cmd+S → starts REST signaling server + cloudflare tunnel
 * 2. Tunnel URL + OTP shown as code: <subdomain>:<otp>
 * 3. Remote presses Shift+Cmd+G → enters code → reconstructs tunnel URL → connects
 * 4. WebRTC signaling happens via REST API through the tunnel
 * 5. Host streams screen to remote via WebRTC peer connection
 * 6. Remote can control host's screen (mouse/keyboard)
 */

import { desktopCapturer, ipcMain, BrowserWindow } from "electron"
import { spawn, execSync } from "node:child_process"
import crypto from "node:crypto"
import http from "node:http"

// ============================================================
// Types
// ============================================================

interface ScreenShareSession {
	id: string
	code: string
	otp: string
	tunnelSubdomain: string
	tunnelUrl: string
	createdAt: number
	// WebRTC signaling data exchanged via REST
	offer: unknown | null
	answer: unknown | null
	iceCandidates: unknown[]
	remoteConnected: boolean
	stopped: boolean
}

interface InputEvent {
	type: "mouse" | "keyboard"
	action: string
	x?: number
	y?: number
	button?: number
	key?: string
	keyCode?: number
	modifiers?: string[]
}

// ============================================================
// State
// ============================================================

const sessions = new Map<string, ScreenShareSession>()
const codeToSession = new Map<string, ScreenShareSession>()
let signalingServer: http.Server | null = null
let tunnelProcess: ReturnType<typeof spawn> | null = null
let signalingPort = 0

// ============================================================
// Helpers
// ============================================================

function generateOTP(): string {
	return crypto.randomInt(100000, 999999).toString()
}

function getMainWindow(): BrowserWindow | null {
	return BrowserWindow.getAllWindows()[0] ?? null
}

function sendToRenderer(channel: string, ...args: unknown[]) {
	const win = getMainWindow()
	if (win && !win.isDestroyed()) {
		win.webContents.send(channel, ...args)
	}
}

function findCloudflaredPath(): string | null {
	const platform = process.platform
	try {
		if (platform === "win32") {
			const paths = [
				`${process.env.LOCALAPPDATA}\\cloudflared\\cloudflared.exe`,
				`${process.env.PROGRAMFILES}\\cloudflared\\cloudflared.exe`,
				`${process.env["PROGRAMFILES(X86)"]}\\cloudflared\\cloudflared.exe`,
			]
			for (const p of paths) {
				try {
					execSync(`"${p}" --version`, { stdio: "ignore" })
					return p
				} catch { /* not found */ }
			}
			try {
				execSync("cloudflared --version", { stdio: "ignore" })
				return "cloudflared"
			} catch {
				return null
			}
		} else {
			try {
				const result = execSync("which cloudflared", { encoding: "utf-8" }).trim()
				return result || null
			} catch {
				const paths = [
					"/opt/homebrew/bin/cloudflared",
					"/usr/local/bin/cloudflared",
					"/usr/bin/cloudflared",
				]
				for (const p of paths) {
					try {
						execSync(`"${p}" --version`, { stdio: "ignore" })
						return p
					} catch { continue }
				}
				return null
			}
		}
	} catch {
		return null
	}
}

// ============================================================
// REST Signaling Server
// ============================================================

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
	return new Promise((resolve) => {
		let body = ""
		req.on("data", (chunk) => { body += chunk })
		req.on("end", () => {
			try {
				resolve(body ? JSON.parse(body) : {})
			} catch {
				resolve({})
			}
		})
	})
}

function jsonResponse(res: http.ServerResponse, status: number, data: unknown) {
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	})
	res.end(JSON.stringify(data))
}

function createSignalingServer(): Promise<number> {
	return new Promise((resolve, reject) => {
		if (signalingServer) {
			resolve(signalingPort)
			return
		}

		const server = http.createServer(async (req, res) => {
			// CORS preflight
			if (req.method === "OPTIONS") {
				res.writeHead(204, {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				})
				res.end()
				return
			}

			const url = new URL(req.url || "/", `http://localhost`)
			const path = url.pathname

			// POST /api/offer — host posts WebRTC offer
			if (req.method === "POST" && path === "/api/offer") {
				const body = await parseBody(req)
				const session = codeToSession.get(body.code as string)
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				session.offer = body.offer
				jsonResponse(res, 200, { ok: true })
				return
			}

			// GET /api/offer?code=xxx — remote polls for offer
			if (req.method === "GET" && path === "/api/offer") {
				const code = url.searchParams.get("code")
				const session = codeToSession.get(code || "")
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				if (session.offer) {
					jsonResponse(res, 200, { offer: session.offer })
					session.offer = null // consumed
				} else {
					jsonResponse(res, 204, {})
				}
				return
			}

			// POST /api/answer — remote posts WebRTC answer
			if (req.method === "POST" && path === "/api/answer") {
				const body = await parseBody(req)
				const session = codeToSession.get(body.code as string)
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				session.answer = body.answer
				jsonResponse(res, 200, { ok: true })
				return
			}

			// GET /api/answer?code=xxx — host polls for answer
			if (req.method === "GET" && path === "/api/answer") {
				const code = url.searchParams.get("code")
				const session = codeToSession.get(code || "")
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				if (session.answer) {
					jsonResponse(res, 200, { answer: session.answer })
					session.answer = null // consumed
				} else {
					jsonResponse(res, 204, {})
				}
				return
			}

			// POST /api/ice — post ICE candidate
			if (req.method === "POST" && path === "/api/ice") {
				const body = await parseBody(req)
				const session = codeToSession.get(body.code as string)
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				session.iceCandidates.push(body.candidate)
				jsonResponse(res, 200, { ok: true })
				return
			}

			// GET /api/ice?code=xxx&index=n — poll ICE candidates
			if (req.method === "GET" && path === "/api/ice") {
				const code = url.searchParams.get("code")
				const index = parseInt(url.searchParams.get("index") || "0", 10)
				const session = codeToSession.get(code || "")
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				if (index < session.iceCandidates.length) {
					jsonResponse(res, 200, {
						candidates: session.iceCandidates.slice(index),
						nextIndex: session.iceCandidates.length,
					})
				} else {
					jsonResponse(res, 204, { nextIndex: index })
				}
				return
			}

			// POST /api/join — remote announces arrival
			if (req.method === "POST" && path === "/api/join") {
				const body = await parseBody(req)
				const session = codeToSession.get(body.code as string)
				if (!session || session.stopped) {
					jsonResponse(res, 404, { error: "Invalid code" })
					return
				}
				session.remoteConnected = true
				sendToRenderer("screen-share:remote-connected", session.code)
				jsonResponse(res, 200, { ok: true, sessionId: session.id })
				return
			}

			// GET /api/status?code=xxx — remote polls for session status (stopped?)
			if (req.method === "GET" && path === "/api/status") {
				const code = url.searchParams.get("code")
				const session = codeToSession.get(code || "")
				if (!session) {
					jsonResponse(res, 404, { error: "Invalid session" })
					return
				}
				jsonResponse(res, 200, { stopped: session.stopped })
				return
			}

			// POST /api/stop — host or remote stops session
			if (req.method === "POST" && path === "/api/stop") {
				const body = await parseBody(req)
				const session = codeToSession.get(body.code as string)
				if (session) {
					session.stopped = true
					sendToRenderer("screen-share:stopped", session.code)
					// Cleanup after short delay
					setTimeout(() => {
						sessions.delete(session.id)
						codeToSession.delete(session.code)
					}, 5000)
				}
				jsonResponse(res, 200, { ok: true })
				return
			}

			jsonResponse(res, 404, { error: "Not found" })
		})

		server.listen(0, "127.0.0.1", () => {
			const addr = server.address()
			const port = addr && typeof addr === "object" ? addr.port : 0
			signalingServer = server
			signalingPort = port
			resolve(port)
		})

		server.on("error", reject)
	})
}

function stopSignalingServer() {
	if (signalingServer) {
		signalingServer.close()
		signalingServer = null
		signalingPort = 0
	}
}

// ============================================================
// Cloudflare Tunnel
// ============================================================

function startTunnel(port: number): Promise<{ url: string; subdomain: string }> {
	const cloudflaredPath = findCloudflaredPath()
	if (!cloudflaredPath) {
		throw new Error("cloudflared is not installed. Install: brew install cloudflare/cloudflare/cloudflared")
	}

	return new Promise((resolve, reject) => {
		const args = ["tunnel", "--url", `http://127.0.0.1:${port}`]
		tunnelProcess = spawn(cloudflaredPath, args, {
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		})

		let stderr = ""
		let urlFound = false

		tunnelProcess.stderr?.on("error", () => {})

		// cloudflared outputs URL to stderr
		const stderrHandler = (data: Buffer) => {
			const chunk = data.toString()
			stderr += chunk
			const urlMatch = stderr.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/)
			if (urlMatch && !urlFound) {
				urlFound = true
				const fullUrl = urlMatch[1]
				const subdomainMatch = fullUrl.match(/https:\/\/([a-z0-9-]+)\.trycloudflare\.com/)
				const subdomain = subdomainMatch ? subdomainMatch[1] : ""
				resolve({ url: fullUrl, subdomain })
			}
		}

		tunnelProcess.stderr?.on("data", stderrHandler)
		tunnelProcess.stdout?.on("data", () => {})

		tunnelProcess.on("error", (err) => {
			if (!urlFound) reject(new Error(`Failed to start cloudflared: ${err.message}`))
		})

		tunnelProcess.on("exit", (code) => {
			if (!urlFound) reject(new Error(`cloudflared exited with code ${code}`))
		})

		// Timeout after 15s
		setTimeout(() => {
			if (!urlFound) {
				stopTunnel()
				reject(new Error("Tunnel timed out"))
			}
		}, 15_000)
	})
}

function stopTunnel() {
	if (tunnelProcess) {
		try {
			if (process.platform !== "win32") {
				tunnelProcess.kill("SIGTERM")
			} else {
				tunnelProcess.kill()
			}
		} catch { /* ignore */ }
		tunnelProcess = null
	}
}

// ============================================================
// IPC Handlers
// ============================================================

export function registerScreenShareIpc(): void {
	// Start screen sharing (host side) — returns code
	ipcMain.handle("screen-share:start", async () => {
		try {
			// 1. Start REST signaling server
			const port = await createSignalingServer()

			// 2. Start cloudflare tunnel
			const { url, subdomain } = await startTunnel(port)

			// 3. Generate OTP
			const otp = generateOTP()
			const id = crypto.randomUUID()

			// 4. Create session
			const session: ScreenShareSession = {
				id,
				code: `${subdomain}:${otp}`,
				otp,
				tunnelSubdomain: subdomain,
				tunnelUrl: url,
				createdAt: Date.now(),
				offer: null,
				answer: null,
				iceCandidates: [],
				remoteConnected: false,
				stopped: false,
			}

			sessions.set(id, session)
			codeToSession.set(session.code, session)

			console.log(`[ScreenShare] Started — code: ${session.code}, tunnel: ${url}`)
			return { success: true, code: session.code, tunnelUrl: url }
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : String(err) }
		}
	})

	// Stop screen sharing
	ipcMain.handle("screen-share:stop", async (_event, code?: string) => {
		try {
			if (code) {
				const session = codeToSession.get(code)
				if (session) {
					session.stopped = true
					sendToRenderer("screen-share:stopped", session.code)
					sessions.delete(session.id)
					codeToSession.delete(code)
				}
			} else {
				for (const [id, session] of sessions) {
					session.stopped = true
					sendToRenderer("screen-share:stopped", session.code)
					codeToSession.delete(session.code)
					sessions.delete(id)
				}
			}
			// Stop tunnel and server if no sessions left
			if (sessions.size === 0) {
				stopTunnel()
				stopSignalingServer()
			}
			return { success: true }
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : String(err) }
		}
	})

	// Get screen sources for capture
	ipcMain.handle("screen-share:getSources", async () => {
		try {
			const sources = await desktopCapturer.getSources({
				types: ["screen", "window"],
				thumbnailSize: { width: 320, height: 180 },
			})
			return sources.map((s) => ({
				id: s.id,
				name: s.name,
				thumbnail: s.thumbnail.toDataURL(),
				display_id: s.display_id,
			}))
		} catch {
			return []
		}
	})

	// Check if screen sharing is active
	ipcMain.handle("screen-share:isActive", async () => {
		return sessions.size > 0
	})

	// Get active session count
	ipcMain.handle("screen-share:getActiveCount", async () => {
		return sessions.size
	})

	// Send signaling message (no-op with REST — kept for compatibility)
	ipcMain.handle("screen-share:sendSignal", async (_event, _code: string, _msg: Record<string, unknown>) => {
		return { success: true }
	})

	// Join session as remote — parses code, connects to host's tunnel
	ipcMain.handle("screen-share:join", async (_event, code: string) => {
		try {
			// Parse code: <subdomain>:<otp>
			const parts = code.split(":")
			if (parts.length !== 2) {
				return { success: false, error: "Invalid code format. Expected: <tunnel-id>:<otp>" }
			}
			const [subdomain, otp] = parts
			const tunnelUrl = `https://${subdomain}.trycloudflare.com`

			// Test connection to host's signaling server
			const testUrl = `${tunnelUrl}/api/status?code=${encodeURIComponent(code)}`
			const response = await fetchWithTimeout(testUrl, 5000)
			if (!response.ok) {
				return { success: false, error: "Invalid code or host unreachable" }
			}

			// Announce join
			const joinResponse = await fetchWithTimeout(`${tunnelUrl}/api/join`, 5000, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code, otp }),
			})

			if (!joinResponse.ok) {
				const errData = await joinResponse.json().catch(() => ({}))
				return { success: false, error: (errData as Record<string, string>).error || "Failed to join" }
			}

			const joinData = await joinResponse.json() as { sessionId?: string }
			return { success: true, sessionId: joinData.sessionId, tunnelUrl }
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : "Connection failed" }
		}
	})

	// Disconnect remote
	ipcMain.handle("screen-share:disconnect", async () => {
		return { success: true }
	})

	// Get sharing status
	ipcMain.handle("screen-share:getStatus", async () => {
		const activeSessions = Array.from(sessions.values())
		return {
			isSharing: activeSessions.length > 0,
			sessions: activeSessions.map((s) => ({
				code: s.code,
				hasRemote: s.remoteConnected,
				createdAt: s.createdAt,
			})),
		}
	})
}

// ============================================================
// HTTP Fetch Helper
// ============================================================

async function fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit): Promise<Response> {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		return await fetch(url, { ...init, signal: controller.signal })
	} finally {
		clearTimeout(timer)
	}
}

// ============================================================
// Input Handling (Remote Control)
// ============================================================

export function setupInputHandlers(): void {
	ipcMain.on("screen-share:input-event", (_event, inputEvent: InputEvent) => {
		const { screen: screenModule } = require("electron")
		const primaryDisplay = screenModule.getPrimaryDisplay()
		const { width, height } = primaryDisplay.bounds

		if (inputEvent.type === "mouse" && inputEvent.x !== undefined && inputEvent.y !== undefined) {
			const absoluteX = Math.round((inputEvent.x / 100) * width)
			const absoluteY = Math.round((inputEvent.y / 100) * height)
			console.log(`[ScreenShare] Mouse event at (${absoluteX}, ${absoluteY}):`, inputEvent.action)
		}

		if (inputEvent.type === "keyboard" && inputEvent.key) {
			console.log(`[ScreenShare] Keyboard event:`, inputEvent.key)
		}
	})
}

// ============================================================
// Cleanup
// ============================================================

export function cleanupScreenShare(): void {
	sessions.clear()
	codeToSession.clear()
	stopTunnel()
	stopSignalingServer()
}
