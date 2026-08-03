/**
 * Telegram Bot Manager — connects a Telegram bot to OpenCode via Cloudflare tunnel.
 *
 * Features:
 * - SSE streaming: real-time response streaming from OpenCode
 * - Inline keyboard buttons: session selection without typing
 * - Auto-reconnect: if tunnel dies, restart and update webhook
 * - Per-user session tracking
 */

import { type ChildProcess, spawn, execSync } from "node:child_process"
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http"
import { createLogger } from "./logger"
import { DEFAULT_PORT } from "../shared/server-config"
import { getSettings, onSettingsChanged } from "./settings-store"

const log = createLogger("telegram-bot")

// ============================================================
// State
// ============================================================

let webhookServer: Server | null = null
let tunnelProcess: ChildProcess | null = null
let currentTunnelUrl: string | null = null
let botToken: string | null = null
let sseConnection: { controller: AbortController; timer: ReturnType<typeof setInterval> } | null = null

interface UserState {
	currentSessionId: string | null
	sessionList: Array<{ id: string; title?: string }>
AwaitingSessionSelect: boolean
WaitingForReply: boolean
}

const userStates = new Map<string, UserState>()
const sessionToChat = new Map<string, string>() // sessionId -> chatId (last user of session)
const pendingReplies = new Map<string, { chatId: number; resolve: (text: string) => void }>()

function getUserState(chatId: string | number): UserState {
	const key = String(chatId)
	let state = userStates.get(key)
	if (!state) {
		state = { currentSessionId: null, sessionList: [], AwaitingSessionSelect: false, WaitingForReply: false }
		userStates.set(key, state)
	}
	return state
}

// ============================================================
// Cloudflared path detection
// ============================================================

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
				} catch { /* continue */ }
			}
			try {
				execSync("cloudflared --version", { stdio: "ignore" })
				return "cloudflared"
			} catch { return null }
		} else {
			try {
				return execSync("which cloudflared", { encoding: "utf-8" }).trim() || null
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
	} catch { return null }
}

// ============================================================
// Telegram Bot API helpers
// ============================================================

async function telegramApi(method: string, body?: Record<string, unknown>): Promise<unknown> {
	if (!botToken) throw new Error("No bot token configured")
	const url = `https://api.telegram.org/bot${botToken}/${method}`
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	})
	const data = await res.json() as { ok: boolean; result?: unknown; description?: string }
	if (!data.ok) {
		throw new Error(`Telegram API error: ${data.description || "unknown"}`)
	}
	return data.result
}

async function sendMessage(chatId: number, text: string, replyMarkup?: unknown): Promise<void> {
	const chunks = splitMessage(text, 4000)
	for (let i = 0; i < chunks.length; i++) {
		const body: Record<string, unknown> = {
			chat_id: chatId,
			text: chunks[i],
			parse_mode: "Markdown",
		}
		// Only add replyMarkup to the last chunk
		if (i === chunks.length - 1 && replyMarkup) {
			body.reply_markup = replyMarkup
		}
		await telegramApi("sendMessage", body)
	}
}

async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
	const body: Record<string, unknown> = { callback_query_id: callbackQueryId }
	if (text) body.text = text
	await telegramApi("answerCallbackQuery", body)
}

async function sendChatAction(chatId: number, action: string): Promise<void> {
	try {
		await telegramApi("sendChatAction", { chat_id: chatId, action })
	} catch { /* ignore */ }
}

function splitMessage(text: string, maxLen: number): string[] {
	if (text.length <= maxLen) return [text]
	const chunks: string[] = []
	let remaining = text
	while (remaining.length > 0) {
		if (remaining.length <= maxLen) {
			chunks.push(remaining)
			break
		}
		let splitIdx = remaining.lastIndexOf("\n", maxLen)
		if (splitIdx < maxLen * 0.5) splitIdx = maxLen
		chunks.push(remaining.slice(0, splitIdx))
		remaining = remaining.slice(splitIdx)
	}
	return chunks
}

function escapeMarkdown(text: string): string {
	return text.replace(/\\/g, "\\\\").replace(/\*/g, "\\*").replace(/_/g, "\\_").replace(/`/g, "\\`").replace(/\[/g, "\\[")
}

// ============================================================
// Inline Keyboard builders
// ============================================================

function buildSessionKeyboard(sessions: Array<{ id: string; title?: string }>, startIdx: number, total: number): unknown {
	const buttons: unknown[][] = []
	const endIdx = Math.min(startIdx + 10, sessions.length)

	for (let i = startIdx; i < endIdx; i++) {
		const s = sessions[i]
		const title = escapeMarkdown(s.title || "Untitled").slice(0, 30)
		buttons.push([{ text: `${i + 1}. ${title}`, callback_data: `session:${i}` }])
	}

	if (endIdx < sessions.length) {
		buttons.push([{ text: `More (${endIdx + 1}-${total})...`, callback_data: `more:${endIdx}` }])
	}

	return { inline_keyboard: buttons }
}

function buildSessionActiveKeyboard(): unknown {
	return {
		inline_keyboard: [
			[{ text: "Change Session", callback_data: "sessions" }, { text: "New Session", callback_data: "new" }],
			[{ text: "Exit Session", callback_data: "exit" }],
		],
	}
}

function buildWelcomeKeyboard(): unknown {
	return {
		inline_keyboard: [
			[{ text: "List Sessions", callback_data: "sessions" }],
			[{ text: "New Session", callback_data: "new" }],
			[{ text: "Help", callback_data: "help" }],
		],
	}
}

// ============================================================
// OpenCode integration
// ============================================================

async function listSessions(): Promise<Array<{ id: string; title?: string }>> {
	try {
		const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session`)
		if (!res.ok) return []
		const raw = await res.json() as Array<{ id: string; title?: string }>
		return raw.map((s) => ({ id: s.id, title: s.title || "Untitled" }))
	} catch { return [] }
}

async function createSession(title: string): Promise<string | null> {
	try {
		const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title }),
		})
		if (!res.ok) return null
		const session = await res.json() as { id: string }
		return session.id
	} catch { return null }
}

async function sendMessageToOpenCode(sessionId: string, text: string): Promise<void> {
	const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/session/${sessionId}/prompt_async`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ parts: [{ type: "text", text }] }),
	})
	if (!res.ok) {
		throw new Error(`Failed to send message: ${res.status}`)
	}
}

// ============================================================
// SSE connection to OpenCode
// ============================================================

function connectSSE(): void {
	if (sseConnection) {
		sseConnection.controller.abort()
		clearInterval(sseConnection.timer)
	}

	const controller = new AbortController()
	let reconnectDelay = 1000

	const connect = async () => {
		try {
			const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/global/event`, {
				headers: { Accept: "text/event-stream" },
				signal: controller.signal,
			})

			if (!res.ok) {
				throw new Error(`SSE connection failed: ${res.status}`)
			}

			reconnectDelay = 1000 // Reset on success
			log.info("SSE connected to engine")

			const reader = res.body?.getReader()
			if (!reader) throw new Error("No response body")

			const decoder = new TextDecoder()
			let buffer = ""

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const events = buffer.split("\n\n")
				buffer = events.pop() || ""

				for (const event of events) {
					const lines = event.split("\n")
					let eventType = ""
					let data = ""

					for (const line of lines) {
						if (line.startsWith("event: ")) {
							eventType = line.slice(7).trim()
						} else if (line.startsWith("data: ")) {
							data = line.slice(6)
						}
					}

					if (!data) continue

					try {
						const parsed = JSON.parse(data)
						handleSSEEvent(eventType, parsed)
					} catch { /* ignore parse errors */ }
				}
			}
		} catch (err: unknown) {
			if (err instanceof Error && err.name === "AbortError") return
			log.warn("SSE connection error, reconnecting...", { error: String(err) })
			setTimeout(connect, reconnectDelay)
			reconnectDelay = Math.min(reconnectDelay * 2, 30000)
		}
	}

	sseConnection = { controller, timer: setInterval(() => {}, 60_000) }
	connect()
}

// Track accumulated text per session
const accumulatedText = new Map<string, string>()

function handleSSEEvent(eventType: string, parsed: Record<string, unknown>): void {
	const payload = parsed.payload as Record<string, unknown> | undefined
	if (!payload) return

	const type = payload.type as string
	const props = payload.properties as Record<string, unknown> | undefined
	if (!props) return

	if (type === "message.part.delta" || eventType === "message.part.delta") {
		const sessionID = props.sessionID as string
		const field = props.field as string
		const delta = props.delta as string

		if (field === "text" && delta && sessionID) {
			const current = accumulatedText.get(sessionID) || ""
			accumulatedText.set(sessionID, current + delta)

			// Forward chunk to pending reply handler
			const pending = pendingReplies.get(sessionID)
			if (pending) {
				// We'll send the final accumulated text when session goes idle
			}
		}
	} else if (type === "message.part.updated" || eventType === "message.part.updated") {
		const part = props.part as Record<string, unknown> | undefined
		if (part?.type === "text" && part.text) {
			const sessionID = props.sessionID as string || part.sessionID as string
			accumulatedText.set(sessionID, part.text as string)
		}
	} else if (type === "session.status" || eventType === "session.status") {
		const sessionID = props.sessionID as string
		const status = props.status as Record<string, unknown> | undefined

		if (status?.type === "idle" && sessionID) {
			const text = accumulatedText.get(sessionID) || ""
			accumulatedText.delete(sessionID)

			if (text) {
				const pending = pendingReplies.get(sessionID)
				if (pending) {
					pendingReplies.delete(sessionID)
					pending.resolve(text)
				}
			}
		}
	} else if (type === "session.error" || eventType === "session.error") {
		const sessionID = props.sessionID as string
		const error = props.error as Record<string, unknown> | undefined
		const errorMsg = (error?.data as Record<string, unknown>)?.message as string || "Unknown error"

		const pending = pendingReplies.get(sessionID)
		if (pending) {
			pendingReplies.delete(sessionID)
			pending.resolve(`Error: ${errorMsg}`)
		}
	}
}

function waitForResponse(sessionId: string, chatId: number, timeoutMs = 120_000): Promise<string> {
	return new Promise((resolve) => {
		accumulatedText.set(sessionId, "")
		pendingReplies.set(sessionId, { chatId, resolve })

		setTimeout(() => {
			const text = accumulatedText.get(sessionId) || ""
			accumulatedText.delete(sessionId)
			pendingReplies.delete(sessionId)
			resolve(text || "(Timed out — no response received)")
		}, timeoutMs)
	})
}

// ============================================================
// Command handlers
// ============================================================

const HELP_TEXT =
	"*Devil AI Bot — Commands*\n\n" +
	"*Session Management:*\n" +
	"/sessions — List all sessions\n" +
	"/new — Create a new session\n" +
	"/current — Show active session\n" +
	"/exit — Exit the current session\n\n" +
	"*Other:*\n" +
	"/help — Show this help\n" +
	"/start — Welcome message\n\n" +
	"*Tip:* Use the buttons below for quick actions!"

async function handleStart(chatId: number): Promise<void> {
	await sendMessage(chatId,
		"*Welcome to Devil AI!*\n\n" +
		"Your AI coding assistant, connected via Telegram.\n\n" +
		"Tap a button below to get started.",
		buildWelcomeKeyboard(),
	)
}

async function handleHelp(chatId: number): Promise<void> {
	await sendMessage(chatId, HELP_TEXT, buildWelcomeKeyboard())
}

async function handleSessions(chatId: number): Promise<void> {
	const state = getUserState(chatId)
	const sessions = await listSessions()
	state.sessionList = sessions

	if (sessions.length === 0) {
		await sendMessage(chatId, "No sessions found. Create one with /new or the button below.", {
			inline_keyboard: [[{ text: "New Session", callback_data: "new" }]],
		})
		return
	}

	const keyboard = buildSessionKeyboard(sessions, 0, sessions.length)
	await sendMessage(chatId, `*Found ${sessions.length} sessions.*\n\nTap a session to select it:`, keyboard)
}

async function handleSelectByIndex(chatId: number, index: number): Promise<void> {
	const state = getUserState(chatId)

	if (index < 0 || index >= state.sessionList.length) {
		await sendMessage(chatId, "Invalid selection. Use the buttons to select a session.")
		return
	}

	const selected = state.sessionList[index]
	state.currentSessionId = selected.id
	state.AwaitingSessionSelect = false

	await sendMessage(chatId,
		`*Session selected:* ${escapeMarkdown(selected.title || "Untitled")}\n\nSend any message to chat.`,
		buildSessionActiveKeyboard(),
	)
}

async function handleExit(chatId: number): Promise<void> {
	const state = getUserState(chatId)
	if (!state.currentSessionId) {
		await sendMessage(chatId, "No active session. Use the buttons to select one.", buildWelcomeKeyboard())
		return
	}

	const title = state.sessionList.find((s) => s.id === state.currentSessionId)?.title || "Unknown"
	state.currentSessionId = null
	await sendMessage(chatId, `*Exited session:* ${escapeMarkdown(title)}`, buildWelcomeKeyboard())
}

async function handleCurrent(chatId: number): Promise<void> {
	const state = getUserState(chatId)
	if (!state.currentSessionId) {
		await sendMessage(chatId, "No active session.", buildWelcomeKeyboard())
		return
	}

	const title = state.sessionList.find((s) => s.id === state.currentSessionId)?.title || "Unknown"
	await sendMessage(chatId, `*Current session:* ${escapeMarkdown(title)}`, buildSessionActiveKeyboard())
}

async function handleNewSession(chatId: number): Promise<void> {
	const sessionId = await createSession(`Telegram: ${chatId}`)
	if (sessionId) {
		const state = getUserState(chatId)
		state.currentSessionId = sessionId
		state.sessionList = []
		await sendMessage(chatId,
			"*New session created!*\n\nSend any message to start chatting.",
			buildSessionActiveKeyboard(),
		)
	} else {
		await sendMessage(chatId, "Failed to create session. Is the AI server running?", buildWelcomeKeyboard())
	}
}

async function handleMessage(chatId: number, text: string): Promise<void> {
	const state = getUserState(chatId)

	if (state.AwaitingSessionSelect) {
		const num = Number.parseInt(text.trim(), 10)
		if (!isNaN(num) && num >= 1 && num <= state.sessionList.length) {
			await handleSelectByIndex(chatId, num - 1)
			return
		}
		await sendMessage(chatId, "Please tap a session button or enter a valid number.")
		return
	}

	if (!state.currentSessionId) {
		await sendMessage(chatId, "Select a session first:", buildWelcomeKeyboard())
		return
	}

	if (state.WaitingForReply) {
		await sendMessage(chatId, "Please wait for the current response to complete.")
		return
	}

	// Track this user as the last one to use this session
	sessionToChat.set(state.currentSessionId, String(chatId))

	// Send typing indicator
	sendChatAction(chatId, "typing").catch((err) => log.debug("Failed to send typing indicator", err))

	try {
		state.WaitingForReply = true

		// Send to OpenCode via async endpoint
		await sendMessageToOpenCode(state.currentSessionId, text)

		// Wait for SSE response
		const response = await waitForResponse(state.currentSessionId, chatId)
		await sendMessage(chatId, response, buildSessionActiveKeyboard())
	} catch (err) {
		log.error("Failed to process message", { error: String(err) })
		await sendMessage(chatId, "Sorry, something went wrong. Please try again.", buildSessionActiveKeyboard())
	} finally {
		state.WaitingForReply = false
	}
}

// ============================================================
// Callback query handler (inline button taps)
// ============================================================

async function handleCallbackQuery(query: {
	id: string
	from?: { id?: number }
	message?: { chat?: { id?: number }; text?: string }
	data?: string
}): Promise<void> {
	const chatId = query.message?.chat?.id || query.from?.id
	const data = query.data

	if (!chatId || !data) {
		await answerCallbackQuery(query.id)
		return
	}

	if (data === "sessions") {
		await handleSessions(chatId)
		await answerCallbackQuery(query.id)
	} else if (data === "new") {
		await handleNewSession(chatId)
		await answerCallbackQuery(query.id)
	} else if (data === "help") {
		await handleHelp(chatId)
		await answerCallbackQuery(query.id)
	} else if (data === "exit") {
		await handleExit(chatId)
		await answerCallbackQuery(query.id)
	} else if (data.startsWith("session:")) {
		const idx = Number.parseInt(data.split(":")[1] || "", 10)
		if (!isNaN(idx)) {
			await handleSelectByIndex(chatId, idx)
			await answerCallbackQuery(query.id, "Session selected!")
		} else {
			await answerCallbackQuery(query.id, "Invalid selection")
		}
	} else if (data.startsWith("more:")) {
		const startIdx = Number.parseInt(data.split(":")[1] || "", 10)
		const state = getUserState(chatId)
		if (!isNaN(startIdx) && state.sessionList.length > 0) {
			const keyboard = buildSessionKeyboard(state.sessionList, startIdx, state.sessionList.length)
			await sendMessage(chatId, `*Sessions (${startIdx + 1}-${state.sessionList.length}):*`, keyboard)
			await answerCallbackQuery(query.id)
		} else {
			await answerCallbackQuery(query.id, "No more sessions")
		}
	} else {
		await answerCallbackQuery(query.id)
	}
}

// ============================================================
// Webhook HTTP Server
// ============================================================

function createWebhookServer(): Promise<Server> {
	return new Promise((resolve, reject) => {
		const handler = async (req: IncomingMessage, res: ServerResponse) => {
			const url = new URL(req.url || "/", `http://${req.headers.host}`)

			if (req.method === "OPTIONS") {
				res.writeHead(204, {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				})
				res.end()
				return
			}

			if (url.pathname === "/health") {
				res.writeHead(200, { "Content-Type": "application/json" })
				res.end(JSON.stringify({ ok: true, bot: !!botToken }))
				return
			}

			if (url.pathname === "/webhook" && req.method === "POST") {
				let body = ""
				req.on("data", (chunk) => { body += chunk })
				req.on("end", async () => {
					try {
						const update = JSON.parse(body) as Record<string, unknown>

						// Handle callback queries (inline button taps)
						if (update.callback_query) {
							await handleCallbackQuery(update.callback_query as Parameters<typeof handleCallbackQuery>[0])
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
							return
						}

						// Handle regular messages
						const message = update.message as Record<string, unknown> | undefined
						if (!message?.chat || !message?.text) {
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
							return
						}

						const chatId = (message.chat as Record<string, unknown>).id as number
						const text = message.text as string
						const from = message.from as Record<string, unknown> | undefined
						const userName = (from?.first_name || from?.username || "User") as string

						log.info("Telegram message received", { chatId, text: text.slice(0, 100), userName })

						// Route commands
						if (text === "/start" || text === "/start@devilbhaiai_bot") {
							await handleStart(chatId)
						} else if (text === "/help" || text === "/help@devilbhaiai_bot") {
							await handleHelp(chatId)
						} else if (text === "/sessions" || text === "/sessions@devilbhaiai_bot") {
							await handleSessions(chatId)
						} else if (text === "/exit" || text === "/exit@devilbhaiai_bot") {
							await handleExit(chatId)
						} else if (text === "/current" || text === "/current@devilbhaiai_bot") {
							await handleCurrent(chatId)
						} else if (text === "/new" || text === "/new@devilbhaiai_bot") {
							await handleNewSession(chatId)
						} else {
							await handleMessage(chatId, text)
						}

						res.writeHead(200, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ ok: true }))
					} catch (err) {
						log.error("Webhook parse error", { error: String(err) })
						res.writeHead(200, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ ok: true }))
					}
				})
				return
			}

			res.writeHead(404, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ error: "Not found" }))
		}

		const httpServer = createServer(handler)
		httpServer.on("error", reject)
		httpServer.listen(0, "127.0.0.1", () => {
			const addr = httpServer.address()
			if (addr && typeof addr === "object") {
				log.info("Webhook server started", { port: addr.port })
				resolve(httpServer)
			} else {
				reject(new Error("Failed to get webhook server address"))
			}
		})
	})
}

// ============================================================
// Tunnel management
// ============================================================

async function startTunnel(port: number): Promise<string> {
	const cloudflaredPath = findCloudflaredPath()
	if (!cloudflaredPath) {
		throw new Error("cloudflared is not installed")
	}

	return new Promise((resolve, reject) => {
		const args = ["tunnel", "--url", `http://127.0.0.1:${port}`]
		tunnelProcess = spawn(cloudflaredPath, args, {
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		})

		let stderr = ""
		let urlFound = false
		let resolved = false

		tunnelProcess.stderr?.on("data", (data: Buffer) => {
			const chunk = data.toString()
			stderr += chunk
			const urlMatch = stderr.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/)
			if (urlMatch && !urlFound) {
				urlFound = true
				currentTunnelUrl = urlMatch[1]
				log.info("Tunnel URL found", { url: currentTunnelUrl })

				const tunnelUrl = currentTunnelUrl
				const waitForReady = async () => {
					await new Promise((r) => setTimeout(r, 3000))
					try {
						const res = await fetch(`http://127.0.0.1:${port}/health`, {
							signal: AbortSignal.timeout(5000),
						})
						if (res.ok) log.info("Tunnel verified", { url: tunnelUrl })
					} catch { /* ok */ }
					if (!resolved) { resolved = true; resolve(tunnelUrl) }
				}
				waitForReady().catch(() => {
					if (!resolved) { resolved = true; resolve(tunnelUrl) }
				})
			}
		})

		tunnelProcess.on("exit", (code, signal) => {
			if (!urlFound) {
				reject(new Error(`cloudflared exited with code ${code}`))
			} else {
				log.warn("Tunnel exited after URL assigned", { code, signal })
				currentTunnelUrl = null
			}
		})

		tunnelProcess.on("error", (err) => {
			reject(new Error(`Failed to start cloudflared: ${err.message}`))
		})

		setTimeout(() => {
			if (!urlFound) {
				stopTunnelProcess()
				reject(new Error("Tunnel timed out waiting for URL"))
			}
		}, 15_000)
	})
}

function stopTunnelProcess(): void {
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
	currentTunnelUrl = null
}

function killAllCloudflaredTunnels(): void {
	try {
		if (process.platform === "win32") {
			execSync("taskkill /F /IM cloudflared.exe 2>nul", { stdio: "ignore" })
		} else {
			const output = execSync("ps aux 2>/dev/null | grep 'cloudflared tunnel' | grep -v grep || true", { encoding: "utf-8" })
			for (const line of output.split("\n")) {
				const match = line.match(/^\S+\s+(\d+)/)
				if (match) {
					const pid = Number.parseInt(match[1], 10)
					if (pid > 0 && pid !== process.pid) {
						try {
							process.kill(pid, "SIGTERM")
							log.info("Killed stale cloudflared process", { pid })
						} catch { /* already dead */ }
					}
				}
			}
		}
	} catch { /* best effort */ }
}

// ============================================================
// Auto-reconnect
// ============================================================

let reconnectTimer: ReturnType<typeof setInterval> | null = null
let webhookPort: number | null = null

function startHealthMonitor(): void {
	if (reconnectTimer) return
	reconnectTimer = setInterval(async () => {
		if (!botToken || !webhookPort) return
		if (currentTunnelUrl) return

		log.warn("Tunnel is down, attempting auto-reconnect...")
		try {
			const newUrl = await startTunnel(webhookPort)
			await setWebhook(newUrl)
			log.info("Auto-reconnect successful", { url: newUrl })
		} catch (err) {
			log.error("Auto-reconnect failed", { error: String(err) })
		}
	}, 30_000)
}

function stopHealthMonitor(): void {
	if (reconnectTimer) {
		clearInterval(reconnectTimer)
		reconnectTimer = null
	}
}

async function setWebhook(url: string): Promise<void> {
	await telegramApi("setWebhook", {
		url: `${url}/webhook`,
		allowed_updates: ["message", "callback_query"],
		drop_pending_updates: true,
	})
	log.info("Webhook set", { url: `${url}/webhook` })
}

// ============================================================
// Public API
// ============================================================

export interface TelegramBotStatus {
	running: boolean
	botToken: boolean
	tunnelUrl: string | null
	userCount: number
}

export async function startTelegramBot(): Promise<{ tunnelUrl: string }> {
	const settings = getSettings()
	const token = settings.telegramBotToken
	if (!token) {
		throw new Error("No Telegram bot token configured. Set it in Settings > Setup.")
	}

	await stopTelegramBot()
	killAllCloudflaredTunnels()

	botToken = token
	log.info("Starting Telegram bot")

	webhookServer = await createWebhookServer()
	const addr = webhookServer.address()
	const port = addr && typeof addr === "object" ? addr.port : 0
	webhookPort = port

	const tunnelUrl = await startTunnel(port)
	await setWebhook(tunnelUrl)

	// Connect SSE for streaming responses
	connectSSE()

	// Monitor tunnel health
	startHealthMonitor()

	if (tunnelProcess) {
		tunnelProcess.on("exit", () => {
			currentTunnelUrl = null
		})
	}

	try {
		const me = await telegramApi("getMe") as { username?: string; first_name?: string }
		log.info("Bot connected", { username: me.username, firstName: me.first_name })
	} catch (err) {
		log.warn("Could not verify bot info", { error: String(err) })
	}

	return { tunnelUrl }
}

export async function stopTelegramBot(): Promise<void> {
	log.info("Stopping Telegram bot")
	stopHealthMonitor()

	if (sseConnection) {
		sseConnection.controller.abort()
		clearInterval(sseConnection.timer)
		sseConnection = null
	}

	accumulatedText.clear()
	pendingReplies.clear()
	sessionToChat.clear()

	if (botToken) {
		try {
			await telegramApi("deleteWebhook", { drop_pending_updates: true })
		} catch { /* ignore */ }
	}

	if (webhookServer) {
		webhookServer.close()
		webhookServer = null
	}

	stopTunnelProcess()
	botToken = null
	webhookPort = null
	userStates.clear()
}

export function getTelegramBotStatus(): TelegramBotStatus {
	return {
		running: !!webhookServer && !!currentTunnelUrl,
		botToken: !!botToken,
		tunnelUrl: currentTunnelUrl,
		userCount: userStates.size,
	}
}

function isTelegramBotRunning(): boolean {
	return !!webhookServer && !!currentTunnelUrl
}

/**
 * Send a forwarded message from a session to all connected Telegram users.
 * Used by the desktop app's per-session Telegram forwarding toggle.
 */
export async function sendForwardedMessage(sessionId: string, role: "user" | "assistant", text: string): Promise<void> {
	if (!botToken || !isTelegramBotRunning()) return
	if (!text.trim()) return

	const prefix = role === "user" ? "👤 *You*" : "🤖 *Assistant*"
	const formatted = `${prefix} (session: \`${sessionId.slice(0, 8)}\`)\n\n${text}`

	// Send to all users who have this session selected
	for (const [chatIdStr, state] of userStates) {
		if (state.currentSessionId === sessionId) {
			try {
				await sendMessage(Number(chatIdStr), formatted)
			} catch (err) {
				log.error("Failed to forward message to Telegram", { chatId: chatIdStr, error: String(err) })
			}
		}
	}
}

export async function autoStartTelegramBot(): Promise<void> {
	const settings = getSettings()
	if (!settings.telegramBotToken || !settings.telegramBotEnabled) return
	try {
		await startTelegramBot()
		log.info("Bot auto-started")
	} catch (err) {
		log.error("Failed to auto-start bot", { error: String(err) })
	}
}

let lastToken: string | undefined
let lastEnabled: boolean | undefined

onSettingsChanged((settings) => {
	const newToken = settings.telegramBotToken
	const newEnabled = settings.telegramBotEnabled
	
	const tokenChanged = newToken !== lastToken
	const enabledChanged = newEnabled !== lastEnabled
	
	lastToken = newToken
	lastEnabled = newEnabled

	if (tokenChanged || enabledChanged) {
		if (newToken && newEnabled) {
			log.info("Telegram settings changed, starting/restarting bot")
			startTelegramBot().catch((err) => {
				log.error("Failed to restart bot", { error: String(err) })
			})
		} else if (!newToken || !newEnabled) {
			log.info("Telegram disabled or token removed, stopping bot")
			stopTelegramBot().catch((err) => log.debug("Failed to stop telegram bot", err))
		}
	}
})

export function shutdownTelegramBot(): void {
	if (botToken) {
		telegramApi("deleteWebhook").catch((err) => log.debug("Failed to delete webhook", err))
	}
	stopTelegramBot().catch((err) => log.debug("Failed to stop telegram bot", err))
}
