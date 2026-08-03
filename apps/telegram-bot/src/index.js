/**
 * Devil-ai Telegram Bot
 *
 * Control your AI coding assistant from Telegram.
 * Commands:
 *   /start        — Welcome message
 *   /ask <text>   — Send a prompt to the AI
 *   /sessions     — List active sessions
 *   /new <title>  — Create a new session
 *   /delete <id>  — Delete a session
 *   /use <id>     — Switch active session
 *   /status       — Server connection status
 *   /help         — Show all commands
 *
 * Any plain text message (without /) is treated as /ask.
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createOpencodeClient } from "@devilcode/sdk/v2/client"
import { Bot, GrammyError, HttpError } from "grammy"

// ─── Config ─────────────────────────────────────────────────
function loadEnv() {
	const envPath = resolve(process.cwd(), ".env")
	if (!existsSync(envPath)) return
	const lines = readFileSync(envPath, "utf8").split("\n")
	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith("#")) continue
		const eqIdx = trimmed.indexOf("=")
		if (eqIdx === -1) continue
		const key = trimmed.slice(0, eqIdx).trim()
		const value = trimmed.slice(eqIdx + 1).trim()
		if (!process.env[key]) process.env[key] = value
	}
}
loadEnv()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SERVER_URL = process.env.DEVIL_AI_SERVER_URL || "http://localhost:3001"
const ALLOWED_IDS = process.env.ALLOWED_USER_IDS
	? process.env.ALLOWED_USER_IDS.split(",").map((id) => Number(id.trim()))
	: []
const WORKING_DIR = process.env.WORKING_DIRECTORY || "/root"
const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || "openrouter"
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "xiaomi/mimo-v2.5"

if (!BOT_TOKEN) {
	console.warn("⚠ TELEGRAM_BOT_TOKEN not set — skipping bot startup. Add it to .env to enable.")
	process.exit(0)
}

// ─── OpenCode SDK client ────────────────────────────────────
let client = null
let _connected = false

function getClient() {
	if (!client) {
		client = createOpencodeClient({
			baseUrl: SERVER_URL,
			directory: WORKING_DIR,
		})
	}
	return client
}

async function checkConnection() {
	try {
		const c = getClient()
		await c.project.list()
		_connected = true
		return true
	} catch (_err) {
		_connected = false
		return false
	}
}

// ─── Per-user active session tracking ───────────────────────
const userSessions = new Map() // userId -> sessionId

// ─── Telegram Bot ───────────────────────────────────────────
import { SocksProxyAgent } from "socks-proxy-agent"

// Configure Tor proxy to bypass Telegram blocks
const agent = new SocksProxyAgent("socks5h://127.0.0.1:9050")

const bot = new Bot(BOT_TOKEN, {
	client: {
		baseFetchConfig: {
			agent,
			compress: true,
		},
	},
})

// Security: only allow specified user IDs
bot.use(async (ctx, next) => {
	if (ALLOWED_IDS.length === 0) return next() // no restriction
	const userId = ctx.from?.id
	if (userId && ALLOWED_IDS.includes(userId)) return next()
	await ctx.reply("⛔ Access denied. Your Telegram ID is not authorized.")
})

// ─── /start ─────────────────────────────────────────────────
bot.command("start", async (ctx) => {
	await ctx.reply(
		`🔥 *Devil\\-ai Bot Ready\\!*\n\n` +
			`Connected to: \`${escMd(SERVER_URL)}\`\n\n` +
			`*Commands:*\n` +
			`/ask \\<text\\> — AI se sawal pucho\n` +
			`/sessions — Active sessions dekho\n` +
			`/new \\<title\\> — Naya session banao\n` +
			`/delete \\<id\\> — Session delete karo\n` +
			`/use \\<id\\> — Session switch karo\n` +
			`/status — Server status check karo\n` +
			`/help — Yeh message dikhao\n\n` +
			`Ya fir seedha message likho \\— wo /ask ki tarah treat hoga\\!`,
		{ parse_mode: "MarkdownV2" },
	)
})

// ─── /help ──────────────────────────────────────────────────
bot.command("help", async (ctx) => {
	await ctx.reply(
		`🔥 *Devil\\-ai Bot Commands*\n\n` +
			`/ask \\<text\\> — AI se sawal pucho\n` +
			`/sessions — Active sessions dekho\n` +
			`/new \\<title\\> — Naya session banao\n` +
			`/delete \\<id\\> — Session delete karo\n` +
			`/use \\<id\\> — Session switch karo\n` +
			`/status — Server status dekho\n\n` +
			`💡 Bina command ke seedha message bhi bhej sakte ho\\!`,
		{ parse_mode: "MarkdownV2" },
	)
})

// ─── /status ────────────────────────────────────────────────
bot.command("status", async (ctx) => {
	const ok = await checkConnection()
	const activeSessionId = userSessions.get(ctx.from.id)
	await ctx.reply(
		ok
			? `✅ Server connected: \`${escMd(SERVER_URL)}\`\n` +
					`📂 Working dir: \`${escMd(WORKING_DIR)}\`\n` +
					`🗂 Active session: \`${escMd(activeSessionId || "none")}\``
			: `❌ Server unreachable: \`${escMd(SERVER_URL)}\``,
		{ parse_mode: "MarkdownV2" },
	)
})

// ─── /sessions ──────────────────────────────────────────────
bot.command("sessions", async (ctx) => {
	try {
		const c = getClient()
		const result = await c.session.list({ limit: 20, roots: true })
		const sessions = result.data || []

		if (sessions.length === 0) {
			await ctx.reply("📭 Koi active session nahi hai. `/new` se banao!", {
				parse_mode: "MarkdownV2",
			})
			return
		}

		const activeId = userSessions.get(ctx.from.id)
		const lines = sessions.map((s, i) => {
			const marker = s.id === activeId ? "👉 " : ""
			const title = s.title || "Untitled"
			const shortId = s.id.slice(0, 8)
			return `${marker}${i + 1}\\. *${escMd(title)}*\n   ID: \`${shortId}\``
		})

		await ctx.reply(`📋 *Sessions \\(${sessions.length}\\):*\n\n${lines.join("\n\n")}`, {
			parse_mode: "MarkdownV2",
		})
	} catch (err) {
		await ctx.reply(`❌ Error: ${err.message}`)
	}
})

// ─── /new <title> ───────────────────────────────────────────
bot.command("new", async (ctx) => {
	const title = ctx.match || "Telegram Session"
	try {
		const c = getClient()
		const result = await c.session.create({ title })
		const session = result.data
		if (session) {
			userSessions.set(ctx.from.id, session.id)
			await ctx.reply(
				`✅ *Naya session bana\\!*\n\n` +
					`📝 Title: *${escMd(session.title || title)}*\n` +
					`🆔 ID: \`${escMd(session.id.slice(0, 8))}\`\n\n` +
					`Ab seedha message bhejo — yeh session active hai\\!`,
				{ parse_mode: "MarkdownV2" },
			)
		}
	} catch (err) {
		await ctx.reply(`❌ Session create failed: ${err.message}`)
	}
})

// ─── /use <id> ──────────────────────────────────────────────
bot.command("use", async (ctx) => {
	const idPrefix = ctx.match?.trim()
	if (!idPrefix) {
		await ctx.reply("Usage: `/use <session-id-prefix>`", { parse_mode: "MarkdownV2" })
		return
	}

	try {
		const c = getClient()
		const result = await c.session.list({ limit: 100 })
		const sessions = result.data || []
		const match = sessions.find((s) => s.id.startsWith(idPrefix))

		if (!match) {
			await ctx.reply(`❌ Session not found with ID prefix: \`${escMd(idPrefix)}\``, {
				parse_mode: "MarkdownV2",
			})
			return
		}

		userSessions.set(ctx.from.id, match.id)
		await ctx.reply(
			`✅ Active session changed\\!\n\n` +
				`📝 *${escMd(match.title || "Untitled")}*\n` +
				`🆔 \`${escMd(match.id.slice(0, 8))}\``,
			{ parse_mode: "MarkdownV2" },
		)
	} catch (err) {
		await ctx.reply(`❌ Error: ${err.message}`)
	}
})

// ─── /delete <id> ───────────────────────────────────────────
bot.command("delete", async (ctx) => {
	const idPrefix = ctx.match?.trim()
	if (!idPrefix) {
		await ctx.reply("Usage: `/delete <session-id-prefix>`", { parse_mode: "MarkdownV2" })
		return
	}

	try {
		const c = getClient()
		const result = await c.session.list({ limit: 100 })
		const sessions = result.data || []
		const match = sessions.find((s) => s.id.startsWith(idPrefix))

		if (!match) {
			await ctx.reply(`❌ Session not found with prefix: \`${escMd(idPrefix)}\``, {
				parse_mode: "MarkdownV2",
			})
			return
		}

		await c.session.delete({ sessionID: match.id })

		// Clear active session if deleted
		if (userSessions.get(ctx.from.id) === match.id) {
			userSessions.delete(ctx.from.id)
		}

		await ctx.reply(`🗑 Session deleted: *${escMd(match.title || "Untitled")}*`, {
			parse_mode: "MarkdownV2",
		})
	} catch (err) {
		await ctx.reply(`❌ Delete failed: ${err.message}`)
	}
})

// ─── /ask <text> & plain messages ───────────────────────────
bot.command("ask", async (ctx) => {
	const text = ctx.match?.trim()
	if (!text) {
		await ctx.reply("Usage: `/ask <your question>`", { parse_mode: "MarkdownV2" })
		return
	}
	await handlePrompt(ctx, text)
})

// Plain text messages → treat as /ask
bot.on("message:text", async (ctx) => {
	const text = ctx.message.text?.trim()
	if (!text) return
	await handlePrompt(ctx, text)
})

// ─── Core prompt handler ────────────────────────────────────
async function handlePrompt(ctx, text) {
	const userId = ctx.from.id
	const c = getClient()

	// Check connection
	const ok = await checkConnection()
	if (!ok) {
		await ctx.reply("❌ Devil-ai server se connection nahi ho raha. Server chal raha hai kya?")
		return
	}

	// Auto-create session if none active
	let sessionId = userSessions.get(userId)
	if (!sessionId) {
		try {
			const result = await c.session.create({ title: "Telegram Chat" })
			sessionId = result.data?.id
			if (sessionId) userSessions.set(userId, sessionId)
		} catch (err) {
			await ctx.reply(`❌ Session create failed: ${err.message}`)
			return
		}
	}

	// Show typing indicator
	const typingMsg = await ctx.reply("⏳ _Soch raha hoon\\.\\.\\._", { parse_mode: "MarkdownV2" })

	try {
		// Send prompt with default Mimo v2.5 model (free)
		await c.session.promptAsync({
			sessionID: sessionId,
			parts: [{ type: "text", text }],
			model: {
				providerID: DEFAULT_PROVIDER,
				modelID: DEFAULT_MODEL,
			},
		})

		// Poll for the latest assistant message
		const response = await waitForResponse(c, sessionId, 120_000)

		// Delete typing indicator
		try {
			await ctx.api.deleteMessage(ctx.chat.id, typingMsg.message_id)
		} catch {}

		if (response) {
			// Split long messages (Telegram 4096 char limit)
			const chunks = splitMessage(response, 4000)
			for (const chunk of chunks) {
				try {
					// Try sending as plain text to avoid Telegram's strict MarkdownV2 parser crashing on code blocks
					await ctx.reply(chunk)
				} catch (err) {
					console.error("Chunk send error:", err)
					await ctx.reply("⚠️ Error sending message chunk.")
				}
			}
		} else {
			await ctx.reply("⚠️ Response nahi mila. Session check karo /status")
		}
	} catch (err) {
		try {
			await ctx.api.deleteMessage(ctx.chat.id, typingMsg.message_id)
		} catch {}
		await ctx.reply(`❌ Error: ${err.message}`)
	}
}

// ─── Wait for AI response ───────────────────────────────────
async function waitForResponse(client, sessionId, timeoutMs = 120_000) {
	const start = Date.now()
	const pollInterval = 2000 // 2 seconds
	let lastMessageCount = 0

	// Give the server a moment to start processing
	await sleep(1500)

	while (Date.now() - start < timeoutMs) {
		try {
			// Check session status
			const statusResult = await client.session.status()
			const statuses = statusResult.data || {}
			const sessionStatus = statuses[sessionId]

			// Get messages
			const msgsResult = await client.message.list({ sessionID: sessionId })
			const messages = msgsResult.data || []

			// Find the latest assistant message
			const assistantMsgs = messages.filter((m) => m.role === "assistant")
			const latest = assistantMsgs[assistantMsgs.length - 1]

			// If session is idle and we have an assistant message newer than our prompt
			if (
				latest &&
				assistantMsgs.length > lastMessageCount &&
				(!sessionStatus || sessionStatus === "idle" || sessionStatus.status === "idle")
			) {
				// Extract text from parts
				const partsResult = await client.message.get({
					sessionID: sessionId,
					messageID: latest.id,
				})
				const msg = partsResult.data
				if (msg?.parts) {
					const textParts = msg.parts
						.filter((p) => p.type === "text")
						.map((p) => p.text)
						.join("\n\n")
					if (textParts.trim()) return textParts
				}
			}

			lastMessageCount = assistantMsgs.length
		} catch (_err) {
			// Ignore poll errors, keep trying
		}

		await sleep(pollInterval)
	}

	return null // Timeout
}

// ─── Helpers ────────────────────────────────────────────────

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Escape MarkdownV2 special characters */
function escMd(text) {
	if (!text) return ""
	return String(text).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1")
}

/** Split message into chunks respecting Telegram's 4096 char limit */
function splitMessage(text, maxLen = 4000) {
	if (text.length <= maxLen) return [text]
	const chunks = []
	let remaining = text
	while (remaining.length > 0) {
		if (remaining.length <= maxLen) {
			chunks.push(remaining)
			break
		}
		// Try to split at newline
		let splitIdx = remaining.lastIndexOf("\n", maxLen)
		if (splitIdx === -1 || splitIdx < maxLen * 0.5) {
			splitIdx = maxLen
		}
		chunks.push(remaining.slice(0, splitIdx))
		remaining = remaining.slice(splitIdx)
	}
	return chunks
}

// ─── Error handling ─────────────────────────────────────────
bot.catch((err) => {
	const ctx = err.ctx
	console.error(`Error while handling update ${ctx.update.update_id}:`)
	const e = err.error
	if (e instanceof GrammyError) {
		console.error("Error in request:", e.description)
	} else if (e instanceof HttpError) {
		console.error("Could not contact Telegram:", e)
	} else {
		console.error("Unknown error:", e)
	}
})

// ─── Start ──────────────────────────────────────────────────
console.log("🔥 Devil-ai Telegram Bot starting...")
console.log(`📡 Server: ${SERVER_URL}`)
console.log(`📂 Working dir: ${WORKING_DIR}`)
console.log(`🤖 Default model: ${DEFAULT_PROVIDER}/${DEFAULT_MODEL}`)
if (ALLOWED_IDS.length > 0) {
	console.log(`🔒 Allowed users: ${ALLOWED_IDS.join(", ")}`)
} else {
	console.log("⚠️  No user restriction — anyone can use this bot!")
}

checkConnection().then((ok) => {
	console.log(ok ? "✅ Server connected!" : "⚠️  Server not reachable yet (will retry on use)")
})

bot.start()
console.log("🤖 Bot is running! Send /start in Telegram.")
