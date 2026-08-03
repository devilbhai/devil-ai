import { type ChildProcess, execSync, spawn } from "node:child_process"
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import { createLogger } from "./logger.js"
import { getSettings, onSettingsChanged } from "./settings.js"
import type { TelegramBotStatus } from "./types.js"

const log = createLogger("telegram-bot")

let webhookServer: Server | null = null
let tunnelProcess: ChildProcess | null = null
let currentTunnelUrl: string | null = null
let botToken: string | null = null

const userSessions = new Map<string, string>()

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
				} catch {
					/* continue */
				}
			}
			try {
				execSync("cloudflared --version", { stdio: "ignore" })
				return "cloudflared"
			} catch {
				return null
			}
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
					} catch {}
				}
				return null
			}
		}
	} catch {
		return null
	}
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
	const data = (await res.json()) as { ok: boolean; result?: unknown; description?: string }
	if (!data.ok) {
		throw new Error(`Telegram API error: ${data.description || "unknown"}`)
	}
	return data.result
}

async function setWebhook(url: string): Promise<void> {
	await telegramApi("setWebhook", {
		url: `${url}/webhook`,
		allowed_updates: ["message"],
		drop_pending_updates: true,
	})
}

async function sendMessage(chatId: number, text: string): Promise<void> {
	const chunks = splitMessage(text, 4000)
	for (const chunk of chunks) {
		await telegramApi("sendMessage", {
			chat_id: chatId,
			text: chunk,
			parse_mode: "Markdown",
		})
	}
}

async function sendChatAction(chatId: number, action: "typing"): Promise<void> {
	try {
		await telegramApi("sendChatAction", { chat_id: chatId, action })
	} catch {
		/* ignore */
	}
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

// ============================================================
// OpenCode integration
// ============================================================

async function getOrCreateSession(chatId: string): Promise<string> {
	const existing = userSessions.get(chatId)
	if (existing) {
		try {
			const res = await fetch(`http://127.0.0.1:4101/session/${existing}`)
			if (res.ok) return existing
		} catch {
			/* session gone */
		}
	}

	try {
		const res = await fetch("http://127.0.0.1:4101/session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: `Telegram: ${chatId}` }),
		})
		if (res.ok) {
			const session = (await res.json()) as { id: string }
			userSessions.set(chatId, session.id)
			return session.id
		}
	} catch {
		/* ignore */
	}

	// Fallback: use first available session
	try {
		const res = await fetch("http://127.0.0.1:4101/session")
		if (res.ok) {
			const sessions = (await res.json()) as Array<{ id: string }>
			if (sessions.length > 0) {
				userSessions.set(chatId, sessions[0].id)
				return sessions[0].id
			}
		}
	} catch {
		/* ignore */
	}

	throw new Error("No OpenCode sessions available")
}

async function getMessages(sessionId: string): Promise<Array<{ role: string; content: string }>> {
	try {
		const res = await fetch(`http://127.0.0.1:4101/session/${sessionId}/message`)
		if (!res.ok) return []
		const raw = (await res.json()) as Array<{
			info: { role?: string }
			parts?: Array<{ type?: string; text?: string }>
		}>
		return raw
			.filter((m) => m.info?.role === "user" || m.info?.role === "assistant")
			.map((m) => ({
				role: m.info!.role!,
				content: (m.parts || [])
					.filter((p) => p.type === "text" && p.text)
					.map((p) => p.text!)
					.join("\n"),
			}))
			.filter((m) => m.content.length > 0)
	} catch {
		return []
	}
}

async function forwardToOpenCode(chatId: string, text: string): Promise<string> {
	const sessionId = await getOrCreateSession(chatId)

	const promptRes = await fetch(`http://127.0.0.1:4101/session/${sessionId}/message`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ parts: [{ type: "text", text }] }),
	})

	if (!promptRes.ok) {
		return "Sorry, I couldn't process your message. The AI server might be busy."
	}

	// Poll for response
	const startTime = Date.now()
	const initialMsgs = await getMessages(sessionId)
	const initialCount = initialMsgs.length

	while (Date.now() - startTime < 120_000) {
		await new Promise((r) => setTimeout(r, 2000))
		const currentMsgs = await getMessages(sessionId)
		if (currentMsgs.length > initialCount) {
			const lastMsg = currentMsgs[currentMsgs.length - 1]
			if (lastMsg.role === "assistant" && lastMsg.content) {
				return lastMsg.content
			}
		}
	}

	return "(AI is still processing...)"
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
				req.on("data", (chunk) => {
					body += chunk
				})
				req.on("end", async () => {
					try {
						const update = JSON.parse(body) as {
							message?: {
								chat?: { id?: number }
								text?: string
								from?: { first_name?: string; username?: string }
							}
						}

						const message = update.message
						if (!message?.chat?.id || !message?.text) {
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
							return
						}

						const chatId = message.chat.id
						const text = message.text
						const userName = message.from?.first_name || message.from?.username || "User"

						log.info("Message received", { chatId, text: text.slice(0, 100), userName })

						if (text === "/start") {
							await sendMessage(
								chatId,
								"*Devil AI CLI*\n\n" +
									"I'm your AI assistant connected via Telegram.\n\n" +
									"*Commands:*\n" +
									"/start - Show this message\n" +
									"/new - Start a new conversation\n" +
									"/sessions - List your sessions",
							)
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
							return
						}

						if (text === "/new") {
							userSessions.delete(String(chatId))
							await sendMessage(chatId, "New conversation started. Send me a message!")
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
							return
						}

						if (text === "/sessions") {
							try {
								const res2 = await fetch("http://127.0.0.1:4101/session")
								if (res2.ok) {
									const sessions = (await res2.json()) as Array<{ id: string; title?: string }>
									const list = sessions
										.slice(0, 10)
										.map((s, i) => `${i + 1}. ${s.title || "Untitled"}`)
										.join("\n")
									await sendMessage(chatId, `*Sessions:*\n${list || "No sessions found"}`)
								}
							} catch {
								await sendMessage(chatId, "Could not list sessions.")
							}
							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify({ ok: true }))
							return
						}

						// Forward to OpenCode (non-blocking)
						const chatIdStr = String(chatId)
						sendChatAction(chatId, "typing").catch(() => {})
						forwardToOpenCode(chatIdStr, text)
							.then(async (response) => {
								await sendMessage(chatId, response)
							})
							.catch(async () => {
								await sendMessage(chatId, "Sorry, something went wrong. Please try again.")
							})

						res.writeHead(200, { "Content-Type": "application/json" })
						res.end(JSON.stringify({ ok: true }))
					} catch {
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
		throw new Error(
			"cloudflared is not installed.\n" +
				"Install it:\n" +
				"  macOS:  brew install cloudflare/cloudflare/cloudflared\n" +
				"  Linux:  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared\n" +
				"  Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/",
		)
	}

	return new Promise((resolve, reject) => {
		const args = ["tunnel", "--url", `http://127.0.0.1:${port}`]
		tunnelProcess = spawn(cloudflaredPath, args, {
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		})

		let stderr = ""
		let urlFound = false

		tunnelProcess.stderr?.on("data", (data: Buffer) => {
			const chunk = data.toString()
			stderr += chunk
			const urlMatch = stderr.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/)
			if (urlMatch && !urlFound) {
				urlFound = true
				currentTunnelUrl = urlMatch[1]
				log.info("Tunnel URL found", { url: currentTunnelUrl })
				resolve(currentTunnelUrl)
			}
		})

		tunnelProcess.on("exit", (code) => {
			if (!urlFound) {
				reject(new Error(`cloudflared exited with code ${code}`))
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
		} catch {
			/* ignore */
		}
		tunnelProcess = null
	}
	currentTunnelUrl = null
}

// ============================================================
// Public API
// ============================================================

export async function startTelegramBot(): Promise<{ tunnelUrl: string }> {
	const settings = getSettings()
	const token = settings.telegramBotToken
	if (!token) {
		throw new Error("No Telegram bot token configured. Run: devil-ai config --token YOUR_TOKEN")
	}

	await stopTelegramBot()
	botToken = token
	log.info("Starting Telegram bot")

	webhookServer = await createWebhookServer()
	const addr = webhookServer.address()
	const port = addr && typeof addr === "object" ? addr.port : 0

	const tunnelUrl = await startTunnel(port)
	await setWebhook(tunnelUrl)

	try {
		const me = (await telegramApi("getMe")) as { username?: string; first_name?: string }
		log.info("Bot connected", { username: me.username, firstName: me.first_name })
	} catch (err) {
		log.warn("Could not verify bot info", { error: String(err) })
	}

	return { tunnelUrl }
}

export async function stopTelegramBot(): Promise<void> {
	log.info("Stopping Telegram bot")

	if (botToken) {
		try {
			await telegramApi("deleteWebhook", { drop_pending_updates: true })
		} catch {
			/* ignore */
		}
	}

	if (webhookServer) {
		webhookServer.close()
		webhookServer = null
	}

	stopTunnelProcess()
	botToken = null
	userSessions.clear()
}

export function getTelegramBotStatus(): TelegramBotStatus {
	return {
		running: !!webhookServer && !!currentTunnelUrl,
		botToken: !!botToken,
		tunnelUrl: currentTunnelUrl,
		userCount: userSessions.size,
	}
}

// Auto-restart on token change
let lastToken: string | undefined

onSettingsChanged((settings) => {
	const newToken = settings.telegramBotToken
	const prevToken = lastToken
	lastToken = newToken

	if (newToken !== prevToken) {
		if (newToken) {
			startTelegramBot().catch((err) => {
				log.error("Failed to restart bot after token change", err)
			})
		} else if (prevToken) {
			stopTelegramBot().catch(() => {})
		}
	}
})
