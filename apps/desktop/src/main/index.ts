import { startAutoSyncDaemon, stopAutoSyncDaemon } from "./auto-sync"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { app, BrowserWindow, dialog, Menu, session, shell } from "electron"
import { initAutomations, shutdownAutomations } from "./automation"
import { initCredentialStore } from "./credential-store"
import { getOpaqueWindowsPref, registerIpcHandlers } from "./ipc-handlers"
import { setDevilAIAgent } from "./ipc/ipc-devil-ai"
import { installLiquidGlass, resolveWindowChrome } from "./liquid-glass"
import { createLogger } from "./logger"
import { startMdnsScanner, stopMdnsScanner } from "./mdns-scanner"
import { ensureServer, forceKillLocalServer, stopServer, restartServer } from "./opencode-manager"
import { ensureDevilRoute, stopDevilRoute } from "./devilroute-manager"
import {
	startDevilRouteTokenRefresher,
	stopDevilRouteTokenRefresher,
} from "./devilroute-token-refresher"
import { initSettingsStore } from "./settings-store"
import { startWebhookServer, stopWebhookServer } from "./webhook-server"
import { initWebhookReviewHandler } from "./webhook-review-handler"
import { startEnvResolution } from "./shell-env"
import { startSelfHealing } from "./self-healing"
import { createTray, destroyTray } from "./tray"
import { initAutoUpdater, stopAutoUpdater } from "./updater"
import { checkVcRedistOnStartup } from "./vc-check"
import { stopTunnel } from "./tunnel-manager"
import { OllamaManager } from "./services/ollama-manager"
import { autoStartTelegramBot, shutdownTelegramBot } from "./telegram-bot-manager"
import { DevilAIAgent } from "@devil-ai/agent-bridge"
import { stopHeartbeat } from "./subscription-guard"
import { checkDiskSpaceForOperation } from "./disk-space"

const log = createLogger("app")

// ESM equivalent for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Devil AI Agent instance
let devilAIAgent: DevilAIAgent | null = null

// Start resolving the shell environment asynchronously. On macOS/Linux, Electron
// GUI launches get a minimal launchd environment missing user PATH additions
// (homebrew, nvm, bun, etc.). This spawns a login shell in the background --
// window creation proceeds immediately without waiting. Operations that need the
// full PATH (e.g., spawning opencode) call waitForEnv() before proceeding.
startEnvResolution()

// Minimal menu — required on macOS for Cmd+C/V/X/A to work in web contents.
// A null menu kills native Edit shortcuts on macOS. This minimal template is
// negligible overhead compared to the full default menu.
const menuTemplate: Electron.MenuItemConstructorOptions[] = [
	...(process.platform === "darwin" ? [{ role: "appMenu" as const }] : []),
	{ role: "editMenu" as const },
	{ role: "viewMenu" as const },
	{ role: "windowMenu" as const },
]
Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

// Collect Chromium feature flags — must be merged into a single --disable-features
// switch because Electron's appendSwitch overwrites (not appends) duplicate keys.
const disabledFeatures: string[] = []
const isDev = !app.isPackaged

// Chromium networking: disable HTTPS upgrades for localhost connections.
// The OpenCode server is plain HTTP/1.1 on 127.0.0.1. Chromium 134+ (Electron 40+)
// can silently upgrade http:// to https://, which causes ERR_ALPN_NEGOTIATION_FAILED
// when hitting a plain HTTP server. Disabling this feature prevents that.
// Must be set before app.whenReady().
	disabledFeatures.push("HttpsUpgrades")
	if (isDev) {
		app.commandLine.appendSwitch("allow-insecure-localhost")
	}

// Linux/Wayland: ensure GTK can find the GdkPixbuf loader modules and enable
// native Wayland rendering. These must be set before app.whenReady() since GTK
// initializes during that call.
if (process.platform === "linux") {
	// GTK needs the GdkPixbuf loaders cache to decode PNG/SVG icons from the
	// icon theme. Electron's bundled Chromium often can't locate the host system's
	// loaders, causing "Could not load a pixbuf from icon theme" warnings and
	// continuous GDK_IS_PIXBUF assertion failures — especially visible on Wayland
	// where GTK renders client-side window decorations (close/minimize/maximize
	// button icons are loaded from the theme on every frame).
	if (!process.env.GDK_PIXBUF_MODULE_FILE) {
		let loadersCachePath: string | undefined

		// Try pkg-config first — works across distros regardless of lib path layout
		try {
			loadersCachePath = execSync(
				"pkg-config --variable gdk_pixbuf_cache_file gdk-pixbuf-2.0",
				{ encoding: "utf-8", timeout: 1000, stdio: ["ignore", "pipe", "ignore"] },
			).trim()
		} catch {
			// pkg-config not installed or gdk-pixbuf-2.0 not registered — try known paths
		}

		if (!loadersCachePath || !fs.existsSync(loadersCachePath)) {
			const candidates = [
				"/usr/lib64/gdk-pixbuf-2.0/2.10.0/loaders.cache", // Fedora, RHEL, openSUSE
				"/usr/lib/x86_64-linux-gnu/gdk-pixbuf-2.0/2.10.0/loaders.cache", // Debian, Ubuntu
				"/usr/lib/gdk-pixbuf-2.0/2.10.0/loaders.cache", // Arch
			]
			loadersCachePath = candidates.find((p) => fs.existsSync(p))
		}

		if (loadersCachePath) {
			process.env.GDK_PIXBUF_MODULE_FILE = loadersCachePath
			log.info(`Set GDK_PIXBUF_MODULE_FILE=${loadersCachePath}`)
		}
	}

	app.commandLine.appendSwitch("ozone-platform-hint", "auto")
	app.commandLine.appendSwitch("enable-features", "WaylandWindowDecorations")
	app.commandLine.appendSwitch("enable-wayland-ime")
	app.commandLine.appendSwitch("font-render-hinting", "slight")

	// Chromium's WaylandFractionalScaleV1 has a known bug where non-maximized
	// windows render at 1x and the compositor upscales them, causing blurry text
	// and UI (Chromium issue 40934705). Work around this by detecting the GNOME
	// fractional scale factor via Mutter's D-Bus API and forcing it explicitly.
	// This runs synchronously before app.whenReady() since command-line switches
	// must be set early. Falls back gracefully if detection fails (non-GNOME, X11).
	if (process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === "wayland") {
		try {
			const dbusOutput = execSync(
				"gdbus call --session --dest org.gnome.Mutter.DisplayConfig " +
					"--object-path /org/gnome/Mutter/DisplayConfig " +
					"--method org.gnome.Mutter.DisplayConfig.GetCurrentState",
				{ timeout: 2000, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
			)
			// Logical monitors section contains: (x, y, scale, uint32 transform, bool primary, ...)
			const match = dbusOutput.match(/\(\d+,\s*\d+,\s*([\d.]+),\s*uint32\s+\d+,\s*true/)
			if (match) {
				const scale = Number.parseFloat(match[1])
				if (scale > 0 && scale !== Math.floor(scale)) {
					// Fractional scale detected — disable the buggy Wayland fractional
					// scale protocol and force the correct DPI scale factor directly.
					disabledFeatures.push("WaylandFractionalScaleV1")
					app.commandLine.appendSwitch("force-device-scale-factor", scale.toString())
					log.info(`Wayland fractional scale detected (${scale}), forcing device scale factor`)
				}
			}
		} catch {
			// D-Bus call failed (not GNOME, not Wayland, or timeout) — ignore.
			// Chromium's default Wayland scaling will be used.
		}
	}
}

// Apply all collected disabled features as a single comma-separated switch.
if (disabledFeatures.length > 0) {
	app.commandLine.appendSwitch("disable-features", disabledFeatures.join(","))
}

// Enable Chrome DevTools Protocol (CDP) in dev mode so external tools
// (agent-browser, Playwright, etc.) can connect for visual testing.
// Usage: `agent-browser connect 9222` or Playwright's `connectOverCDP`.
if (isDev && process.env.ENABLE_CDP === "1") {
	app.commandLine.appendSwitch("remote-debugging-port", "9222")
}

// Use a separate identity for dev so dev and production can run side-by-side.
// The single-instance lock and user-data directory are both keyed on app name,
// so changing it here prevents the two from conflicting.
if (isDev) {
	app.setName("Devil-ai Dev")
	app.setPath("userData", path.join(app.getPath("appData"), "Devil-ai Dev"))
}

export async function createWindow(route?: string): Promise<BrowserWindow> {
	const title = isDev ? "Devil-ai (Dev)" : "Devil-ai"

	const isMac = process.platform === "darwin"

	// Resolve window chrome tier: liquid glass > vibrancy > opaque
	const isOpaque = getOpaqueWindowsPref()
	const chrome = await resolveWindowChrome(isOpaque)

	// Resolve the window icon for Linux/Windows. macOS uses the .app bundle icon.
	// Linux: use 256x256 icon — GTK's GdkPixbuf can choke on the full 1024x1024
	// icon on Wayland, causing GDK_IS_PIXBUF assertion failures.
	const windowIcon = isMac
		? undefined
		: app.isPackaged
			? path.join(process.resourcesPath, "icon.png")
			: path.join(
					__dirname,
					process.platform === "linux"
						? "../../resources/linux-icons/256x256.png"
						: "../../resources/icon.png",
				)

	const win = new BrowserWindow({
		title,
		width: 1200,
		height: 800,
		// Transparent background for macOS glass/vibrancy tiers.
		// On Linux/Windows (always opaque tier) use a solid background to prevent
		// the window from being see-through while the renderer loads.
		backgroundColor: isMac ? "#00000000" : "#000000",
		// Don't show the window until the renderer has painted its first frame.
		// Prevents a flash of transparent/empty content, especially on Wayland.
		show: false,
		// Three-tier window chrome — options from resolveWindowChrome()
		...chrome.options,
		// Window icon for Linux/Windows
		...(windowIcon && { icon: windowIcon }),
		webPreferences: {
			preload: path.join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false,
			spellcheck: false,
			v8CacheOptions: "bypassHeatCheckAndEagerCompile",
		},
	})

	// Show the window once the renderer has painted — avoids a flash of
	// transparent/blank content while the page loads.
	win.once("ready-to-show", () => {
		win.show()
	})

	// Install liquid glass effect after window creation (tier 1 only)
	if (chrome.tier === "liquid-glass") {
		await installLiquidGlass(win, isOpaque)
	}

	// Notify the renderer which chrome tier is active so it can adapt CSS
	win.webContents.once("did-finish-load", () => {
		win.webContents.send("chrome-tier", chrome.tier)
	})

	// Open external links in default browser instead of new Electron windows
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("http:") || url.startsWith("https:")) {
			shell.openExternal(url)
		}
		return { action: "deny" }
	})

	// In dev mode, ensure the window title always shows "(Dev)" suffix
	if (isDev) {
		win.on("page-title-updated", (event, pageTitle) => {
			if (!pageTitle.includes("(Dev)")) {
				event.preventDefault()
				win.setTitle(`${pageTitle} (Dev)`)
			}
		})
	}

	// Workaround: transparent/vibrancy windows on macOS lose click interactivity
	// after DevTools are toggled (Electron recomposites the window and marks
	// transparent regions as click-through). Force detached mode and re-assert
	// mouse events on every DevTools open/close cycle.
	if (process.platform === "darwin") {
		const fixClickThrough = () => {
			win.setIgnoreMouseEvents(false)
		}
		win.webContents.on("devtools-opened", fixClickThrough)
		win.webContents.on("devtools-closed", fixClickThrough)
	}

	// Dev: load from Vite dev server | Prod: load built files
	if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
		const url = route ? `${process.env.ELECTRON_RENDERER_URL}/#${route}` : process.env.ELECTRON_RENDERER_URL
		win.loadURL(url)
	} else {
		win.loadFile(path.join(__dirname, "../renderer/index.html"), route ? { hash: route } : undefined)
	}

	return win
}

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
	app.quit()
} else {
	// Register custom protocol for deep linking (devil-ai://)
	if (process.defaultApp) {
		if (process.argv.length >= 2) {
			app.setAsDefaultProtocolClient("devil-ai", process.execPath, [path.resolve(process.argv[1])])
		}
	} else {
		app.setAsDefaultProtocolClient("devil-ai")
	}

	// Helper to process incoming OAuth deep links
	const handleDeepLink = async (urlStr: string) => {
		try {
			log.info(`Received deep link: ${urlStr}`)
			const url = new URL(urlStr)
			if (url.protocol !== "devil-ai:") return
			if (url.hostname === "callback") {
				const provider = url.searchParams.get("provider")
				const connected = url.searchParams.get("connected")

				if (provider && connected === "true" && /^[a-zA-Z0-9_-]{1,50}$/.test(provider)) {
					// Restart the AI engine in the background so it picks up the new environment variables
					restartServer()
						.then(server => {
							const win = BrowserWindow.getAllWindows()[0]
							if (win) {
								win.webContents.send("engine-restarted", server.url)
							}
						})
						.catch(err => log.error("Failed to restart engine after deep link auth:", err))

					// Notify renderer if window is available
					const win = BrowserWindow.getAllWindows()[0]
					if (win) {
						win.webContents.send("connector-authenticated", provider)
					}
				}
			}
		} catch (err) {
			log.error("Failed to parse deep link", err)
		}
	}

	// Windows/Linux deep link handler
	app.on("second-instance", (_event, commandLine, _workingDirectory) => {
		const win = BrowserWindow.getAllWindows()[0]
		if (win) {
			if (win.isMinimized()) win.restore()
			win.focus()
		}
		// Find the devil-ai:// argument
		const url = commandLine.find((arg) => arg.startsWith("devil-ai://"))
		if (url) handleDeepLink(url)
	})

	// macOS deep link handler
	app.on("open-url", (event, url) => {
		event.preventDefault()
		// Focus existing window on macOS (second-instance doesn't fire on macOS)
		const win = BrowserWindow.getAllWindows()[0]
		if (win) {
			if (win.isMinimized()) win.restore()
			win.show()
			win.focus()
		}
		handleDeepLink(url)
	})

	app.whenReady().then(async () => {
		// Clear Chromium cache on startup
		await session.defaultSession.clearCache()
		
		// Bypass Chromium's Private Network Access checks for server requests.
		// Chromium (134+/Electron 40+) blocks renderer fetch() to private network addresses
		// (127.0.0.1) with ERR_ALPN_NEGOTIATION_FAILED when the PNA preflight response
		// doesn't include Access-Control-Allow-Private-Network. The local server (Bun/Hono)
		// doesn't send this header. Instead of patching the server, we inject the header
		// for all responses from the local server.
		session.defaultSession.webRequest.onHeadersReceived(
			{ urls: ["http://127.0.0.1:*/*"] },
			(details, callback) => {
				callback({
					responseHeaders: {
						...details.responseHeaders,
						"Access-Control-Allow-Private-Network": ["true"],
					},
				})
			},
		)
		log.info("Registered PNA header injection for 127.0.0.1 requests")

		initSettingsStore()
		initCredentialStore()
		startAutoSyncDaemon()

		// Initialize connector token sync
		try {
			const { getCredential } = await import("./credential-store")
			const userEmail = await getCredential("user-email")
			if (userEmail) {
				const { syncTokensFromServer } = await import("./connectors/token-sync")
				// Delay token sync to ensure DB is ready
				setTimeout(() => {
					syncTokensFromServer(userEmail).catch((err: unknown) => {
						console.error("Token sync error:", err)
					})
				}, 5000)
				log.info("Connector token sync scheduled for", userEmail)
			}
		} catch (err) {
			log.warn("Connector token sync failed to start", err)
		}

		// Check disk space early — warn user if critically low
		checkDiskSpaceForOperation()


		// Check VC++ Redistributable on Windows (portable exe only)
		// Must run before createWindow so the dialog appears before the app UI
		await checkVcRedistOnStartup()

		registerIpcHandlers()
		initAutomations().catch((err) => log.error("Automations failed to start", err))
		startMdnsScanner().catch((err) => log.warn("mDNS scanner failed to start", err))
		createWindow()
		createTray(() => BrowserWindow.getAllWindows()[0])
		initAutoUpdater().catch((err) => log.error("AutoUpdater failed to start", err))

		// Start subscription heartbeat for license enforcement
		try {
			const { startHeartbeat } = await import("./subscription-guard")
			const { getCredential } = await import("./credential-store")
			startHeartbeat(async () => {
				try {
					return await getCredential("subscription-token")
				} catch {
					return null
				}
			})
		} catch (err) {
			log.warn("Subscription heartbeat failed to start", err)
		}

		// Eagerly start the engine in background so it's ready
		// by the time the renderer calls ensureServer().
		// Retry up to 3 times with exponential backoff.
		// Before retrying, force-kill any stale process holding the port.
		const startServerWithRetry = async (attempt = 1): Promise<void> => {
			try {
				await ensureServer()
				log.info("Engine started successfully")
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err)
				log.warn("Server spawn attempt failed", { attempt, error: errorMsg })

				const isBinaryMissing = errorMsg.includes("Engine binary not found") ||
					errorMsg.includes("auto-install") ||
					errorMsg.includes("installation completed but binary was not found")

				if (!isBinaryMissing && attempt < 3) {
					// Port-related error: force-kill and retry on different ports
					if (attempt === 1) {
						log.info("Attempting to clean up stale processes before retry")
						try {
							await forceKillLocalServer()
						} catch {
							// Ignore — force kill is best-effort
						}
					}

					const delay = 2000 * 2 ** (attempt - 1)
					log.info("Retrying server spawn", { delayMs: delay, attempt: attempt + 1 })
					await new Promise(resolve => setTimeout(resolve, delay))
					await startServerWithRetry(attempt + 1)
				} else if (isBinaryMissing) {
					// Binary not found — retrying won't help, show install-focused dialog
					log.error("Engine binary not found, showing install dialog", { error: errorMsg })
					const { response } = await dialog.showMessageBox({
						type: "error",
						title: "Engine Not Found",
						message: "The engine binary could not be found or installed.",
						detail:
							`${errorMsg}\n\n` +
							"The engine needs to be installed before Devil AI can start.\n\n" +
							"You can try reinstalling the engine, or quit and install it manually.",
						buttons: ["Try Install Again", "Restart App", "Quit"],
						defaultId: 0,
						cancelId: 2,
					})

					if (response === 0) {
						// Try installing again
						log.info("User chose to retry install")
						await new Promise(resolve => setTimeout(resolve, 1000))
						await startServerWithRetry(1)
					} else if (response === 1) {
						log.info("User chose to restart app")
						app.relaunch()
						app.exit(0)
					}
				} else {
					// Port retry exhausted
					log.error("Failed to start engine after 3 attempts", { error: errorMsg })
					const { response } = await dialog.showMessageBox({
						type: "error",
						title: "Server Start Failed",
						message: "Could not start the engine after trying multiple ports.",
						detail:
							`Error: ${errorMsg}\n\n` +
							"This can happen if another instance is already running or a stale process is holding the port.\n\n" +
							"Would you like to force-kill any existing processes and retry?",
						buttons: ["Force Kill & Retry", "Restart App", "Quit"],
						defaultId: 0,
						cancelId: 2,
					})

					if (response === 0) {
						log.info("User chose force kill and retry")
						try {
							await forceKillLocalServer()
						} catch {
							// Ignore
						}
						await new Promise(resolve => setTimeout(resolve, 1000))
						await startServerWithRetry(1)
					} else if (response === 1) {
						log.info("User chose to restart app")
						app.relaunch()
						app.exit(0)
					}
				}
			}
		}
		
		startServerWithRetry()

		// Auto-start the DevilRoute local gateway (powers the devil-ai provider).
		// Health-checks first — never double-spawns if it is already running.
		ensureDevilRoute().catch((err) =>
			log.warn("DevilRoute auto-start failed", { reason: String(err) }),
		)

		// Auto-refresh session-token providers in the gateway (once now, then every 2h).
		// A no-op until the user stores the gateway admin password in Settings.
		startDevilRouteTokenRefresher()

		// Auto-start Ollama if installed
		if (OllamaManager.getInstance().isInstalled()) {
			OllamaManager.getInstance().start().catch((err) => {
				log.warn("Ollama auto-start failed", { reason: String(err) })
			})
		}

		// Auto-start Telegram bot if token is configured
		autoStartTelegramBot().catch((err) =>
			log.warn("Telegram bot auto-start failed", { reason: String(err) }),
		)

		// Start webhook server for GitHub/GitLab PR reviews
		startWebhookServer({
			port: 9876,
			enabled: true,
			secret: process.env.GITHUB_WEBHOOK_SECRET || process.env.GITLAB_WEBHOOK_SECRET,
		}).catch((err) => log.warn("Webhook server failed to start", { reason: String(err) }))

		// Initialize webhook review handler
		initWebhookReviewHandler()

		// Initialize Devil AI Agent for autonomous AI capabilities
		// Uses existing server providers - no separate API key needed!
		try {
			devilAIAgent = new DevilAIAgent({
				workDir: app.getPath('userData')
			})
			await devilAIAgent.initialize()
			setDevilAIAgent(devilAIAgent)
			log.info("Devil AI Agent initialized successfully")
		} catch (err) {
			log.warn("Devil AI initialization failed", { reason: String(err) })
		}

		// Start self-healing system (monitor and repair)
		startSelfHealing()

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow()
		})
	})

	// On all platforms (including macOS), closing all windows quits the app.
	// Previously macOS kept the app alive on window close, but users expect
	// the red close button to fully quit the application.
	app.on("window-all-closed", () => {
		stopAutoSyncDaemon()

		app.quit()
	})

	// All cleanup happens here, triggered by Cmd+Q, Dock > Quit, app.quit(),
	// or system-initiated quit (macOS logout SIGTERM). This is the single
	// source of truth for teardown -- stopServer() etc. are idempotent.
	app.on("before-quit", () => {
		destroyTray()
		shutdownAutomations()
		stopMdnsScanner()
		stopServer()
		stopDevilRoute()
		stopDevilRouteTokenRefresher()
		OllamaManager.getInstance().stop()
		stopTunnel()
		shutdownTelegramBot()
		stopAutoUpdater()
		stopWebhookServer().catch((err) => log.warn("Webhook server stop failed", err))
		// Stop subscription heartbeat
		stopHeartbeat()
		// Devil AI agent cleanup (if needed in future)
		devilAIAgent = null
	})
}
