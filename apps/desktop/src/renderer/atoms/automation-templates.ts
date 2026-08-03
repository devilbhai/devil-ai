/**
 * Automation Templates atoms — gallery of pre-built automation templates.
 */
import { atom } from "jotai"

export interface AutomationTemplate {
	id: string
	name: string
	description: string
	category: "security" | "quality" | "documentation" | "testing" | "deployment" | "maintenance"
	prompt: string
	schedule: string
	icon: string
	author: string
	installCount: number
	tags: string[]
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
	{
		id: "dep-audit",
		name: "Nightly Dependency Audit",
		description: "Scan for outdated/vulnerable dependencies every night",
		category: "security",
		prompt:
			"Check all dependencies in package.json and lock files for known vulnerabilities and outdated versions. Report critical findings.",
		schedule: "RRULE:FREQ=DAILY;BYHOUR=2;BYMINUTE=0",
		icon: "shield",
		author: "Devil AI",
		installCount: 0,
		tags: ["security", "dependencies", "npm"],
	},
	{
		id: "test-suite",
		name: "Weekly Test Suite",
		description: "Run full test suite and report failures",
		category: "testing",
		prompt: "Run the full test suite. Analyze any failures and suggest fixes.",
		schedule: "RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=9",
		icon: "test-tube",
		author: "Devil AI",
		installCount: 0,
		tags: ["testing", "ci", "quality"],
	},
	{
		id: "pr-review",
		name: "PR Review on Push",
		description: "Review code changes when pushed to a branch",
		category: "quality",
		prompt:
			"Review the recent code changes. Check for bugs, security issues, performance problems, and style violations. Provide actionable feedback.",
		schedule: "on-push",
		icon: "git-pull-request",
		author: "Devil AI",
		installCount: 0,
		tags: ["review", "git", "quality"],
	},
	{
		id: "code-quality",
		name: "Code Quality Scan",
		description: "Weekly code quality and complexity analysis",
		category: "quality",
		prompt:
			"Analyze code quality metrics: complexity, duplication, naming conventions, error handling. Suggest improvements.",
		schedule: "RRULE:FREQ=WEEKLY;BYDAY=WE;BYHOUR=10",
		icon: "scan",
		author: "Devil AI",
		installCount: 0,
		tags: ["quality", "refactoring", "metrics"],
	},
	{
		id: "doc-freshness",
		name: "Documentation Freshness",
		description: "Check if docs match current code",
		category: "documentation",
		prompt:
			"Compare README.md, docs/, and code comments against actual implementation. Flag outdated documentation.",
		schedule: "RRULE:FREQ=WEEKLY;BYDAY=FR;BYHOUR=14",
		icon: "book-open",
		author: "Devil AI",
		installCount: 0,
		tags: ["documentation", "readme", "maintenance"],
	},
	{
		id: "license-check",
		name: "License Compliance",
		description: "Verify all dependencies have compatible licenses",
		category: "security",
		prompt:
			"Check all dependency licenses against project license. Flag any incompatible or copyleft licenses that need attention.",
		schedule: "RRULE:FREQ=MONTHLY;BYDAY=1;BYHOUR=8",
		icon: "scale",
		author: "Devil AI",
		installCount: 0,
		tags: ["legal", "license", "compliance"],
	},
	{
		id: "cleanup",
		name: "Dead Code Detection",
		description: "Find unused exports and dead code paths",
		category: "maintenance",
		prompt:
			"Analyze the codebase for unused exports, unreachable code, and dead code paths. Provide a report with safe-to-remove items.",
		schedule: "RRULE:FREQ=MONTHLY;BYDAY=15;BYHOUR=6",
		icon: "trash-2",
		author: "Devil AI",
		installCount: 0,
		tags: ["cleanup", "dead-code", "refactoring"],
	},
	{
		id: "changelog",
		name: "Changelog Auto-Update",
		description: "Generate changelog from recent commits",
		category: "documentation",
		prompt:
			"Review recent git commits and generate/update CHANGELOG.md with new features, fixes, and breaking changes.",
		schedule: "RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8",
		icon: "file-text",
		author: "Devil AI",
		installCount: 0,
		tags: ["changelog", "git", "documentation"],
	},
]

export const templatesGalleryAtom = atom<AutomationTemplate[]>(AUTOMATION_TEMPLATES)
export const selectedTemplateAtom = atom<AutomationTemplate | null>(null)
