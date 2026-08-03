/**
 * Type definitions for the Electron preload bridge.
 *
 * These types are shared between the preload script and the renderer.
 * The renderer accesses these via `window.devilAi`.
 */

export interface OpenCodeServerInfo {
	url: string;
	pid: number | null;
	managed: boolean;
}

export interface ModelRef {
	providerID: string;
	modelID: string;
}

export interface ModelState {
	recent: ModelRef[];
	favorite: ModelRef[];
	variant: Record<string, string | undefined>;
}

export interface UpdateState {
	status:
		| "idle"
		| "checking"
		| "available"
		| "downloading"
		| "ready"
		| "error"
		| "latest";
	version?: string;
	releaseNotes?: string;
	progress?: {
		percent: number;
		bytesPerSecond: number;
		transferred: number;
		total: number;
	};
	error?: string;
	/** Whether the app can auto-install updates (false on unsigned macOS builds). */
	canAutoInstall: boolean;
}

// ============================================================
// Engine Installer
// ============================================================
export interface EngineInstallerAPI {
	installLocalEngine: (engine: string) => Promise<void>;
	onEngineInstallOutput: (callback: (text: string) => void) => () => void;
}

// ============================================================
// Git types
// ============================================================

export interface GitBranchInfo {
	current: string;
	detached: boolean;
	local: string[];
	remote: string[];
}

export interface GitStatusInfo {
	isClean: boolean;
	staged: number;
	modified: number;
	untracked: number;
	conflicted: number;
	summary: string;
}

export interface GitCheckoutResult {
	success: boolean;
	error?: string;
}

export interface GitStashResult {
	success: boolean;
	stashed: boolean;
	error?: string;
}

export interface GitDiffStat {
	filesChanged: number;
	insertions: number;
	deletions: number;
	files: { path: string; insertions: number; deletions: number }[];
}

export interface GitCommitResult {
	success: boolean;
	commitHash?: string;
	error?: string;
}

export interface GitPushResult {
	success: boolean;
	error?: string;
}

export interface GitApplyResult {
	success: boolean;
	filesApplied: string[];
	error?: string;
}

export interface GitLogEntry {
	sha: string;
	message: string;
	author: string;
	date: string;
}

export interface GitBlameEntry {
	line: number;
	author: string;
	commit: string;
	content: string;
}

// ============================================================
// Open-in-targets types
// ============================================================

export interface OpenInTarget {
	id: string;
	label: string;
	available: boolean;
	/** Base64-encoded PNG icon data URL, resolved at runtime from the installed app. */
	iconDataUrl?: string;
}

export interface OpenInTargetsResult {
	targets: OpenInTarget[];
	availableTargets: string[];
	preferredTarget: string | null;
}

// ============================================================
// Server config types (shared between main process and renderer)
// ============================================================

/** Built-in local server, auto-managed by Devil AI via OpenCodeManager. */
export interface LocalServerConfig {
	id: "local";
	name: string;
	type: "local";
	/** Hostname the local server binds to (default "127.0.0.1"). Use "0.0.0.0" to expose on the network. */
	hostname?: string;
	/** Port the local server listens on (default 4101). */
	port?: number;
	/** Whether a password is configured for the local server (stored in safeStorage). */
	hasPassword?: boolean;
	/** Enable mDNS service discovery so this server is advertised on the local network. */
	mdns?: boolean;
	/** Custom mDNS domain name (default "opencode.local"). Only used when mdns is enabled. */
	mdnsDomain?: string;
}

/** Remote server reachable over HTTP(S). */
export interface RemoteServerConfig {
	id: string;
	name: string;
	type: "remote";
	/** Full base URL, e.g. "https://opencode.example.com:4096" */
	url: string;
	/** Basic Auth username (defaults to "opencode" if omitted). */
	username?: string;
	/** Whether a password is stored in safeStorage (never stored in settings.json). */
	hasPassword?: boolean;
}

/** SSH tunnel server (future -- type is defined now to avoid config migration later). */
export interface SshServerConfig {
	id: string;
	name: string;
	type: "ssh";
	sshHost: string;
	sshPort?: number;
	sshUser: string;
	sshAuthMethod: "key" | "password" | "agent";
	sshKeyPath?: string;
	/** Where the engine listens on the remote machine (default 127.0.0.1). */
	remoteHost?: string;
	remotePort: number;
	/** Basic Auth username for the engine server (defaults to "engine"). */
	username?: string;
	hasPassword?: boolean;
}

export type ServerConfig =
	| LocalServerConfig
	| RemoteServerConfig
	| SshServerConfig;

// ============================================================
// mDNS discovery types
// ============================================================

/** A server discovered via mDNS on the local network. */
export interface DiscoveredMdnsServer {
	/** Unique key derived from host:port. */
	id: string;
	/** Service name from mDNS (e.g. "opencode-4096"). */
	name: string;
	/** Resolved hostname or IP address. */
	host: string;
	/** Port the engine server is listening on. */
	port: number;
	/** IP addresses reported by the service. */
	addresses: string[];
}

/** The default built-in local server entry (defined in server-config.ts). */
export declare const DEFAULT_LOCAL_SERVER: LocalServerConfig;

export interface ServerSettings {
	/** Ordered list of configured servers. The local server is always first. */
	servers: ServerConfig[];
	/** ID of the currently active server. */
	activeServerId: string;
}

// ============================================================
// Settings types (shared between main process and renderer)
// ============================================================

export type CompletionNotificationMode = "off" | "unfocused" | "always";

export interface NotificationSettings {
	completionMode: CompletionNotificationMode;
	permissions: boolean;
	questions: boolean;
	errors: boolean;
	dockBadge: boolean;
	/** Play a sound when a task completes */
	completionSound: boolean;
}

export interface AppSettings {
	notifications: NotificationSettings;
	/** Whether the user prefers opaque (solid) windows. Read at window creation time. */
	opaqueWindows: boolean;
	/** Server connection configuration. */
	servers: ServerSettings;
	/** Master password for accessing shared sessions. */
	masterPassword?: string;
	masterPasswordSalt?: string;
	/** Telegram bot token for remote control. */
	telegramBotToken?: string;
	/** Whether the telegram bot should auto start */
	telegramBotEnabled?: boolean;
}

export type PublicAppSettings = Omit<
	AppSettings,
	"masterPassword" | "masterPasswordSalt"
> & { hasMasterPassword?: boolean };

// ============================================================
// CLI install types
// ============================================================

export interface CliInstallResult {
	success: boolean;
	error?: string;
}

// ============================================================
// Onboarding types
// ============================================================

export interface OpenCodeCheckResult {
	installed: boolean;
	version: string | null;
	path: string | null;
	compatible: boolean;
	compatibility: "ok" | "too-old" | "too-new" | "blocked" | "unknown";
	message: string | null;
}

export interface GitCheckResult {
	installed: boolean;
	version: string | null;
	path: string | null;
	message: string | null;
}

export interface PythonCheckResult {
	installed: boolean;
	version: string | null;
	path: string | null;
	message: string | null;
}

/** State of the local DevilRoute gateway (http://127.0.0.1:20128). */
export interface DevilRouteStatus {
	/** Whether the `devilroute` (or `omniroute` fallback) binary is on PATH. */
	installed: boolean;
	/** Whether `/v1/models` is responding on port 20128. */
	running: boolean;
	/** Absolute path to the resolved binary, if found. */
	binary: string | null;
}

/** A session-token provider that needs attention (expired or dead refresh token). */
export interface TokenProblem {
	id: string;
	state: "expired" | "needsReauth";
	provider: string;
	displayName: string;
}

/** Result of one DevilRoute session-token refresh scan. */
export interface TokenRefreshSummary {
	/** Non-API-key connections examined. */
	scanned: number;
	/** OAuth connections actually refreshed. */
	refreshed: number;
	/** Connections where refresh/test threw or returned a hard error. */
	failed: number;
	/** OAuth connections whose refresh token is dead — user must re-auth. */
	needsReauth: TokenProblem[];
	/** Cookie/session connections currently expired — user must re-paste. */
	expired: TokenProblem[];
	checkedAt: string;
}

/** Supported migration source providers. */
export type MigrationProvider = "claude-code" | "cursor" | "opencode";

/** Detection result for a single provider. */
export interface ProviderDetection {
	provider: MigrationProvider;
	found: boolean;
	label: string;
	summary: string;
	mcpServerCount: number;
	agentCount: number;
	commandCount: number;
	ruleCount: number;
	skillCount: number;
	projectCount: number;
	hasGlobalSettings: boolean;
	hasPermissions: boolean;
	hasHooks: boolean;
	totalSessions: number;
	totalMessages: number;
}

export interface MigrationCategoryPreview {
	category: string;
	itemCount: number;
	files: MigrationFilePreview[];
}

export interface MigrationFilePreview {
	path: string;
	status: "new" | "modified" | "skipped";
	lineCount: number;
	content?: string;
}

export interface MigrationPreview {
	categories: MigrationCategoryPreview[];
	warnings: string[];
	manualActions: string[];
	errors: string[];
	fileCount: number;
	sessionCount: number;
	sessionProjectCount: number;
}

export interface MigrationResult {
	success: boolean;
	filesWritten: string[];
	filesSkipped: string[];
	backupDir: string | null;
	warnings: string[];
	manualActions: string[];
	errors: string[];
	/** Number of history sessions that were skipped as duplicates */
	historyDuplicatesSkipped: number;
}

export interface MigrationProgress {
	phase: string;
	current: number;
	total: number;
	duplicatesSkipped: number;
}

export interface AppInfo {
	version: string;
	isDev: boolean;
}

export type WindowChromeTier = "liquid-glass" | "vibrancy" | "opaque";

// ============================================================
// Automation types
// ============================================================

export interface AutomationSchedule {
	rrule: string;
	timezone: string;
}

export type PermissionPreset = "default" | "allow-all" | "read-only";

export interface ExecutionConfig {
	/** Model to use in "providerID/modelID" format (e.g. "anthropic/claude-opus-4-5"). Defaults to server default. */
	model?: string;
	/** Agent name to use (e.g. "build", "research"). Defaults to server default agent. */
	agent?: string;
	/** Model variant name (e.g. "extended" for extended thinking). Defaults to model default. */
	variant?: string;
	effort: "low" | "medium" | "high";
	timeout: number;
	retries: number;
	retryDelay: number;
	parallelWorkspaces: boolean;
	approvalPolicy: "never" | "auto-edit";
	/** Whether to run in an isolated git worktree (default: true) */
	useWorktree: boolean;
	/** Permission preset controlling agent tool access */
	permissionPreset: PermissionPreset;
}

export type AutomationStatus = "active" | "paused" | "archived";

export interface Automation {
	id: string;
	name: string;
	prompt: string;
	status: AutomationStatus;
	schedule: AutomationSchedule;
	workspaces: string[];
	execution: ExecutionConfig;
	nextRunAt: number | null;
	lastRunAt: number | null;
	runCount: number;
	consecutiveFailures: number;
	createdAt: number;
	updatedAt: number;
}

export type AutomationRunStatus =
	| "queued"
	| "running"
	| "pending_review"
	| "accepted"
	| "archived"
	| "failed";

export interface AutomationRun {
	id: string;
	automationId: string;
	workspace: string;
	status: AutomationRunStatus;
	attempt: number;
	sessionId: string | null;
	worktreePath: string | null;
	startedAt: number | null;
	completedAt: number | null;
	timeoutAt: number | null;
	resultTitle: string | null;
	resultSummary: string | null;
	resultHasActionable: boolean | null;
	resultBranch: string | null;
	resultPrUrl: string | null;
	errorMessage: string | null;
	archivedReason: string | null;
	archivedAssistantMessage: string | null;
	readAt: number | null;
	createdAt: number;
	updatedAt: number;
}

export interface CreateAutomationInput {
	name: string;
	prompt: string;
	schedule: { rrule: string; timezone?: string };
	workspaces: string[];
	execution?: Partial<ExecutionConfig>;
}

export interface UpdateAutomationInput {
	id: string;
	name?: string;
	prompt?: string;
	status?: AutomationStatus;
	schedule?: { rrule: string; timezone?: string };
	workspaces?: string[];
	execution?: Partial<ExecutionConfig>;
}

export interface DevilAIAPI {
	installLocalEngine: (engine: string) => Promise<void>;
	onEngineInstallOutput: (callback: (text: string) => void) => () => void;
	/** The host platform: "darwin", "win32", or "linux". */
	platform: NodeJS.Platform;
	getAppInfo: () => Promise<AppInfo>;
	checkDir: (path: string) => Promise<boolean>;

	// Speech-to-text / Text-to-speech
	/** Transcribe audio to text via STT provider. */
	sttTranscribe: (data: { base64Audio: string; language?: string; customKey?: string }) => Promise<{ text: string } | { error: string }>;
	/** Synthesize text to audio via TTS provider. */
	ttsSynthesize: (data: { text: string; customKey?: string }) => Promise<{ audioContent: string } | { error: string }>;

	/** Subscribe to chrome tier notification (fired once on load). */
	onChromeTier: (callback: (tier: WindowChromeTier) => void) => () => void;
	/** Get the current chrome tier (pull-based, avoids race with push event). */
	getChromeTier: () => Promise<WindowChromeTier>;

	ensureOpenCode: () => Promise<OpenCodeServerInfo>;
	getServerUrl: () => Promise<string | null>;
	stopOpenCode: () => Promise<boolean>;
	restartOpenCode: () => Promise<OpenCodeServerInfo>;
	forceKillOpenCode: () => Promise<boolean>;
	onEngineRestarted: (callback: (url: string) => void) => () => void;
	getModelState: () => Promise<ModelState>;
	updateModelRecent: (model: ModelRef) => Promise<ModelState>;

	// Credential storage (safeStorage-backed, passwords never leave main process in plain text)
	credential: {
		/** Store an encrypted password for a server. */
		store: (serverId: string, password: string) => Promise<void>;
		/** Retrieve a decrypted password for a server (only returns to renderer for auth headers). */
		get: (serverId: string) => Promise<string | null>;
		/** Delete a stored password. */
		delete: (serverId: string) => Promise<void>;
	};

	// Config
	config: {
		/** Get the skills directory path (for auto-skill detection) */
		getSkillsDir: () => Promise<string | null>;
	};

	// Analytics
	analytics: {
		getDashboardStats: () => Promise<{
			totalSessions: number;
			totalTokensUsed: number;
			estimatedCost: number;
			avgSessionDuration: number;
			mostUsedSkills: { name: string; count: number }[];
			sessionsByDay: { date: string; count: number }[];
			topModels: { name: string; usage: number }[];
		}>;
		trackSessionStart: (id: string, projectId?: string, modelName?: string) => Promise<void>;
		trackSessionEnd: (id: string) => Promise<void>;
	};

	// Window management
	window: {
		open: (route: string) => Promise<void>;
	};

	// Code Sandbox
	sandbox: {
		execute: (code: string, language: string) => Promise<{
			stdout: string;
			stderr: string;
			exitCode: number;
			duration: number;
		}>;
	};

	// Integrations
	integrations: {
		getConfig: () => Promise<{
			jiraUrl: string;
			jiraEmail: string;
			jiraToken: string;
			linearToken: string;
		}>;
		setConfig: (config: {
			jiraUrl?: string;
			jiraEmail?: string;
			jiraToken?: string;
			linearToken?: string;
		}) => Promise<void>;
		fetchTasks: () => Promise<Array<{
			id: string;
			provider: "jira" | "linear";
			ticketId: string;
			title: string;
			status: string;
		}>>;
	};

	// Skills
	skills: {
		/** Auto-detect relevant skills from a prompt, optionally with project context */
		detect: (prompt: string, projectDir?: string) => Promise<{ skills: Array<{ name: string; confidence: number; reason: string; description?: string; fullContent?: string }>; keywords: string[] }>;
		/** Fetch skills from GitHub based on project context */
		fetchForProject: (projectDir: string) => Promise<{
			context: { type: string; dependencies: string[]; extensions: string[]; framework?: string };
			skills: Array<{ name: string; description: string; content: string; source: string; fetchedAt: number; projectType: string }>;
			sources: Array<{ repo: string; description?: string; priority: number }>;
		}>;
		/** Get cached skills (no network fetch) */
		getCached: () => Promise<Array<{ name: string; description: string; content: string; source: string; fetchedAt: number; projectType: string }>>;
		/** Clear expired cache entries */
		clearCache: () => Promise<{ success: boolean }>;
		/** Detect project context only (no fetch) */
		detectContext: (projectDir: string) => Promise<{ type: string; dependencies: string[]; extensions: string[]; framework?: string }>;
	};

	/** Test connectivity to a remote engine server. Returns null on success or an error message. */
	testServerConnection: (
		url: string,
		username?: string,
		password?: string,
	) => Promise<string | null>;

	// Connectors
	onConnectorAuthenticated: (callback: (provider: string) => void) => () => void;

	// mDNS discovery
	mdns: {
		/** Get the current list of discovered servers. */
		getDiscovered: () => Promise<DiscoveredMdnsServer[]>;
		/** Subscribe to discovered server list changes. Returns an unsubscribe function. */
		onChanged: (
			callback: (servers: DiscoveredMdnsServer[]) => void,
		) => () => void;
	};

	// Auto-updater
	getUpdateState: () => Promise<UpdateState>;
	checkForUpdates: () => Promise<void>;
	downloadUpdate: () => Promise<void>;
	installUpdate: () => Promise<void>;
	/** Opens the GitHub release page for the current update version (fallback for unsigned macOS). */
	openReleasePage: () => Promise<void>;
	onUpdateStateChanged: (callback: (state: UpdateState) => void) => () => void;

	// Subscription validation
	/** Validates subscription against the server. */
	validateSubscription: (token: string) => Promise<{
		valid: boolean;
		planId?: string;
		expiresAt?: string;
		daysRemaining?: number;
		user?: { id: string; email: string; name: string | null };
	}>;
	/** Gets current subscription state from the main process. */
	getSubscriptionState: () => Promise<{
		valid: boolean;
		planId: string | null;
		expiresAt: string | null;
		daysRemaining: number;
		lastValidated: number;
		offlineValidUntil: number | null;
		user: { id: string; email: string; name: string | null } | null;
	}>;

	// Installation Assistant
	install: {
		/** Detect installation issues from error output */
		detectIssues: (errorOutput: string, stdout?: string) => Promise<Array<{
			id: string;
			severity: "error" | "warning" | "info";
			message: string;
			solution?: string;
			autoFixable: boolean;
		}>>;
		/** Get quick fixes for common installation issues */
		getQuickFixes: () => Promise<Array<{ issue: string; fix: string }>>;
	};

	// Update Assistant
	update: {
		/** Detect update issues from error output */
		detectIssues: (errorOutput: string, stdout?: string, context?: Record<string, string>) => Promise<Array<{
			id: string;
			severity: "error" | "warning" | "info";
			message: string;
			solution?: string;
			autoFixable: boolean;
			canRetry: boolean;
		}>>;
		/** Get recovery suggestions */
		getRecoverySuggestions: () => Promise<Array<{ issue: string; recovery: string }>>;
		/** Validate update file */
		validate: (updateFilePath: string) => Promise<{
			valid: boolean;
			issues: Array<{
				id: string;
				severity: "error" | "warning" | "info";
				message: string;
				solution?: string;
				autoFixable: boolean;
				canRetry: boolean;
			}>;
		}>;
	};

	// Git operations
	git: {
		listBranches: (directory: string) => Promise<GitBranchInfo>;
		getStatus: (directory: string) => Promise<GitStatusInfo>;
		checkout: (directory: string, branch: string) => Promise<GitCheckoutResult>;
		stashAndCheckout: (
			directory: string,
			branch: string,
		) => Promise<GitStashResult>;
		stashPop: (directory: string) => Promise<GitStashResult>;
		getRoot: (directory: string) => Promise<string | null>;
		diffStat: (directory: string) => Promise<GitDiffStat>;
		commitAll: (directory: string, message: string) => Promise<GitCommitResult>;
		push: (directory: string, remote?: string) => Promise<GitPushResult>;
		createBranch: (
			directory: string,
			branchName: string,
		) => Promise<GitCheckoutResult>;
		applyToLocal: (
			worktreeDir: string,
			localDir: string,
		) => Promise<GitApplyResult>;
		applyDiffText: (
			localDir: string,
			diffText: string,
		) => Promise<GitApplyResult>;
		getRemoteUrl: (
			directory: string,
			remote?: string,
		) => Promise<string | null>;
		getLog: (
			directory: string,
			filePath: string,
			count?: number,
		) => Promise<GitLogEntry[]>;
		getBlame: (
			directory: string,
			filePath: string,
		) => Promise<GitBlameEntry[]>;
		wasRecentlyModified: (
			directory: string,
			filePath: string,
		) => Promise<boolean>;
	};

	// Window preferences (opaque windows / transparency)
	/** Get the persisted opaque windows preference from the main process. */
	getOpaqueWindows: () => Promise<boolean>;
	/** Set the opaque windows preference and persist it in the main process. */
	setOpaqueWindows: (value: boolean) => Promise<{ success: boolean }>;
	/** Relaunch the app (used after toggling transparency). */
	relaunch: () => Promise<void>;

	// Power management
	/** Prevent or allow system sleep while app is running. */
	preventSleep: (enable: boolean) => Promise<{ success: boolean }>;

	// CLI install
	cli: {
		isInstalled: () => Promise<boolean>;
		install: () => Promise<CliInstallResult>;
		uninstall: () => Promise<CliInstallResult>;
	};

	security: {
		executeTool: (toolName: string, args: string[], options: any) => Promise<any>;
		listTools: (category?: string) => Promise<any[]>;
	};

	// Devil AI (JARVIS-like Agent)
	devilAi: {
		/** Process input with JARVIS personality */
		process: (input: string) => Promise<string>;
		/** Execute a task */
		execute: (prompt: string) => Promise<any>;
		/** Get greeting in current language */
		greeting: () => Promise<string>;
		/** Get response by type */
		response: (type: string) => Promise<string>;
		/** Set language (en, hi, gu) */
		setLanguage: (lang: string) => Promise<boolean>;
		/** Speak text */
		speak: (text: string) => Promise<boolean>;
		/** Control smart home device */
		smartHome: (command: string) => Promise<string>;
		/** Get daily briefing */
		briefing: () => Promise<string>;
		/** Get proactive suggestions */
		suggestions: () => Promise<any[]>;
		/** Get system status */
		status: () => Promise<any>;
		/** Play sound effect */
		sound: (effect: string) => Promise<boolean>;
		/** Organize files */
		organize: (directory: string) => Promise<any>;
		/** Search web */
		search: (query: string) => Promise<any>;
		/** Browse website */
		browse: (url: string) => Promise<any>;
		/** Use tool */
		tool: (toolName: string, params?: any) => Promise<any>;
	};

	// Open in external app
	openIn: {
		getTargets: () => Promise<OpenInTargetsResult>;
		open: (directory: string, targetId: string, persistPreferred?: boolean) => Promise<{ success: boolean; error?: string }>;
		setPreferred: (targetId: string) => Promise<{ success: boolean }>;
	};

	// Ollama Manager
	ollama: {
		isInstalled: () => Promise<boolean>;
		install: () => Promise<void>;
		start: () => Promise<void>;
		stop: () => Promise<void>;
		pullModel: (model: string) => Promise<void>;
		listModels: () => Promise<string[]>;
		onInstallOutput: (callback: (text: string) => void) => () => void;
		onPullOutput: (callback: (text: string) => void) => () => void;
	};

	// Fuzzy file search (fzf)
	fzf: {
		/** Check if fzf is installed */
		check: () => Promise<FzfCheckResult>;
		/** Install fzf (macOS: brew, Windows: winget, Linux: git) */
		install: () => Promise<{ success: boolean; error?: string }>;
		/** Quick file search in a directory */
		files: (
			cwd: string,
			query?: string,
		) => Promise<{
			success: boolean;
			result?: FzfSearchResult;
			error?: string;
		}>;
		/** Advanced fuzzy search with options */
		search: (
			query: string,
			cwd: string,
			options?: {
				files?: boolean;
				dirs?: boolean;
				hidden?: boolean;
				multi?: boolean;
				preview?: string;
			},
		) => Promise<{
			success: boolean;
			result?: FzfSearchResult;
			error?: string;
		}>;
	};

	// CodeGraph (Code Knowledge Graph)
	codegraph: {
		/** Check if CodeGraph is installed */
		check: () => Promise<CodeGraphCheckResult>;
		/** Install CodeGraph via npm */
		install: () => Promise<{ success: boolean; error?: string }>;
		/** Index codebase for knowledge graph */
		index: (cwd: string) => Promise<{
			success: boolean;
			result?: CodeGraphIndexResult;
			error?: string;
		}>;
		/** Query the code knowledge graph */
		query: (
			query: string,
			cwd: string,
		) => Promise<{
			success: boolean;
			result?: CodeGraphQueryResult;
			error?: string;
		}>;
		/** Start CodeGraph MCP server */
		startMcp: (cwd: string) => Promise<{ success: boolean; error?: string }>;
		/** Stop CodeGraph MCP server */
		stopMcp: () => Promise<void>;
	};

	// Ponytail (Code Quality - Built-in Skill)
	ponytail: {
		/** Check if Ponytail is available */
		check: () => Promise<{ installed: boolean; version?: string; error?: string }>;
		/** Setup Ponytail config */
		setup: () => Promise<{ success: boolean; error?: string }>;
		/** Get current Ponytail mode */
		getMode: () => Promise<"lite" | "full" | "ultra" | "off">;
		/** Set Ponytail mode (lite/full/ultra/off) */
		setMode: (mode: "lite" | "full" | "ultra" | "off") => Promise<{ success: boolean; error?: string }>;
		/** Get Ponytail rules for prompt injection */
		getRules: () => Promise<string>;
		/** Check if Ponytail is enabled */
		isEnabled: () => Promise<boolean>;
		/** Toggle Ponytail on/off */
		toggle: () => Promise<{ success: boolean; enabled?: boolean; error?: string }>;
	};

	// Connectors (third-party service integrations)
	connectors: {
		/** Get all connector statuses */
		getStatuses: () => Promise<Record<string, { connected: boolean; connectedAt?: number }>>;
		/** Save credentials for a connector */
		setCredential: (id: string, credentials: Record<string, string>) => Promise<boolean>;
		/** Delete credentials for a connector */
		deleteCredential: (id: string) => Promise<boolean>;
		/** Test a connector connection */
		testConnection: (id: string, credentials: Record<string, string>) => Promise<{ success: boolean; message: string }>;
	};

	// Code Review Agent (extends Ponytail)
	codeReview: {
		/** Run comprehensive code review with security, performance, best-practice rules */
		review: (
			code: string,
			filePath?: string,
			options?: { categories?: string[]; includeComplexity?: boolean },
		) => Promise<CodeReviewResult>;
		/** Audit entire directory */
		audit: (cwd: string) => Promise<CodeReviewResult>;
	};

	// Live Collaboration
	collab: {
		/** Start a collaboration session */
		start: (roomId?: string) => Promise<{ active: boolean; roomId: string | null }>;
		/** Stop the collaboration session */
		stop: () => Promise<void>;
		/** Get current collaboration state */
		getState: () => Promise<CollaborationState>;
	};

	// Test Runner
	testRunner: {
		/** Run a test command and return output */
		run: (
			command: string,
			cwd: string,
		) => Promise<{ success: boolean; output: string; exitCode: number }>;
	};

	// Webhook Server (GitHub/GitLab PR reviews)
	webhook: {
		/** Check if webhook server is running */
		getStatus: () => Promise<{ running: boolean; port: number }>;
		/** Get review status for a PR */
		getReviewStatus: (
			provider: string,
			repository: string,
			prNumber: number,
		) => Promise<{ reviewed: boolean; lastReview?: number; reviewing: boolean }>;
	};

	// Git Provider Integration (GitHub/GitLab API)
	gitProvider: {
		/** Get provider configuration status */
		getConfig: (
			provider: "github" | "gitlab",
		) => Promise<{ configured: boolean; baseUrl?: string }>;
		/** Set API token for a provider */
		setToken: (
			provider: "github" | "gitlab",
			token: string,
		) => Promise<{ success: boolean }>;
	};

	// GitHub Actions Runner
	githubActions: {
		/** List workflows for a repository */
		listWorkflows: (owner: string, repo: string, page?: number, perPage?: number) => Promise<{ workflows: Array<{ id: number; name: string; path: string; state: string; createdAt: string; updatedAt: string; htmlUrl: string }>; totalCount: number }>;
		/** List recent workflow runs */
		listRuns: (owner: string, repo: string, workflowId?: number, page?: number, perPage?: number) => Promise<{ runs: Array<{ id: number; name: string; headBranch: string; headSha: string; event: string; status: string; conclusion: string | null; createdAt: string; updatedAt: string; runNumber: number; htmlUrl: string }>; totalCount: number }>;
		/** Trigger a workflow run */
		trigger: (owner: string, repo: string, workflowId: number, ref?: string, inputs?: Record<string, string>) => Promise<{ id: number; name: string; status: string; conclusion: string | null; htmlUrl: string }>;
		/** Get workflow run status */
		getRunStatus: (owner: string, repo: string, runId: number) => Promise<{ id: number; name: string; status: string; conclusion: string | null; htmlUrl: string }>;
		/** Get workflow run logs */
		getRunLogs: (owner: string, repo: string, runId: number) => Promise<{ totalCount: number; complete: boolean; logs: Array<{ name: string; content: string }> }>;
		/** Cancel a workflow run */
		cancelRun: (owner: string, repo: string, runId: number) => Promise<void>;
		/** Re-run a failed workflow */
		rerunRun: (owner: string, repo: string, runId: number) => Promise<void>;
		/** Get workflow run artifacts */
		getArtifacts: (owner: string, repo: string, runId: number) => Promise<Array<{ id: number; name: string; sizeInBytes: number; expired: boolean; createdAt: string }>>;
		/** Parse owner/repo from git remote URL */
		parseRemoteUrl: (remoteUrl: string) => Promise<{ owner: string; repo: string } | null>;
		/** List user's GitHub repositories */
		listRepos: () => Promise<{ repositories: Array<{ id: number; name: string; fullName: string; owner: { login: string; avatarUrl: string }; private: boolean; htmlUrl: string; description: string | null; updatedAt: string }>; totalCount: number }>;
		/** Save GitHub token */
		saveToken: (token: string) => Promise<{ success: boolean }>;
		/** Delete GitHub token */
		deleteToken: () => Promise<{ success: boolean }>;
		/** Check if GitHub token exists */
		hasToken: () => Promise<{ hasToken: boolean }>;
		/** Create a new GitHub repository */
		createRepo: (options: { name: string; description?: string; private?: boolean; autoInit?: boolean }) => Promise<{ id: number; name: string; fullName: string; owner: { login: string; avatarUrl: string }; private: boolean; htmlUrl: string; description: string | null; updatedAt: string }>;
		/** Check if a repository exists */
		checkRepo: (owner: string, repo: string) => Promise<boolean>;
		/** Get authenticated GitHub user */
		getUser: () => Promise<string>;
	};

	// Project-Repo Mapping
	projectRepoMap: {
		/** Initialize the mapping store */
		init: () => Promise<{ success: boolean }>;
		/** Get the repo linked to a project */
		get: (projectDir: string) => Promise<{ owner: string; repo: string; createdAt: string } | null>;
		/** Link a project to a repo */
		set: (projectDir: string, owner: string, repo: string) => Promise<{ success: boolean }>;
		/** Remove a project-repo link */
		delete: (projectDir: string) => Promise<{ success: boolean }>;
		/** Get all project-repo mappings */
		list: () => Promise<Record<string, { owner: string; repo: string; createdAt: string }>>;
		/** Check if a repo is already linked to a project */
		checkLinked: (owner: string, repo: string) => Promise<{ linked: boolean; projectDir: string | null }>;
	};

	// REST API & Cloudflare Tunnel
	restApi: {
		/** Start the REST API server */
		start: (config: { enabled: boolean; port: number; enableCors: boolean; allowedOrigins: string[]; requireAuth: boolean; apiKey: string; enableTunnel: boolean; tunnelSubdomain?: string }) => Promise<{ url: string; tunnelUrl?: string }>;
		/** Stop the REST API server */
		stop: () => Promise<void>;
		/** Get REST API status */
		getStatus: () => Promise<{ running: boolean; url?: string; tunnelUrl?: string }>;
		/** Generate a new API key */
		generateKey: (name: string, expiresAt?: string) => Promise<{ id: string; name: string; key: string; createdAt: string; expiresAt?: string }>;
		/** Revoke an API key */
		revokeKey: (key: string) => Promise<boolean>;
		/** List all API keys */
		listKeys: () => Promise<Array<{ id: string; name: string; createdAt: string; lastUsedAt?: string; expiresAt?: string }>>;
	};

	// Native theme (syncs macOS glass tint to app color scheme)
	/** Set the native theme source to control macOS glass tint color. */
	setNativeTheme: (source: string) => Promise<void>;

	/** Set the app dock icon (macOS only) */
	setAppIcon: (iconName: string) => Promise<boolean>;

	// System accent color
	/** Get the system accent color as an 8-char hex RRGGBBAA string, or null if unavailable. */
	getAccentColor: () => Promise<string | null>;
	/** Subscribe to system accent color changes. Returns an unsubscribe function. */
	onAccentColorChanged: (callback: (color: string) => void) => () => void;

	// Directory picker
	pickDirectory: () => Promise<string | null>;

	// Fetch proxy (bypasses Chromium connection limits)
	fetch: (req: {
		url: string;
		method: string;
		headers: Record<string, string>;
		body: string | null;
	}) => Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string>;
		body: string | null;
	}>;

	// Notifications
	/** Subscribe to navigation events from native OS notification clicks. */
	onNotificationNavigate: (
		callback: (data: { sessionId: string }) => void,
	) => () => void;
	/** Dismiss any active notification for a session. */
	dismissNotification: (sessionId: string) => Promise<void>;
	/** Update the dock badge / app badge count. */
	updateBadgeCount: (count: number) => Promise<void>;

	// Settings
	/** Get the full app settings object. */
	getSettings: () => Promise<PublicAppSettings>;
	/** Update settings with a partial object (deep-merged). Returns the updated settings. */
	updateSettings: (partial: Record<string, unknown>) => Promise<AppSettings>;
	/** Subscribe to settings changes pushed from the main process. */
	onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;

	// Onboarding
	// Automations
	automation: {
		list: () => Promise<Automation[]>;
		get: (id: string) => Promise<Automation | null>;
		create: (input: CreateAutomationInput) => Promise<Automation>;
		update: (input: UpdateAutomationInput) => Promise<Automation | null>;
		delete: (id: string) => Promise<boolean>;
		runNow: (id: string) => Promise<boolean>;
		listRuns: (automationId?: string) => Promise<AutomationRun[]>;
		archiveRun: (runId: string) => Promise<boolean>;
		acceptRun: (runId: string) => Promise<boolean>;
		markRunRead: (runId: string) => Promise<boolean>;
		previewSchedule: (rrule: string, timezone: string) => Promise<string[]>;
	};
	/** Subscribe to automation run state changes. */
	onAutomationRunsUpdated: (callback: () => void) => () => void;

	onboarding: {
		/** Whether the DevilRoute local gateway binary is installed and/or running. */
		checkDevilRoute: () => Promise<DevilRouteStatus>;
		/** Install (if needed) and start the DevilRoute local gateway. */
		installDevilRoute: () => Promise<{ success: boolean; error?: string }>;
		checkOpenCode: () => Promise<OpenCodeCheckResult>;
		installOpenCode: () => Promise<{ success: boolean; error?: string }>;
		checkGit: () => Promise<GitCheckResult>;
		installGit: () => Promise<{ success: boolean; error?: string }>;
		checkPython: () => Promise<PythonCheckResult>;
		installAgentReach: () => Promise<{ success: boolean; error?: string }>;
		installCloudflared: () => Promise<{ success: boolean; error?: string }>;
		onInstallOutput: (callback: (text: string) => void) => () => void;
		/** Quick-detect all supported providers (Claude Code, Cursor, Devil AI). */
		detectProviders: () => Promise<ProviderDetection[]>;
		/** Full scan of a specific provider's configuration. */
		scanProvider: (
			provider: MigrationProvider,
		) => Promise<{ detection: ProviderDetection; scanResult: unknown }>;
		/** Dry-run migration preview for a provider. */
		previewMigration: (
			provider: MigrationProvider,
			scanResult: unknown,
			categories: string[],
		) => Promise<MigrationPreview>;
		/** Execute migration (writes files with backup). */
		executeMigration: (
			provider: MigrationProvider,
			scanResult: unknown,
			categories: string[],
		) => Promise<MigrationResult>;
		/** Subscribe to migration progress updates (history writing). */
		onMigrationProgress: (
			callback: (progress: MigrationProgress) => void,
		) => () => void;
		/** Restore the most recent migration backup. */
		restoreBackup: () => Promise<{
			success: boolean;
			restored: string[];
			removed: string[];
			errors: string[];
		}>;
	};

	// DevilRoute session-token refresher
	devilroute: {
		/** Store the gateway admin password (enables auto token refresh). */
		setAdminPassword: (password: string) => Promise<TokenRefreshSummary>;
		/** Whether a gateway admin password is stored. */
		hasAdminPassword: () => Promise<boolean>;
		/** Manually trigger a session-token refresh now. */
		refreshNow: () => Promise<TokenRefreshSummary>;
		/** Current refresh status (password configured + last summary). */
		getStatus: () => Promise<{
			configured: boolean;
			lastSummary: TokenRefreshSummary | null;
		}>;
		/** Subscribe to token status updates (expired / needs-reauth providers). */
		onTokenStatus: (
			callback: (payload: {
				summary: TokenRefreshSummary;
				newProblems: TokenProblem[];
			}) => void,
		) => () => void;
	};

	// Tunnel (Cloudflare sharing)
	tunnel: {
		/** Check if cloudflared is installed */
		check: () => Promise<boolean>;
		/** Start a temporary tunnel for session sharing */
		start: (sessionId: string) => Promise<{ url: string; otp: string }>;
		/** Stop the current tunnel */
		stop: () => Promise<boolean>;
		/** Get the current tunnel URL */
		getUrl: () => Promise<string | null>;
		/** Get the current OTP */
		getOtp: () => Promise<string | null>;
		/** Get number of active viewers */
		getViewers: () => Promise<number>;
	};

	// Notes (User Memory)
	notes: {
		list: () => Promise<Note[]>;
		get: (id: string) => Promise<Note | null>;
		create: (input: {
			title: string;
			content?: string;
			tags?: string;
			sessionId?: string;
			projectPath?: string;
		}) => Promise<Note>;
		update: (input: {
			id: string;
			title?: string;
			content?: string;
			tags?: string;
			includeInContext?: boolean;
		}) => Promise<Note | null>;
		delete: (id: string) => Promise<boolean>;
		search: (query: string) => Promise<Note[]>;
		getContext: (projectPath?: string, promptText?: string) => Promise<string>;
	};

	// Prompt Library
	prompts: {
		list: () => Promise<Prompt[]>;
		get: (id: string) => Promise<Prompt | null>;
		create: (input: { title: string; content?: string; tags?: string; category?: string }) => Promise<Prompt>;
		update: (input: { id: string; title?: string; content?: string; tags?: string; category?: string; isFavorite?: boolean }) => Promise<Prompt | null>;
		delete: (id: string) => Promise<boolean>;
		search: (query: string) => Promise<Prompt[]>;
		use: (id: string) => Promise<void>;
		resolve: (content: string, variables: Record<string, string>) => Promise<string>;
		extractVars: (content: string) => Promise<string[]>;
	};

	// Snippets Manager
	snippets: {
		list: () => Promise<Snippet[]>;
		get: (id: string) => Promise<Snippet | null>;
		create: (input: { title: string; content?: string; language?: string; tags?: string; projectPath?: string }) => Promise<Snippet>;
		update: (input: { id: string; title?: string; content?: string; language?: string; tags?: string; isFavorite?: boolean }) => Promise<Snippet | null>;
		delete: (id: string) => Promise<boolean>;
		search: (query: string) => Promise<Snippet[]>;
		use: (id: string) => Promise<void>;
	};

	// Session Templates
	templates: {
		list: () => Promise<SessionTemplate[]>;
		get: (id: string) => Promise<SessionTemplate | null>;
		create: (input: { name: string; description?: string; config?: string; category?: string }) => Promise<SessionTemplate>;
		update: (input: { id: string; name?: string; description?: string; config?: string; category?: string; isFavorite?: boolean }) => Promise<SessionTemplate | null>;
		delete: (id: string) => Promise<boolean>;
		search: (query: string) => Promise<SessionTemplate[]>;
		use: (id: string) => Promise<void>;
	};

	// Keyboard Shortcuts
	shortcuts: {
		list: () => Promise<KeyboardShortcut[]>;
		get: (id: string) => Promise<KeyboardShortcut | null>;
		create: (input: { action: string; label: string; category?: string; shortcut: string }) => Promise<KeyboardShortcut>;
		update: (input: { id: string; shortcut?: string; isEnabled?: boolean }) => Promise<KeyboardShortcut | null>;
		delete: (id: string) => Promise<boolean>;
		getByAction: (action: string) => Promise<KeyboardShortcut | null>;
	};

	// Agent Memory (persistent cross-session memory)
	memory: {
		prefs: {
			list: (projectPath?: string) => Promise<UserPreference[]>;
			set: (input: {
				category: string;
				key: string;
				value: string;
				projectPath?: string;
			}) => Promise<UserPreference>;
			delete: (id: string) => Promise<boolean>;
			search: (query: string) => Promise<UserPreference[]>;
		};
		memories: {
			list: (
				projectPath?: string,
				category?: string,
				limit?: number,
			) => Promise<AgentMemory[]>;
			create: (input: {
				projectPath?: string;
				sessionId?: string;
				category: string;
				summary: string;
				content: string;
				weight?: number;
			}) => Promise<AgentMemory>;
			update: (input: {
				id: string;
				summary?: string;
				content?: string;
				weight?: number;
				category?: string;
			}) => Promise<AgentMemory | null>;
			delete: (id: string) => Promise<boolean>;
			search: (
				query: string,
				projectPath?: string,
				limit?: number,
			) => Promise<AgentMemory[]>;
		};
		getContext: (projectPath: string) => Promise<string>;

		// --- NEW MEMORY SYSTEM ---

		/** Log a conversation message */
		logConversation: (input: {
			sessionId?: string;
			projectPath?: string;
			role: string;
			content: string;
		}) => Promise<ConversationEntry>;

		/** Get conversation history */
		getHistory: (options?: {
			sessionId?: string;
			projectPath?: string;
			limit?: number;
			offset?: number;
		}) => Promise<ConversationEntry[]>;

		/** Search conversations */
		searchConversations: (
			query: string,
			projectPath?: string,
			limit?: number,
		) => Promise<ConversationEntry[]>;

		/** Add project knowledge */
		addKnowledge: (input: {
			projectPath: string;
			type: string;
			title: string;
			description: string;
			files?: string;
			sessionId?: string;
			technologies?: string;
			weight?: number;
		}) => Promise<ProjectKnowledgeEntry>;

		/** List project knowledge */
		getKnowledge: (
			projectPath: string,
			type?: string,
			limit?: number,
		) => Promise<ProjectKnowledgeEntry[]>;

		/** Search project knowledge */
		searchKnowledge: (
			query: string,
			projectPath?: string,
			limit?: number,
		) => Promise<ProjectKnowledgeEntry[]>;

		/** Add a learned skill */
		addSkill: (input: {
			category: string;
			name: string;
			description: string;
			pattern: string;
			example?: string;
			sessionId?: string;
		}) => Promise<LearnedSkill>;

		/** List learned skills */
		getSkills: (category?: string, limit?: number) => Promise<LearnedSkill[]>;

		/** Search learned skills */
		searchSkills: (query: string, limit?: number) => Promise<LearnedSkill[]>;

		/** Mark a skill as used */
		useSkill: (id: string) => Promise<LearnedSkill | null>;

		/** Get memory system stats */
		getStats: () => Promise<MemoryStats>;

		/** Consolidate a session */
		consolidate: (options: {
			sessionId: string;
			projectPath?: string;
		}) => Promise<{ summary: string; learnings: string[] } | null>;

		/** Auto-consolidate old sessions */
		autoConsolidate: (options?: {
			projectPath?: string;
			maxAge?: number;
			maxSessions?: number;
		}) => Promise<number>;

		/** Assemble context for a new prompt */
		assembleContext: (options: {
			query: string;
			projectPath?: string;
			sessionId?: string;
			limit?: number;
		}) => Promise<AssembledContext>;
	};

	// Telegram Bot
	telegram: {
		/** Start the Telegram bot (webhook + tunnel + set webhook) */
		start: () => Promise<{ tunnelUrl: string }>;
		/** Stop the Telegram bot */
		stop: () => Promise<void>;
		/** Get current bot status */
		getStatus: () => Promise<TelegramBotStatus>;
		/** Forward a message from a session to connected Telegram users */
		sendForwarded: (
			sessionId: string,
			role: "user" | "assistant",
			text: string,
		) => Promise<void>;
	};

	// Plugin Installer
	pluginInstaller: {
		/** Install a plugin from a GitHub repo URL */
		install: (
			url: string,
			type?: "mcp" | "skill" | "plugin",
		) => Promise<PluginInstallResult>;
		/** List all installed plugins */
		list: () => Promise<InstalledPlugins>;
		/** Uninstall a plugin by name and type */
		uninstall: (
			name: string,
			type: "mcp" | "skill" | "plugin",
		) => Promise<{ success: boolean; message: string }>;
	};

	// Image Generation (Pollinations.ai)
	/** Generate an image using Pollinations.ai free API. */
	generateImage: (input: GenerateImageInput) => Promise<GenerateImageResult>;

	/** Semantic codebase search */
	semanticSearch: {
		/** Index a project for semantic search. Returns project state when complete. */
		index: (projectPath: string) => Promise<ProjectIndexState>;
		/** Get current index state for a project. */
		state: (projectPath: string) => Promise<ProjectIndexState | null>;
		/** Search the indexed codebase. */
		search: (options: SearchOptions) => Promise<SearchResult[]>;
		/** Cancel an in-progress indexing operation. */
		abort: (projectPath: string) => Promise<void>;
		/** Notify indexer of a file system event. */
		fileEvent: (projectPath: string, event: FileWatchEvent) => Promise<void>;
		/** Subscribe to indexing progress updates. */
		onProgress: (callback: (progress: IndexProgress) => void) => () => void;
	};

	// History Search
	historySearch: {
		/** Search chat history across sessions. */
		search: (options: HistorySearchOptions) => Promise<HistorySearchResult[]>;
		/** Get detailed session information. */
		getSessionDetail: (sessionId: string, projectPath: string) => Promise<HistorySessionDetail | null>;
	};

	// ============================================================
	// Browser Automation
	// ============================================================

	browser: {
		/** Initialize browser automation */
		init: (options?: { headless?: boolean; browser?: "chromium" | "firefox" | "webkit"; viewport?: { width: number; height: number } }) => Promise<{ success: boolean }>;
		/** Close browser */
		close: () => Promise<{ success: boolean }>;
		/** Create new tab */
		newTab: (url?: string) => Promise<{ pageId: string; url: string }>;
		/** Navigate to URL */
		navigate: (pageId: string, url: string, options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit"; timeout?: number }) => Promise<{ success: boolean }>;
		/** Click element */
		click: (pageId: string, selector: string, options?: { button?: "left" | "right" | "middle"; clickCount?: number; delay?: number }) => Promise<{ success: boolean }>;
		/** Type text */
		type: (pageId: string, selector: string, text: string, options?: { delay?: number }) => Promise<{ success: boolean }>;
		/** Take screenshot */
		screenshot: (pageId: string, options?: { fullPage?: boolean; format?: "png" | "jpeg"; quality?: number }) => Promise<{ data: string }>;
		/** Evaluate JavaScript */
		evaluate: (pageId: string, script: string, args?: any) => Promise<{ result: any }>;
		/** Get page HTML */
		getContent: (pageId: string) => Promise<{ content: string }>;
		/** Get page text */
		getText: (pageId: string) => Promise<{ text: string }>;
		/** Wait for selector */
		waitForSelector: (pageId: string, selector: string, timeout?: number) => Promise<{ success: boolean }>;
		/** Get cookies */
		getCookies: (pageId: string) => Promise<{ cookies: any[] }>;
		/** Set cookies */
		setCookies: (pageId: string, cookies: any[]) => Promise<{ success: boolean }>;
		/** Press key */
		pressKey: (pageId: string, key: string) => Promise<{ success: boolean }>;
		/** Get all tabs */
		getTabs: () => Promise<{ tabs: Array<{ id: number; url: string; title: string; active: boolean }> }>;
		/** Close page */
		closePage: (pageId: string) => Promise<{ success: boolean }>;
		/** Get runner status */
		status: () => Promise<{ running: boolean; pageCount: number; contextCount: number }>;
	};

	// Terminal (node-pty)
	terminal: {
		/** Create a new terminal instance */
		create: (id: string, cols?: number, rows?: number) => Promise<{ success: boolean; error?: string }>;
		/** Write data to a terminal */
		write: (id: string, data: string) => Promise<{ success: boolean; error?: string }>;
		/** Resize a terminal */
		resize: (id: string, cols: number, rows: number) => Promise<{ success: boolean; error?: string }>;
		/** Kill a terminal instance */
		kill: (id: string) => Promise<{ success: boolean; error?: string }>;
		/** List all terminal IDs */
		list: () => Promise<string[]>;
		/** Subscribe to terminal data events */
		onData: (callback: (id: string, data: string) => void) => () => void;
		/** Subscribe to terminal exit events */
		onExit: (callback: (id: string, exitCode: number) => void) => () => void;
	};

	// Screen Sharing (AnyDesk-like remote desktop)
	screenShare: {
		/** Start screen sharing (host) — returns 6-digit code */
		start: () => Promise<{ success: boolean; code?: string; tunnelUrl?: string; sessionId?: string; error?: string }>;
		/** Stop screen sharing */
		stop: (code?: string) => Promise<{ success: boolean; error?: string }>;
		/** Get available screen sources */
		getSources: () => Promise<Array<{ id: string; name: string; thumbnail: string; display_id: string }>>;
		/** Check if screen sharing is active */
		isActive: () => Promise<boolean>;
		/** Get active session count */
		getActiveCount: () => Promise<number>;
		/** Send signaling message */
		sendSignal: (code: string, msg: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
		/** Join session as remote viewer */
		join: (code: string) => Promise<{ success: boolean; sessionId?: string; tunnelUrl?: string; error?: string }>;
		/** Disconnect remote viewer */
		disconnect: () => Promise<{ success: boolean }>;
		/** Get sharing status */
		getStatus: () => Promise<{ isSharing: boolean; sessions: Array<{ code: string; hasRemote: boolean; createdAt: number }> }>;

		// Event subscriptions
		/** Remote connected to host */
		onRemoteConnected: (callback: (code: string) => void) => () => void;
		/** Host disconnected */
		onHostDisconnected: (callback: (code: string) => void) => () => void;
		/** Session stopped */
		onStopped: (callback: (code: string) => void) => () => void;
		/** WebRTC offer received */
		onOffer: (callback: (code: string, offer: RTCSessionDescriptionInit) => void) => () => void;
		/** WebRTC answer received */
		onAnswer: (callback: (code: string, answer: RTCSessionDescriptionInit) => void) => () => void;
		/** ICE candidate received */
		onIceCandidate: (callback: (code: string, candidate: RTCIceCandidateInit) => void) => () => void;
		/** Input event from remote */
		onInput: (callback: (code: string, event: unknown) => void) => () => void;
		/** Status changed */
		onStatusChanged: (callback: (status: unknown) => void) => () => void;
	};

	// --- AI Code Review Bot ---
	reviewBot: {
		reviewPR: (args: { provider: "github" | "gitlab"; repository: string; prNumber: number }) => Promise<unknown>;
		configure: (args: Partial<{ githubToken: string; gitlabToken: string; autoReview: boolean; inlineComments: boolean; setCommitStatus: boolean; categories: string[] }>) => Promise<unknown>;
		getPRInfo: (args: { provider: "github" | "gitlab"; repository: string; prNumber: number; token: string }) => Promise<unknown>;
	};

	// --- One-Click Deploy ---
	deploy: {
		detectFramework: (projectDir: string) => Promise<unknown>;
		deploy: (args: { provider: "vercel" | "netlify" | "railway"; projectDir: string; projectName?: string; buildCommand?: string; outputDir?: string; installCommand?: string; nodeVersion?: string; envVars?: Record<string, string>; startCommand?: string }) => Promise<unknown>;
		getStatus: (deployId: string) => Promise<unknown>;
		listActive: () => Promise<unknown>;
	};

	// --- Smart Context Engine ---
	contextEngine: {
		buildGraph: (projectDir: string) => Promise<unknown>;
		getMetrics: (projectDir: string) => Promise<unknown>;
		analyzeImpact: (projectDir: string, filePath: string) => Promise<unknown>;
		detectBreakingChanges: (projectDir: string) => Promise<unknown>;
		getSummary: (projectDir: string, filePath?: string) => Promise<unknown>;
		getFileImports: (projectDir: string, filePath: string) => Promise<unknown>;
		getDependents: (projectDir: string, filePath: string) => Promise<unknown>;
		invalidateCache: (projectDir: string) => Promise<unknown>;
	};

	// --- Multi-Agent Orchestrator ---
	multiAgent: {
		createSwarm: (args: { agents: Array<{ role: string; name: string; capabilities?: string[] }>; createdBy: string }) => Promise<unknown>;
		createCodeReviewSwarm: (createdBy: string) => Promise<unknown>;
		delegateTask: (args: { swarmId: string; fromAgentId: string; toAgentId: string; title: string; description: string; priority?: number }) => Promise<unknown>;
		completeTask: (args: { swarmId: string; taskId: string; result: unknown }) => Promise<unknown>;
		shareContext: (args: { swarmId: string; fromAgentId: string; toAgentId: string; context: Record<string, unknown> }) => Promise<unknown>;
		getPendingTasks: (args: { swarmId: string; agentId: string }) => Promise<unknown>;
		getSummary: (swarmId: string) => Promise<unknown>;
		destroy: (swarmId: string) => Promise<unknown>;
		listSwarms: () => Promise<unknown>;
	};
}

export interface TelegramBotStatus {
	running: boolean;
	botToken: boolean;
	tunnelUrl: string | null;
	userCount: number;
}

export interface PluginInstallResult {
	success: boolean;
	type: "mcp" | "skill" | "plugin" | "unknown";
	name: string;
	path: string;
	message: string;
	mcpConfig?: Record<string, unknown>;
}

export interface InstalledPlugins {
	mcpServers: string[];
	skills: string[];
	plugins: string[];
}

// ============================================================
// Image Generation types
// ============================================================

export interface GenerateImageInput {
	prompt: string;
	width?: number;
	height?: number;
	model?: "flux" | "turbo" | "stable-diffusion";
	seed?: number;
	enhance?: boolean;
}

export interface GenerateImageResult {
	filePath: string;
	width: number;
	height: number;
	model: string;
}

export interface Note {
	id: string;
	title: string;
	content: string;
	tags: string;
	sessionId: string | null;
	projectPath: string | null;
	includeInContext: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface Prompt {
	id: string;
	title: string;
	content: string;
	tags: string;
	category: string;
	useCount: number;
	isFavorite: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface Snippet {
	id: string;
	title: string;
	content: string;
	language: string;
	tags: string;
	projectPath: string | null;
	useCount: number;
	isFavorite: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface SessionTemplate {
	id: string;
	name: string;
	description: string;
	config: string;
	category: string;
	useCount: number;
	isFavorite: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface KeyboardShortcut {
	id: string;
	action: string;
	label: string;
	category: string;
	shortcut: string;
	isEnabled: boolean;
	isCustom: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface UserPreference {
	id: string;
	projectPath: string | null;
	category: string;
	key: string;
	value: string;
	createdAt: number;
	updatedAt: number;
}

export interface AgentMemory {
	id: string;
	projectPath: string | null;
	sessionId: string | null;
	category: string;
	summary: string;
	content: string;
	weight: number;
	createdAt: number;
	updatedAt: number;
}

export interface FzfCheckResult {
	installed: boolean;
	version?: string;
	error?: string;
}

export interface FzfSearchResult {
	items: string[];
	query: string;
}

export interface CodeGraphCheckResult {
	installed: boolean;
	version?: string;
	error?: string;
}

export interface CodeGraphIndexResult {
	success: boolean;
	indexedFiles?: number;
	duration?: number;
	error?: string;
}

export interface CodeGraphQueryResult {
	success: boolean;
	result?: string;
	error?: string;
}

export interface PonytailCheckResult {
	installed: boolean;
	version?: string;
	error?: string;
}

export interface PonytailReviewResult {
	success: boolean;
	findings?: PonytailFinding[];
	summary?: string;
	error?: string;
}

export interface PonytailFinding {
	file: string;
	line: number;
	tag: "delete" | "stdlib" | "native" | "yagni" | "shrink";
	description: string;
	replacement: string;
}

// ============================================================
// Semantic Search types
// ============================================================

export interface SearchOptions {
	query: string;
	projectPath: string;
	limit?: number;
	threshold?: number;
	languages?: string[];
	includeSymbols?: boolean;
}

export interface SearchResult {
	chunk: CodeChunk;
	score: number;
	matchType: "semantic" | "symbol" | "text";
	contextBefore?: string;
	contextAfter?: string;
}

export interface CodeChunk {
	id: string;
	filePath: string;
	relativePath: string;
	language: string;
	startLine: number;
	endLine: number;
	content: string;
	symbols: string[];
	contentHash: string;
	indexedAt: number;
}

export interface IndexProgress {
	phase: "scanning" | "parsing" | "indexing" | "complete" | "error";
	filesTotal: number;
	filesProcessed: number;
	currentFile?: string;
	error?: string;
}

export interface ProjectIndexState {
	projectPath: string;
	lastIndexed: number;
	fileCount: number;
	chunkCount: number;
	languages: string[];
	status: "idle" | "indexing" | "error";
	error?: string;
}

export interface FileWatchEvent {
	type: "added" | "changed" | "deleted";
	filePath: string;
	relativePath: string;
}

// ============================================================
// History Search types
// ============================================================

export interface HistorySearchOptions {
	query: string;
	projectPath?: string;
	since?: number;
	until?: number;
	limit?: number;
}

export interface HistorySearchResult {
	sessionId: string;
	projectPath: string;
	summary: string;
	timestamp: number;
	messageCount: number;
	model?: string;
	matchSnippet: string;
}

export interface HistorySessionDetail {
	sessionId: string;
	projectPath: string;
	title: string;
	timestamp: number;
	messageCount: number;
	model?: string;
	messages: HistoryMessage[];
}

export interface HistoryMessage {
	role: "user" | "assistant" | "system" | "tool";
	content: string;
	timestamp: number;
	toolName?: string;
	toolInput?: unknown;
	toolOutput?: unknown;
}

// ============================================================
// Code Review Agent types
// ============================================================

export interface CodeReviewResult {
	success: boolean;
	findings?: CodeReviewFinding[];
	summary?: string;
	score?: number;
	error?: string;
}

export interface CodeReviewFinding {
	file: string;
	line: number;
	category: "security" | "performance" | "best-practice" | "complexity";
	severity: "error" | "warning" | "info";
	message: string;
	suggestion?: string;
	rule: string;
}

// Live Collaboration types
export interface CollaborationState {
	active: boolean;
	roomId: string | null;
	peers: Collaborator[];
	localPeer: Collaborator | null;
}

export interface Collaborator {
	id: string;
	name: string;
	color: string;
	cursor?: CursorPosition;
	selection?: SelectionRange;
}

export interface CursorPosition {
	line: number;
	column: number;
	file?: string;
}

export interface SelectionRange {
	startLine: number;
	startColumn: number;
	endLine: number;
	endColumn: number;
	file?: string;
}

// ============================================================
// NEW MEMORY SYSTEM types
// ============================================================

export interface ConversationEntry {
	id: string;
	sessionId: string | null;
	projectPath: string | null;
	role: string;
	content: string;
	summary: string | null;
	tokenCount: number | null;
	topics: string | null;
	timestamp: number;
}

export interface ProjectKnowledgeEntry {
	id: string;
	projectPath: string;
	type: string;
	title: string;
	description: string;
	files: string | null;
	sessionId: string | null;
	technologies: string | null;
	weight: number;
	createdAt: number;
	updatedAt: number;
}

export interface LearnedSkill {
	id: string;
	category: string;
	name: string;
	description: string;
	pattern: string;
	example: string | null;
	useCount: number;
	successRate: number;
	sessionId: string | null;
	createdAt: number;
	updatedAt: number;
}

export interface MemoryStats {
	conversations: number;
	knowledge: number;
	skills: number;
	embeddings: number;
	consolidations: number;
}

export interface AssembledContext {
	similarPrompts: Array<{
		content: string;
		score: number;
		role: string;
		timestamp: number;
	}>;
	knowledge: Array<{
		title: string;
		description: string;
		type: string;
		score: number;
	}>;
	skills: Array<{
		name: string;
		description: string;
		category: string;
		pattern: string;
		score: number;
	}>;
	memories: Array<{
		summary: string;
		content: string;
		category: string;
	}>;
	preferences: Array<{
		key: string;
		value: string;
		category: string;
	}>;
	contextString: string;
}

// ============================================================
// Theme types
// ============================================================

export interface ThemeColors {
	primary: string;
	primaryForeground: string;
	background: string;
	foreground: string;
	card: string;
	cardForeground: string;
	border: string;
	input: string;
	ring: string;
	muted: string;
	mutedForeground: string;
	accent: string;
	accentForeground: string;
	destructive: string;
	destructiveForeground: string;
	success: string;
	warning: string;
	info: string;
	sidebar: string;
	sidebarForeground: string;
	sidebarAccent: string;
	editor: string;
	editorForeground: string;
	editorLineHighlight: string;
	editorSelection: string;
	editorCursor: string;
	terminal: string;
	terminalForeground: string;
	terminalAnsi: string[];
	brandPrimary: string;
	brandSecondary: string;
	brandAccent: string;
}

export interface Theme {
	id: string;
	name: string;
	description: string;
	author: string;
	version: string;
	isDark: boolean;
	colors: ThemeColors;
	createdAt: string;
	updatedAt: string;
}

export interface ThemePreset {
	id: string;
	name: string;
	description: string;
	theme: Theme;
}

declare global {
	interface Window {
		devilAi: DevilAIAPI;
	}
}
