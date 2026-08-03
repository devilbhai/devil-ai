import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Command } from "commander"
import { createLogger } from "./logger.js"
import { ensureServer, getServerUrl, stopServer } from "./opencode.js"
import { getSettings, initSettings, updateSettings } from "./settings.js"
import { getTelegramBotStatus, startTelegramBot, stopTelegramBot } from "./telegram.js"

const log = createLogger("cli")

const DEFAULT_MODEL = "opencode/mimo-v2.5-free"

const LOGO = `
  ██████╗ ██╗ ███████╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗
  ██╔══██╗██║ ██╔════╝██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
  ██║  ██║██║ █████╗  ██║ █╗ ██║███████║   ██║   ██║     ███████║
  ██║  ██║██║ ██╔══╝  ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║
  ██████╔╝██║ ███████╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║
  ╚═════╝ ╚═╝ ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
`

// ============================================================
// OpenCode config management
// ============================================================

function getDevilCodeConfigPath(): string {
	const platform = process.platform
	// Try DevilCode config path first, then fallback to OpenCode
	if (platform === "win32") {
		const devilcodePath = path.join(
			os.homedir(),
			"AppData",
			"Roaming",
			"devilcode",
			"devilcode.json",
		)
		const opencodePath = path.join(os.homedir(), "AppData", "Roaming", "opencode", "opencode.json")
		return fs.existsSync(devilcodePath) ? devilcodePath : opencodePath
	}
	if (platform === "darwin") {
		const devilcodePath = path.join(
			os.homedir(),
			"Library",
			"Application Support",
			"devilcode",
			"devilcode.json",
		)
		const opencodePath = path.join(
			os.homedir(),
			"Library",
			"Application Support",
			"opencode",
			"opencode.json",
		)
		return fs.existsSync(devilcodePath) ? devilcodePath : opencodePath
	}
	const devilcodePath = path.join(os.homedir(), ".config", "devilcode", "devilcode.json")
	const opencodePath = path.join(os.homedir(), ".config", "opencode", "opencode.json")
	return fs.existsSync(devilcodePath) ? devilcodePath : opencodePath
}

function ensureDevilCodeConfig(model: string): void {
	const configPath = getDevilCodeConfigPath()
	const configDir = path.dirname(configPath)

	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true })
	}

	let config: Record<string, unknown> = {}
	if (fs.existsSync(configPath)) {
		try {
			config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
		} catch {
			/* use empty config */
		}
	}

	// Ensure opencode provider exists with mimo model
	const providers = (config.provider as Record<string, unknown>) || {}
	const opencodeProvider = (providers.opencode as Record<string, unknown>) || {}

	providers.opencode = {
		...opencodeProvider,
		name: "OpenCode Zen",
		models: {
			...((opencodeProvider.models as Record<string, unknown>) || {}),
			"mimo-v2.5-free": { name: "Mimo V2.5 Free" },
		},
	}

	config.provider = providers

	// Set default model
	if (!config.model) {
		config.model = model
	}

	fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"), "utf-8")
	log.info("OpenCode config updated", { path: configPath, model })
}

// ============================================================
// CLI
// ============================================================

const program = new Command()

program.name("devil-ai").description("AI-powered coding assistant via Telegram").version("0.1.0")

program
	.command("start")
	.description("Start Devil AI (server + Telegram bot)")
	.option("-t, --token <token>", "Telegram bot token")
	.option("-m, --model <model>", "AI model to use", DEFAULT_MODEL)
	.option("-p, --port <port>", "Server port", "4101")
	.action(async (opts) => {
		initSettings()

		console.log(LOGO)
		console.log("  Devil AI — AI Coding Assistant via Telegram")
		console.log("")

		if (opts.token) {
			updateSettings({ telegramBotToken: opts.token })
		}

		const settings = getSettings()
		if (!settings.telegramBotToken) {
			console.error("Error: No Telegram bot token.")
			console.error("")
			console.error("Get a token from @BotFather on Telegram, then:")
			console.error("  devil-ai config --token YOUR_TOKEN")
			process.exit(1)
		}

		// Ensure OpenCode config has the right model
		ensureOpenCodeConfig(opts.model)

		console.log(`Model:       ${opts.model}`)
		console.log("")

		try {
			// Start OpenCode server
			console.log("Starting server...")
			const server = await ensureServer()
			console.log(`Server:      ${server.url}`)

			// Start Telegram bot
			console.log("Starting Telegram bot...")
			const { tunnelUrl } = await startTelegramBot()
			console.log(`Bot:         connected`)
			console.log(`Tunnel:      ${tunnelUrl}`)
			console.log("")
			console.log("Ready! Send a message to your Telegram bot.")
			console.log("Press Ctrl+C to stop.")
			console.log("")

			const shutdown = async () => {
				console.log("\nShutting down...")
				await stopTelegramBot()
				stopServer()
				process.exit(0)
			}

			process.on("SIGINT", shutdown)
			process.on("SIGTERM", shutdown)

			await new Promise(() => {})
		} catch (err) {
			console.error("Failed to start:", err instanceof Error ? err.message : err)
			process.exit(1)
		}
	})

program
	.command("stop")
	.description("Stop Devil AI")
	.action(async () => {
		initSettings()
		await stopTelegramBot()
		stopServer()
		console.log("Devil AI stopped.")
	})

program
	.command("status")
	.description("Show running status")
	.action(() => {
		initSettings()
		const serverUrl = getServerUrl()
		const botStatus = getTelegramBotStatus()
		const settings = getSettings()

		console.log(LOGO)
		console.log("  Status")
		console.log("  ──────")
		console.log(`  Server:       ${serverUrl || "Not running"}`)
		console.log(
			`  Bot token:    ${settings.telegramBotToken ? `****${settings.telegramBotToken.slice(-4)}` : "Not set"}`,
		)
		console.log(`  Bot running:  ${botStatus.running ? "Yes" : "No"}`)
		console.log(`  Tunnel:       ${botStatus.tunnelUrl || "N/A"}`)
		console.log(`  Users:        ${botStatus.userCount}`)
		console.log(`  Model:        ${settings.model || DEFAULT_MODEL}`)
		console.log("")
	})

program
	.command("config")
	.description("Configure settings")
	.option("-t, --token <token>", "Set Telegram bot token")
	.option("-m, --model <model>", "Set default AI model", DEFAULT_MODEL)
	.option("--show", "Show current config")
	.action((opts) => {
		initSettings()

		if (opts.show) {
			const settings = getSettings()
			console.log("Current configuration:")
			console.log(
				`  Telegram token: ${settings.telegramBotToken ? `****${settings.telegramBotToken.slice(-4)}` : "Not set"}`,
			)
			console.log(`  Model:          ${settings.model || DEFAULT_MODEL}`)
			console.log(`  Server port:    ${settings.servers.servers[0]?.port || 4101}`)
			return
		}

		if (opts.token) {
			updateSettings({ telegramBotToken: opts.token })
			console.log("Telegram bot token saved.")
		}

		if (opts.model) {
			updateSettings({ model: opts.model })
			ensureOpenCodeConfig(opts.model)
			console.log(`Default model set to: ${opts.model}`)
		}

		if (!opts.token && !opts.model) {
			console.log("Usage:")
			console.log("  devil-ai config --token YOUR_BOT_TOKEN")
			console.log("  devil-ai config --model opencode/mimo-v2.5-free")
			console.log("  devil-ai config --show")
		}
	})

program
	.command("setup")
	.description("Check and install all dependencies")
	.action(async () => {
		console.log(LOGO)
		console.log("  Checking dependencies...")
		console.log("")

		const checks: Array<{ name: string; ok: boolean; version?: string }> = []

		// Node.js
		checks.push({ name: "Node.js", ok: true, version: process.version })

		// git
		try {
			const { execSync } = await import("node:child_process")
			const v = execSync("git --version", { encoding: "utf-8" }).trim()
			checks.push({ name: "git", ok: true, version: v.replace("git version ", "") })
		} catch {
			checks.push({ name: "git", ok: false })
		}

		// DevilCode / OpenCode
		try {
			const { execSync } = await import("node:child_process")
			let v: string
			try {
				v = execSync("devilcode --version", { encoding: "utf-8" }).trim()
			} catch {
				v = execSync("opencode --version", { encoding: "utf-8" }).trim()
			}
			checks.push({ name: "DevilCode", ok: true, version: v })
		} catch {
			checks.push({ name: "DevilCode", ok: false })
		}

		// cloudflared
		try {
			const { execSync } = await import("node:child_process")
			const v =
				execSync("cloudflared --version", { encoding: "utf-8" }).trim().split(" ")[2] || "installed"
			checks.push({ name: "cloudflared", ok: true, version: v })
		} catch {
			checks.push({ name: "cloudflared", ok: false })
		}

		// Print results
		for (const c of checks) {
			const icon = c.ok ? "✓" : "✗"
			const ver = c.version ? ` (${c.version})` : ""
			console.log(`  ${icon} ${c.name}${ver}`)
		}

		const allOk = checks.every((c) => c.ok)
		console.log("")
		if (allOk) {
			console.log("  All dependencies satisfied!")
		} else {
			console.log("  Missing dependencies. Install the install script will handle this:")
			console.log(
				"  curl -fsSL https://raw.githubusercontent.com/devilbhai/devil-ai/main/packages/devil-ai-cli/install.sh | bash",
			)
		}
		console.log("")
	})

program.parse()
