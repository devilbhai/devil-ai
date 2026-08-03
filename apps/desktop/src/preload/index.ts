import { contextBridge, ipcRenderer } from "electron"
import type {
	SearchOptions,
	IndexProgress,
	FileWatchEvent,
	HistorySearchOptions,
	TokenRefreshSummary,
	TokenProblem,
} from "./api"

/**
 * Preload bridge — exposes a typed API from the main process to the renderer.
 *
 * The renderer accesses these via `window.devilAi.*`.
 * All methods return Promises (backed by `ipcRenderer.invoke`).
 */
contextBridge.exposeInMainWorld("devilAi", {
	/** The host platform: "darwin", "win32", or "linux". */
	platform: process.platform,

	/** Returns app version and dev/production mode. */
	getAppInfo: () => ipcRenderer.invoke("app:info"),
	checkDir: (path: string) => ipcRenderer.invoke("fs:exists", path),
	sttTranscribe: (data: any) => ipcRenderer.invoke("stt:transcribe", data),
	ttsSynthesize: (data: any) => ipcRenderer.invoke("tts:synthesize", data),

	// --- Window chrome / liquid glass ---

	/**
	 * Subscribes to the window chrome tier notification from the main process.
	 * Fired once after the window finishes loading.
	 * Tier values: "liquid-glass" | "vibrancy" | "opaque"
	 */
	onChromeTier: (callback: (tier: string) => void) => {
		const listener = (_event: unknown, tier: string) => callback(tier)
		ipcRenderer.on("chrome-tier", listener)
		return () => {
			ipcRenderer.removeListener("chrome-tier", listener)
		}
	},

	/** Get the current chrome tier (pull-based, avoids race with push event). */
	getChromeTier: () => ipcRenderer.invoke("chrome-tier:get"),

	/** Ensures the engine server is running. Spawns it if not. */
	ensureOpenCode: () => ipcRenderer.invoke("opencode:ensure"),

	/** Gets the URL of the running server, or null. */
	getServerUrl: () => ipcRenderer.invoke("opencode:url"),

	/** Stops the managed engine server. */
	stopOpenCode: () => ipcRenderer.invoke("opencode:stop"),

	/** Restarts the managed OpenCode server (stops and re-starts with current settings). */
	restartOpenCode: () => ipcRenderer.invoke("opencode:restart"),
	forceKillOpenCode: () => ipcRenderer.invoke("opencode:kill"),

	onEngineRestarted: (callback: (url: string) => void) => {
		const listener = (_event: unknown, url: string) => callback(url)
		ipcRenderer.on("engine-restarted", listener)
		return () => {
			ipcRenderer.removeListener("engine-restarted", listener)
		}
	},

	// --- Credential storage (safeStorage-backed) ---

	credential: {
		store: (serverId: string, password: string) =>
			ipcRenderer.invoke("credential:store", serverId, password),
		get: (serverId: string) => ipcRenderer.invoke("credential:get", serverId),
		delete: (serverId: string) => ipcRenderer.invoke("credential:delete", serverId),
	},

	/** Test connectivity to a remote engine server. Returns null on success or error message. */
	testServerConnection: (url: string, username?: string, password?: string) =>
		ipcRenderer.invoke("server:test-connection", url, username, password),

	// --- Connectors ---

	onConnectorAuthenticated: (callback: (provider: string) => void) => {
		const listener = (_event: unknown, provider: string) => callback(provider)
		ipcRenderer.on("connector-authenticated", listener)
		return () => {
			ipcRenderer.removeListener("connector-authenticated", listener)
		}
	},

	// --- mDNS discovery ---

	mdns: {
		/** Get the current list of discovered servers. */
		getDiscovered: () => ipcRenderer.invoke("mdns:get-discovered"),
		/** Subscribe to discovered server list changes. */
		onChanged: (callback: (servers: unknown[]) => void) => {
			const listener = (_event: unknown, servers: unknown[]) => callback(servers)
			ipcRenderer.on("mdns:servers-changed", listener)
			return () => {
				ipcRenderer.removeListener("mdns:servers-changed", listener)
			}
		},
	},

	// --- Semantic Search ---

	semanticSearch: {
		/** Index a project for semantic search. Returns project state when complete. */
		index: (projectPath: string) => ipcRenderer.invoke("semantic-search:index", projectPath),

		/** Get current index state for a project. */
		state: (projectPath: string) => ipcRenderer.invoke("semantic-search:state", projectPath),

		/** Search the indexed codebase. */
		search: (options: SearchOptions) => ipcRenderer.invoke("semantic-search:search", options),

		/** Cancel an in-progress indexing operation. */
		abort: (projectPath: string) => ipcRenderer.invoke("semantic-search:cancel", projectPath),

		/** Notify indexer of a file system event. */
		fileEvent: (projectPath: string, event: FileWatchEvent) => ipcRenderer.invoke("semantic-search:file-event", projectPath, event),

		/** Subscribe to indexing progress updates. */
		onProgress: (callback: (progress: IndexProgress) => void) => {
			const listener = (_event: unknown, progress: IndexProgress) => callback(progress)
			ipcRenderer.on("semantic-search:progress", listener)
			return () => {
				ipcRenderer.removeListener("semantic-search:progress", listener)
			}
		},
	},

	// --- History Search ---

	historySearch: {
		/** Search chat history across sessions. */
		search: (options: HistorySearchOptions) => ipcRenderer.invoke("history-search:search", options),

		/** Get detailed session information. */
		getSessionDetail: (sessionId: string, projectPath: string) => ipcRenderer.invoke("history-search:session-detail", sessionId, projectPath),
	},

	// --- Analytics ---

	analytics: {
		getDashboardStats: () => ipcRenderer.invoke("analytics:getDashboardStats"),
		trackSessionStart: (id: string, projectId?: string, modelName?: string) => 
			ipcRenderer.invoke("analytics:trackSessionStart", id, projectId, modelName),
		trackSessionEnd: (id: string) => ipcRenderer.invoke("analytics:trackSessionEnd", id),
	},

	// --- Window management ---

	window: {
		open: (route: string) => ipcRenderer.invoke("window:open", route),
	},

	// --- Code Sandbox ---

	sandbox: {
		execute: (code: string, language: string) => ipcRenderer.invoke("sandbox:execute", code, language),
	},

	// --- Integrations ---

	integrations: {
		getConfig: () => ipcRenderer.invoke("integrations:getConfig"),
		setConfig: (config: any) => ipcRenderer.invoke("integrations:setConfig", config),
		fetchTasks: () => ipcRenderer.invoke("integrations:fetchTasks"),
	},

	/** Reads model state (recent models, favorites, variants). */
	getModelState: () => ipcRenderer.invoke("model-state"),

	/** Updates the recent model list (adds model to front, deduplicates, caps at 10). */
	updateModelRecent: (model: { providerID: string; modelID: string }) =>
		ipcRenderer.invoke("model-state:update-recent", model),

	// --- Auto-updater ---

	/** Gets the current auto-updater state. */
	getUpdateState: () => ipcRenderer.invoke("updater:state"),

	/** Manually triggers an update check. */
	checkForUpdates: () => ipcRenderer.invoke("updater:check"),

	/** Starts downloading the available update. */
	downloadUpdate: () => ipcRenderer.invoke("updater:download"),

	/** Quits the app and installs the downloaded update. */
	installUpdate: () => ipcRenderer.invoke("updater:install"),

	/** Opens the GitHub release page for the current update version. */
	openReleasePage: () => ipcRenderer.invoke("updater:open-release-page"),

	/** Subscribes to update state changes pushed from the main process. */
	onUpdateStateChanged: (callback: (state: unknown) => void) => {
		const listener = (_event: unknown, state: unknown) => callback(state)
		ipcRenderer.on("updater:state-changed", listener)
		return () => {
			ipcRenderer.removeListener("updater:state-changed", listener)
		}
	},

	// --- Subscription validation ---

	/** Validates subscription against the server. */
	validateSubscription: (token: string) => ipcRenderer.invoke("subscription:validate", token),

	/** Gets current subscription state. */
	getSubscriptionState: () => ipcRenderer.invoke("subscription:state"),

	// --- Git operations ---

	git: {
		listBranches: (directory: string) => ipcRenderer.invoke("git:branches", directory),
		getStatus: (directory: string) => ipcRenderer.invoke("git:status", directory),
		checkout: (directory: string, branch: string) =>
			ipcRenderer.invoke("git:checkout", directory, branch),
		stashAndCheckout: (directory: string, branch: string) =>
			ipcRenderer.invoke("git:stash-and-checkout", directory, branch),
		stashPop: (directory: string) => ipcRenderer.invoke("git:stash-pop", directory),
		getRoot: (directory: string) => ipcRenderer.invoke("git:root", directory),
		diffStat: (directory: string) => ipcRenderer.invoke("git:diff-stat", directory),
		commitAll: (directory: string, message: string) =>
			ipcRenderer.invoke("git:commit-all", directory, message),
		push: (directory: string, remote?: string) => ipcRenderer.invoke("git:push", directory, remote),
		createBranch: (directory: string, branchName: string) =>
			ipcRenderer.invoke("git:create-branch", directory, branchName),
		applyToLocal: (worktreeDir: string, localDir: string) =>
			ipcRenderer.invoke("git:apply-to-local", worktreeDir, localDir),
		applyDiffText: (localDir: string, diffText: string) =>
			ipcRenderer.invoke("git:apply-diff-text", localDir, diffText),
		getRemoteUrl: (directory: string, remote?: string) =>
			ipcRenderer.invoke("git:remote-url", directory, remote),
		getLog: (directory: string, filePath: string, count?: number) =>
			ipcRenderer.invoke("git:log", directory, filePath, count),
		getBlame: (directory: string, filePath: string) =>
			ipcRenderer.invoke("git:blame", directory, filePath),
		wasRecentlyModified: (directory: string, filePath: string) =>
			ipcRenderer.invoke("git:recently-modified", directory, filePath),
	},

	// --- Window preferences (opaque windows / transparency) ---

	/** Get the persisted opaque windows preference from the main process. */
	getOpaqueWindows: () => ipcRenderer.invoke("prefs:get-opaque-windows"),

	/** Set the opaque windows preference and persist it in the main process. */
	setOpaqueWindows: (value: boolean) => ipcRenderer.invoke("prefs:set-opaque-windows", value),

	// --- Power management ---

	/** Prevent or allow system sleep while app is running. */
	preventSleep: (enable: boolean) => ipcRenderer.invoke("power:prevent-sleep", enable),

	/** Relaunch the app (used after toggling transparency, which requires a restart). */
	relaunch: () => ipcRenderer.invoke("app:relaunch"),

	// --- CLI install ---

	cli: {
		/** Checks whether the `devil-ai` CLI command is installed. */
		isInstalled: () => ipcRenderer.invoke("cli:is-installed"),
		/** Installs the `devil-ai` CLI command (symlinks to /usr/local/bin). */
		install: () => ipcRenderer.invoke("cli:install"),
		/** Uninstalls the `devil-ai` CLI command. */
		uninstall: () => ipcRenderer.invoke("cli:uninstall"),
	},

	// --- Ollama Manager ---

	ollama: {
		isInstalled: () => ipcRenderer.invoke("ollama:is-installed"),
		install: () => ipcRenderer.invoke("ollama:install"),
		start: () => ipcRenderer.invoke("ollama:start"),
		stop: () => ipcRenderer.invoke("ollama:stop"),
		pullModel: (model: string) => ipcRenderer.invoke("ollama:pull-model", model),
		listModels: () => ipcRenderer.invoke("ollama:list-models"),
		onInstallOutput: (callback: (text: string) => void) => {
			const handler = (_event: unknown, text: string) => callback(text)
			ipcRenderer.on("ollama:install-output", handler)
			return () => ipcRenderer.off("ollama:install-output", handler)
		},
		onPullOutput: (callback: (text: string) => void) => {
			const handler = (_event: unknown, text: string) => callback(text)
			ipcRenderer.on("ollama:pull-output", handler)
			return () => ipcRenderer.off("ollama:pull-output", handler)
		},
	},

	// --- Security Testing ---

	security: {
		executeTool: (toolName: string, args: string[], options: any) =>
			ipcRenderer.invoke("security:executeTool", toolName, args, options),
		listTools: (category?: string) =>
			ipcRenderer.invoke("security:listTools", category),
	},

	// --- Devil AI (JARVIS-like Agent) ---

	devilAi: {
		/** Process input with JARVIS personality */
		process: (input: string) => ipcRenderer.invoke("devil-ai:process", input),
		/** Execute a task */
		execute: (prompt: string) => ipcRenderer.invoke("devil-ai:execute", prompt),
		/** Get greeting in current language */
		greeting: () => ipcRenderer.invoke("devil-ai:greeting"),
		/** Get response by type */
		response: (type: string) => ipcRenderer.invoke("devil-ai:response", type),
		/** Set language (en, hi, gu) */
		setLanguage: (lang: string) => ipcRenderer.invoke("devil-ai:set-language", lang),
		/** Speak text */
		speak: (text: string) => ipcRenderer.invoke("devil-ai:speak", text),
		/** Control smart home device */
		smartHome: (command: string) => ipcRenderer.invoke("devil-ai:smart-home", command),
		/** Get daily briefing */
		briefing: () => ipcRenderer.invoke("devil-ai:briefing"),
		/** Get proactive suggestions */
		suggestions: () => ipcRenderer.invoke("devil-ai:suggestions"),
		/** Get system status */
		status: () => ipcRenderer.invoke("devil-ai:status"),
		/** Play sound effect */
		sound: (effect: string) => ipcRenderer.invoke("devil-ai:sound", effect),
		/** Organize files */
		organize: (directory: string) => ipcRenderer.invoke("devil-ai:organize", directory),
		/** Search web */
		search: (query: string) => ipcRenderer.invoke("devil-ai:search", query),
		/** Browse website */
		browse: (url: string) => ipcRenderer.invoke("devil-ai:browse", url),
		/** Use tool */
		tool: (toolName: string, params?: any) => ipcRenderer.invoke("devil-ai:tool", toolName, params),
	},

	// --- Open in external app ---

	openIn: {
		getTargets: () => ipcRenderer.invoke("open-in:targets"),
		open: (directory: string, targetId: string, persistPreferred?: boolean) =>
			ipcRenderer.invoke("open-in:open", directory, targetId, persistPreferred),
		setPreferred: (targetId: string) => ipcRenderer.invoke("open-in:set-preferred", targetId),
	},

	// --- fzf (Fuzzy Finder) ---

	fzf: {
		/** Check if fzf is installed */
		check: () => ipcRenderer.invoke("fzf:check"),
		/** Install fzf (macOS: brew, Windows: winget, Linux: git) */
		install: () => ipcRenderer.invoke("fzf:install"),
		/** Quick file search in a directory */
		files: (cwd: string, query?: string) => ipcRenderer.invoke("fzf:files", cwd, query),
		/** Advanced fuzzy search with options */
		search: (query: string, cwd: string, options?: { files?: boolean; dirs?: boolean; hidden?: boolean; multi?: boolean; preview?: string }) =>
			ipcRenderer.invoke("fzf:search", query, cwd, options),
	},

	// --- CodeGraph (Code Knowledge Graph) ---

	codegraph: {
		/** Check if CodeGraph is installed */
		check: () => ipcRenderer.invoke("codegraph:check"),
		/** Install CodeGraph via npm */
		install: () => ipcRenderer.invoke("codegraph:install"),
		/** Index codebase for knowledge graph */
		index: (cwd: string) => ipcRenderer.invoke("codegraph:index", cwd),
		/** Query the code knowledge graph */
		query: (query: string, cwd: string) => ipcRenderer.invoke("codegraph:query", query, cwd),
		/** Start CodeGraph MCP server */
		startMcp: (cwd: string) => ipcRenderer.invoke("codegraph:start-mcp", cwd),
		/** Stop CodeGraph MCP server */
		stopMcp: () => ipcRenderer.invoke("codegraph:stop-mcp"),
	},

	// --- Ponytail (Code Quality - Built-in Skill) ---

	ponytail: {
		/** Check if Ponytail is available */
		check: () => ipcRenderer.invoke("ponytail:check"),
		/** Setup Ponytail config */
		setup: () => ipcRenderer.invoke("ponytail:setup"),
		/** Get current Ponytail mode */
		getMode: () => ipcRenderer.invoke("ponytail:mode:get"),
		/** Set Ponytail mode (lite/full/ultra/off) */
		setMode: (mode: "lite" | "full" | "ultra" | "off") => ipcRenderer.invoke("ponytail:mode:set", mode),
		/** Get Ponytail rules for prompt injection */
		getRules: () => ipcRenderer.invoke("ponytail:rules"),
		/** Check if Ponytail is enabled */
		isEnabled: () => ipcRenderer.invoke("ponytail:enabled"),
		/** Toggle Ponytail on/off */
		toggle: () => ipcRenderer.invoke("ponytail:toggle"),
	},

	// --- Code Review Agent (extends Ponytail) ---

	codeReview: {
		/** Run comprehensive code review with security, performance, best-practice rules */
		review: (code: string, filePath?: string, options?: { categories?: string[]; includeComplexity?: boolean }) =>
			ipcRenderer.invoke("code-review:review", code, filePath, options),
		/** Audit entire directory */
		audit: (cwd: string) => ipcRenderer.invoke("code-review:audit", cwd),
	},

	// --- GitHub Actions Runner ---

	githubActions: {
		/** List workflows for a repository */
		listWorkflows: (owner: string, repo: string, page?: number, perPage?: number) =>
			ipcRenderer.invoke("github-actions:list-workflows", owner, repo, page, perPage),
		/** List recent workflow runs */
		listRuns: (owner: string, repo: string, workflowId?: number, page?: number, perPage?: number) =>
			ipcRenderer.invoke("github-actions:list-runs", owner, repo, workflowId, page, perPage),
		/** Trigger a workflow run */
		trigger: (owner: string, repo: string, workflowId: number, ref?: string, inputs?: Record<string, string>) =>
			ipcRenderer.invoke("github-actions:trigger", owner, repo, workflowId, ref, inputs),
		/** Get workflow run status */
		getRunStatus: (owner: string, repo: string, runId: number) =>
			ipcRenderer.invoke("github-actions:get-run-status", owner, repo, runId),
		/** Get workflow run logs */
		getRunLogs: (owner: string, repo: string, runId: number) =>
			ipcRenderer.invoke("github-actions:get-run-logs", owner, repo, runId),
		/** Cancel a workflow run */
		cancelRun: (owner: string, repo: string, runId: number) =>
			ipcRenderer.invoke("github-actions:cancel-run", owner, repo, runId),
		/** Re-run a failed workflow */
		rerunRun: (owner: string, repo: string, runId: number) =>
			ipcRenderer.invoke("github-actions:rerun-run", owner, repo, runId),
		/** Get workflow run artifacts */
		getArtifacts: (owner: string, repo: string, runId: number) =>
			ipcRenderer.invoke("github-actions:get-artifacts", owner, repo, runId),
		/** Parse owner/repo from git remote URL */
		parseRemoteUrl: (remoteUrl: string) =>
			ipcRenderer.invoke("github-actions:parse-remote-url", remoteUrl),
		/** List user's GitHub repositories */
		listRepos: () => ipcRenderer.invoke("github-actions:list-repos"),
		/** Save GitHub token */
		saveToken: (token: string) => ipcRenderer.invoke("github-actions:save-token", token),
		/** Delete GitHub token */
		deleteToken: () => ipcRenderer.invoke("github-actions:delete-token"),
		/** Check if GitHub token exists */
		hasToken: () => ipcRenderer.invoke("github-actions:has-token"),
		/** Create a new GitHub repository */
		createRepo: (options: { name: string; description?: string; private?: boolean; autoInit?: boolean }) =>
			ipcRenderer.invoke("github-actions:create-repo", options),
		/** Check if a repository exists */
		checkRepo: (owner: string, repo: string) => ipcRenderer.invoke("github-actions:check-repo", owner, repo),
		/** Get authenticated GitHub user */
		getUser: () => ipcRenderer.invoke("github-actions:get-user"),
	},

	// --- Project-Repo Mapping ---
	// Links projects to GitHub repositories (1:1)

	projectRepoMap: {
		/** Initialize the mapping store */
		init: () => ipcRenderer.invoke("project-repo:init"),
		/** Get the repo linked to a project */
		get: (projectDir: string) => ipcRenderer.invoke("project-repo:get", projectDir),
		/** Link a project to a repo */
		set: (projectDir: string, owner: string, repo: string) => ipcRenderer.invoke("project-repo:set", projectDir, owner, repo),
		/** Remove a project-repo link */
		delete: (projectDir: string) => ipcRenderer.invoke("project-repo:delete", projectDir),
		/** Get all project-repo mappings */
		list: () => ipcRenderer.invoke("project-repo:list"),
		/** Check if a repo is already linked to a project */
		checkLinked: (owner: string, repo: string) => ipcRenderer.invoke("project-repo:check-linked", owner, repo),
	},

	// --- Browser Automation ---
	// Control browser via Playwright or extension

	browser: {
		/** Initialize browser automation */
		init: (options?: { headless?: boolean; browser?: "chromium" | "firefox" | "webkit"; viewport?: { width: number; height: number } }) =>
			ipcRenderer.invoke("browser:init", options),
		/** Close browser */
		close: () => ipcRenderer.invoke("browser:close"),
		/** Create new tab */
		newTab: (url?: string) => ipcRenderer.invoke("browser:new-tab", url),
		/** Navigate to URL */
		navigate: (pageId: string, url: string, options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit"; timeout?: number }) =>
			ipcRenderer.invoke("browser:navigate", pageId, url, options),
		/** Click element */
		click: (pageId: string, selector: string, options?: { button?: "left" | "right" | "middle"; clickCount?: number; delay?: number }) =>
			ipcRenderer.invoke("browser:click", pageId, selector, options),
		/** Type text */
		type: (pageId: string, selector: string, text: string, options?: { delay?: number }) =>
			ipcRenderer.invoke("browser:type", pageId, selector, text, options),
		/** Take screenshot */
		screenshot: (pageId: string, options?: { fullPage?: boolean; format?: "png" | "jpeg"; quality?: number }) =>
			ipcRenderer.invoke("browser:screenshot", pageId, options),
		/** Evaluate JavaScript */
		evaluate: (pageId: string, script: string, args?: any) =>
			ipcRenderer.invoke("browser:evaluate", pageId, script, args),
		/** Get page HTML */
		getContent: (pageId: string) => ipcRenderer.invoke("browser:get-content", pageId),
		/** Get page text */
		getText: (pageId: string) => ipcRenderer.invoke("browser:get-text", pageId),
		/** Wait for selector */
		waitForSelector: (pageId: string, selector: string, timeout?: number) =>
			ipcRenderer.invoke("browser:wait-for-selector", pageId, selector, timeout),
		/** Get cookies */
		getCookies: (pageId: string) => ipcRenderer.invoke("browser:get-cookies", pageId),
		/** Set cookies */
		setCookies: (pageId: string, cookies: any[]) => ipcRenderer.invoke("browser:set-cookies", pageId, cookies),
		/** Press key */
		pressKey: (pageId: string, key: string) => ipcRenderer.invoke("browser:press-key", pageId, key),
		/** Get all tabs */
		getTabs: () => ipcRenderer.invoke("browser:get-tabs"),
		/** Close page */
		closePage: (pageId: string) => ipcRenderer.invoke("browser:close-page", pageId),
		/** Get runner status */
		status: () => ipcRenderer.invoke("browser:status"),
	},

	// --- Live Collaboration ---

	collab: {
		/** Start a collaboration session */
		start: (roomId?: string) => ipcRenderer.invoke("collab:start", roomId),
		/** Stop the collaboration session */
		stop: () => ipcRenderer.invoke("collab:stop"),
		/** Get current collaboration state */
		getState: () => ipcRenderer.invoke("collab:state"),
	},

	// --- Native theme (syncs macOS glass tint to app color scheme) ---

	/** Set the native theme source to control macOS glass tint color. */
	setNativeTheme: (source: string) => ipcRenderer.invoke("theme:set-native", source),

	/** Get the system accent color as an 8-char hex RRGGBBAA string, or null if unavailable. */
	getAccentColor: () => ipcRenderer.invoke("theme:accent-color"),

	/** Subscribe to system accent color changes (fired when the user changes OS accent color). */
	onAccentColorChanged: (callback: (color: string) => void) => {
		const listener = (_event: unknown, color: string) => callback(color)
		ipcRenderer.on("theme:accent-color-changed", listener)
		return () => {
			ipcRenderer.removeListener("theme:accent-color-changed", listener)
		}
	},

	// --- Directory picker ---

	/** Opens a native folder picker dialog. Returns the selected path, or null if cancelled. */
	pickDirectory: () => ipcRenderer.invoke("dialog:open-directory"),

	// --- Fetch proxy (bypasses Chromium connection limits) ---

	/**
	 * Proxies an HTTP request through the main process using Electron's `net.fetch()`.
	 * This bypasses Chromium's 6-connections-per-origin limit for HTTP/1.1.
	 * The renderer serializes the Request, sends it over IPC, and gets back
	 * a serialized Response.
	 */
	fetch: (req: {
		url: string
		method: string
		headers: Record<string, string>
		body: string | null
	}) => ipcRenderer.invoke("fetch:request", req),

	// --- Notifications ---

	/**
	 * Subscribes to notification navigation events from the main process.
	 * Fired when the user clicks a native OS notification — the renderer
	 * should navigate to the specified session.
	 */
	onNotificationNavigate: (callback: (data: { sessionId: string }) => void) => {
		const listener = (_event: unknown, data: { sessionId: string }) => callback(data)
		ipcRenderer.on("notification:navigate", listener)
		return () => {
			ipcRenderer.removeListener("notification:navigate", listener)
		}
	},

	/** Dismiss any active notification for a session (e.g. when the user navigates to it). */
	dismissNotification: (sessionId: string) => ipcRenderer.invoke("notification:dismiss", sessionId),

	/** Update the dock badge / app badge count. */
	updateBadgeCount: (count: number) => ipcRenderer.invoke("notification:badge", count),

	// --- Settings ---

	/** Get the full app settings object. */
	getSettings: () => ipcRenderer.invoke("settings:get"),

	/** Update settings with a partial object (deep-merged). Returns the updated settings. */
	updateSettings: (partial: Record<string, unknown>) =>
		ipcRenderer.invoke("settings:update", partial),

	/** Subscribe to settings changes pushed from the main process. */
	onSettingsChanged: (callback: (settings: unknown) => void) => {
		const listener = (_event: unknown, settings: unknown) => callback(settings)
		ipcRenderer.on("settings:changed", listener)
		return () => {
			ipcRenderer.removeListener("settings:changed", listener)
		}
	},

	// --- App Icon ---
	/** Set the app dock icon (macOS only) */
	setAppIcon: (iconName: string) => ipcRenderer.invoke("app:set-icon", iconName),

	// --- REST API & Cloudflare Tunnel ---

	restApi: {
		/** Start the REST API server */
		start: (config: { enabled: boolean; port: number; enableCors: boolean; allowedOrigins: string[]; requireAuth: boolean; apiKey: string; enableTunnel: boolean; tunnelSubdomain?: string }) =>
			ipcRenderer.invoke("rest-api:start", config),
		/** Stop the REST API server */
		stop: () => ipcRenderer.invoke("rest-api:stop"),
		/** Get REST API status */
		getStatus: () => ipcRenderer.invoke("rest-api:status"),
		/** Generate a new API key */
		generateKey: (name: string, expiresAt?: string) =>
			ipcRenderer.invoke("rest-api:generate-key", name, expiresAt),
		/** Revoke an API key */
		revokeKey: (key: string) => ipcRenderer.invoke("rest-api:revoke-key", key),
		/** List all API keys */
		listKeys: () => ipcRenderer.invoke("rest-api:list-keys"),
	},

	// --- Config ---
	config: {
		/** Get the skills directory path (for auto-skill detection) */
		getSkillsDir: () => ipcRenderer.invoke("config:get-skills-dir"),
	},

	// --- Skills ---
	skills: {
		/** Auto-detect relevant skills from a prompt, optionally with project context */
		detect: (prompt: string, projectDir?: string) => ipcRenderer.invoke("skills:detect", prompt, projectDir),
		/** Fetch skills from GitHub based on project context */
		fetchForProject: (projectDir: string) => ipcRenderer.invoke("skills:fetch-for-project", projectDir),
		/** Get cached skills (no network fetch) */
		getCached: () => ipcRenderer.invoke("skills:get-cached"),
		/** Clear expired cache entries */
		clearCache: () => ipcRenderer.invoke("skills:clear-cache"),
		/** Detect project context only (no fetch) */
		detectContext: (projectDir: string) => ipcRenderer.invoke("skills:detect-context", projectDir),
	},

	// --- Installation Assistant ---
	install: {
		/** Detect installation issues from error output */
		detectIssues: (errorOutput: string, stdout?: string) =>
			ipcRenderer.invoke("install:detect-issues", errorOutput, stdout),
		/** Get quick fixes for common issues */
		getQuickFixes: () => ipcRenderer.invoke("install:quick-fixes"),
	},

	// --- Update Assistant ---
	update: {
		/** Detect update issues from error output */
		detectIssues: (errorOutput: string, stdout?: string, context?: Record<string, string>) =>
			ipcRenderer.invoke("update:detect-issues", errorOutput, stdout, context),
		/** Get recovery suggestions */
		getRecoverySuggestions: () => ipcRenderer.invoke("update:recovery-suggestions"),
		/** Validate update file */
		validate: (updateFilePath: string) =>
			ipcRenderer.invoke("update:validate", updateFilePath),
	},

	// --- Local Engine Installer ---

	installLocalEngine: (engine: string) => ipcRenderer.invoke("engine:install", engine),
	onEngineInstallOutput: (callback: (text: string) => void) => {
		const listener = (_event: unknown, text: string) => callback(text)
		ipcRenderer.on("engine:install-output", listener)
		return () => {
			ipcRenderer.removeListener("engine:install-output", listener)
		}
	},

	// --- Automations ---

	automation: {
		list: () => ipcRenderer.invoke("automation:list"),
		get: (id: string) => ipcRenderer.invoke("automation:get", id),
		create: (input: unknown) => ipcRenderer.invoke("automation:create", input),
		update: (input: unknown) => ipcRenderer.invoke("automation:update", input),
		delete: (id: string) => ipcRenderer.invoke("automation:delete", id),
		runNow: (id: string) => ipcRenderer.invoke("automation:run-now", id),
		listRuns: (automationId?: string) => ipcRenderer.invoke("automation:list-runs", automationId),
		archiveRun: (runId: string) => ipcRenderer.invoke("automation:archive-run", runId),
		acceptRun: (runId: string) => ipcRenderer.invoke("automation:accept-run", runId),
		markRunRead: (runId: string) => ipcRenderer.invoke("automation:mark-run-read", runId),
		previewSchedule: (rrule: string, timezone: string) =>
			ipcRenderer.invoke("automation:preview-schedule", rrule, timezone),
	},

	onAutomationRunsUpdated: (callback: () => void) => {
		const listener = () => callback()
		ipcRenderer.on("automation:runs-updated", listener)
		return () => {
			ipcRenderer.removeListener("automation:runs-updated", listener)
		}
	},

	// --- Onboarding ---

	onboarding: {
		/** Check whether the DevilRoute local gateway is installed and/or running. */
		checkDevilRoute: () => ipcRenderer.invoke("onboarding:check-devilroute"),
		/** Install (if needed) and start the DevilRoute local gateway. */
		installDevilRoute: () => ipcRenderer.invoke("onboarding:install-devilroute"),
		/** Check if the engine is installed and compatible. */
		checkOpenCode: () => ipcRenderer.invoke("onboarding:check-opencode"),
		/** Install engine via the official install script. */
		installOpenCode: () => ipcRenderer.invoke("onboarding:install-opencode"),
		/** Check if Git is installed. */
		checkGit: () => ipcRenderer.invoke("onboarding:check-git"),
		/** Install Git (Windows via winget, macOS/Linux shows manual instructions). */
		installGit: () => ipcRenderer.invoke("onboarding:install-git"),
		/** Check if Python is installed. */
		checkPython: () => ipcRenderer.invoke("onboarding:check-python"),
		/** Install Agent-Reach CLI */
		installAgentReach: () => ipcRenderer.invoke("onboarding:install-agent-reach"),
		/** Install cloudflared (macOS: brew, Windows: winget, Linux: binary). */
		installCloudflared: () => ipcRenderer.invoke("onboarding:install-cloudflared"),
		/** Subscribe to install output lines (streamed from the install script). */
		onInstallOutput: (callback: (text: string) => void) => {
			const listener = (_event: unknown, text: string) => callback(text)
			ipcRenderer.on("onboarding:install-output", listener)
			return () => {
				ipcRenderer.removeListener("onboarding:install-output", listener)
			}
		},
		/** Quick detect all supported providers (Claude Code, Cursor, Devil AI). */
		detectProviders: () => ipcRenderer.invoke("onboarding:detect-providers"),
		/** Full scan of a specific provider's configuration. */
		scanProvider: (provider: string) => ipcRenderer.invoke("onboarding:scan-provider", provider),
		/** Dry-run migration preview for a provider. */
		previewMigration: (provider: string, scanResult: unknown, categories: string[]) =>
			ipcRenderer.invoke("onboarding:preview-migration", provider, scanResult, categories),
		/** Execute migration (writes files with backup). */
		executeMigration: (provider: string, scanResult: unknown, categories: string[]) =>
			ipcRenderer.invoke("onboarding:execute-migration", provider, scanResult, categories),
		/** Subscribe to migration progress updates (history writing). */
		onMigrationProgress: (callback: (progress: unknown) => void) => {
			const listener = (_event: unknown, progress: unknown) => callback(progress)
			ipcRenderer.on("onboarding:migration-progress", listener)
			return () => {
				ipcRenderer.removeListener("onboarding:migration-progress", listener)
			}
		},
		/** Restore the most recent migration backup. */
		restoreBackup: () => ipcRenderer.invoke("onboarding:restore-backup"),
	},

	// --- DevilRoute session-token refresher ---

	devilroute: {
		/** Store the gateway admin password (enables auto token refresh). */
		setAdminPassword: (password: string) =>
			ipcRenderer.invoke("devilroute:set-admin-password", password),
		/** Whether a gateway admin password is stored. */
		hasAdminPassword: () => ipcRenderer.invoke("devilroute:has-admin-password"),
		/** Manually trigger a session-token refresh now. */
		refreshNow: () => ipcRenderer.invoke("devilroute:refresh-now"),
		/** Current refresh status (password configured + last summary). */
		getStatus: () => ipcRenderer.invoke("devilroute:status"),
		/** Subscribe to token status updates (expired / needs-reauth providers). */
		onTokenStatus: (
			callback: (payload: {
				summary: TokenRefreshSummary
				newProblems: TokenProblem[]
			}) => void,
		) => {
			const listener = (
				_event: unknown,
				payload: {
					summary: TokenRefreshSummary
					newProblems: TokenProblem[]
				},
			) => callback(payload)
			ipcRenderer.on("devilroute:token-status", listener)
			return () => {
				ipcRenderer.removeListener("devilroute:token-status", listener)
			}
		},
	},

	// --- Tunnel (Cloudflare sharing) ---
	tunnel: {
		/** Check if cloudflared is installed */
		check: () => ipcRenderer.invoke("tunnel:check"),
		/** Start a temporary tunnel for session sharing */
		start: (sessionId: string) => ipcRenderer.invoke("tunnel:start", sessionId),
		/** Stop the current tunnel */
		stop: () => ipcRenderer.invoke("tunnel:stop"),
		/** Get the current tunnel URL */
		getUrl: () => ipcRenderer.invoke("tunnel:url"),
		/** Get the current OTP */
		getOtp: () => ipcRenderer.invoke("tunnel:otp"),
		/** Get number of active viewers */
		getViewers: () => ipcRenderer.invoke("tunnel:viewers"),
	},

	// --- Notes (User Memory) ---
	notes: {
		list: () => ipcRenderer.invoke("notes:list"),
		get: (id: string) => ipcRenderer.invoke("notes:get", id),
		create: (input: { title: string; content?: string; tags?: string; sessionId?: string; projectPath?: string }) =>
			ipcRenderer.invoke("notes:create", input),
		update: (input: { id: string; title?: string; content?: string; tags?: string; includeInContext?: boolean }) =>
			ipcRenderer.invoke("notes:update", input),
		delete: (id: string) => ipcRenderer.invoke("notes:delete", id),
		search: (query: string) => ipcRenderer.invoke("notes:search", query),
		getContext: (projectPath?: string, promptText?: string) => ipcRenderer.invoke("notes:context", projectPath, promptText),
	},

	// --- Prompt Library ---
	prompts: {
		list: () => ipcRenderer.invoke("prompts:list"),
		get: (id: string) => ipcRenderer.invoke("prompts:get", id),
		create: (input: { title: string; content?: string; tags?: string; category?: string }) =>
			ipcRenderer.invoke("prompts:create", input),
		update: (input: { id: string; title?: string; content?: string; tags?: string; category?: string; isFavorite?: boolean }) =>
			ipcRenderer.invoke("prompts:update", input),
		delete: (id: string) => ipcRenderer.invoke("prompts:delete", id),
		search: (query: string) => ipcRenderer.invoke("prompts:search", query),
		use: (id: string) => ipcRenderer.invoke("prompts:use", id),
		resolve: (content: string, variables: Record<string, string>) => ipcRenderer.invoke("prompts:resolve", content, variables),
		extractVars: (content: string) => ipcRenderer.invoke("prompts:extract-vars", content),
	},

	// --- Snippets Manager ---
	snippets: {
		list: () => ipcRenderer.invoke("snippets:list"),
		get: (id: string) => ipcRenderer.invoke("snippets:get", id),
		create: (input: { title: string; content?: string; language?: string; tags?: string; projectPath?: string }) =>
			ipcRenderer.invoke("snippets:create", input),
		update: (input: { id: string; title?: string; content?: string; language?: string; tags?: string; isFavorite?: boolean }) =>
			ipcRenderer.invoke("snippets:update", input),
		delete: (id: string) => ipcRenderer.invoke("snippets:delete", id),
		search: (query: string) => ipcRenderer.invoke("snippets:search", query),
		use: (id: string) => ipcRenderer.invoke("snippets:use", id),
	},

	// --- Session Templates ---
	templates: {
		list: () => ipcRenderer.invoke("templates:list"),
		get: (id: string) => ipcRenderer.invoke("templates:get", id),
		create: (input: { name: string; description?: string; config?: string; category?: string }) =>
			ipcRenderer.invoke("templates:create", input),
		update: (input: { id: string; name?: string; description?: string; config?: string; category?: string; isFavorite?: boolean }) =>
			ipcRenderer.invoke("templates:update", input),
		delete: (id: string) => ipcRenderer.invoke("templates:delete", id),
		search: (query: string) => ipcRenderer.invoke("templates:search", query),
		use: (id: string) => ipcRenderer.invoke("templates:use", id),
	},

	// --- Keyboard Shortcuts ---
	shortcuts: {
		list: () => ipcRenderer.invoke("shortcuts:list"),
		get: (id: string) => ipcRenderer.invoke("shortcuts:get", id),
		create: (input: { action: string; label: string; category?: string; shortcut: string }) =>
			ipcRenderer.invoke("shortcuts:create", input),
		update: (input: { id: string; shortcut?: string; isEnabled?: boolean }) =>
			ipcRenderer.invoke("shortcuts:update", input),
		delete: (id: string) => ipcRenderer.invoke("shortcuts:delete", id),
		getByAction: (action: string) => ipcRenderer.invoke("shortcuts:get-by-action", action),
	},

	// --- Agent Memory (persistent cross-session memory) ---
	memory: {
		prefs: {
			list: (projectPath?: string) => ipcRenderer.invoke("memory:prefs:list", projectPath),
			set: (input: { category: string; key: string; value: string; projectPath?: string }) =>
				ipcRenderer.invoke("memory:prefs:set", input),
			delete: (id: string) => ipcRenderer.invoke("memory:prefs:delete", id),
			search: (query: string) => ipcRenderer.invoke("memory:prefs:search", query),
		},
		memories: {
			list: (projectPath?: string, category?: string, limit?: number) =>
				ipcRenderer.invoke("memory:memories:list", projectPath, category, limit),
			create: (input: {
				projectPath?: string
				sessionId?: string
				category: string
				summary: string
				content: string
				weight?: number
			}) => ipcRenderer.invoke("memory:memories:create", input),
			update: (input: { id: string; summary?: string; content?: string; weight?: number; category?: string }) =>
				ipcRenderer.invoke("memory:memories:update", input),
			delete: (id: string) => ipcRenderer.invoke("memory:memories:delete", id),
			search: (query: string, projectPath?: string, limit?: number) =>
				ipcRenderer.invoke("memory:memories:search", query, projectPath, limit),
		},
		getContext: (projectPath: string) => ipcRenderer.invoke("memory:context", projectPath),

		// --- NEW MEMORY SYSTEM ---

		/** Log a conversation message */
		logConversation: (input: {
			sessionId?: string
			projectPath?: string
			role: string
			content: string
		}) => ipcRenderer.invoke("memory:conversations:log", input),

		/** Get conversation history */
		getHistory: (options?: { sessionId?: string; projectPath?: string; limit?: number; offset?: number }) =>
			ipcRenderer.invoke("memory:conversations:history", options),

		/** Search conversations */
		searchConversations: (query: string, projectPath?: string, limit?: number) =>
			ipcRenderer.invoke("memory:conversations:search", query, projectPath, limit),

		/** Add project knowledge */
		addKnowledge: (input: {
			projectPath: string
			type: string
			title: string
			description: string
			files?: string
			sessionId?: string
			technologies?: string
			weight?: number
		}) => ipcRenderer.invoke("memory:knowledge:add", input),

		/** List project knowledge */
		getKnowledge: (projectPath: string, type?: string, limit?: number) =>
			ipcRenderer.invoke("memory:knowledge:list", projectPath, type, limit),

		/** Search project knowledge */
		searchKnowledge: (query: string, projectPath?: string, limit?: number) =>
			ipcRenderer.invoke("memory:knowledge:search", query, projectPath, limit),

		/** Add a learned skill */
		addSkill: (input: {
			category: string
			name: string
			description: string
			pattern: string
			example?: string
			sessionId?: string
		}) => ipcRenderer.invoke("memory:skills:add", input),

		/** List learned skills */
		getSkills: (category?: string, limit?: number) =>
			ipcRenderer.invoke("memory:skills:list", category, limit),

		/** Search learned skills */
		searchSkills: (query: string, limit?: number) =>
			ipcRenderer.invoke("memory:skills:search", query, limit),

		/** Mark a skill as used */
		useSkill: (id: string) => ipcRenderer.invoke("memory:skills:use", id),

		/** Get memory system stats */
		getStats: () => ipcRenderer.invoke("memory:stats"),

		/** Consolidate a session */
		consolidate: (options: { sessionId: string; projectPath?: string }) =>
			ipcRenderer.invoke("memory:consolidate:session", options),

		/** Auto-consolidate old sessions */
		autoConsolidate: (options?: { projectPath?: string; maxAge?: number; maxSessions?: number }) =>
			ipcRenderer.invoke("memory:consolidate:auto", options),

		/** Assemble context for a new prompt */
		assembleContext: (options: { query: string; projectPath?: string; sessionId?: string; limit?: number }) =>
			ipcRenderer.invoke("memory:assemble", options),
	},

	// --- Telegram Bot ---
	telegram: {
		/** Start the Telegram bot (webhook + tunnel + set webhook) */
		start: () => ipcRenderer.invoke("telegram:start"),
		/** Stop the Telegram bot */
		stop: () => ipcRenderer.invoke("telegram:stop"),
		/** Get current bot status */
		getStatus: () => ipcRenderer.invoke("telegram:status"),
		/** Forward a message from a session to connected Telegram users */
		sendForwarded: (sessionId: string, role: "user" | "assistant", text: string) =>
			ipcRenderer.invoke("telegram:send-forwarded", sessionId, role, text),
	},

	// --- Plugin Installer ---
	pluginInstaller: {
		/** Install a plugin from a GitHub repo URL */
		install: (url: string, type?: "mcp" | "skill" | "plugin") =>
			ipcRenderer.invoke("plugin:install", url, type),
		/** List all installed plugins */
		list: () => ipcRenderer.invoke("plugin:list"),
		/** Uninstall a plugin by name and type */
		uninstall: (name: string, type: "mcp" | "skill" | "plugin") =>
			ipcRenderer.invoke("plugin:uninstall", name, type),
	},

	// --- Image Generation (Pollinations.ai) ---

	/** Generate an image using Pollinations.ai free API. */
	generateImage: (input: {
		prompt: string
		width?: number
		height?: number
		model?: "flux" | "turbo" | "stable-diffusion"
		seed?: number
		enhance?: boolean
	}) => ipcRenderer.invoke("image:generate", input),

	// --- Test Runner ---

	testRunner: {
		/** Run a test command and return output */
		run: (command: string, cwd: string) =>
			ipcRenderer.invoke("test-runner:run", { command, cwd }),
	},

	// --- Webhook Server (GitHub/GitLab PR reviews) ---

	webhook: {
		/** Check if webhook server is running */
		getStatus: () => ipcRenderer.invoke("webhook:status"),
		/** Get review status for a PR */
		getReviewStatus: (provider: string, repository: string, prNumber: number) =>
			ipcRenderer.invoke("webhook:review-status", provider, repository, prNumber),
	},

	// --- Git Provider Integration (GitHub/GitLab API) ---

	gitProvider: {
		/** Get provider configuration status */
		getConfig: (provider: "github" | "gitlab") =>
			ipcRenderer.invoke("git-provider:get-config", provider),
		/** Set API token for a provider */
		setToken: (provider: "github" | "gitlab", token: string) =>
			ipcRenderer.invoke("git-provider:set-token", provider, token),
	},

	// --- AI Code Review Bot ---

	reviewBot: {
		/** Run code review on a PR */
		reviewPR: (args: {
			provider: "github" | "gitlab"
			repository: string
			prNumber: number
		}) => ipcRenderer.invoke("review-bot:reviewPR", args),
		/** Configure review bot settings */
		configure: (args: Partial<{
			githubToken: string
			gitlabToken: string
			autoReview: boolean
			inlineComments: boolean
			setCommitStatus: boolean
			categories: string[]
		}>) => ipcRenderer.invoke("review-bot:configure", args),
		/** Get PR info from provider API */
		getPRInfo: (args: {
			provider: "github" | "gitlab"
			repository: string
			prNumber: number
			token: string
		}) => ipcRenderer.invoke("review-bot:getPRInfo", args),
	},

	// --- One-Click Deploy ---

	deploy: {
		/** Auto-detect framework for a project */
		detectFramework: (projectDir: string) =>
			ipcRenderer.invoke("deploy:detectFramework", { projectDir }),
		/** Deploy to a provider */
		deploy: (args: {
			provider: "vercel" | "netlify" | "railway"
			projectDir: string
			projectName?: string
			buildCommand?: string
			outputDir?: string
			installCommand?: string
			nodeVersion?: string
			envVars?: Record<string, string>
			startCommand?: string
		}) => ipcRenderer.invoke("deploy:deploy", args),
		/** Get deploy status */
		getStatus: (deployId: string) =>
			ipcRenderer.invoke("deploy:getStatus", { deployId }),
		/** List active deploys */
		listActive: () => ipcRenderer.invoke("deploy:listActive"),
	},

	// --- Smart Context Engine ---

	contextEngine: {
		/** Build dependency graph for a project */
		buildGraph: (projectDir: string) =>
			ipcRenderer.invoke("context:buildGraph", { projectDir }),
		/** Get codebase metrics */
		getMetrics: (projectDir: string) =>
			ipcRenderer.invoke("context:getMetrics", { projectDir }),
		/** Analyze impact of changing a file */
		analyzeImpact: (projectDir: string, filePath: string) =>
			ipcRenderer.invoke("context:analyzeImpact", { projectDir, filePath }),
		/** Detect breaking changes */
		detectBreakingChanges: (projectDir: string) =>
			ipcRenderer.invoke("context:detectBreakingChanges", { projectDir }),
		/** Get human-readable context summary */
		getSummary: (projectDir: string, filePath?: string) =>
			ipcRenderer.invoke("context:getSummary", { projectDir, filePath }),
		/** Get imports/exports for a file */
		getFileImports: (projectDir: string, filePath: string) =>
			ipcRenderer.invoke("context:getFileImports", { projectDir, filePath }),
		/** Get files that depend on a given file */
		getDependents: (projectDir: string, filePath: string) =>
			ipcRenderer.invoke("context:getDependents", { projectDir, filePath }),
		/** Invalidate cached graph */
		invalidateCache: (projectDir: string) =>
			ipcRenderer.invoke("context:invalidateCache", { projectDir }),
	},

	// --- Multi-Agent Orchestrator ---

	multiAgent: {
		/** Create a swarm with custom agents */
		createSwarm: (args: {
			agents: Array<{ role: string; name: string; capabilities?: string[] }>
			createdBy: string
		}) => ipcRenderer.invoke("multi-agent:createSwarm", args),
		/** Create a standard code review swarm (architect, coder, reviewer, tester) */
		createCodeReviewSwarm: (createdBy: string) =>
			ipcRenderer.invoke("multi-agent:createCodeReviewSwarm", { createdBy }),
		/** Delegate a task from one agent to another */
		delegateTask: (args: {
			swarmId: string
			fromAgentId: string
			toAgentId: string
			title: string
			description: string
			priority?: number
		}) => ipcRenderer.invoke("multi-agent:delegateTask", args),
		/** Complete a task and report results */
		completeTask: (args: { swarmId: string; taskId: string; result: unknown }) =>
			ipcRenderer.invoke("multi-agent:completeTask", args),
		/** Share context between agents */
		shareContext: (args: {
			swarmId: string
			fromAgentId: string
			toAgentId: string
			context: Record<string, unknown>
		}) => ipcRenderer.invoke("multi-agent:shareContext", args),
		/** Get pending tasks for an agent */
		getPendingTasks: (args: { swarmId: string; agentId: string }) =>
			ipcRenderer.invoke("multi-agent:getPendingTasks", args),
		/** Get swarm status summary */
		getSummary: (swarmId: string) =>
			ipcRenderer.invoke("multi-agent:getSummary", { swarmId }),
		/** Destroy a swarm */
		destroy: (swarmId: string) =>
			ipcRenderer.invoke("multi-agent:destroy", { swarmId }),
		/** List all active swarms */
		listSwarms: () => ipcRenderer.invoke("multi-agent:listSwarms"),
	},

	// --- Terminal (node-pty) ---

	terminal: {
		/** Create a new terminal instance */
		create: (id: string, cols?: number, rows?: number) =>
			ipcRenderer.invoke("terminal:create", id, cols, rows),
		/** Write data to a terminal */
		write: (id: string, data: string) =>
			ipcRenderer.invoke("terminal:write", id, data),
		/** Resize a terminal */
		resize: (id: string, cols: number, rows: number) =>
			ipcRenderer.invoke("terminal:resize", id, cols, rows),
		/** Kill a terminal instance */
		kill: (id: string) => ipcRenderer.invoke("terminal:kill", id),
		/** List all terminal IDs */
		list: () => ipcRenderer.invoke("terminal:list"),
		/** Subscribe to terminal data events */
		onData: (callback: (id: string, data: string) => void) => {
			const listener = (_event: unknown, id: string, data: string) => callback(id, data)
			ipcRenderer.on("terminal:data", listener)
			return () => {
				ipcRenderer.removeListener("terminal:data", listener)
			}
		},
		/** Subscribe to terminal exit events */
		onExit: (callback: (id: string, exitCode: number) => void) => {
			const listener = (_event: unknown, id: string, exitCode: number) => callback(id, exitCode)
			ipcRenderer.on("terminal:exit", listener)
			return () => {
				ipcRenderer.removeListener("terminal:exit", listener)
			}
		},
	},

	// --- Screen Sharing (AnyDesk-like) ---

	screenShare: {
		/** Start screen sharing (host) — returns 6-digit code */
		start: () => ipcRenderer.invoke("screen-share:start"),
		/** Stop screen sharing */
		stop: (code?: string) => ipcRenderer.invoke("screen-share:stop", code),
		/** Get available screen sources */
		getSources: () => ipcRenderer.invoke("screen-share:getSources"),
		/** Check if screen sharing is active */
		isActive: () => ipcRenderer.invoke("screen-share:isActive"),
		/** Get active session count */
		getActiveCount: () => ipcRenderer.invoke("screen-share:getActiveCount"),
		/** Send signaling message */
		sendSignal: (code: string, msg: Record<string, unknown>) =>
			ipcRenderer.invoke("screen-share:sendSignal", code, msg),
		/** Join session as remote viewer */
		join: (code: string) => ipcRenderer.invoke("screen-share:join", code),
		/** Disconnect remote viewer */
		disconnect: () => ipcRenderer.invoke("screen-share:disconnect"),
		/** Get sharing status */
		getStatus: () => ipcRenderer.invoke("screen-share:getStatus"),

		// --- Event subscriptions ---
		/** Subscribe to remote connected event */
		onRemoteConnected: (callback: (code: string) => void) => {
			const listener = (_event: unknown, code: string) => callback(code)
			ipcRenderer.on("screen-share:remote-connected", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:remote-connected", listener)
			}
		},
		/** Subscribe to host disconnected event */
		onHostDisconnected: (callback: (code: string) => void) => {
			const listener = (_event: unknown, code: string) => callback(code)
			ipcRenderer.on("screen-share:host-disconnected", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:host-disconnected", listener)
			}
		},
		/** Subscribe to session stopped event */
		onStopped: (callback: (code: string) => void) => {
			const listener = (_event: unknown, code: string) => callback(code)
			ipcRenderer.on("screen-share:stopped", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:stopped", listener)
			}
		},
		/** Subscribe to WebRTC offer */
		onOffer: (callback: (code: string, offer: RTCSessionDescriptionInit) => void) => {
			const listener = (_event: unknown, code: string, offer: RTCSessionDescriptionInit) => callback(code, offer)
			ipcRenderer.on("screen-share:offer", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:offer", listener)
			}
		},
		/** Subscribe to WebRTC answer */
		onAnswer: (callback: (code: string, answer: RTCSessionDescriptionInit) => void) => {
			const listener = (_event: unknown, code: string, answer: RTCSessionDescriptionInit) => callback(code, answer)
			ipcRenderer.on("screen-share:answer", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:answer", listener)
			}
		},
		/** Subscribe to ICE candidate */
		onIceCandidate: (callback: (code: string, candidate: RTCIceCandidateInit) => void) => {
			const listener = (_event: unknown, code: string, candidate: RTCIceCandidateInit) => callback(code, candidate)
			ipcRenderer.on("screen-share:ice-candidate", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:ice-candidate", listener)
			}
		},
		/** Subscribe to input events (from remote) */
		onInput: (callback: (code: string, event: unknown) => void) => {
			const listener = (_event: unknown, code: string, event: unknown) => callback(code, event)
			ipcRenderer.on("screen-share:input", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:input", listener)
			}
		},
		/** Subscribe to status changes */
		onStatusChanged: (callback: (status: unknown) => void) => {
			const listener = (_event: unknown, status: unknown) => callback(status)
			ipcRenderer.on("screen-share:status-changed", listener)
			return () => {
				ipcRenderer.removeListener("screen-share:status-changed", listener)
			}
		},
	},

	// --- Connectors (GitHub, Slack, etc.) ---
	connectors: {
		/** Get statuses for all connectors */
		getStatuses: () => ipcRenderer.invoke("connectors:get"),
		/** Set credentials for a connector */
		setCredential: (id: string, credentials: Record<string, string>) => 
			ipcRenderer.invoke("connectors:set-credential", id, credentials),
		/** Delete credentials for a connector */
		deleteCredential: (id: string) => 
			ipcRenderer.invoke("connectors:delete-credential", id),
		/** Test a connection */
		testConnection: (id: string, credentials: Record<string, string>) => 
			ipcRenderer.invoke("connectors:test-connection", id, credentials),
	},
})
