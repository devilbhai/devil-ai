/**
 * Plugin Installer - Auto-detect and install GitHub repos as MCP servers, skills, or plugins.
 *
 * Flow:
 * 1. User provides GitHub repo URL
 * 2. Clone repo to temp directory
 * 3. Detect type by examining repo structure
 * 4. Install to appropriate location
 * 5. Update config if needed (MCP servers)
 * 6. Return installation result
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { createLogger } from "../logger"
import { getConfigDir } from "../automation/paths"

const log = createLogger("plugin-installer")
const execFileAsync = promisify(execFile)

export type PluginType = "mcp" | "skill" | "plugin" | "unknown"

export interface DetectedPlugin {
	type: PluginType
	name: string
	description: string
	/** For MCP: the command to run */
	mcpCommand?: string[]
	/** For MCP: environment variables */
	mcpEnv?: Record<string, string>
	/** For skill: the SKILL.md content */
	skillContent?: string
	/** Package.json dependencies */
	dependencies?: Record<string, string>
}

export interface InstallResult {
	success: boolean
	type: PluginType
	name: string
	path: string
	message: string
	/** For MCP servers, the config entry that was added */
	mcpConfig?: Record<string, unknown>
}

/**
 * Parse a GitHub URL to extract owner and repo name.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
	// Handle various formats:
	// https://github.com/owner/repo
	// https://github.com/owner/repo.git
	// git@github.com:owner/repo.git
	const patterns = [
		/https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/,
		/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/,
	]

	for (const pattern of patterns) {
		const match = url.match(pattern)
		if (match) {
			return { owner: match[1], repo: match[2] }
		}
	}
	return null
}

/**
 * Detect plugin type by examining repo structure.
 */
async function detectPluginType(cloneDir: string): Promise<PluginType> {
	const files = fs.readdirSync(cloneDir)

	// Check for MCP server indicators
	const hasPackageJson = files.includes("package.json")
	const hasPyprojectToml = files.includes("pyproject.toml")
	const hasCargoToml = files.includes("Cargo.toml")

	if (hasPackageJson) {
		try {
			const pkg = JSON.parse(fs.readFileSync(path.join(cloneDir, "package.json"), "utf-8"))

			// Check if it's an MCP server
			if (
				pkg.name?.includes("mcp") ||
				pkg.keywords?.includes("mcp") ||
				pkg.dependencies?.["@modelcontextprotocol/sdk"] ||
				pkg.dependencies?.["@modelcontextprotocol/server"]
			) {
				return "mcp"
			}

			// Check if it has a bin entry (could be a CLI plugin)
			if (pkg.bin) {
				return "plugin"
			}
		} catch {
			// Ignore parse errors
		}
	}

	// Check for skill indicators
	const hasSkillMd = files.includes("SKILL.md")
	const hasSkillDir = fs.existsSync(path.join(cloneDir, "skills"))

	if (hasSkillMd || hasSkillDir) {
		return "skill"
	}

	// Check for Python MCP server
	if (hasPyprojectToml) {
		try {
			const toml = fs.readFileSync(path.join(cloneDir, "pyproject.toml"), "utf-8")
			if (toml.includes("mcp") || toml.includes("modelcontextprotocol")) {
				return "mcp"
			}
		} catch {
			// Ignore
		}
	}

	// Check for Rust MCP server
	if (hasCargoToml) {
		try {
			const toml = fs.readFileSync(path.join(cloneDir, "Cargo.toml"), "utf-8")
			if (toml.includes("mcp") || toml.includes("modelcontextprotocol")) {
				return "mcp"
			}
		} catch {
			// Ignore
		}
	}

	// Default to plugin if it has package.json
	if (hasPackageJson) {
		return "plugin"
	}

	return "unknown"
}

/**
 * Extract MCP server config from a cloned repo.
 */
async function extractMcpConfig(cloneDir: string, name: string): Promise<DetectedPlugin> {
	const pkgPath = path.join(cloneDir, "package.json")

	if (fs.existsSync(pkgPath)) {
		const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))

		return {
			type: "mcp",
			name,
			description: pkg.description || `MCP server: ${name}`,
			mcpCommand: ["npx", "-y", pkg.name || name],
			dependencies: pkg.dependencies,
		}
	}

	// Python MCP server
	if (fs.existsSync(path.join(cloneDir, "pyproject.toml"))) {
		return {
			type: "mcp",
			name,
			description: `MCP server: ${name}`,
			mcpCommand: ["uvx", name],
		}
	}

	// Rust MCP server
	if (fs.existsSync(path.join(cloneDir, "Cargo.toml"))) {
		return {
			type: "mcp",
			name,
			description: `MCP server: ${name}`,
			mcpCommand: ["cargo", "run", "--release", "--bin", name],
		}
	}

	return { type: "mcp", name, description: `MCP server: ${name}` }
}

/**
 * Extract skill config from a cloned repo.
 */
async function extractSkillConfig(cloneDir: string, name: string): Promise<DetectedPlugin> {
	const skillMdPath = path.join(cloneDir, "SKILL.md")

	if (fs.existsSync(skillMdPath)) {
		const content = fs.readFileSync(skillMdPath, "utf-8")
		const nameMatch = content.match(/^name:\s*(.+)$/m)
		const descMatch = content.match(/^description:\s*(.+)$/m)

		return {
			type: "skill",
			name: nameMatch?.[1]?.trim() || name,
			description: descMatch?.[1]?.trim() || `Skill: ${name}`,
			skillContent: content,
		}
	}

	return { type: "skill", name, description: `Skill: ${name}` }
}

/**
 * Install an MCP server to the engine config.
 */
async function installMcpServer(detected: DetectedPlugin): Promise<InstallResult> {
	const configDir = getConfigDir()
	const configPath = path.join(configDir, "opencode.json")

	// Read existing config
	let config: Record<string, unknown> = {}
	if (fs.existsSync(configPath)) {
		config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
	}

	// Add MCP server
	const mcp = (config.mcp || {}) as Record<string, unknown>
	const serverName = detected.name

	mcp[serverName] = {
		type: "local",
		command: detected.mcpCommand,
		environment: detected.mcpEnv || {},
		enabled: true,
	}

	config.mcp = mcp

	// Write config
	fs.mkdirSync(configDir, { recursive: true })
	fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"))

	log.info("MCP server installed", { name: serverName })

	return {
		success: true,
		type: "mcp",
		name: serverName,
		path: configPath,
		message: `MCP server "${serverName}" added to config. Restart the server to activate.`,
		mcpConfig: mcp[serverName] as Record<string, unknown>,
	}
}

/**
 * Install a skill to the skills directory.
 */
async function installSkill(detected: DetectedPlugin, cloneDir: string): Promise<InstallResult> {
	const skillsDir = path.join(getConfigDir(), "skills", detected.name)
	fs.mkdirSync(skillsDir, { recursive: true })

	// Copy SKILL.md
	const skillMdPath = path.join(cloneDir, "SKILL.md")
	if (fs.existsSync(skillMdPath)) {
		fs.copyFileSync(skillMdPath, path.join(skillsDir, "SKILL.md"))
	} else if (detected.skillContent) {
		fs.writeFileSync(path.join(skillsDir, "SKILL.md"), detected.skillContent)
	}

	log.info("Skill installed", { name: detected.name, path: skillsDir })

	return {
		success: true,
		type: "skill",
		name: detected.name,
		path: skillsDir,
		message: `Skill "${detected.name}" installed. It will be available in the next session.`,
	}
}

/**
 * Install a plugin (npm package or local files).
 */
async function installPlugin(detected: DetectedPlugin, cloneDir: string): Promise<InstallResult> {
	const pluginsDir = path.join(getConfigDir(), "plugins", detected.name)
	fs.mkdirSync(pluginsDir, { recursive: true })

	// Copy all files from clone dir
	const copyDir = (src: string, dest: string) => {
		const entries = fs.readdirSync(src, { withFileTypes: true })
		for (const entry of entries) {
			const srcPath = path.join(src, entry.name)
			const destPath = path.join(dest, entry.name)
			if (entry.isDirectory()) {
				copyDir(srcPath, destPath)
			} else {
				fs.copyFileSync(srcPath, destPath)
			}
		}
	}

	copyDir(cloneDir, pluginsDir)

	// Install dependencies if package.json exists
	const pkgPath = path.join(pluginsDir, "package.json")
	if (fs.existsSync(pkgPath)) {
		try {
			log.info("Installing plugin dependencies", { path: pluginsDir })
			await execFileAsync("npm", ["install", "--production", "--ignore-scripts"], { cwd: pluginsDir })
		} catch (err) {
			log.warn("Failed to install plugin dependencies", { error: err })
		}
	}

	log.info("Plugin installed", { name: detected.name, path: pluginsDir })

	return {
		success: true,
		type: "plugin",
		name: detected.name,
		path: pluginsDir,
		message: `Plugin "${detected.name}" installed. Restart the app to activate.`,
	}
}

/**
 * Main installation function.
 * Clones a GitHub repo and installs it as an MCP server, skill, or plugin.
 */
export async function installFromGitHub(
	githubUrl: string,
	forcedType?: PluginType,
): Promise<InstallResult> {
	const parsed = parseGitHubUrl(githubUrl)
	if (!parsed) {
		return {
			success: false,
			type: "unknown",
			name: "",
			path: "",
			message: "Invalid GitHub URL. Please provide a valid GitHub repository URL.",
		}
	}

	const { owner, repo } = parsed

	log.info("Starting plugin installation", { url: githubUrl, owner, repo })

	// Clone to temp directory
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "devil-ai-plugin-"))
	const cloneDir = path.join(tmpDir, repo)

	try {
		// Clone with depth 1 (shallow clone)
		await execFileAsync("git", ["clone", "--depth", "1", githubUrl, cloneDir])

		// Detect plugin type
		const detectedType = forcedType || (await detectPluginType(cloneDir))
		log.info("Detected plugin type", { type: detectedType })

		if (detectedType === "unknown") {
			return {
				success: false,
				type: "unknown",
				name: repo,
				path: cloneDir,
				message: "Could not detect plugin type. Please specify the type manually.",
			}
		}

		// Extract config based on type
		let detected: DetectedPlugin
		switch (detectedType) {
			case "mcp":
				detected = await extractMcpConfig(cloneDir, repo)
				return installMcpServer(detected)
			case "skill":
				detected = await extractSkillConfig(cloneDir, repo)
				return installSkill(detected, cloneDir)
			case "plugin":
				detected = { type: "plugin", name: repo, description: `Plugin: ${repo}` }
				return installPlugin(detected, cloneDir)
			default:
				return {
					success: false,
					type: "unknown",
					name: repo,
					path: cloneDir,
					message: `Unsupported plugin type: ${detectedType}`,
				}
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		log.error("Installation failed", { error: message })
		return {
			success: false,
			type: "unknown",
			name: repo,
			path: cloneDir,
			message: `Installation failed: ${message}`,
		}
	}
}

/**
 * List installed plugins (MCP servers, skills, plugins).
 */
export async function listInstalled(): Promise<{
	mcpServers: string[]
	skills: string[]
	plugins: string[]
}> {
	const configDir = getConfigDir()

	// MCP servers from config
	let mcpServers: string[] = []
	const configPath = path.join(configDir, "opencode.json")
	if (fs.existsSync(configPath)) {
		try {
			const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
			mcpServers = Object.keys(config.mcp || {})
		} catch {
			// Ignore
		}
	}

	// Skills
	const skillsDir = path.join(configDir, "skills")
	let skills: string[] = []
	if (fs.existsSync(skillsDir)) {
		skills = fs.readdirSync(skillsDir).filter((f) => {
			const skillPath = path.join(skillsDir, f)
			return fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, "SKILL.md"))
		})
	}

	// Plugins
	const pluginsDir = path.join(configDir, "plugins")
	let plugins: string[] = []
	if (fs.existsSync(pluginsDir)) {
		plugins = fs.readdirSync(pluginsDir).filter((f) => {
			return fs.statSync(path.join(pluginsDir, f)).isDirectory()
		})
	}

	return { mcpServers, skills, plugins }
}

/**
 * Uninstall a plugin by name and type.
 */
export async function uninstall(name: string, type: PluginType): Promise<{ success: boolean; message: string }> {
	const configDir = getConfigDir()

	switch (type) {
		case "mcp": {
			const configPath = path.join(configDir, "opencode.json")
			if (!fs.existsSync(configPath)) {
				return { success: false, message: "Config file not found" }
			}
			const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
			if (!config.mcp?.[name]) {
				return { success: false, message: `MCP server "${name}" not found` }
			}
			delete config.mcp[name]
			fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"))
			return { success: true, message: `MCP server "${name}" removed. Restart server to apply.` }
		}
		case "skill": {
			const skillDir = path.join(configDir, "skills", name)
			if (!fs.existsSync(skillDir)) {
				return { success: false, message: `Skill "${name}" not found` }
			}
			fs.rmSync(skillDir, { recursive: true, force: true })
			return { success: true, message: `Skill "${name}" removed.` }
		}
		case "plugin": {
			const pluginDir = path.join(configDir, "plugins", name)
			if (!fs.existsSync(pluginDir)) {
				return { success: false, message: `Plugin "${name}" not found` }
			}
			fs.rmSync(pluginDir, { recursive: true, force: true })
			return { success: true, message: `Plugin "${name}" removed.` }
		}
		default:
			return { success: false, message: `Unknown plugin type: ${type}` }
	}
}
