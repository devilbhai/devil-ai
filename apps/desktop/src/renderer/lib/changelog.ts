export interface ChangelogEntry {
	version: string
	date: string
	changes: { type: "feature" | "fix" | "improvement"; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
	{
		version: "0.53.0",
		date: "2026-07-22",
		changes: [
			{ type: "feature", text: "354 skills with auto-detection" },
			{ type: "feature", text: "72 MCP tools including httpx, katana, semgrep, gitleaks" },
			{ type: "feature", text: "Platform-specific server names (This Mac / This PC / This Machine)" },
			{ type: "feature", text: "Cloudflare Agentic Inbox integration" },
			{ type: "improvement", text: "Engine binary search with multiple fallback paths" },
			{ type: "improvement", text: "Port conflict detection and auto-kill stale processes" },
			{ type: "improvement", text: "Better error dialogs for binary not found vs port conflicts" },
			{ type: "fix", text: "Sidebar showing correct platform name on Windows" },
			{ type: "fix", text: "Login page Tab/Enter now focuses password field" },
		],
	},
	{
		version: "0.52.0",
		date: "2026-07-20",
		changes: [
			{ type: "feature", text: "19 new security testing skills" },
			{ type: "feature", text: "AI code review bot for GitHub/GitLab" },
			{ type: "feature", text: "Self-healing automation workflows" },
			{ type: "improvement", text: "Dark mode auto-switch based on system theme" },
			{ type: "fix", text: "Account settings page using consistent theme tokens" },
		],
	},
	{
		version: "0.51.0",
		date: "2026-07-18",
		changes: [
			{ type: "feature", text: "Cross-app controller for multi-project management" },
			{ type: "feature", text: "Installation and update assistants" },
			{ type: "feature", text: "Inline code actions in editor" },
			{ type: "improvement", text: "Local RAG with IDF weighting" },
			{ type: "fix", text: "Router lazy import for named exports" },
		],
	},
]
