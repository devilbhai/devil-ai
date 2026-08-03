import { registerOnboardingIpc } from "./ipc/ipc-onboarding";
import { registerDevilRouteTokenIpc } from "./ipc/ipc-devilroute";
import { registerAutomationIpc } from "./ipc/ipc-automation";
import { registerSettingsIpc } from "./ipc/ipc-settings";
import { registerGitIpc } from "./ipc/ipc-git";
import { registerPluginIpc } from "./ipc/ipc-plugins";
import { registerMemoryIpc } from "./ipc/ipc-memory";
import { registerGitHubActionsIpc } from "./ipc/ipc-github-actions";
import { registerRestApiIpc } from "./ipc/ipc-rest-api";
import { registerHistorySearchIpc } from "./history-search/ipc";
import { registerSemanticSearchIpc } from "./semantic-search/ipc";
import { registerProjectRepoMapIpc } from "./ipc/ipc-project-repo";
import { setupSttIpc } from "./ipc/ipc-stt";
import { registerBrowserAutomationIpc } from "./ipc/ipc-browser";
import { registerDevilAIIpc } from "./ipc/ipc-devil-ai";
import { registerPromptsIpc } from "./ipc/ipc-prompts";
import { registerSnippetsIpc } from "./ipc/ipc-snippets";
import { registerSessionTemplatesIpc } from "./ipc/ipc-session-templates";
import { registerKeyboardShortcutsIpc } from "./ipc/ipc-keyboard-shortcuts";
import { registerAnalyticsIpc } from "./ipc/ipc-analytics";
import { registerWindowIpc } from "./ipc/ipc-window";
import { registerSandboxIpc } from "./ipc/ipc-sandbox";
import { registerIntegrationsIpc } from "./ipc/ipc-integrations";
import { registerMultiAgentIpc } from "./ipc/ipc-multi-agent";
import { registerContextEngineIpc } from "./ipc/ipc-context-engine";
import { registerDeployIpc } from "./ipc/ipc-deploy";
import { registerReviewBotIpc } from "./ipc/ipc-review-bot";
import { registerSkillsIpc } from "./ipc/ipc-skills";
import { registerTerminalIpc } from "./ipc/ipc-terminal";
import { registerConnectorsIpc } from "./ipc/ipc-connectors";
import { registerScreenShareIpc, setupInputHandlers } from "./screen-share";
import { handleFetchProxy, withLogging } from "./ipc/utils";
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, net, systemPreferences } from "electron"
import { getOpenInTargets, openInTarget, setPreferredTarget } from "./open-in-targets";
import { installCli, isCliInstalled, uninstallCli } from "./cli-install"
import { deleteCredential, getCredential, storeCredential } from "./credential-store"

import { getResolvedChromeTier } from "./liquid-glass"
import { createLogger } from "./logger"
import { getDiscoveredServers } from "./mdns-scanner"
import { isCloudflaredInstalled, startTunnel, stopTunnel, getTunnelUrl, getCurrentOtp, getViewerCount } from "./tunnel-manager"
import {
	startTelegramBot,
	stopTelegramBot,
	getTelegramBotStatus,
	sendForwardedMessage,
} from "./telegram-bot-manager"
import { readModelState, updateModelRecent } from "./model-state"
import { dismissNotification, updateBadgeCount } from "./notifications"
import { checkFzf, installFzf, fzfFiles, fzfSearch } from "./fzf"
import { checkCodeGraph, installCodeGraph, indexCodeGraph, queryCodeGraph, startCodeGraphMcp, stopCodeGraphMcp } from "./codegraph"
import { checkPonytail, setupPonytail, getPonytailMode, setPonytailMode, getPonytailRules, isPonytailEnabled, togglePonytail } from "./ponytail"
import { ensureServer, forceKillLocalServer, getServerUrl, restartServer, stopServer } from "./opencode-manager"
import { OllamaManager } from "./services/ollama-manager"

import {
	checkForUpdates,
	downloadUpdate,
	getUpdateState,
	installUpdate,
	openReleasePage,
} from "./updater"

const log = createLogger("ipc")

/** Read the opaque windows preference for use at window creation time. */
export { getOpaqueWindows as getOpaqueWindowsPref } from "./settings-store"

/**
 * Registers all IPC handlers that the renderer can invoke via contextBridge.
 *
 * Each handler corresponds to an endpoint that was previously served by
 * the Bun + Hono server on port 3100. Now they run in-process in Electron's
 * main process, communicating via IPC instead of HTTP.
 */
export function registerIpcHandlers(): void {
	const ALLOWED_FS_PATHS = [
		"/usr/",
		"/bin/",
		"/sbin/",
		"/opt/",
		"/System/",
		"/Library/",
		"/Applications/",
		process.env.HOME || "",
	].filter(Boolean)

	ipcMain.handle("fs:exists", (_, pathStr: string) => {
		try {
			if (typeof pathStr !== "string" || pathStr.length > 1024) return false
			const resolved = require("node:path").resolve(pathStr)
			const isAllowed = ALLOWED_FS_PATHS.some((prefix) => resolved.startsWith(prefix))
			if (!isAllowed) return false
			return require("node:fs").existsSync(resolved)
		} catch {
			return false
		}
	});

	registerOnboardingIpc();
	registerDevilRouteTokenIpc();
	registerAutomationIpc();

	registerSettingsIpc();
	registerMemoryIpc();
	registerSemanticSearchIpc();
	registerHistorySearchIpc();
	registerGitHubActionsIpc();
	registerRestApiIpc();
	registerProjectRepoMapIpc();
	registerBrowserAutomationIpc();
	setupSttIpc();
	registerDevilAIIpc();
	registerPromptsIpc();
	registerSnippetsIpc();
	registerSessionTemplatesIpc();
	registerKeyboardShortcutsIpc();
	registerAnalyticsIpc();
	registerWindowIpc();
	registerSandboxIpc();
	registerIntegrationsIpc();
	registerMultiAgentIpc();
	registerContextEngineIpc();
	registerDeployIpc();
	registerReviewBotIpc();
	registerSkillsIpc();
	registerTerminalIpc();
	registerConnectorsIpc();
	registerScreenShareIpc();
	setupInputHandlers();

	// --- App info ---

	ipcMain.handle("app:info", () => ({
		version: app.getVersion(),
		isDev: !app.isPackaged,
	}))

	// --- Ollama Manager ---
	ipcMain.handle("ollama:is-installed", () => {
		return OllamaManager.getInstance().isInstalled()
	})

	ipcMain.handle("ollama:install", (event) => {
		return OllamaManager.getInstance().install((text) => {
			event.sender.send("ollama:install-output", text)
		})
	})

	ipcMain.handle("ollama:start", () => {
		return OllamaManager.getInstance().start()
	})

	ipcMain.handle("ollama:stop", () => {
		return OllamaManager.getInstance().stop()
	})

	ipcMain.handle("ollama:pull-model", (event, model: string) => {
		return OllamaManager.getInstance().pullModel(model, (text) => {
			event.sender.send("ollama:pull-output", text)
		})
	})

	ipcMain.handle("ollama:list-models", () => {
		return OllamaManager.getInstance().listModels()
	})

	// --- Engine Installer ---
	ipcMain.handle("engine:install", (event, engine: string) => {
		return import("./services/engine-installer").then(({ installLocalEngine }) =>
			installLocalEngine(engine, (text) => {
				event.sender.send("engine:install-output", text)
			}),
		)
	})

	// --- Security Testing ---
	// Gate dangerous tool execution: reject obviously-internal/private targets
	// to prevent SSRF-style abuse via the renderer IPC surface.
	const isSafeSecurityTarget = (value: string): boolean => {
		const v = value.trim().toLowerCase()
		if (!v) return true
		if (v === "localhost" || v === "127.0.0.1" || v === "[::1]") return false
		if (v.endsWith(".local") || v.endsWith(".internal")) return false
		if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) {
			if (v === "127.0.0.1") return false
			// Block RFC1918 + link-local + cloud metadata ranges.
			return !(
				v.startsWith("10.") ||
				v.startsWith("192.168.") ||
				v.startsWith("169.254.") ||
				/^172\.(1[6-9]|2\d|3[01])\./.test(v)
			)
		}
		return true
	}

	ipcMain.handle("security:executeTool", withLogging("security:executeTool", async (_, toolName: string, args: string[], options: any) => {
		if (Array.isArray(args) && args.some((a) => typeof a === "string" && !isSafeSecurityTarget(a))) {
			throw new Error("Blocked: target appears to be an internal/private address. Security tools may only scan public targets you are authorized to test.")
		}
		const { executeTool } = await import("./security-testing/index")
		return await executeTool(toolName, args, options)
	}))

	ipcMain.handle("security:listTools", async (_, category?: string) => {
		const { listTools } = await import("./security-testing/index")
		return listTools(category)
	})

	// --- Engine server lifecycle ---

	ipcMain.handle(
		"opencode:ensure",
		withLogging("opencode:ensure", async () => await ensureServer()),
	)

	ipcMain.handle("opencode:url", () => getServerUrl())

	ipcMain.handle(
		"opencode:stop",
		withLogging("opencode:stop", () => stopServer()),
	)

	ipcMain.handle(
		"opencode:restart",
		withLogging("opencode:restart", async () => await restartServer()),
	)
	ipcMain.handle(
		"opencode:kill",
		withLogging("opencode:kill", async () => await forceKillLocalServer()),
	)

	// --- Model state ---

	ipcMain.handle(
		"model-state",
		withLogging("model-state", async () => await readModelState()),
	)

	ipcMain.handle(
		"model-state:update-recent",
		withLogging(
			"model-state:update-recent",
			async (_, model: { providerID: string; modelID: string }) => await updateModelRecent(model),
		),
	)

	// --- Auto-updater ---

	ipcMain.handle("updater:state", () => getUpdateState())

	ipcMain.handle("updater:check", async () => await checkForUpdates())

	ipcMain.handle("updater:download", async () => await downloadUpdate())

	ipcMain.handle("updater:install", async () => await installUpdate())

	ipcMain.handle("updater:open-release-page", async () => await openReleasePage())

	// --- Subscription validation ---

	ipcMain.handle("subscription:validate", withLogging("subscription:validate", async (_event, token: string) => {
		const { validateSubscription } = await import("./subscription-guard")
		return await validateSubscription(token, true)
	}))

	ipcMain.handle("subscription:state", withLogging("subscription:state", async () => {
		const { getSubscriptionState } = await import("./subscription-guard")
		return getSubscriptionState()
	}))

	registerGitIpc();

	// --- Directory picker ---

	ipcMain.handle(
		"dialog:open-directory",
		withLogging("dialog:open-directory", async () => {
			const result = await dialog.showOpenDialog({
				properties: ["openDirectory"],
				title: "Select a project folder",
			})
			if (result.canceled || result.filePaths.length === 0) return null
			return result.filePaths[0]
		}),
	)

	// --- Fetch proxy (bypasses Chromium connection limits) ---

	ipcMain.handle("fetch:request", withLogging("fetch:request", handleFetchProxy))

	// --- CLI install ---

	ipcMain.handle("cli:is-installed", () => isCliInstalled())

	ipcMain.handle("cli:install", () => installCli())

	ipcMain.handle("cli:uninstall", () => uninstallCli())

	// --- Open in external app ---

	ipcMain.handle("open-in:targets", () => getOpenInTargets())

	ipcMain.handle(
		"open-in:open",
		withLogging(
			"open-in:open",
			async (_, directory: string, targetId: string, persistPreferred?: boolean) =>
				await openInTarget(directory, targetId, { persistPreferred }),
		),
	)

	ipcMain.handle("open-in:set-preferred", (_, targetId: string) => {
		setPreferredTarget(targetId)
		return { success: true }
	})

	// --- fzf (Fuzzy Finder) ---

	ipcMain.handle(
		"fzf:check",
		withLogging("fzf:check", async () => await checkFzf()),
	)

	ipcMain.handle(
		"fzf:install",
		withLogging("fzf:install", async () => await installFzf()),
	)

	ipcMain.handle(
		"fzf:files",
		withLogging("fzf:files", async (_, cwd: string, query?: string) => await fzfFiles(cwd, query)),
	)

	ipcMain.handle(
		"fzf:search",
		withLogging(
			"fzf:search",
			async (_, query: string, cwd: string, options?: { files?: boolean; dirs?: boolean; hidden?: boolean; multi?: boolean; preview?: string }) =>
				await fzfSearch(query, cwd, options),
		),
	)

	// --- CodeGraph (Code Knowledge Graph) ---

	ipcMain.handle(
		"codegraph:check",
		withLogging("codegraph:check", async () => await checkCodeGraph()),
	)

	ipcMain.handle(
		"codegraph:install",
		withLogging("codegraph:install", async () => await installCodeGraph()),
	)

	ipcMain.handle(
		"codegraph:index",
		withLogging("codegraph:index", async (_, cwd: string) => await indexCodeGraph(cwd)),
	)

	ipcMain.handle(
		"codegraph:query",
		withLogging("codegraph:query", async (_, query: string, cwd: string) => await queryCodeGraph(query, cwd)),
	)

	ipcMain.handle(
		"codegraph:start-mcp",
		withLogging("codegraph:start-mcp", async (_, cwd: string) => await startCodeGraphMcp(cwd)),
	)

	ipcMain.handle(
		"codegraph:stop-mcp",
		withLogging("codegraph:stop-mcp", () => stopCodeGraphMcp()),
	)

	// --- Ponytail (Code Quality) ---

	ipcMain.handle(
		"ponytail:check",
		withLogging("ponytail:check", async () => await checkPonytail()),
	)

	ipcMain.handle(
		"ponytail:setup",
		withLogging("ponytail:setup", async () => await setupPonytail()),
	)

	ipcMain.handle(
		"ponytail:mode:get",
		withLogging("ponytail:mode:get", async () => await getPonytailMode()),
	)

	ipcMain.handle(
		"ponytail:mode:set",
		withLogging("ponytail:mode:set", async (_, mode: "lite" | "full" | "ultra" | "off") => await setPonytailMode(mode)),
	)

	ipcMain.handle(
		"ponytail:rules",
		withLogging("ponytail:rules", async () => await getPonytailRules()),
	)

	ipcMain.handle(
		"ponytail:enabled",
		withLogging("ponytail:enabled", async () => await isPonytailEnabled()),
	)

	ipcMain.handle(
		"ponytail:toggle",
		withLogging("ponytail:toggle", async () => await togglePonytail()),
	)

	// --- Code Review Agent (extends Ponytail) ---

	ipcMain.handle(
		"code-review:review",
		withLogging(
			"code-review:review",
			async (
				_,
				code: string,
				filePath?: string,
				options?: { categories?: Array<"security" | "performance" | "best-practice" | "complexity">; includeComplexity?: boolean },
			) => {
				const { reviewCode } = await import("./code-review-agent")
				return reviewCode(code, filePath, options)
			},
		),
	)

	ipcMain.handle(
		"code-review:audit",
		withLogging("code-review:audit", async (_, cwd: string) => {
			const { auditDirectory } = await import("./code-review-agent")
			return auditDirectory(cwd)
		}),
	)

	// --- Live Collaboration ---

	ipcMain.handle(
		"collab:start",
		withLogging("collab:start", async (_, roomId?: string) => {
			const { getCollaborationManager } = await import("./live-collaboration")
			const mgr = getCollaborationManager()
			const id = roomId || `room-${Date.now().toString(36)}`
			await mgr.startSession(id, "local")
			return { active: true, roomId: id }
		}),
	)

	ipcMain.handle("collab:stop", withLogging("collab:stop", async () => {
		const { getCollaborationManager } = await import("./live-collaboration")
		const mgr = getCollaborationManager()
		mgr.leaveSession()
	}))

	ipcMain.handle("collab:state", withLogging("collab:state", async () => {
		const { getCollaborationState } = await import("./live-collaboration")
		return getCollaborationState()
	}))

	// --- Chrome tier (pull-based, avoids race with push-based "chrome-tier" event) ---

	ipcMain.handle("chrome-tier:get", () => getResolvedChromeTier())

	// --- Notifications ---

	ipcMain.handle("notification:dismiss", (_, sessionId: string) => {
		dismissNotification(sessionId)
	})

	ipcMain.handle("notification:badge", (_, count: number) => {
		updateBadgeCount(count)
	})

	// --- Credential storage (safeStorage-backed) ---

	ipcMain.handle(
		"credential:store",
		withLogging("credential:store", (_, serverId: string, password: string) => {
			storeCredential(serverId, password)
		}),
	)

	ipcMain.handle("credential:get", (_, serverId: string) => getCredential(serverId))

	ipcMain.handle(
		"credential:delete",
		withLogging("credential:delete", (_, serverId: string) => {
			deleteCredential(serverId)
		}),
	)

	// --- mDNS discovery ---

	ipcMain.handle("mdns:get-discovered", () => getDiscoveredServers())

	// --- Remote server connectivity test ---

	const isSafeConnectTarget = (rawUrl: string): boolean => {
		try {
			const parsed = new URL(rawUrl)
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
			const hostname = parsed.hostname.toLowerCase()
			// Block private ranges, loopback (other than explicit), link-local, cloud metadata.
			if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true
			if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false
			if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return false
			if (hostname === "169.254.169.254" || hostname.endsWith(".metadata.google") || hostname.endsWith(".metadata.azure")) {
				return false
			}
			return true
		} catch {
			return false
		}
	}

	ipcMain.handle(
		"server:test-connection",
		withLogging(
			"server:test-connection",
			async (_, url: string, username?: string, password?: string) => {
				if (!isSafeConnectTarget(url)) {
					return "Blocked: the URL is not a permitted remote server address."
				}
				try {
					const headers: Record<string, string> = {}
					if (password) {
						const user = username || "opencode"
						headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`
					}
					const res = await net.fetch(`${url}/session`, {
						method: "GET",
						headers,
						signal: AbortSignal.timeout(5000),
					})
					if (res.ok) return null
					if (res.status === 401) return "Authentication failed. Check username and password."
					return `Server responded with HTTP ${res.status} ${res.statusText}`
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err)
					if (msg.includes("ECONNREFUSED")) return "Connection refused. Is the server running?"
					if (msg.includes("ENOTFOUND")) return "Host not found. Check the URL."
					if (msg.includes("ETIMEDOUT") || msg.includes("timeout")) return "Connection timed out."
					if (msg.includes("CERT")) return `TLS/certificate error: ${msg}`
					return `Connection failed: ${msg}`
				}
			},
		),
	)

	// --- Native theme (controls macOS glass tint color) ---

	ipcMain.handle("theme:set-native", (_, source: string) => {
		if (source === "light" || source === "dark") {
			nativeTheme.themeSource = source
		} else {
			nativeTheme.themeSource = "system"
		}
	})

	// --- System accent color (macOS / Windows) ---

	ipcMain.handle("theme:accent-color", () => {
		try {
			return systemPreferences.getAccentColor()
		} catch {
			return null
		}
	})

	// Broadcast accent color changes to all renderer windows
	systemPreferences.on("accent-color-changed", (_event, newColor) => {
		for (const win of BrowserWindow.getAllWindows()) {
			win.webContents.send("theme:accent-color-changed", newColor)
		}
	})

	// --- Tunnel (Cloudflare sharing) ---

	ipcMain.handle("tunnel:check", () => isCloudflaredInstalled())

	ipcMain.handle(
		"tunnel:start",
		withLogging("tunnel:start", async (_, sessionId: string) => await startTunnel(sessionId)),
	)

	ipcMain.handle("tunnel:stop", withLogging("tunnel:stop", () => stopTunnel()))

	ipcMain.handle("tunnel:url", () => getTunnelUrl())

	ipcMain.handle("tunnel:otp", () => getCurrentOtp())

	ipcMain.handle("tunnel:viewers", () => getViewerCount())

	// --- Telegram Bot ---

	ipcMain.handle(
		"telegram:start",
		withLogging("telegram:start", async () => await startTelegramBot()),
	)

	ipcMain.handle(
		"telegram:stop",
		withLogging("telegram:stop", async () => await stopTelegramBot()),
	)

	ipcMain.handle("telegram:status", () => getTelegramBotStatus())

	ipcMain.handle(
		"telegram:send-forwarded",
		withLogging("telegram:send-forwarded", async (_event, sessionId: string, role: "user" | "assistant", text: string) => {
			await sendForwardedMessage(sessionId, role, text)
		}),
	)

	// --- Notes ---

	ipcMain.handle("notes:list", withLogging("notes:list", () => import("./notes").then((m) => m.listNotes())))

	ipcMain.handle("notes:get", withLogging("notes:get", (_, id: string) => import("./notes").then((m) => m.getNote(id))))

	ipcMain.handle(
		"notes:create",
		withLogging("notes:create", async (_, input: { title: string; content?: string; tags?: string; sessionId?: string; projectPath?: string }) => {
			const { createNote } = await import("./notes")
			return createNote(input)
		}),
	)

	ipcMain.handle(
		"notes:update",
		withLogging("notes:update", async (_, input: { id: string; title?: string; content?: string; tags?: string; includeInContext?: boolean }) => {
			const { updateNote } = await import("./notes")
			return updateNote(input)
		}),
	)

	ipcMain.handle("notes:delete", withLogging("notes:delete", (_, id: string) => import("./notes").then((m) => m.deleteNote(id))))

	ipcMain.handle("notes:search", withLogging("notes:search", (_, query: string) => import("./notes").then((m) => m.searchNotes(query))))

	ipcMain.handle("notes:context", withLogging("notes:context", (_, projectPath?: string, promptText?: string) => import("./notes").then((m) => m.getNotesForContext(projectPath, promptText))))

	
	registerPluginIpc();

	// --- Image Generation (Pollinations.ai) ---

	ipcMain.handle(
		"image:generate",
		withLogging(
			"image:generate",
			async (
				_,
				input: {
					prompt: string
					width?: number
					height?: number
					model?: "flux" | "turbo" | "stable-diffusion"
					seed?: number
					enhance?: boolean
				},
			) => {
				const { generateImage } = await import("./image-gen")
				return generateImage(input)
			},
		),
	)

	// --- Test Runner ---
	const TEST_RUNNER_TIMEOUT_MS = 120_000
	const TEST_RUNNER_MAX_BUFFER = 10 * 1024 * 1024

	ipcMain.handle(
		"test-runner:run",
		withLogging(
			"test-runner:run",
			async (_, { command, cwd }: { command: string; cwd: string }) => {
				if (typeof command !== "string" || command.trim().length === 0) {
					throw new Error("Invalid command")
				}
				const { spawn } = await import("node:child_process")
				const { existsSync } = await import("node:fs")
				const { isAbsolute } = await import("node:path")
				const resolvedCwd = isAbsolute(cwd) && existsSync(cwd) ? cwd : process.cwd()
				return new Promise<{ success: boolean; output: string; exitCode: number }>((resolve) => {
					const timer = setTimeout(() => {
						proc.kill("SIGKILL")
						resolve({ success: false, output: "Error: command timed out", exitCode: 124 })
					}, TEST_RUNNER_TIMEOUT_MS)

					const proc = spawn("sh", ["-c", command], {
						cwd: resolvedCwd,
						stdio: "pipe",
						env: process.env,
					})

					let stdout = ""
					let stderr = ""

					proc.stdout?.on("data", (data: Buffer) => {
						stdout += data.toString()
						if (stdout.length > TEST_RUNNER_MAX_BUFFER) {
							proc.kill("SIGKILL")
							resolve({ success: false, output: "Error: output exceeded size limit", exitCode: 1 })
						}
					})

					proc.stderr?.on("data", (data: Buffer) => {
						stderr += data.toString()
						if (stderr.length > TEST_RUNNER_MAX_BUFFER) {
							proc.kill("SIGKILL")
							resolve({ success: false, output: "Error: output exceeded size limit", exitCode: 1 })
						}
					})

					proc.on("error", (err) => {
						clearTimeout(timer)
						resolve({ success: false, output: `Error: ${err.message}`, exitCode: 1 })
					})

					proc.on("exit", (code) => {
						clearTimeout(timer)
						resolve({
							success: code === 0,
							output: stdout + (stderr ? `\nSTDERR:\n${stderr}` : ""),
							exitCode: code ?? 1,
						})
					})
				})
			},
		),
	)

	// --- Webhook Server ---

	ipcMain.handle(
		"webhook:status",
		withLogging("webhook:status", async () => {
			const { getWebhookServerStatus } = await import("./webhook-server")
			return getWebhookServerStatus()
		}),
	)

	ipcMain.handle(
		"webhook:review-status",
		withLogging("webhook:review-status", async (_event, provider: string, repository: string, prNumber: number) => {
			const { getPRReviewStatus } = await import("./webhook-review-handler")
			return getPRReviewStatus(provider, repository, prNumber)
		}),
	)

	// --- Git Provider Tokens ---

	ipcMain.handle(
		"git-provider:get-config",
		withLogging("git-provider:get-config", async (_event, provider: "github" | "gitlab") => {
			const token = getCredential(`${provider}-token`)
			const baseUrl = getCredential(`${provider}-base-url`)
			return {
				configured: !!token,
				baseUrl: baseUrl || undefined,
			}
		}),
	)

	ipcMain.handle(
		"git-provider:set-token",
		withLogging("git-provider:set-token", async (_event, provider: "github" | "gitlab", token: string) => {
			storeCredential(`${provider}-token`, token)
			log.info(`Git provider token stored securely`, { provider })
			return { success: true }
		}),
	)
}
