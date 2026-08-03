/**
 * Types for the scanner output.
 */
import type {
	ClaudeMcpJson,
	ClaudeMcpServer,
	ClaudeProjectSettings,
	ClaudeSessionIndex,
	ClaudeSettings,
	ClaudeUserState,
} from "./claude-code"

export interface ScanOptions {
	/** Scan global Claude Code config (~/.Claude/, ~/.claude.json) */
	global?: boolean
	/** Scan specific project path (defaults to cwd) */
	project?: string
	/** Also scan session history */
	includeHistory?: boolean
	/** Only import history since this date */
	since?: Date
}

export interface ScanResult {
	global: GlobalScanResult
	projects: ProjectScanResult[]
	history?: HistoryScanResult
}

export interface GlobalScanResult {
	/** Parsed global settings.json (global rules, permissions, model, MCP) */
	settings?: ClaudeSettings
	/** Path to the settings file */
	settingsPath?: string
	/** Parsed ~/.claude.json user state */
	userState?: ClaudeUserState
	/** Path to the user state file */
	userStatePath?: string
	/** Global CLAUDE.md content */
	claudeMd?: string
	claudeMdPath?: string
	/** Global skills discovered */
	skills: SkillInfo[]
	/** Non-fatal warnings (e.g. malformed config files that were skipped) */
	warnings: string[]
}

export interface ProjectScanResult {
	/** Absolute path to the project */
	path: string
	/** .claude/settings.local.json */
	settingsLocal?: ClaudeProjectSettings
	settingsLocalPath?: string
	/** .mcp.json content */
	mcpJson?: ClaudeMcpJson
	mcpJsonPath?: string
	/** Agent markdown files found in .claude/agents/ */
	agents: AgentFile[]
	/** Command markdown files found in .claude/commands/ */
	commands: CommandFile[]
	/** Skills found in .claude/skills/ */
	skills: SkillInfo[]
	/** CLAUDE.md content from project root */
	claudeMd?: string
	claudeMdPath?: string
	/** AGENTS.md content from project root (if exists) */
	agentsMd?: string
	agentsMdPath?: string
	/** MCP servers from ~/.claude.json projects[path].mcpServers */
	projectMcpServers: Record<string, ClaudeMcpServer>
	/** Allowed tools from ~/.claude.json projects[path].allowedTools */
	allowedTools?: string[]
	/** Disabled MCP servers from ~/.claude.json */
	disabledMcpServers?: string[]
	/** Enabled MCP servers from ~/.claude.json */
	enabledMcpServers?: string[]
	/** Ignore patterns from ~/.claude.json */
	ignorePatterns?: string[]
	/** Whether trust dialog was accepted */
	trustAccepted?: boolean
	/** Non-fatal warnings (e.g. malformed config files that were skipped) */
	warnings: string[]
}

export interface AgentFile {
	/** Absolute file path */
	path: string
	/** Filename without extension */
	name: string
	/** Raw file content */
	content: string
	/** Parsed YAML frontmatter */
	frontmatter: Record<string, unknown>
	/** Markdown body (below frontmatter) */
	body: string
}

export interface CommandFile {
	path: string
	name: string
	content: string
	frontmatter: Record<string, unknown>
	body: string
}

export interface SkillInfo {
	/** Absolute path to SKILL.md */
	path: string
	/** Skill directory name */
	name: string
	/** Description from frontmatter */
	description?: string
	/** Whether this is a symlink */
	isSymlink: boolean
	/** Symlink target if applicable */
	symlinkTarget?: string
}

export interface HistoryScanResult {
	/** Session indices per project */
	sessionIndices: ProjectSessionIndex[]
	/** Total session count */
	totalSessions: number
	/** Total message count */
	totalMessages: number
	/** Prompt history entries */
	promptHistory?: PromptHistoryEntry[]
}

export interface ProjectSessionIndex {
	projectPath: string
	mangledPath: string
	index: ClaudeSessionIndex
}

export interface PromptHistoryEntry {
	display: string
	timestamp: number
	project?: string
}
