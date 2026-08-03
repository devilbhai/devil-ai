/**
 * Auto-fetch skills from GitHub based on project context.
 *
 * Detects project type (React, Vue, etc.) and fetches relevant skills
 * from configured repositories. Skills are cached locally and refreshed
 * periodically.
 */

import fs from "node:fs/promises"
import path from "node:path"

// ============================================================
// Types
// ============================================================

export interface SkillSource {
	/** GitHub repo in "owner/repo" format */
	repo: string
	/** Skills to fetch from this repo (empty = all) */
	skills?: string[]
	/** Project types this source applies to */
	projectTypes: string[]
	/** Priority (higher = more relevant) */
	priority: number
	/** Optional description */
	description?: string
}

export interface FetchedSkill {
	/** Skill name (from frontmatter) */
	name: string
	/** Skill description */
	description: string
	/** Raw markdown content */
	content: string
	/** Source repo */
	source: string
	/** When it was fetched */
	fetchedAt: number
	/** Project type that triggered this fetch */
	projectType: string
}

export interface ProjectContext {
	/** Detected project type */
	type: string
	/** Package.json dependencies */
	dependencies: string[]
	/** File extensions found */
	extensions: string[]
	/** Framework detected */
	framework?: string
}

// ============================================================
// Skill Sources Registry
// ============================================================

export const SKILL_SOURCES: SkillSource[] = [
	// Security (Priority 1 - highest)
	{
		repo: "mukul975/Anthropic-Cybersecurity-Skills",
		projectTypes: ["security", "pentest", "backend", "fullstack", "web"],
		priority: 100,
		description: "817 cybersecurity skills - 29 domains, MITRE ATT&CK mapped",
	},
	{
		repo: "yaklang/hack-skills",
		projectTypes: ["security", "pentest", "backend", "fullstack", "web"],
		priority: 95,
		description: "101 security skills - web, API, AD, mobile, pwn, crypto, forensics",
	},
	// Design & UI
	{
		repo: "emilkowalski/skills",
		projectTypes: ["react", "nextjs", "vue", "svelte", "frontend"],
		priority: 90,
		description: "Design engineering skills by Emil Kowalski (animations, UI polish)",
	},
	// Security (secondary)
	{
		repo: "yankils/skills",
		projectTypes: ["security", "pentest", "backend", "fullstack"],
		priority: 85,
		description: "Security and penetration testing skills",
	},
	// Data Science
	{
		repo: "jujumilk3/skills",
		projectTypes: ["data-science", "python", "machine-learning"],
		priority: 80,
		description: "Data science and ML skills",
	},
	// DevOps
	{
		repo: "ahmedasmar/skills",
		projectTypes: ["devops", "docker", "kubernetes", "backend"],
		priority: 75,
		description: "DevOps and infrastructure skills",
	},
	// Mobile
	{
		repo: "zoeykelly/skills",
		projectTypes: ["react-native", "flutter", "ios", "android", "mobile"],
		priority: 70,
		description: "Mobile development skills",
	},
	// Creative Tools / Design Automation
	{
		repo: "alisaitteke/photoshop-mcp",
		projectTypes: ["design", "photoshop", "creative", "graphic-design", "image-editing"],
		priority: 85,
		description: "Photoshop MCP - 86 tools for design, image editing, and workflow automation",
	},
	// SkillsLLM Top Skills (Priority 88 - high quality curated skills)
	{
		repo: "obra/superpowers",
		projectTypes: ["fullstack", "backend", "frontend", "web", "api"],
		priority: 88,
		description: "SkillsLLM #1: Agentic skills framework & software development methodology (234k stars)",
	},
	{
		repo: "affaan-m/ECC",
		projectTypes: ["fullstack", "backend", "frontend", "web", "api"],
		priority: 87,
		description: "SkillsLLM #2: Agent harness performance optimization system (232k stars)",
	},
	{
		repo: "NousResearch/hermes-agent",
		projectTypes: ["ai", "machine-learning", "python", "backend"],
		priority: 86,
		description: "SkillsLLM #3: The agent that grows with you (219k stars)",
	},
	{
		repo: "affaan-m/everything-claude-code",
		projectTypes: ["fullstack", "backend", "frontend", "web", "api"],
		priority: 85,
		description: "SkillsLLM #4: Agent harness performance optimization (185k stars)",
	},
	{
		repo: "n8n-io/n8n",
		projectTypes: ["devops", "automation", "workflow", "backend", "api"],
		priority: 84,
		description: "SkillsLLM MCP #1: Workflow automation platform with AI (197k stars)",
	},
	{
		repo: "nextlevelbuilder/ui-ux-pro-max-skill",
		projectTypes: ["design", "ui", "ux", "frontend", "react", "vue"],
		priority: 83,
		description: "SkillsLLM CLI #1: UI/UX design intelligence (109k stars)",
	},
	{
		repo: "D4Vinci/Scrapling",
		projectTypes: ["web", "scraping", "data", "python"],
		priority: 82,
		description: "SkillsLLM MCP #2: Adaptive web scraping framework (70k stars)",
	},
	{
		repo: "sansan0/TrendRadar",
		projectTypes: ["monitoring", "analytics", "data", "python"],
		priority: 81,
		description: "SkillsLLM MCP #3: AI-driven trend monitor with alerts (60k stars)",
	},
	{
		repo: "upstash/context7",
		projectTypes: ["documentation", "ai", "typescript", "backend"],
		priority: 80,
		description: "SkillsLLM MCP #4: Up-to-date code documentation for LLMs (59k stars)",
	},
	{
		repo: "garrytan/gstack",
		projectTypes: ["fullstack", "backend", "frontend", "web", "api"],
		priority: 79,
		description: "SkillsLLM AI #6: 23 opinionated tools for CEO/Designer/Eng (112k stars)",
	},
	{
		repo: "ggml-org/llama.cpp",
		projectTypes: ["ai", "machine-learning", "cpp", "backend"],
		priority: 78,
		description: "SkillsLLM AI #7: LLM inference in C/C++ (103k stars)",
	},
	{
		repo: "Graphify-Labs/graphify",
		projectTypes: ["knowledge", "graph", "python", "data"],
		priority: 77,
		description: "SkillsLLM AI #8: Turn codebase into queryable knowledge graph (94k stars)",
	},
	{
		repo: "JuliusBrussee/caveman",
		projectTypes: ["optimization", "tokens", "javascript", "fullstack"],
		priority: 76,
		description: "SkillsLLM AI #9: Cut 65% of tokens by talking like caveman (92k stars)",
	},
	{
		repo: "thedotmack/claude-mem",
		projectTypes: ["memory", "context", "javascript", "fullstack"],
		priority: 75,
		description: "SkillsLLM AI #10: Persistent context across sessions (88k stars)",
	},
	{
		repo: "DeusData/codebase-memory-mcp",
		projectTypes: ["knowledge", "graph", "c", "backend"],
		priority: 74,
		description: "SkillsLLM MCP #5: High-performance code intelligence (34k stars)",
	},
	{
		repo: "anthropics/claude-plugins-official",
		projectTypes: ["plugins", "claude", "python", "fullstack"],
		priority: 73,
		description: "SkillsLLM MCP #6: Official Anthropic Claude Code Plugins (32k stars)",
	},
	{
		repo: "github/github-mcp-server",
		projectTypes: ["github", "git", "go", "backend"],
		priority: 72,
		description: "SkillsLLM MCP #7: GitHub's official MCP Server (31k stars)",
	},
	{
		repo: "tirth8205/code-review-graph",
		projectTypes: ["code-review", "analysis", "python", "backend"],
		priority: 71,
		description: "SkillsLLM MCP #8: Local-first code intelligence graph (25k stars)",
	},
	{
		repo: "czlonkowski/n8n-mcp",
		projectTypes: ["workflow", "automation", "typescript", "backend"],
		priority: 70,
		description: "SkillsLLM MCP #9: MCP for n8n workflows (22k stars)",
	},
	{
		repo: "davila7/claude-code-templates",
		projectTypes: ["cli", "templates", "python", "fullstack"],
		priority: 69,
		description: "SkillsLLM CLI #2: CLI tool for Claude Code (29k stars)",
	},
	{
		repo: "slopus/happy",
		projectTypes: ["mobile", "web", "typescript", "frontend"],
		priority: 68,
		description: "SkillsLLM CLI #3: Mobile/Web client for Codex/Claude (22k stars)",
	},
	{
		repo: "siteboon/claudecodeui",
		projectTypes: ["mobile", "web", "typescript", "frontend"],
		priority: 67,
		description: "SkillsLLM CLI #4: Use Claude Code on mobile/web (12k stars)",
	},
	{
		repo: "sirmalloc/ccstatusline",
		priority: 66,
		projectTypes: ["cli", "terminal", "typescript", "fullstack"],
		description: "SkillsLLM CLI #5: Beautiful statusline for Claude Code (11k stars)",
	},
	{
		repo: "xonsh/xonsh",
		projectTypes: ["shell", "python", "devops", "cli"],
		priority: 65,
		description: "SkillsLLM DevOps #1: Python-powered shell (9.5k stars)",
	},
	{
		repo: "LukasNiessen/kubernetes-skill",
		projectTypes: ["kubernetes", "docker", "devops", "backend"],
		priority: 64,
		description: "SkillsLLM DevOps #4: Kubernetes skill for Claude Code",
	},
	{
		repo: "LukasNiessen/terrashark",
		priority: 63,
		projectTypes: ["terraform", "infrastructure", "devops", "backend"],
		description: "SkillsLLM DevOps #5: Terraform skill for Claude Code",
	},
]

// ============================================================
// Project Detection
// ============================================================

/** File extensions to project type mapping */
const EXTENSION_MAP: Record<string, string[]> = {
	".tsx": ["react", "frontend"],
	".jsx": ["react", "frontend"],
	".vue": ["vue", "frontend"],
	".svelte": ["svelte", "frontend"],
	".swift": ["ios", "mobile"],
	".kt": ["android", "mobile"],
	".dart": ["flutter", "mobile"],
	".py": ["python", "data-science"],
	".rs": ["rust", "backend"],
	".go": ["go", "backend"],
	".java": ["java", "backend"],
	".ts": ["typescript", "frontend", "backend"],
	".psd": ["photoshop", "design", "creative"],
	".psb": ["photoshop", "design", "creative"],
	".ai": ["illustrator", "design", "creative"],
	".indd": ["indesign", "design", "creative"],
	".sketch": ["sketch", "design", "frontend"],
	".fig": ["figma", "design", "frontend"],
	".xd": ["adobe-xd", "design", "frontend"],
}

/** Package name to project type mapping */
const PACKAGE_MAP: Record<string, string[]> = {
	react: ["react", "frontend"],
	"react-dom": ["react", "frontend"],
	next: ["nextjs", "frontend"],
	"next.js": ["nextjs", "frontend"],
	vue: ["vue", "frontend"],
	nuxt: ["vue", "frontend"],
	svelte: ["svelte", "frontend"],
	"@sveltejs/kit": ["svelte", "frontend"],
	"react-native": ["react-native", "mobile"],
	flutter: ["flutter", "mobile"],
	django: ["python", "backend"],
	fastapi: ["python", "backend"],
	flask: ["python", "backend"],
 express: ["nodejs", "backend"],
	fastify: ["nodejs", "backend"],
	nestjs: ["nodejs", "backend"],
	"@nestjs/core": ["nodejs", "backend"],
	docker: ["docker", "devops"],
	kubernetes: ["kubernetes", "devops"],
	terraform: ["terraform", "devops"],
	aws: ["cloud", "devops"],
	"@aws-sdk/client-s3": ["cloud", "devops"],
 tensorflow: ["machine-learning", "data-science"],
	pytorch: ["machine-learning", "data-science"],
	numpy: ["data-science", "python"],
	pandas: ["data-science", "python"],
}

/**
 * Detect project context from directory
 */
export async function detectProjectContext(projectDir: string): Promise<ProjectContext> {
	const context: ProjectContext = {
		type: "unknown",
		dependencies: [],
		extensions: [],
	}

	try {
		// Read package.json
		const pkgPath = path.join(projectDir, "package.json")
		try {
			const pkgContent = await fs.readFile(pkgPath, "utf-8")
			const pkg = JSON.parse(pkgContent)
			const allDeps = {
				...pkg.dependencies,
				...pkg.devDependencies,
				...pkg.peerDependencies,
			}
			context.dependencies = Object.keys(allDeps)

			// Detect project types from dependencies
			const detectedTypes = new Set<string>()
			for (const dep of context.dependencies) {
				const types = PACKAGE_MAP[dep]
				if (types) {
					types.forEach((t) => detectedTypes.add(t))
				}
			}

			if (detectedTypes.size > 0) {
				context.type = [...detectedTypes].sort((a, b) => {
					// Prioritize specific types over generic ones
					const priority = ["frontend", "backend", "mobile", "data-science"]
					const aIdx = priority.indexOf(a)
					const bIdx = priority.indexOf(b)
					return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
				})[0]
			}

			// Detect framework
			if (allDeps.next) context.framework = "nextjs"
			else if (allDeps.nuxt) context.framework = "nuxt"
			else if (allDeps["@sveltejs/kit"]) context.framework = "sveltekit"
			else if (allDeps["@nestjs/core"]) context.framework = "nestjs"
			else if (allDeps.fastify) context.framework = "fastify"
			else if (allDeps.express) context.framework = "express"
			else if (allDeps.django) context.framework = "django"
			else if (allDeps.fastapi) context.framework = "fastapi"
		} catch {
			// No package.json
		}

		// Scan file extensions (limited to top-level dirs)
		const extCounts = new Map<string, number>()
		await scanExtensions(projectDir, extCounts, 0)

		context.extensions = [...extCounts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([ext]) => ext)

		// Detect from extensions if no dependencies found
		if (context.type === "unknown" && context.extensions.length > 0) {
			const detectedTypes = new Set<string>()
			for (const ext of context.extensions) {
				const types = EXTENSION_MAP[ext]
				if (types) {
					types.forEach((t) => detectedTypes.add(t))
				}
			}
			if (detectedTypes.size > 0) {
				context.type = [...detectedTypes][0]
			}
		}
	} catch (err) {
		console.error("Failed to detect project context:", err)
	}

	return context
}

/**
 * Recursively scan directory for file extensions (limited depth)
 */
async function scanExtensions(
	dir: string,
	extCounts: Map<string, number>,
	depth: number,
): Promise<void> {
	if (depth > 3) return

	try {
		const entries = await fs.readdir(dir, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.name.startsWith(".") || entry.name === "node_modules") continue

			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				await scanExtensions(fullPath, extCounts, depth + 1)
			} else {
				const ext = path.extname(entry.name)
				if (ext) {
					extCounts.set(ext, (extCounts.get(ext) || 0) + 1)
				}
			}
		}
	} catch {
		// Permission denied or other error
	}
}

// ============================================================
// Skill Fetching
// ============================================================

/**
 * Get relevant skill sources for a project context
 */
export function getRelevantSources(context: ProjectContext): SkillSource[] {
	return SKILL_SOURCES.filter((source) =>
		source.projectTypes.some(
			(t) =>
				context.type.includes(t) ||
				t.includes(context.type) ||
				context.dependencies.some((d) => d.includes(t)) ||
				context.framework?.includes(t),
		),
	).sort((a, b) => b.priority - a.priority)
}

/**
 * Fetch a single skill from GitHub
 */
async function fetchSkillFromGitHub(
	repo: string,
	skillName: string,
): Promise<FetchedSkill | null> {
	try {
		const url = `https://raw.githubusercontent.com/${repo}/main/skills/${skillName}/SKILL.md`
		const response = await fetch(url)
		if (!response.ok) return null

		const content = await response.text()

		// Parse frontmatter
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
		let name = skillName
		let description = ""

		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1]
			const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
			const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
			if (nameMatch) name = nameMatch[1].trim()
			if (descMatch) description = descMatch[1].trim()
		}

		return {
			name,
			description,
			content,
			source: repo,
			fetchedAt: Date.now(),
			projectType: "",
		}
	} catch {
		return null
	}
}

/**
 * Fetch all skills from a repository
 */
async function fetchAllSkillsFromRepo(repo: string): Promise<FetchedSkill[]> {
	try {
		const url = `https://api.github.com/repos/${repo}/contents/skills`
		const response = await fetch(url)
		if (!response.ok) return []

		const data = await response.json()
		if (!Array.isArray(data)) return []

		const skills: FetchedSkill[] = []
		for (const item of data) {
			if (item.type === "dir") {
				const skill = await fetchSkillFromGitHub(repo, item.name)
				if (skill) skills.push(skill)
			}
		}

		return skills
	} catch {
		return []
	}
}

/**
 * Fetch skills for a project context
 */
export async function fetchSkillsForProject(
	context: ProjectContext,
	cacheDir: string,
): Promise<FetchedSkill[]> {
	const sources = getRelevantSources(context)
	const allSkills: FetchedSkill[] = []

	for (const source of sources) {
		// Check cache first
		const cachePath = path.join(cacheDir, `${source.repo.replace("/", "_")}.json`)
		try {
			const cached = await fs.readFile(cachePath, "utf-8")
			const cacheData = JSON.parse(cached)

			// Cache valid for 24 hours
			if (Date.now() - cacheData.fetchedAt < 24 * 60 * 60 * 1000) {
				allSkills.push(
					...cacheData.skills.map((s: FetchedSkill) => ({
						...s,
						projectType: context.type,
					})),
				)
				continue
			}
		} catch {
			// No cache or invalid cache
		}

		// Fetch from GitHub
		console.log(`Fetching skills from ${source.repo}...`)
		let skills: FetchedSkill[]

		if (source.skills && source.skills.length > 0) {
			// Fetch specific skills
			skills = []
			for (const skillName of source.skills) {
				const skill = await fetchSkillFromGitHub(source.repo, skillName)
				if (skill) {
					skill.projectType = context.type
					skills.push(skill)
				}
			}
		} else {
			// Fetch all skills from repo
			skills = await fetchAllSkillsFromRepo(source.repo)
			skills.forEach((s) => {
				s.projectType = context.type
			})
		}

		// Cache the result
		try {
			await fs.mkdir(cacheDir, { recursive: true })
			await fs.writeFile(
				cachePath,
				JSON.stringify({
					repo: source.repo,
					skills,
					fetchedAt: Date.now(),
				}),
			)
		} catch {
			// Cache write failed
		}

		allSkills.push(...skills)
	}

	return allSkills
}

/**
 * Get cached skills (without fetching)
 */
export async function getCachedSkills(cacheDir: string): Promise<FetchedSkill[]> {
	try {
		const files = await fs.readdir(cacheDir)
		const skills: FetchedSkill[] = []

		for (const file of files) {
			if (!file.endsWith(".json")) continue
			try {
				const content = await fs.readFile(path.join(cacheDir, file), "utf-8")
				const data = JSON.parse(content)
				skills.push(...data.skills)
			} catch {
				// Invalid cache file
			}
		}

		return skills
	} catch {
		return []
	}
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(cacheDir: string): Promise<void> {
	try {
		const files = await fs.readdir(cacheDir)
		for (const file of files) {
			if (!file.endsWith(".json")) continue
			try {
				const content = await fs.readFile(path.join(cacheDir, file), "utf-8")
				const data = JSON.parse(content)
				if (Date.now() - data.fetchedAt > 7 * 24 * 60 * 60 * 1000) {
					await fs.unlink(path.join(cacheDir, file))
				}
			} catch {
				// Ignore errors
			}
		}
	} catch {
		// Ignore errors
	}
}
