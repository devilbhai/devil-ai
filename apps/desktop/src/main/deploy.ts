/**
 * One-Click Deploy — deploy projects to Vercel, Netlify, or Railway
 * directly from Devil AI.
 *
 * Features:
 * - Auto-detect framework (React, Next.js, Vue, Svelte, etc.)
 * - Build command detection
 * - Environment variable management
 * - Deploy status tracking
 * - Preview URLs
 */

import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createLogger } from "./logger"

const log = createLogger("deploy")

// ============================================================
// Types
// ============================================================

export type DeployProvider = "vercel" | "netlify" | "railway"

export type DeployStatus =
	| "idle"
	| "building"
	| "deploying"
	| "success"
	| "failed"
	| "cancelled"

export interface DeployConfig {
	provider: DeployProvider
	projectDir: string
	/** Project name on the platform */
	projectName?: string
	/** Build command (auto-detected if not provided) */
	buildCommand?: string
	/** Output directory */
	outputDir?: string
	/** Install command */
	installCommand?: string
	/** Node version */
	nodeVersion?: string
	/** Environment variables */
	envVars?: Record<string, string>
	/** Framework preset */
	framework?: string
	/** Start command (for Railway) */
	startCommand?: string
}

export interface DeployResult {
	success: boolean
	deployId?: string
	url?: string
	previewUrl?: string
	provider: DeployProvider
	status: DeployStatus
	error?: string
	logs?: string[]
}

export interface DeployStatusUpdate {
	deployId: string
	provider: DeployProvider
	status: DeployStatus
	url?: string
	previewUrl?: string
	logs?: string[]
	timestamp: number
}

// ============================================================
// Framework Detection
// ============================================================

interface FrameworkPreset {
	name: string
	buildCommand: string
	outputDir: string
	installCommand?: string
	framework?: string
}

const FRAMEWORK_PRESETS: Array<{
	detect: (dir: string) => boolean
	preset: FrameworkPreset
}> = [
	{
		detect: (dir) => existsSync(join(dir, "next.config.js")) || existsSync(join(dir, "next.config.mjs")) || existsSync(join(dir, "next.config.ts")),
		preset: {
			name: "Next.js",
			buildCommand: "next build",
			outputDir: ".next",
			framework: "nextjs",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "nuxt.config.js")) || existsSync(join(dir, "nuxt.config.ts")) || existsSync(join(dir, "nuxt.config.mjs")),
		preset: {
			name: "Nuxt",
			buildCommand: "nuxt build",
			outputDir: ".output/public",
			framework: "nuxt",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "vite.config.ts")) || existsSync(join(dir, "vite.config.js")) || existsSync(join(dir, "vite.config.mjs")),
		preset: {
			name: "Vite",
			buildCommand: "vite build",
			outputDir: "dist",
			framework: "vite",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "svelte.config.js")) || existsSync(join(dir, "svelte.config.ts")),
		preset: {
			name: "SvelteKit",
			buildCommand: "vite build",
			outputDir: ".svelte-kit/output",
			framework: "sveltekit",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "angular.json")),
		preset: {
			name: "Angular",
			buildCommand: "ng build",
			outputDir: "dist",
			framework: "angular",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "remix.config.js")) || existsSync(join(dir, "remix.config.mjs")),
		preset: {
			name: "Remix",
			buildCommand: "remix build",
			outputDir: "public",
			framework: "remix",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "astro.config.mjs")) || existsSync(join(dir, "astro.config.ts")),
		preset: {
			name: "Astro",
			buildCommand: "astro build",
			outputDir: "dist",
			framework: "astro",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "package.json")),
		preset: {
			name: "Node.js",
			buildCommand: "npm run build",
			outputDir: "dist",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "requirements.txt")) || existsSync(join(dir, "pyproject.toml")),
		preset: {
			name: "Python",
			buildCommand: "",
			outputDir: ".",
			framework: "python",
		},
	},
	{
		detect: (dir) => existsSync(join(dir, "Gemfile")),
		preset: {
			name: "Ruby",
			buildCommand: "bundle exec rake assets:precompile",
			outputDir: "public",
			framework: "ruby",
		},
	},
]

export function detectFramework(projectDir: string): FrameworkPreset | null {
	for (const { detect, preset } of FRAMEWORK_PRESETS) {
		if (detect(projectDir)) {
			log.info("Framework detected", { framework: preset.name, dir: projectDir })
			return preset
		}
	}
	return null
}

// ============================================================
// Config Generation
// ============================================================

export function generateVercelConfig(config: DeployConfig): string {
	const vercelConfig: Record<string, unknown> = {
		version: 2,
		buildCommand: config.buildCommand,
		outputDirectory: config.outputDir,
		framework: config.framework,
	}

	if (config.envVars && Object.keys(config.envVars).length > 0) {
		vercelConfig.env = config.envVars
	}

	return JSON.stringify(vercelConfig, null, 2)
}

export function generateNetlifyConfig(config: DeployConfig): string {
	const lines: string[] = []
	if (config.buildCommand) lines.push(`command = "${config.buildCommand}"`)
	if (config.outputDir) lines.push(`publish = "${config.outputDir}"`)
	if (config.nodeVersion) lines.push(`node_version = "${config.nodeVersion}"`)
	return lines.join("\n")
}

export function generateRailwayConfig(config: DeployConfig): string {
	const railwayConfig: Record<string, unknown> = {
		build: {
			builder: "NIXPACKS",
			buildCommand: config.buildCommand,
		},
		deploy: {
			startCommand: config.startCommand || "npm start",
			healthcheckPath: "/",
			healthcheckTimeout: 300,
			restartPolicyType: "ON_FAILURE",
			restartPolicyMaxRetries: 3,
		},
	}

	return JSON.stringify(railwayConfig, null, 2)
}

// ============================================================
// Deploy Operations (placeholder — real implementations
// would use platform-specific APIs)
// ============================================================

export async function deployToVercel(config: DeployConfig): Promise<DeployResult> {
	const preset = detectFramework(config.projectDir)
	const buildCmd = config.buildCommand || preset?.buildCommand
	const outDir = config.outputDir || preset?.outputDir

	log.info("Deploying to Vercel", {
		project: config.projectName,
		build: buildCmd,
		output: outDir,
	})

	// Write vercel.json if it doesn't exist
	const vercelJsonPath = join(config.projectDir, "vercel.json")
	if (!existsSync(vercelJsonPath)) {
		const vercelConfig = generateVercelConfig({
			...config,
			buildCommand: buildCmd,
			outputDir: outDir,
			framework: preset?.framework,
		})
		writeFileSync(vercelJsonPath, vercelConfig)
		log.info("Generated vercel.json", { path: vercelJsonPath })
	}

	return {
		success: true,
		deployId: `vercel-${Date.now()}`,
		provider: "vercel",
		status: "building",
		previewUrl: `https://${config.projectName || "project"}.vercel.app`,
	}
}

export async function deployToNetlify(config: DeployConfig): Promise<DeployResult> {
	const preset = detectFramework(config.projectDir)
	const buildCmd = config.buildCommand || preset?.buildCommand
	const outDir = config.outputDir || preset?.outputDir

	log.info("Deploying to Netlify", {
		project: config.projectName,
		build: buildCmd,
		output: outDir,
	})

	// Write netlify.toml if it doesn't exist
	const netlifyTomlPath = join(config.projectDir, "netlify.toml")
	if (!existsSync(netlifyTomlPath)) {
		const netlifyConfig = generateNetlifyConfig({
			...config,
			buildCommand: buildCmd,
			outputDir: outDir,
		})
		writeFileSync(netlifyTomlPath, netlifyConfig)
		log.info("Generated netlify.toml", { path: netlifyTomlPath })
	}

	return {
		success: true,
		deployId: `netlify-${Date.now()}`,
		provider: "netlify",
		status: "building",
		previewUrl: `https://${config.projectName || "project"}.netlify.app`,
	}
}

export async function deployToRailway(config: DeployConfig): Promise<DeployResult> {
	const preset = detectFramework(config.projectDir)
	const buildCmd = config.buildCommand || preset?.buildCommand

	log.info("Deploying to Railway", {
		project: config.projectName,
		build: buildCmd,
	})

	return {
		success: true,
		deployId: `railway-${Date.now()}`,
		provider: "railway",
		status: "building",
		previewUrl: `https://${config.projectName || "project"}.up.railway.app`,
	}
}

// ============================================================
// Unified Deploy
// ============================================================

export async function deploy(config: DeployConfig): Promise<DeployResult> {
	switch (config.provider) {
		case "vercel":
			return deployToVercel(config)
		case "netlify":
			return deployToNetlify(config)
		case "railway":
			return deployToRailway(config)
		default:
			return {
				success: false,
				provider: config.provider,
				status: "failed",
				error: `Unknown provider: ${config.provider}`,
			}
	}
}

// ============================================================
// Deploy Status Tracking
// ============================================================

const activeDeploys = new Map<string, DeployStatusUpdate>()

export function trackDeploy(update: DeployStatusUpdate): void {
	activeDeploys.set(update.deployId, update)
	log.info("Deploy status updated", {
		deployId: update.deployId,
		status: update.status,
		provider: update.provider,
	})
}

export function getDeployStatus(deployId: string): DeployStatusUpdate | undefined {
	return activeDeploys.get(deployId)
}

export function listActiveDeploys(): DeployStatusUpdate[] {
	return Array.from(activeDeploys.values())
}
