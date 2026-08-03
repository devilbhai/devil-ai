/**
 * Unified backend service layer.
 *
 * Detects whether we're running inside Electron (preload bridge available)
 * or in a plain browser (Bun + Hono server on port 3100). All hooks import
 * from here instead of `devil-ai-server.ts` directly.
 *
 * In Electron mode, calls go through IPC to the main process.
 * In browser mode, calls go through HTTP to the Devil AI server.
 */

import type {
	Automation,
	AutomationRun,
	CreateAutomationInput,
	GitApplyResult,
	GitBranchInfo,
	GitCheckoutResult,
	GitCommitResult,
	GitDiffStat,
	GitPushResult,
	GitStashResult,
	GitStatusInfo,
	ModelState,
	OpenInTargetsResult,
	UpdateAutomationInput,
} from "../../preload/api";
import { createLogger } from "../lib/logger";

const log = createLogger("backend");

// ============================================================
// Runtime detection
// ============================================================

/**
 * Returns true when running inside Electron (preload bridge is available).
 * The `devil-ai` object is exposed via `contextBridge.exposeInMainWorld`.
 */
export const isElectron = typeof window !== "undefined" && "devilAi" in window;

// ============================================================
// Backend API — same signatures regardless of runtime
// ============================================================

/**
 * Ensures the single engine server is running and returns its URL.
 * For local servers, this spawns/attaches via IPC.
 * For remote servers, the URL is already known and returned directly.
 */
export async function fetchOpenCodeUrl(): Promise<{ url: string }> {
	log.debug("fetchOpenCodeUrl", { via: isElectron ? "ipc" : "http" });
	try {
		if (isElectron) {
			const info = await window.devilAi.ensureOpenCode();
			log.info("Engine server URL resolved", { url: info.url });
			return { url: info.url };
		}
		const { fetchOpenCodeUrl: httpFetch } = await import("./devil-ai-server");
		const result = await httpFetch();
		log.info("Engine server URL resolved", { url: result.url });
		return result;
	} catch (err) {
		log.error("fetchOpenCodeUrl failed", err);
		throw err;
	}
}

/**
 * Resolve the connection URL for a server config.
 * For local servers, spawns/attaches via the existing IPC mechanism.
 * For remote servers, returns the configured URL directly.
 */
export async function resolveServerUrl(
	server: import("../../preload/api").ServerConfig,
): Promise<string> {
	switch (server.type) {
		case "local": {
			const { url } = await fetchOpenCodeUrl();
			return url;
		}
		case "remote":
			return server.url;
		case "ssh":
			// SSH tunneling not yet implemented; the URL would come from the tunnel manager
			throw new Error("SSH tunnel servers are not yet supported");
		default:
			throw new Error(
				`Unknown server type: ${(server as { type: string }).type}`,
			);
	}
}

/**
 * Resolve the auth header for a server config.
 * Fetches the encrypted password from the main process via IPC.
 * Returns null for unauthenticated servers.
 */
export async function resolveAuthHeader(
	server: import("../../preload/api").ServerConfig,
): Promise<string | null> {
	if (server.type === "local") return null;
	if (server.type === "remote" || server.type === "ssh") {
		if (!server.hasPassword) return null;
		if (!isElectron) return null;

		const password = await window.devilAi.credential.get(server.id);
		if (!password) return null;

		const username = server.username || "opencode";
		return `Basic ${btoa(`${username}:${password}`)}`;
	}
	return null;
}

/**
 * Fetches the engine model state (recent models, favorites, variants)
 * from ~/.local/state/devil-ai/model.json.
 */
export async function fetchModelState(): Promise<ModelState> {
	if (isElectron) {
		return window.devilAi.getModelState();
	}
	const { fetchModelState: httpFetch } = await import("./devil-ai-server");
	return httpFetch() as unknown as Promise<ModelState>;
}

/**
 * Adds a model to the front of the recent list in model.json.
 * Matches the TUI's `model.set(model, { recent: true })` behavior.
 * Returns the updated model state.
 */
export async function updateModelRecent(model: {
	providerID: string;
	modelID: string;
}): Promise<ModelState> {
	if (isElectron) {
		return window.devilAi.updateModelRecent(model);
	}
	const { updateModelRecent: httpUpdate } = await import("./devil-ai-server");
	return httpUpdate(model) as unknown as Promise<ModelState>;
}

/**
 * Checks if the backend is available.
 * In Electron, always returns true (main process is always there).
 * In browser, pings the Devil AI HTTP server.
 */
export async function checkBackendHealth(): Promise<boolean> {
	if (isElectron) {
		return true;
	}
	const { checkServerHealth } = await import("./devil-ai-server");
	return checkServerHealth();
}

// ============================================================
// Directory picker — Electron-only (native dialog via IPC)
// ============================================================

/**
 * Opens a native folder picker dialog.
 * Returns the selected directory path, or null if cancelled.
 */
export async function pickDirectory(): Promise<string | null> {
	if (isElectron) {
		return window.devilAi.pickDirectory();
	}
	throw new Error("Directory picker is only available in Electron mode");
}

// ============================================================
// Git operations — Electron-only (main process via IPC)
// In browser mode, these are not available (engine server
// doesn't expose git checkout/stash APIs).
// ============================================================

/**
 * Lists all local and remote branches for a project directory.
 */
export async function fetchGitBranches(
	directory: string,
): Promise<GitBranchInfo> {
	if (isElectron) {
		return window.devilAi.git.listBranches(directory);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Gets the working tree status (clean/dirty, file counts).
 */
export async function fetchGitStatus(
	directory: string,
): Promise<GitStatusInfo> {
	if (isElectron) {
		return window.devilAi.git.getStatus(directory);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Checks out a branch. Fails if there are uncommitted changes
 * that would conflict.
 */
export async function gitCheckout(
	directory: string,
	branch: string,
): Promise<GitCheckoutResult> {
	if (isElectron) {
		return window.devilAi.git.checkout(directory, branch);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Stashes uncommitted changes, then checks out the target branch.
 */
export async function gitStashAndCheckout(
	directory: string,
	branch: string,
): Promise<GitStashResult> {
	if (isElectron) {
		return window.devilAi.git.stashAndCheckout(directory, branch);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Pops the most recent stash entry.
 */
export async function gitStashPop(directory: string): Promise<GitStashResult> {
	if (isElectron) {
		return window.devilAi.git.stashPop(directory);
	}
	throw new Error("Git operations are only available in Electron mode");
}

// ============================================================
// Worktree operations — engine API only
// ============================================================

export type { WorktreeResult } from "./worktree-service";
export {
	createWorktree as createWorktreeViaApi,
	listWorktrees as listWorktreesViaApi,
	removeWorktree as removeWorktreeViaApi,
	resetWorktree,
} from "./worktree-service";

/**
 * Gets the git repository root for a directory.
 */
export async function getGitRoot(directory: string): Promise<string | null> {
	if (isElectron) {
		return window.devilAi.git.getRoot(directory);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Gets a summary of uncommitted changes in a directory.
 */
export async function fetchDiffStat(directory: string): Promise<GitDiffStat> {
	if (isElectron) {
		return window.devilAi.git.diffStat(directory);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Commits all changes (staged + unstaged) with the given message.
 */
export async function gitCommitAll(
	directory: string,
	message: string,
): Promise<GitCommitResult> {
	if (isElectron) {
		return window.devilAi.git.commitAll(directory, message);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Pushes the current branch to the remote.
 */
export async function gitPush(
	directory: string,
	remote?: string,
): Promise<GitPushResult> {
	if (isElectron) {
		return window.devilAi.git.push(directory, remote);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Creates a new branch on the given directory.
 */
export async function gitCreateBranch(
	directory: string,
	branchName: string,
): Promise<GitCheckoutResult> {
	if (isElectron) {
		return window.devilAi.git.createBranch(directory, branchName);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Gets the remote URL for a repository (defaults to "origin").
 */
export async function getGitRemoteUrl(
	directory: string,
	remote?: string,
): Promise<string | null> {
	if (isElectron) {
		return window.devilAi.git.getRemoteUrl(directory, remote);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Applies uncommitted changes from a worktree to the local checkout as a patch.
 */
export async function gitApplyToLocal(
	worktreeDir: string,
	localDir: string,
): Promise<GitApplyResult> {
	if (isElectron) {
		return window.devilAi.git.applyToLocal(worktreeDir, localDir);
	}
	throw new Error("Git operations are only available in Electron mode");
}

/**
 * Applies a raw diff string to a local directory using `git apply`.
 * Used for remote worktree apply-to-local, where the diff is fetched
 * from the engine session.diff API rather than from a local worktree.
 */
export async function gitApplyDiffText(
	localDir: string,
	diffText: string,
): Promise<GitApplyResult> {
	if (isElectron) {
		return window.devilAi.git.applyDiffText(localDir, diffText);
	}
	throw new Error("Git operations are only available in Electron mode");
}

// ============================================================
// Open in external app — Electron-only (main process via IPC)
// ============================================================

/**
 * Gets the list of available "Open in" targets (editors, terminals, file managers)
 * with their availability status and the user's preferred target.
 */
export async function fetchOpenInTargets(): Promise<OpenInTargetsResult> {
	if (isElectron) {
		return window.devilAi.openIn.getTargets();
	}
	throw new Error("Open-in targets are only available in Electron mode");
}

/**
 * Opens a directory in the specified target application.
 * Optionally persists the target as the user's preferred choice.
 */
export async function openInTarget(
	directory: string,
	targetId: string,
	persistPreferred?: boolean,
): Promise<void> {
	if (isElectron) {
		await window.devilAi.openIn.open(directory, targetId, persistPreferred);
		return
	}
	throw new Error("Open-in targets are only available in Electron mode");
}

/**
 * Sets the user's preferred "Open in" target without opening anything.
 */
export async function setOpenInPreferred(
	targetId: string,
): Promise<{ success: boolean }> {
	if (isElectron) {
		return window.devilAi.openIn.setPreferred(targetId);
	}
	throw new Error("Open-in targets are only available in Electron mode");
}

// ============================================================
// Automations — Electron-only
// ============================================================

export async function fetchAutomations(): Promise<Automation[]> {
	if (isElectron) {
		return window.devilAi.automation.list();
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function fetchAutomation(id: string): Promise<Automation | null> {
	if (isElectron) {
		return window.devilAi.automation.get(id);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function createAutomation(
	input: CreateAutomationInput,
): Promise<Automation> {
	if (isElectron) {
		return window.devilAi.automation.create(input);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function updateAutomation(
	input: UpdateAutomationInput,
): Promise<Automation | null> {
	if (isElectron) {
		return window.devilAi.automation.update(input);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function deleteAutomation(id: string): Promise<boolean> {
	if (isElectron) {
		return window.devilAi.automation.delete(id);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function runAutomationNow(id: string): Promise<boolean> {
	if (isElectron) {
		return window.devilAi.automation.runNow(id);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function fetchAutomationRuns(
	automationId?: string,
): Promise<AutomationRun[]> {
	if (isElectron) {
		return window.devilAi.automation.listRuns(automationId);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function archiveAutomationRun(runId: string): Promise<boolean> {
	if (isElectron) {
		return window.devilAi.automation.archiveRun(runId);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function acceptAutomationRun(runId: string): Promise<boolean> {
	if (isElectron) {
		return window.devilAi.automation.acceptRun(runId);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function markAutomationRunRead(runId: string): Promise<boolean> {
	if (isElectron) {
		return window.devilAi.automation.markRunRead(runId);
	}
	throw new Error("Automations are only available in Electron mode");
}

export async function previewAutomationSchedule(
	rrule: string,
	timezone: string,
): Promise<string[]> {
	if (isElectron) {
		return window.devilAi.automation.previewSchedule(rrule, timezone);
	}
	throw new Error("Automations are only available in Electron mode");
}

// ============================================================
// Notes — Electron-only
// ============================================================

export async function fetchNotes(): Promise<
	import("../../preload/api").Note[]
> {
	if (isElectron) {
		return window.devilAi.notes.list();
	}
	throw new Error("Notes are only available in Electron mode");
}

export async function fetchNote(
	id: string,
): Promise<import("../../preload/api").Note | null> {
	if (isElectron) {
		return window.devilAi.notes.get(id);
	}
	throw new Error("Notes are only available in Electron mode");
}

export async function createNote(input: {
	title: string;
	content?: string;
	tags?: string;
	sessionId?: string;
	projectPath?: string;
}): Promise<import("../../preload/api").Note> {
	if (isElectron) {
		return window.devilAi.notes.create(input);
	}
	throw new Error("Notes are only available in Electron mode");
}

export async function updateNote(input: {
	id: string;
	title?: string;
	content?: string;
	tags?: string;
	includeInContext?: boolean;
}): Promise<import("../../preload/api").Note | null> {
	if (isElectron) {
		return window.devilAi.notes.update(input);
	}
	throw new Error("Notes are only available in Electron mode");
}

export async function deleteNote(id: string): Promise<boolean> {
	if (isElectron) {
		return window.devilAi.notes.delete(id);
	}
	throw new Error("Notes are only available in Electron mode");
}

export async function searchNotes(
	query: string,
): Promise<import("../../preload/api").Note[]> {
	if (isElectron) {
		return window.devilAi.notes.search(query);
	}
	throw new Error("Notes are only available in Electron mode");
}

export async function getNotesContext(projectPath?: string): Promise<string> {
	if (isElectron) {
		return window.devilAi.notes.getContext(projectPath);
	}
	throw new Error("Notes are only available in Electron mode");
}

// ============================================================
// Prompt Library — Electron-only
// ============================================================

export async function fetchPrompts(): Promise<import("../../preload/api").Prompt[]> {
	if (isElectron) return window.devilAi.prompts.list()
	throw new Error("Prompt Library is only available in Electron mode")
}

export async function fetchPrompt(id: string): Promise<import("../../preload/api").Prompt | null> {
	if (isElectron) return window.devilAi.prompts.get(id)
	throw new Error("Prompt Library is only available in Electron mode")
}

export async function createPrompt(input: { title: string; content?: string; tags?: string; category?: string }): Promise<import("../../preload/api").Prompt> {
	if (isElectron) return window.devilAi.prompts.create(input)
	throw new Error("Prompt Library is only available in Electron mode")
}

export async function updatePrompt(input: { id: string; title?: string; content?: string; tags?: string; category?: string; isFavorite?: boolean }): Promise<import("../../preload/api").Prompt | null> {
	if (isElectron) return window.devilAi.prompts.update(input)
	throw new Error("Prompt Library is only available in Electron mode")
}

export async function deletePrompt(id: string): Promise<boolean> {
	if (isElectron) return window.devilAi.prompts.delete(id)
	throw new Error("Prompt Library is only available in Electron mode")
}

export async function searchPrompts(query: string): Promise<import("../../preload/api").Prompt[]> {
	if (isElectron) return window.devilAi.prompts.search(query)
	throw new Error("Prompt Library is only available in Electron mode")
}

export async function usePrompt(id: string): Promise<void> {
	if (isElectron) return window.devilAi.prompts.use(id)
	throw new Error("Prompt Library is only available in Electron mode")
}

// ============================================================
// Snippets Manager — Electron-only
// ============================================================

export async function fetchSnippets(): Promise<import("../../preload/api").Snippet[]> {
	if (isElectron) return window.devilAi.snippets.list()
	throw new Error("Snippets Manager is only available in Electron mode")
}

export async function fetchSnippet(id: string): Promise<import("../../preload/api").Snippet | null> {
	if (isElectron) return window.devilAi.snippets.get(id)
	throw new Error("Snippets Manager is only available in Electron mode")
}

export async function createSnippet(input: { title: string; content?: string; language?: string; tags?: string; projectPath?: string }): Promise<import("../../preload/api").Snippet> {
	if (isElectron) return window.devilAi.snippets.create(input)
	throw new Error("Snippets Manager is only available in Electron mode")
}

export async function updateSnippet(input: { id: string; title?: string; content?: string; language?: string; tags?: string; isFavorite?: boolean }): Promise<import("../../preload/api").Snippet | null> {
	if (isElectron) return window.devilAi.snippets.update(input)
	throw new Error("Snippets Manager is only available in Electron mode")
}

export async function deleteSnippet(id: string): Promise<boolean> {
	if (isElectron) return window.devilAi.snippets.delete(id)
	throw new Error("Snippets Manager is only available in Electron mode")
}

export async function searchSnippets(query: string): Promise<import("../../preload/api").Snippet[]> {
	if (isElectron) return window.devilAi.snippets.search(query)
	throw new Error("Snippets Manager is only available in Electron mode")
}

// ============================================================
// Session Templates — Electron-only
// ============================================================

export async function fetchTemplates(): Promise<import("../../preload/api").SessionTemplate[]> {
	if (isElectron) return window.devilAi.templates.list()
	throw new Error("Session Templates are only available in Electron mode")
}

export async function fetchTemplate(id: string): Promise<import("../../preload/api").SessionTemplate | null> {
	if (isElectron) return window.devilAi.templates.get(id)
	throw new Error("Session Templates are only available in Electron mode")
}

export async function createTemplate(input: { name: string; description?: string; config?: string; category?: string }): Promise<import("../../preload/api").SessionTemplate> {
	if (isElectron) return window.devilAi.templates.create(input)
	throw new Error("Session Templates are only available in Electron mode")
}

export async function updateTemplate(input: { id: string; name?: string; description?: string; config?: string; category?: string; isFavorite?: boolean }): Promise<import("../../preload/api").SessionTemplate | null> {
	if (isElectron) return window.devilAi.templates.update(input)
	throw new Error("Session Templates are only available in Electron mode")
}

export async function deleteTemplate(id: string): Promise<boolean> {
	if (isElectron) return window.devilAi.templates.delete(id)
	throw new Error("Session Templates are only available in Electron mode")
}

// ============================================================
// Keyboard Shortcuts — Electron-only
// ============================================================

export async function fetchShortcuts(): Promise<import("../../preload/api").KeyboardShortcut[]> {
	if (isElectron) return window.devilAi.shortcuts.list()
	throw new Error("Keyboard Shortcuts are only available in Electron mode")
}

export async function updateShortcut(input: { id: string; shortcut?: string; isEnabled?: boolean }): Promise<import("../../preload/api").KeyboardShortcut | null> {
	if (isElectron) return window.devilAi.shortcuts.update(input)
	throw new Error("Keyboard Shortcuts are only available in Electron mode")
}

// ============================================================
// Plugin Installer (Electron-only)
// ============================================================

export async function installPlugin(
	url: string,
	type?: "mcp" | "skill" | "plugin",
): Promise<import("../../preload/api").PluginInstallResult> {
	if (isElectron) {
		return window.devilAi.pluginInstaller.install(url, type);
	}
	throw new Error("Plugin installer is only available in Electron mode");
}

export async function listInstalledPlugins(): Promise<
	import("../../preload/api").InstalledPlugins
> {
	if (isElectron) {
		return window.devilAi.pluginInstaller.list();
	}
	throw new Error("Plugin installer is only available in Electron mode");
}

export async function uninstallPlugin(
	name: string,
	type: "mcp" | "skill" | "plugin",
): Promise<{ success: boolean; message: string }> {
	if (isElectron) {
		return window.devilAi.pluginInstaller.uninstall(name, type);
	}
	throw new Error("Plugin installer is only available in Electron mode");
}

// ============================================================
// Image Generation (Electron-only)
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

/**
 * Generate an image using Pollinations.ai free API (no API key required).
 * Returns the local file path of the downloaded image.
 */
export async function generateImage(
	input: GenerateImageInput,
): Promise<GenerateImageResult> {
	if (isElectron) {
		return window.devilAi.generateImage(input);
	}
	throw new Error("Image generation is only available in Electron mode");
}

// ============================================================
// Connectors (Electron-only)
// ============================================================

export async function getConnectorStatuses(): Promise<Record<string, any>> {
	if (isElectron) return window.devilAi.connectors.getStatuses();
	throw new Error("Connectors are only available in Electron mode");
}

export async function setConnectorCredential(id: string, credentials: Record<string, string>): Promise<boolean> {
	if (isElectron) return window.devilAi.connectors.setCredential(id, credentials);
	throw new Error("Connectors are only available in Electron mode");
}

export async function deleteConnectorCredential(id: string): Promise<boolean> {
	if (isElectron) return window.devilAi.connectors.deleteCredential(id);
	throw new Error("Connectors are only available in Electron mode");
}

const SERVER_BASE_URL = "https://devil-ai.agribee.in"

export async function getConnectorServerStatus(): Promise<Record<string, { configured: boolean }>> {
	try {
		const res = await fetch(`${SERVER_BASE_URL}/api/connectors/status`)
		if (!res.ok) return {}
		return await res.json()
	} catch {
		return {}
	}
}

export async function testConnectorConnection(id: string, credentials: Record<string, string>): Promise<{success: boolean, message: string}> {
	if (isElectron) return window.devilAi.connectors.testConnection(id, credentials);
	throw new Error("Connectors are only available in Electron mode");
}
