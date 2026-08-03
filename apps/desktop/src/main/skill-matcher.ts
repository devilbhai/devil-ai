/**
 * Skill Matcher - Automatically detects and loads relevant skills based on user prompts.
 *
 * Scans the user's prompt for keywords/patterns and returns matching skills
 * that should be loaded for the task. This makes skills "invisible" to the user -
 * they just describe what they want, and the right skills load automatically.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { createLogger } from "./logger"

const log = createLogger("skill-matcher")

// ============================================================
// Types
// ============================================================

export interface SkillMatch {
	/** Skill name (directory name) */
	name: string
	/** Match confidence: 0-100 */
	confidence: number
	/** Why this skill matched */
	reason: string
	/** Skill description from SKILL.md */
	description?: string
	/** Full SKILL.md content for high-confidence matches */
	fullContent?: string
}

export interface SkillDetectionResult {
	/** Matched skills sorted by confidence */
	skills: SkillMatch[]
	/** Raw keywords detected */
	keywords: string[]
}

// ============================================================
// Skill keyword mapping
// ============================================================

/**
 * Maps keywords/patterns to skill names.
 * Keys are lowercase patterns to match in the prompt.
 * Values are arrays of [skillName, reason] tuples.
 */
const SKILL_KEYWORDS: Record<string, Array<[string, string]>> = {
	// Connectors
	gmail: [["google-workspace", "User asked about Gmail"]],
	"google workspace": [["google-workspace", "User asked about Google Workspace"]],
	"google calendar": [["google-workspace", "User asked about Google Calendar"]],
	"google drive": [["google-workspace", "User asked about Google Drive"]],
	"google docs": [["google-workspace", "User asked about Google Docs"]],
	"google sheets": [["google-workspace", "User asked about Google Sheets"]],
	slack: [["slack-assistant", "User asked about Slack"]],
	discord: [["discord-assistant", "User asked about Discord"]],
	telegram: [["telegram-assistant", "User asked about Telegram"]],
	whatsapp: [["whatsapp-reply", "User asked about WhatsApp"]],
	github: [["github-assistant", "User asked about GitHub"]],

	// Code review & quality
	"code review": [["code-reviewer", "Code review requested"], ["bug-finder", "Bugs may be found during review"]],
	review: [["code-reviewer", "Code review context"]],
	"bug fix": [["bug-finder", "Bug fixing requested"]],
	"bug find": [["bug-finder", "Bug detection requested"]],
	bugs: [["bug-finder", "Bug-related task"]],
	"find bug": [["bug-finder", "Bug hunting requested"]],
	debug: [["debugging", "Debugging task"]],
	debugging: [["debugging", "Debugging context"]],
	"fix bug": [["bug-finder", "Bug fix requested"]],
	"error fix": [["bug-finder", "Error fixing requested"]],
	crack: [["bug-finder", "Crack/bug detection"]],
	dhoondho: [["bug-finder", "Bug finding in Hindi"]],
	sudharo: [["bug-finder", "Fix/improve in Hindi"]],

	// Code explanation
	"explain code": [["code-explainer", "Code explanation requested"]],
	"explain karo": [["code-explainer", "Code explanation in Hindi"]],
	"samjhao": [["code-explainer", "Explain in Hindi"]],
	"code samjhao": [["code-explainer", "Code explanation in Hindi"]],
	"kya karta hai": [["code-explainer", "What does it do - explanation requested"]],

	// Documentation
	"write doc": [["documentation-writer", "Documentation writing requested"]],
	"docs likho": [["documentation-writer", "Documentation in Hindi"]],
	documentation: [["documentation-writer", "Documentation task"]],
	"api doc": [["documentation-writer", "API documentation requested"]],
	"readme": [["documentation-writer", "README writing requested"]],

	// Refactoring
	refactor: [["refactoring-patterns", "Refactoring requested"]],
	"simplify code": [["refactoring-patterns", "Code simplification requested"]],
	"clean code": [["refactoring-patterns", "Code cleanup requested"]],
	"optimize code": [["performance-optimizer", "Performance optimization requested"]],
	performance: [["performance-optimizer", "Performance optimization context"]],
	"slow code": [["performance-optimizer", "Slow code issue"]],

	// Security
	security: [["security-audit", "Security audit requested"]],
	"security check": [["security-audit", "Security checking requested"]],
	vulnerability: [["security-audit", "Vulnerability detection"]],
	"security scan": [["security-audit", "Security scanning requested"]],

	// Testing
	"write test": [["test-generation", "Test writing requested"]],
	"tests likho": [["test-generation", "Test writing in Hindi"]],
	"test banao": [["test-generation", "Test creation in Hindi"]],
	"testing": [["testing-patterns", "Testing context"]],
	"verify app": [["reticle-verification", "Runtime verification requested"]],
	"verify react": [["reticle-verification", "React runtime verification"]],
	"check running app": [["reticle-verification", "Running app verification"]],
	"runtime check": [["reticle-verification", "Runtime verification task"]],
	"assert pass": [["reticle-verification", "Pass/fail assertion requested"]],
	"catch bug": [["reticle-verification", "Runtime bug catching"]],
	"silent error": [["reticle-verification", "Silent error detection"]],
	"500 error": [["reticle-verification", "Server error detection"]],
	"state mismatch": [["reticle-verification", "State mismatch detection"]],
	"regression check": [["reticle-verification", "Regression verification"]],
	"reticle": [["reticle-verification", "Reticle tool usage"]],
	"optimize tokens": [["headroom-optimization", "Token optimization requested"]],
	"save tokens": [["headroom-optimization", "Token savings requested"]],
	"reduce cost": [["headroom-optimization", "Cost optimization requested"]],
	"token usage": [["headroom-optimization", "Token usage optimization"]],
	"compress prompt": [["headroom-optimization", "Prompt compression requested"]],
	"shorter prompt": [["headroom-optimization", "Prompt optimization requested"]],
	"efficient prompt": [["headroom-optimization", "Prompt efficiency requested"]],
	"token limit": [["headroom-optimization", "Token limit optimization"]],
	"context window": [["headroom-optimization", "Context window optimization"]],
	"api cost": [["headroom-optimization", "API cost optimization"]],
	"headroom": [["headroom-optimization", "Headroom optimization technique"]],

	// API
	"api design": [["api-design", "API design requested"]],
	"api build": [["api-builder", "API building requested"]],
	"api banavo": [["api-builder", "API building in Hindi"]],

	// Database
	database: [["database-designer", "Database task"]],
	"db schema": [["database-designer", "Database schema design"]],
	migration: [["database-migrator", "Database migration requested"]],
	"schema design": [["schema-visualizer", "Schema visualization requested"]],

	// React
	react: [["react-best-practices", "React development task"]],
	component: [["react-best-practices", "React component work"]],
	"react component": [["react-best-practices", "React component development"]],

	// TypeScript
	typescript: [["typescript-patterns", "TypeScript task"]],
	"type safety": [["typescript-patterns", "Type safety improvement"]],

	// Git
	git: [["git-workflow", "Git workflow task"]],
	commit: [["git-workflow", "Git commit task"]],
	"pull request": [["github-assistant", "PR management"]],
	pr: [["github-assistant", "PR task"]],
	branch: [["git-workflow", "Branch management"]],

	// Docker
	docker: [["docker-patterns", "Docker task"]],
	container: [["docker-patterns", "Container task"]],
	dockerfile: [["docker-patterns", "Dockerfile task"]],

	// Performance
	"fast code": [["performance-optimizer", "Speed optimization"]],
	"slow app": [["performance-optimizer", "App slowness issue"]],
	bottleneck: [["performance-optimizer", "Performance bottleneck"]],

	// Architecture
	architecture: [["architecture-reviewer", "Architecture review"]],
	"design pattern": [["architecture-reviewer", "Design pattern discussion"]],

	// Error handling
	"error handling": [["error-handling", "Error handling improvement"]],
	errors: [["error-handling", "Error management task"]],

	// State management
	"state management": [["jotai-deep", "State management task"]],
	atom: [["jotai-deep", "Jotai atom work"]],
	jotai: [["jotai-deep", "Jotai state management"]],

	// UI/UX
	"ui design": [["ui-ux-pro-designer", "UI design task"]],
	ux: [["ui-ux-pro-designer", "UX design task"]],
	"layout design": [["ui-ux-pro-designer", "Layout design task"]],
	theme: [["css-tailwind", "Theming task"]],
	tailwind: [["css-tailwind", "Tailwind CSS task"]],
	"dark mode": [["css-tailwind", "Dark mode implementation"]],

	// Markdown
	markdown: [["markdown-rendering", "Markdown rendering task"]],
	"render markdown": [["markdown-rendering", "Markdown rendering"]],

	// Forms
	form: [["form-patterns", "Form handling task"]],
	"form handling": [["form-patterns", "Form handling task"]],
	validation: [["form-patterns", "Form validation task"]],

	// Hooks
	hook: [["react-best-practices", "React hooks task"]],
	"usestate": [["react-best-practices", "useState usage"]],
	"useeffect": [["react-best-practices", "useEffect usage"]],

	// Clipboard
	clipboard: [["clipboard-manager", "Clipboard task"]],
	"copy paste": [["clipboard-manager", "Copy-paste task"]],
	"copy kar": [["clipboard-manager", "Copy task in Hindi"]],

	// Calendar
	calendar: [["calendar-assistant", "Calendar task"]],
	schedule: [["meeting-scheduler", "Scheduling task"]],
	meeting: [["meeting-recorder", "Meeting task"]],

	// Email
	email: [["email-writer", "Email task"]],
	"email likho": [["email-writer", "Email writing in Hindi"]],

	// Notes
	notes: [["meeting-recorder", "Notes task"]],
	"meeting notes": [["meeting-recorder", "Meeting notes task"]],

	// Deployment
	deploy: [["deployment-manager", "Deployment task"]],
	deployment: [["deployment-manager", "Deployment task"]],
	"production deploy": [["deployment-manager", "Production deployment"]],

	// Monitoring
	monitor: [["monitoring-alerts", "Monitoring task"]],
	alert: [["monitoring-alerts", "Alert setup task"]],
	"system monitor": [["system-monitor", "System monitoring"]],

	// Backup
	backup: [["backup-restore", "Backup task"]],
	"backup banao": [["backup-restore", "Backup creation in Hindi"]],

	// SSH
	ssh: [["ssh-manager", "SSH task"]],
	"remote server": [["ssh-manager", "Remote server task"]],

	// SSL
	ssl: [["ssl-certificates", "SSL certificate task"]],
	certificate: [["ssl-certificates", "Certificate task"]],

	// DNS
	dns: [["dns-management", "DNS management task"]],

	// Nginx
	nginx: [["nginx-litespeed", "Nginx configuration task"]],

	// Linux
	linux: [["linux-admin", "Linux administration task"]],
	ubuntu: [["linux-admin", "Ubuntu administration task"]],
	server: [["linux-admin", "Server administration task"]],

	// Excel
	excel: [["excel-automation", "Excel task"]],
	spreadsheet: [["excel-automation", "Spreadsheet task"]],

	// PDF
	pdf: [["pdf-reader", "PDF task"]],

	// Image
	image: [["image-processing", "Image processing task"]],
	photo: [["image-processing", "Image task"]],

	// Video
	video: [["video-editor", "Video task"]],

	// Audio
	audio: [["audio-transcription", "Audio task"]],
	transcribe: [["audio-transcription", "Transcription task"]],

	// QR code
	qr: [["qr-code-generator", "QR code task"]],
	barcode: [["barcode-generator", "Barcode task"]],

	// JSON
	json: [["json-viewer", "JSON task"]],

	// CSV
	csv: [["csv-processing", "CSV task"]],

	// XML
	xml: [["xml-viewer", "XML task"]],

	// Word
	word: [["word-reader", "Word document task"]],

	// PowerPoint
	powerpoint: [["powerpoint-reader", "PowerPoint task"]],

	// SEO
	seo: [["seo-expert", "SEO task"]],
	"keyword research": [["keyword-research", "Keyword research task"]],

	// Internet access & web scraping (Agent Reach)
	"agent reach": [["agent-reach", "Internet access via Agent Reach"]],
	agentreach: [["agent-reach", "Agent Reach tool usage"]],
	"internet access": [["agent-reach", "Internet access requested"]],
	"web read": [["agent-reach", "Web page reading requested"]],
	"read article": [["agent-reach", "Article reading requested"]],
	"read page": [["agent-reach", "Web page reading"]],
	"fetch url": [["agent-reach", "URL fetching requested"]],
	"read url": [["agent-reach", "URL reading requested"]],
	"youtube video": [["agent-reach", "YouTube video access"]],
	"youtube summary": [["agent-reach", "YouTube summary requested"]],
	"read youtube": [["agent-reach", "YouTube content reading"]],
	"search twitter": [["agent-reach", "Twitter search requested"]],
	"read twitter": [["agent-reach", "Twitter reading requested"]],
	"twitter post": [["agent-reach", "Twitter post access"]],
	"read tweet": [["agent-reach", "Tweet reading"]],
	"search reddit": [["agent-reach", "Reddit search requested"]],
	"read reddit": [["agent-reach", "Reddit reading requested"]],
	"reddit post": [["agent-reach", "Reddit post access"]],
	"read reddit post": [["agent-reach", "Reddit post reading"]],
	"github repo": [["agent-reach", "GitHub repo access"]],
	"github issues": [["agent-reach", "GitHub issues access"]],
	"read github": [["agent-reach", "GitHub content reading"]],
	"bilibili video": [["agent-reach", "Bilibili video access"]],
	"bilibili search": [["agent-reach", "Bilibili search requested"]],
	"read bilibili": [["agent-reach", "Bilibili content reading"]],
	"xiaohongshu": [["agent-reach", "XiaoHongShu access"]],
	"xhs": [["agent-reach", "XiaoHongShu access"]],
	"read xhs": [["agent-reach", "XiaoHongShu reading"]],
	"rss feed": [["agent-reach", "RSS feed access"]],
	"rss read": [["agent-reach", "RSS feed reading"]],
	"monitor rss": [["agent-reach", "RSS monitoring requested"]],
	"web search": [["agent-reach", "Web search requested"]],
	"search web": [["agent-reach", "Web search requested"]],
	"search internet": [["agent-reach", "Internet search requested"]],
	"online search": [["agent-reach", "Online search requested"]],
	"check website": [["agent-reach", "Website checking requested"]],
	"read website": [["agent-reach", "Website reading requested"]],
	"website content": [["agent-reach", "Website content access"]],
	"trending": [["agent-reach", "Trending content access"]],
	"social media check": [["agent-reach", "Social media checking"]],
	"social media search": [["agent-reach", "Social media search"]],

	// Computer use (Pi Computer Use)
	"computer use": [["pi-computer-use", "Desktop app control requested"]],
	"desktop control": [["pi-computer-use", "Desktop automation requested"]],
	"click button": [["pi-computer-use", "Button clicking requested"]],
	"type text": [["pi-computer-use", "Text typing requested"]],
	"scroll window": [["pi-computer-use", "Window scrolling requested"]],
	"screenshot": [["pi-computer-use", "Screenshot capture requested"]],
	"automate app": [["pi-computer-use", "App automation requested"]],
	"gui automation": [["pi-computer-use", "GUI automation requested"]],
	"desktop automation": [["pi-computer-use", "Desktop automation requested"]],
	"control app": [["pi-computer-use", "App control requested"]],
	"use app": [["pi-computer-use", "App usage requested"]],
	"interact with app": [["pi-computer-use", "App interaction requested"]],
	"click": [["pi-computer-use", "Click action requested"]],
	"type in": [["pi-computer-use", "Type action requested"]],
	"fill form": [["pi-computer-use", "Form filling requested"]],
	"read screen": [["pi-computer-use", "Screen reading requested"]],
	"see screen": [["pi-computer-use", "Screen viewing requested"]],
	"what's on screen": [["pi-computer-use", "Screen analysis requested"]],

	// Agent Frameworks
	"langgraph": [["langgraph", "LangGraph framework requested"]],
	"lang graph": [["langgraph", "LangGraph usage"]],
	"multi agent": [["crewai", "Multi-agent system requested"]],
	"agent framework": [["langgraph", "Agent framework requested"]],
	"agent system": [["autogen", "Multi-agent system requested"]],
	"crew ai": [["crewai", "CrewAI framework requested"]],
	"crewai": [["crewai", "CrewAI usage"]],
	"autogen": [["autogen", "AutoGen framework requested"]],
	"auto gen": [["autogen", "AutoGen usage"]],
	"smolagents": [["smolagents", "Smolagents framework requested"]],
	"smol agents": [["smolagents", "Smolagents usage"]],
	"hugging face agents": [["smolagents", "HuggingFace agents requested"]],
	"langflow": [["langflow", "Langflow visual builder requested"]],
	"lang flow": [["langflow", "Langflow usage"]],
	"llama agents": [["llama-agents", "LlamaIndex agents requested"]],
	"llamaindex": [["llama-agents", "LlamaIndex framework requested"]],
	"multi-agent": [["crewai", "Multi-agent system requested"]],
	"orchestrate agents": [["crewai", "Agent orchestration requested"]],
	"build agent": [["langgraph", "Agent building requested"]],
	"create agent": [["langgraph", "Agent creation requested"]],
	"agent workflow": [["langgraph", "Agent workflow requested"]],
	"agent orchestration": [["crewai", "Agent orchestration requested"]],
	"role-playing": [["crewai", "Role-playing agents requested"]],
	"conversation agent": [["autogen", "Conversation agent requested"]],
	"visual agent": [["langflow", "Visual agent builder requested"]],
	"node-based": [["langflow", "Node-based agent building requested"]],

	// MCP Servers
	"mcp server": [["mcp-servers", "MCP server setup requested"]],
	"model context protocol": [["mcp-servers", "MCP protocol usage"]],
	"mcp servers": [["mcp-servers", "Multiple MCP servers requested"]],
	"filesystem mcp": [["mcp-filesystem", "Filesystem MCP requested"]],
	"postgres mcp": [["mcp-postgres", "PostgreSQL MCP requested"]],
	"sqlite mcp": [["mcp-sqlite", "SQLite MCP requested"]],
	"database mcp": [["mcp-database", "Database MCP requested"]],
	"brave search mcp": [["mcp-brave", "Brave Search MCP requested"]],
	"puppeteer mcp": [["mcp-puppeteer", "Puppeteer MCP requested"]],
	"browser mcp": [["mcp-browser", "Browser MCP requested"]],
	"memory mcp": [["mcp-memory", "Memory MCP requested"]],
	"github mcp": [["mcp-github", "GitHub MCP requested"]],
	"slack mcp": [["mcp-slack", "Slack MCP requested"]],
	"notion mcp": [["mcp-notion", "Notion MCP requested"]],
	"linear mcp": [["mcp-linear", "Linear MCP requested"]],
	"google drive mcp": [["mcp-gdrive", "Google Drive MCP requested"]],
	"exa mcp": [["mcp-exa", "Exa search MCP requested"]],
	"mysql mcp": [["mcp-mysql", "MySQL MCP requested"]],
	"database integration": [["mcp-database", "Database integration requested"]],
	"file system access": [["mcp-filesystem", "Filesystem access requested"]],
	"web search mcp": [["mcp-brave", "Web search MCP requested"]],
	"browser automation mcp": [["mcp-puppeteer", "Browser automation MCP requested"]],
	"persistent memory": [["mcp-memory", "Persistent memory requested"]],
	"team communication": [["mcp-slack", "Team communication MCP requested"]],
	
	// Memory
	"mem0": [["mem0", "Mem0 memory layer requested"]],
	"embedding store": [["chroma", "Embedding store requested"]],
	
	// Sandboxing
	"sandbox": [["e2b", "Sandbox execution requested"]],
	"sandboxing": [["e2b", "Sandboxing requested"]],
	"safe execution": [["e2b", "Safe code execution requested"]],
	"code interpreter": [["e2b", "Code interpreter requested"]],
	"e2b": [["e2b", "E2B sandbox requested"]],
	"openhands": [["openhands", "OpenHands AI developer requested"]],
	"open hands": [["openhands", "OpenHands requested"]],
	"ai developer": [["openhands", "AI developer agent requested"]],
	
	// Observability
	"observability": [["langfuse", "Observability platform requested"]],
	"langfuse": [["langfuse", "Langfuse observability requested"]],
	"langsmith": [["langfuse", "LangSmith alternative requested"]],
	
	// RAG
	"haystack": [["haystack", "Haystack framework requested"]],
	"nlp pipeline": [["haystack", "NLP pipeline requested"]],
	"document qa": [["haystack", "Document Q&A requested"]],
	
	// Web Scraping
	"firecrawl": [["firecrawl", "Firecrawl web scraping requested"]],
	"web crawl": [["firecrawl", "Web crawling requested"]],
	"web extract": [["firecrawl", "Web content extraction requested"]],
	"project management": [["mcp-linear", "Project management MCP requested"]],
	"note taking": [["mcp-notion", "Note taking MCP requested"]],
	"cloud storage": [["mcp-gdrive", "Cloud storage MCP requested"]],

	// Claude Skills
	"claude skills": [["claude-skills", "Claude skills requested"]],
	"anthropic skills": [["claude-skills", "Anthropic skills requested"]],
	"skill loader": [["openskills", "Universal skill loader requested"]],
	"openskills": [["openskills", "OpenSkills framework requested"]],
	"awesome skills": [["awesome-skills", "Awesome skills list requested"]],
	"agent skills": [["agent-skills", "Agent skills requested"]],
	"skill examples": [["claude-skills", "Skill examples requested"]],
	"skill development": [["claude-skills", "Skill development requested"]],
	"build skill": [["claude-skills", "Skill building requested"]],
	"create skill": [["claude-skills", "Skill creation requested"]],
	"load skill": [["openskills", "Skill loading requested"]],
	"install skill": [["openskills", "Skill installation requested"]],

	// Social media
	"social media": [["social-media-writer", "Social media task"]],
	twitter: [["twitter-writer", "Twitter task"]],
	linkedin: [["linkedin-writer", "LinkedIn task"]],
	instagram: [["instagram-writer", "Instagram task"]],

	// Blog
	blog: [["blog-writer", "Blog writing task"]],
	article: [["blog-writer", "Article writing task"]],

	// Content
	content: [["content-writer", "Content writing task"]],

	// Copywriting
	copywriting: [["copywriter", "Copywriting task"]],
	"sales page": [["copywriter", "Sales page task"]],

	// Ad
	"ad copy": [["ad-copy-writer", "Ad copy task"]],
	advertisement: [["ad-copy-writer", "Ad writing task"]],

	// Proposal
	proposal: [["business-proposal", "Business proposal task"]],

	// Tender
	tender: [["tender-writer", "Tender writing task"]],

	// Report
	report: [["report-generator", "Report generation task"]],

	// Budget
	budget: [["budget-planner", "Budget planning task"]],
	finance: [["finance-assistant", "Finance task"]],

	// Tax
	tax: [["tax-calculator", "Tax calculation task"]],
	gst: [["agribee-gst-invoice", "GST task"]],

	// Stock
	stock: [["stock-market-assistant", "Stock market task"]],

	// Crypto
	crypto: [["crypto-assistant", "Cryptocurrency task"]],

	// Weather
	weather: [["weather-assistant", "Weather task"]],

	// Health
	health: [["health-assistant", "Health task"]],
	diet: [["diet-planner", "Diet planning task"]],
	fitness: [["fitness-planner", "Fitness task"]],

	// Habit
	habit: [["habit-tracker", "Habit tracking task"]],

	// Time
	"time tracking": [["time-tracker", "Time tracking task"]],
	productivity: [["time-tracker", "Productivity task"]],

	// Reminder
	reminder: [["reminder-manager", "Reminder task"]],

	// Travel
	travel: [["travel-planner", "Travel planning task"]],

	// Recipe
	recipe: [["diet-planner", "Recipe task"]],

	// Language
	translate: [["translation", "Translation task"]],
	hindi: [["hindi-translator", "Hindi translation task"]],
	english: [["english-translator", "English refinement task"]],

	// Interview
	interview: [["interview-assistant", "Interview task"]],

	// Resume
	resume: [["recruitment-assistant", "Resume task"]],

	// CRM
	crm: [["crm-manager", "CRM task"]],

	// HR
	hr: [["hr-assistant", "HR task"]],

	// ERP
	erp: [["erp-assistant", "ERP task"]],



	// Browser
	browser: [["browser-use", "Browser automation task"]],
	playwright: [["playwright-automation", "Playwright task"]],
	selenium: [["playwright-automation", "Browser automation task"]],

	// Web scraping
	scrape: [["web-scraping", "Web scraping task"]],
	"web scraping": [["web-scraping", "Web scraping task"]],

	// API reverse engineer
	"reverse engineer": [["api-reverse-engineer", "API reverse engineering task"]],
	"api analyze": [["api-reverse-engineer", "API analysis task"]],

	// Decision
	decision: [["decision-assistant", "Decision making task"]],

	// Meeting
	"meeting summary": [["conversation-summarizer", "Meeting summary task"]],

	// Document comparison
	compare: [["document-comparator", "Document comparison task"]],
	"diff": [["document-comparator", "Document comparison task"]],

	// Root cause
	"root cause": [["root-cause-analyzer", "Root cause analysis task"]],
	"why did": [["root-cause-analyzer", "Root cause analysis task"]],

	// Incident
	incident: [["incident-response", "Incident response task"]],

	// Dependency
	dependency: [["dependency-checker", "Dependency check task"]],

	// Code analysis
	"code analysis": [["codebase-analyzer", "Code analysis task"]],
	"analyze code": [["codebase-analyzer", "Code analysis task"]],

	// Log analysis
	logs: [["log-analyzer", "Log analysis task"]],
	"analyze logs": [["log-forensics", "Log forensics task"]],

	// Schema
	schema: [["schema-visualizer", "Schema visualization task"]],

	// Dependency graph
	"dependency graph": [["dependency-graph", "Dependency graph task"]],
	"imports graph": [["dependency-graph", "Import graph task"]],

	// Kanban
	kanban: [["kanban-manager", "Kanban board task"]],

	// Project management
	"project plan": [["project-manager", "Project planning task"]],
	"task list": [["task-manager", "Task management task"]],

	// Checklist
	checklist: [["task-manager", "Checklist task"]],

	// Decision matrix
	"decision matrix": [["decision-assistant", "Decision matrix task"]],

	// Pros cons
	"pros and cons": [["decision-assistant", "Pros/cons analysis task"]],
	"advantages disadvantages": [["decision-assistant", "Pros/cons analysis task"]],

	// DevOps
	terraform: [["terraform-expert", "Terraform IaC task"]],
	"infrastructure as code": [["terraform-expert", "Infrastructure as Code task"]],
	"iac": [["terraform-expert", "Infrastructure as Code task"]],
	ansible: [["ansible-automation", "Ansible automation task"]],
	"playbook": [["ansible-automation", "Ansible playbook task"]],
	prometheus: [["prometheus-grafana", "Prometheus monitoring task"]],
	grafana: [["prometheus-grafana", "Grafana dashboard task"]],
	monitoring: [["prometheus-grafana", "Monitoring setup task"]],
	"kubernetes": [["kubernetes-advanced", "Kubernetes task"]],
	"k8s": [["kubernetes-advanced", "Kubernetes task"]],
	helm: [["kubernetes-advanced", "Helm chart task"]],
	"service mesh": [["service-mesh", "Service mesh task"]],
	istio: [["service-mesh", "Istio service mesh task"]],
	"ci/cd": [["ci-cd-pipeline", "CI/CD pipeline task"]],
	"pipeline": [["ci-cd-pipeline", "Pipeline task"]],
	"github actions": [["ci-cd-pipeline", "GitHub Actions task"]],
	jenkins: [["ci-cd-pipeline", "Jenkins pipeline task"]],

	// Data Engineering
	"apache spark": [["apache-spark", "Apache Spark task"]],
	spark: [["apache-spark", "Spark task"]],
	"big data": [["apache-spark", "Big data processing task"]],
	kafka: [["apache-kafka", "Apache Kafka task"]],
	"event streaming": [["apache-kafka", "Event streaming task"]],
	"message queue": [["apache-kafka", "Message queue task"]],
	airflow: [["airflow-pipeline", "Airflow workflow task"]],
	dag: [["airflow-pipeline", "DAG workflow task"]],
	"workflow orchestration": [["airflow-pipeline", "Workflow orchestration task"]],
	dbt: [["dbt-transformations", "dbt transformation task"]],
	"analytics engineering": [["dbt-transformations", "Analytics engineering task"]],
	"data pipeline": [["data-pipeline", "Data pipeline task"]],
	etl: [["data-pipeline", "ETL pipeline task"]],
	elt: [["data-pipeline", "ELT pipeline task"]],
	snowflake: [["snowflake-warehouse", "Snowflake data warehouse task"]],
	"data warehouse": [["snowflake-warehouse", "Data warehouse task"]],

	// AI/ML
	"fine-tuning": [["model-finetuning", "Model fine-tuning task"]],
	"finetune": [["model-finetuning", "Model fine-tuning task"]],
	"model training": [["model-finetuning", "Model training task"]],
	"lora": [["model-finetuning", "LoRA fine-tuning task"]],
	rag: [["rag-advanced", "Advanced RAG task"]],
	"retrieval augmented": [["rag-advanced", "RAG task"]],
	"hybrid search": [["rag-advanced", "Hybrid search task"]],
	reranking: [["rag-advanced", "Reranking task"]],
	"agent builder": [["agent-builder", "Agent building task"]],
	"ai agent": [["agent-builder", "AI agent task"]],
	"prompt engineering": [["prompt-optimization", "Prompt engineering task"]],
	"prompt optimization": [["prompt-optimization", "Prompt optimization task"]],
	"chain of thought": [["prompt-optimization", "Chain of thought task"]],
	"vector database": [["vector-store-expert", "Vector database task"]],
	"vector store": [["vector-store-expert", "Vector store task"]],
	pinecone: [["vector-store-expert", "Pinecone task"]],
	weaviate: [["vector-store-expert", "Weaviate task"]],
	qdrant: [["vector-store-expert", "Qdrant task"]],
	chroma: [["vector-store-expert", "Chroma task"]],
	"llm deployment": [["llm-deployment", "LLM deployment task"]],
	"model serving": [["llm-deployment", "Model serving task"]],
	"inference": [["llm-deployment", "Inference task"]],

	// Blockchain
	solidity: [["solidity-smart-contracts", "Solidity smart contract task"]],
	"smart contract": [["solidity-smart-contracts", "Smart contract task"]],
	ethereum: [["solidity-smart-contracts", "Ethereum task"]],
	defi: [["defi-protocols", "DeFi protocol task"]],
	"decentralized finance": [["defi-protocols", "DeFi task"]],
	"liquidity pool": [["defi-protocols", "Liquidity pool task"]],
	"yield farming": [["defi-protocols", "Yield farming task"]],
	web3: [["web3-development", "Web3 development task"]],
	"dapp": [["web3-development", "dApp task"]],
	"wallet": [["web3-development", "Wallet integration task"]],
	nft: [["nft-marketplace", "NFT marketplace task"]],
	"non-fungible": [["nft-marketplace", "NFT task"]],

	// Mobile
	"react native": [["react-native", "React Native task"]],
	"mobile app": [["react-native", "Mobile app task"]],
	swift: [["swift-swiftui", "Swift iOS task"]],
	swiftui: [["swift-swiftui", "SwiftUI task"]],
	ios: [["swift-swiftui", "iOS development task"]],
	kotlin: [["kotlin-compose", "Kotlin Android task"]],
	compose: [["kotlin-compose", "Jetpack Compose task"]],
	android: [["kotlin-compose", "Android development task"]],

	// Game Dev
	unity: [["unity-developer", "Unity game development task"]],
	"game development": [["unity-developer", "Game development task"]],
	"unreal": [["unreal-engine", "Unreal Engine task"]],
	"unreal engine": [["unreal-engine", "Unreal Engine task"]],
	godot: [["godot-engine", "Godot engine task"]],

	// Security
	"penetration testing": [["penetration-testing", "Penetration testing task"]],
	"ethical hacking": [["penetration-testing", "Ethical hacking task"]],
	"vulnerability assessment": [["penetration-testing", "Vulnerability assessment task"]],
	"malware analysis": [["malware-analysis", "Malware analysis task"]],
	"reverse engineering": [["malware-analysis", "Reverse engineering task"]],
	"forensics": [["digital-forensics", "Digital forensics task"]],
	"incident forensics": [["digital-forensics", "Incident forensics task"]],
	"zero trust": [["zero-trust-architecture", "Zero trust architecture task"]],
	"zero-trust": [["zero-trust-architecture", "Zero trust architecture task"]],

	// Enterprise
	okr: [["okr-management", "OKR management task"]],
	"objectives and key results": [["okr-management", "OKR task"]],
	"goal setting": [["okr-management", "Goal setting task"]],
	sprint: [["sprint-planning", "Sprint planning task"]],
	"agile": [["sprint-planning", "Agile development task"]],
	"scrum": [["sprint-planning", "Scrum task"]],
	"retrospective": [["sprint-planning", "Retrospective task"]],
	"stakeholder": [["stakeholder-comms", "Stakeholder communication task"]],
	"executive summary": [["stakeholder-comms", "Executive summary task"]],
	"technical architecture": [["technical-architecture", "Technical architecture task"]],
	"system design": [["technical-architecture", "System design task"]],
	"cost optimization": [["cost-optimization", "Cost optimization task"]],
	"cloud cost": [["cost-optimization", "Cloud cost task"]],

	"screen automation": [["desktop-automation-pro", "Screen automation task"]],
	"mac control": [["desktop-automation-pro", "Mac automation task"]],
	"windows control": [["desktop-automation-pro", "Windows automation task"]],
	"control mac": [["desktop-automation-pro", "Mac automation task"]],
	"control windows": [["desktop-automation-pro", "Windows automation task"]],
	"control pc": [["desktop-automation-pro", "PC automation task"]],
	"pc control": [["desktop-automation-pro", "PC automation task"]],
	
	// Advanced Desktop Tools
	"browser agent": [["desktop-tools-pro", "Browser agent task"]],
	"headless browser": [["desktop-tools-pro", "Headless browser task"]],
	"generate image": [["desktop-tools-pro", "Image generation task"]],
	"ui mockup": [["desktop-tools-pro", "UI mockup task"]],
	"multi replace": [["desktop-tools-pro", "Multi replace task"]],
	"spawn subagent": [["desktop-tools-pro", "Subagent task"]],
	"email automation": [["email-automation", "Email automation task"]],
	"email sequence": [["email-automation", "Email sequence task"]],
	"cold email": [["email-automation", "Cold email task"]],
	"social media scheduler": [["social-media-scheduler", "Social media scheduling task"]],
	"content calendar": [["social-media-scheduler", "Content calendar task"]],
	"post scheduling": [["social-media-scheduler", "Post scheduling task"]],
	chatbot: [["chatbot-builder", "Chatbot building task"]],
	"conversation design": [["chatbot-builder", "Conversation design task"]],

	// Creative
	figma: [["figma-to-code", "Figma to code task"]],
	"design to code": [["figma-to-code", "Design to code task"]],
	"figma to react": [["figma-to-code", "Figma to React task"]],
	animation: [["animation-advanced", "CSS animation task"]],
	"css animation": [["animation-advanced", "CSS animation task"]],
	"scroll animation": [["animation-advanced", "Scroll animation task"]],
	"micro-interaction": [["animation-advanced", "Micro-interaction task"]],
	"motion design": [["motion-design", "Motion design task"]],
	"video editing": [["motion-design", "Video editing task"]],
	"motion graphics": [["motion-design", "Motion graphics task"]],
	"brand identity": [["brand-identity", "Brand identity task"]],
	"logo design": [["brand-identity", "Logo design task"]],
	"brand guidelines": [["brand-identity", "Brand guidelines task"]],

	// Common development tasks
	"component banao": [["react-best-practices", "React component creation in Hindi"]],
	"component create": [["react-best-practices", "React component creation"]],
	"page banao": [["react-best-practices", "Page creation in Hindi"]],
	"page create": [["react-best-practices", "Page creation"]],
	"form banao": [["form-patterns", "Form creation in Hindi"]],
	"form create": [["form-patterns", "Form creation"]],
	"modal banao": [["shadcn-ui", "Modal creation in Hindi"]],
	"dialog banao": [["shadcn-ui", "Dialog creation in Hindi"]],
	"button add": [["shadcn-ui", "Button addition"]],
	"button banao": [["shadcn-ui", "Button creation in Hindi"]],
	"table banao": [["data-table", "Table creation in Hindi"]],
	"table create": [["data-table", "Table creation"]],
	"chart banao": [["chart-generation", "Chart creation in Hindi"]],
	"graph banao": [["chart-generation", "Graph creation in Hindi"]],
	"dashboard banao": [["business-intelligence", "Dashboard creation in Hindi"]],
	"dashboard create": [["business-intelligence", "Dashboard creation"]],
	"api banao": [["api-builder", "API creation in Hindi"]],
	"api create": [["api-builder", "API creation"]],
	"database banao": [["database-designer", "Database creation in Hindi"]],
	"schema banao": [["database-designer", "Schema creation in Hindi"]],
	"migration banao": [["database-migrator", "Migration creation in Hindi"]],
	"test create": [["test-generation", "Test creation"]],
	"deploy karo": [["deployment-manager", "Deployment in Hindi"]],
	"production mein deploy": [["deployment-manager", "Production deployment in Hindi"]],
	"performance optimize": [["performance-optimizer", "Performance optimization"]],
	"speed up": [["performance-optimizer", "Speed optimization"]],
	"fast banao": [["performance-optimizer", "Speed optimization in Hindi"]],
	"refactor karo": [["refactoring-patterns", "Refactoring requested"]],
	"refactor code": [["refactoring-patterns", "Code refactoring"]],
	"bug fix karo": [["bug-finder", "Bug fixing in Hindi"]],
	"error handle": [["error-handling", "Error handling improvement"]],
	"error handle karo": [["error-handling", "Error handling in Hindi"]],
	"logging add": [["log-analyzer", "Logging addition"]],
	"logger add": [["log-analyzer", "Logger addition"]],
	"cache implement": [["redis-expert", "Caching implementation"]],
	"cache banao": [["redis-expert", "Cache creation in Hindi"]],
	"auth implement": [["firebase-expert", "Authentication implementation"]],
	"login system": [["firebase-expert", "Login system creation"]],
	"signup system": [["firebase-expert", "Signup system creation"]],
	"notification system": [["notification-system", "Notification system creation"]],
	"whatsapp integration": [["whatsapp-reply", "WhatsApp integration"]],
	"telegram bot": [["telegram-assistant", "Telegram bot creation"]],
	"discord bot": [["discord-assistant", "Discord bot creation"]],
	"slack bot": [["slack-assistant", "Slack bot creation"]],
	"webhook setup": [["webhook-manager", "Webhook setup"]],
	"cron job": [["cron-job-manager", "Cron job setup"]],
	"background job": [["bull-queue", "Background job setup"]],
	"queue implement": [["bull-queue", "Queue implementation"]],
	"websocket": [["socketio-patterns", "WebSocket implementation"]],
	"real-time": [["socketio-patterns", "Real-time feature"]],
	"file upload": [["file-upload", "File upload implementation"]],
	"image upload": [["file-upload", "Image upload implementation"]],
	"video upload": [["file-upload", "Video upload implementation"]],
	"pdf generate": [["pdf-generator", "PDF generation"]],
	"report generate": [["report-generator", "Report generation"]],
	"excel export": [["excel-automation", "Excel export"]],
	"csv export": [["csv-processor", "CSV export"]],
	"qr code": [["qr-code-generator", "QR code generation"]],
	"map integrate": [["maps-extraction", "Map integration"]],
	"payment integrate": [["stripe-integration", "Payment integration"]],
	"stripe integrate": [["stripe-integration", "Stripe integration"]],
	"razorpay integrate": [["razorpay-integration", "Razorpay integration"]],
	"analytics implement": [["google-analytics", "Analytics implementation"]],
	"seo optimize": [["seo-expert", "SEO optimization"]],
	"accessibility": [["accessibility", "Accessibility improvement"]],
	"i18n": [["i18n-internationalization", "Internationalization"]],
	"translation": [["i18n-internationalization", "Translation implementation"]],
	"light mode": [["css-tailwind", "Light mode implementation"]],
	"responsive design": [["responsive-design", "Responsive design"]],
	"mobile first": [["responsive-design", "Mobile-first design"]],
	"animation add": [["animation-advanced", "Animation addition"]],
	"transition add": [["animation-advanced", "Transition addition"]],
	"skeleton loading": [["loading-states", "Skeleton loading implementation"]],
	"spinner add": [["loading-states", "Spinner addition"]],
	"error boundary": [["error-handling", "Error boundary implementation"]],
	"loading state": [["loading-states", "Loading state implementation"]],
	"empty state": [["empty-states", "Empty state implementation"]],
	"toast add": [["notification-system", "Toast notification addition"]],
	"alert add": [["notification-system", "Alert addition"]],
	"tooltip add": [["tooltip-component", "Tooltip addition"]],
	"popover add": [["shadcn-ui", "Popover addition"]],
	"dropdown menu": [["shadcn-ui", "Dropdown menu addition"]],
	"sidebar banao": [["sidebar-navigation", "Sidebar creation in Hindi"]],
	"sidebar create": [["sidebar-navigation", "Sidebar creation"]],
	"navbar banao": [["navigation-patterns", "Navbar creation in Hindi"]],
	"navbar create": [["navigation-patterns", "Navbar creation"]],
	"footer banao": [["footer-component", "Footer creation in Hindi"]],
	"footer create": [["footer-component", "Footer creation"]],
	"hero section": [["hero-section", "Hero section creation"]],
	"landing page": [["landing-page", "Landing page creation"]],
	"pricing page": [["pricing-component", "Pricing page creation"]],
	"testimonial": [["testimonial-component", "Testimonial section creation"]],
	"faq section": [["faq-component", "FAQ section creation"]],
	"contact form": [["contact-form", "Contact form creation"]],
	"newsletter": [["newsletter-signup", "Newsletter signup creation"]],
	"search feature": [["search-functionality", "Search feature implementation"]],
	"filter feature": [["filter-component", "Filter feature implementation"]],
	"sort feature": [["sort-component", "Sort feature implementation"]],
	"pagination": [["pagination-component", "Pagination implementation"]],
	"infinite scroll": [["infinite-scroll", "Infinite scroll implementation"]],
	"virtual scroll": [["virtual-scroller", "Virtual scroll implementation"]],
	"drag and drop": [["dnd-kit", "Drag and drop implementation"]],
	"image carousel": [["image-carousel", "Image carousel creation"]],
	"video player": [["video-player", "Video player implementation"]],
	"audio player": [["audio-player", "Audio player implementation"]],
	"date picker": [["date-picker", "Date picker creation"]],
	"time picker": [["time-picker", "Time picker creation"]],
	"color picker": [["color-picker", "Color picker creation"]],
	"file tree": [["file-tree", "File tree component creation"]],
	"code editor": [["code-editor", "Code editor integration"]],
	"markdown editor": [["markdown-editor", "Markdown editor creation"]],
	"rich text": [["rich-text-editor", "Rich text editor integration"]],
	"wysiwyg": [["wysiwyg-editor", "WYSIWYG editor integration"]],
	"form validation": [["form-patterns", "Form validation improvement"]],
	"zod schema": [["zod", "Zod schema creation"]],
	"react query": [["react-query", "React Query implementation"]],
	"swr": [["swr", "SWR implementation"]],
	"context api": [["react-context", "React Context implementation"]],
	"use state": [["react-hooks", "useState hook usage"]],
	"use effect": [["react-hooks", "useEffect hook usage"]],
	"use memo": [["react-hooks", "useMemo hook usage"]],
	"use callback": [["react-hooks", "useCallback hook usage"]],
	"custom hook": [["react-hooks", "Custom hook creation"]],
	"forward ref": [["react-hooks", "forwardRef usage"]],
	"use ref": [["react-hooks", "useRef usage"]],
	"use reducer": [["react-hooks", "useReducer usage"]],
	"use context": [["react-hooks", "useContext usage"]],
	"suspense": [["react-suspense", "Suspense implementation"]],
	"lazy load": [["react-lazy", "Lazy loading implementation"]],
	"code splitting": [["code-splitting", "Code splitting implementation"]],
	"bundle optimize": [["bundle-optimization", "Bundle optimization"]],
	"tree shaking": [["tree-shaking", "Tree shaking optimization"]],
	"minify": [["minification", "Minification optimization"]],
	"gzip": [["compression", "Gzip compression"]],
	"cdn": [["cdn-setup", "CDN setup"]],
	"domain": [["dns-management", "Domain configuration"]],
	"apache": [["apache-config", "Apache configuration"]],
	"reverse proxy": [["reverse-proxy", "Reverse proxy setup"]],
	"load balancer": [["load-balancer", "Load balancer setup"]],
	"auto scale": [["auto-scaling", "Auto-scaling setup"]],
	"cicd": [["cicd-assistant", "CI/CD pipeline setup"]],
	"docker compose": [["docker-patterns", "Docker Compose setup"]],
	"aws": [["aws-services", "AWS service integration"]],
	"gcp": [["gcp-services", "GCP service integration"]],
	"azure": [["azure-services", "Azure service integration"]],
	"firebase": [["firebase-expert", "Firebase integration"]],
	"supabase": [["supabase-expert", "Supabase integration"]],
	"mongodb": [["mongodb-expert", "MongoDB integration"]],
	"postgresql": [["sql-postgresql", "PostgreSQL integration"]],
	"mysql": [["mysql-expert", "MySQL integration"]],
	"redis": [["redis-expert", "Redis integration"]],
	"elasticsearch": [["elasticsearch", "Elasticsearch integration"]],
	"graphql": [["graphql", "GraphQL implementation"]],
	"rest api": [["api-design", "REST API design"]],
	"grpc": [["grpc", "gRPC implementation"]],
	"socket.io": [["socketio-patterns", "Socket.io implementation"]],
	"rabbitmq": [["rabbitmq", "RabbitMQ implementation"]],
	"celery": [["celery", "Celery implementation"]],
	"bull": [["bull-queue", "Bull queue implementation"]],
	"agenda": [["agenda", "Agenda job scheduler"]],
	"node-cron": [["node-cron", "Node-cron scheduler"]],
	"pm2": [["pm2", "PM2 process manager"]],
	"supervisor": [["supervisor", "Supervisor process manager"]],
	"systemd": [["systemd", "Systemd service setup"]],
	"cron": [["cron-job-manager", "Cron job setup"]],
	"haproxy": [["haproxy", "HAProxy load balancer"]],
	"envoy": [["envoy", "Envoy proxy"]],
	"linkerd": [["service-mesh", "Linkerd service mesh"]],
	"consul": [["consul", "Consul service discovery"]],
	"vault": [["vault", "Vault secret management"]],
	"etcd": [["etcd", "etcd configuration store"]],
	"zookeeper": [["zookeeper", "Zookeeper coordination"]],
	"nats": [["nats", "NATS messaging"]],
	"pulsar": [["pulsar", "Pulsar messaging"]],
	"kafka streams": [["kafka-streams", "Kafka streams"]],
	"prefect": [["prefect", "Prefect orchestration"]],
	"great expectations": [["great-expectations", "Data validation"]],
	"bigquery": [["bigquery", "BigQuery data warehouse"]],
	"redshift": [["redshift", "Redshift data warehouse"]],
	"databricks": [["databricks", "Databricks lakehouse"]],
	"iceberg": [["iceberg", "Apache Iceberg tables"]],
	"delta lake": [["delta-lake", "Delta Lake tables"]],
	"hudi": [["hudi", "Apache Hudi tables"]],
	"parquet": [["parquet", "Parquet file format"]],
	"avro": [["avro", "Avro file format"]],
	"orc": [["orc", "ORC file format"]],
	"feast": [["feast", "Feature store"]],
	"mlflow": [["mlflow", "MLflow experiment tracking"]],
	"kubeflow": [["kubeflow", "Kubeflow ML pipelines"]],
	"sagemaker": [["sagemaker", "SageMaker ML platform"]],
	"vertex ai": [["vertex-ai", "Vertex AI platform"]],
	"openai": [["openai-api", "OpenAI API integration"]],
	"anthropic": [["anthropic-api", "Anthropic API integration"]],
	"ollama": [["ollama", "Ollama local LLM"]],
	"langchain": [["langchain", "LangChain framework"]],
	"semantic kernel": [["semantic-kernel", "Semantic Kernel framework"]],
	"embedding": [["embedding-manager", "Embedding generation"]],
	"agent": [["agent-builder", "AI agent building"]],
	"function calling": [["function-calling", "Function calling implementation"]],
	"mcp tool": [["mcp-development", "MCP tool development"]],
	"mcp resource": [["mcp-development", "MCP resource development"]],
	"mcp prompt": [["mcp-development", "MCP prompt development"]],
	"mcp transport": [["mcp-development", "MCP transport layer"]],
	"mcp auth": [["mcp-development", "MCP server authentication"]],
	"mcp test": [["mcp-development", "MCP server testing"]],
	"mcp deploy": [["mcp-development", "MCP server deployment"]],
	"mcp debug": [["mcp-development", "MCP server debugging"]],
	"mcp monitor": [["mcp-development", "MCP server monitoring"]],
	"mcp log": [["mcp-development", "MCP server logging"]],
	"mcp metric": [["mcp-development", "MCP server metrics"]],
	"mcp trace": [["mcp-development", "MCP server tracing"]],
	"mcp health": [["mcp-development", "MCP server health check"]],
	"mcp version": [["mcp-development", "MCP server versioning"]],
	"mcp upgrade": [["mcp-development", "MCP server upgrade"]],
	"mcp migrate": [["mcp-development", "MCP server migration"]],
	"mcp backup": [["mcp-development", "MCP server backup"]],
	"mcp restore": [["mcp-development", "MCP server restore"]],
	"mcp sync": [["mcp-development", "MCP server sync"]],
	"mcp clone": [["mcp-development", "MCP server clone"]],
	"mcp fork": [["mcp-development", "MCP server fork"]],
	"mcp merge": [["mcp-development", "MCP server merge"]],
	"mcp conflict": [["mcp-development", "MCP server conflict resolution"]],
	"mcp review": [["mcp-development", "MCP server code review"]],
	"mcp audit": [["mcp-development", "MCP server security audit"]],
	"mcp compliance": [["mcp-development", "MCP server compliance check"]],
	"mcp governance": [["mcp-development", "MCP server governance"]],
	"mcp policy": [["mcp-development", "MCP server policy"]],
	"mcp rule": [["mcp-development", "MCP server rule"]],
	"mcp permission": [["mcp-development", "MCP server permission"]],
	"mcp role": [["mcp-development", "MCP server role"]],
	"mcp access": [["mcp-development", "MCP server access control"]],
	"mcp token": [["mcp-development", "MCP server token management"]],
	"mcp session": [["mcp-development", "MCP server session management"]],
	"mcp cache": [["mcp-development", "MCP server caching"]],
	"mcp rate limit": [["mcp-development", "MCP server rate limiting"]],
	"mcp throttle": [["mcp-development", "MCP server throttling"]],
	"mcp queue": [["mcp-development", "MCP server queue management"]],
	"mcp worker": [["mcp-development", "MCP server worker management"]],
	"mcp job": [["mcp-development", "MCP server job management"]],
	"mcp task": [["mcp-development", "MCP server task management"]],
	"mcp workflow": [["mcp-development", "MCP server workflow automation"]],
	"mcp pipeline": [["mcp-development", "MCP server pipeline setup"]],
	"mcp stage": [["mcp-development", "MCP server stage management"]],
	"mcp environment": [["mcp-development", "MCP server environment setup"]],
	"mcp config": [["mcp-development", "MCP server configuration"]],
	"mcp setting": [["mcp-development", "MCP server settings"]],
	"mcp option": [["mcp-development", "MCP server options"]],
	"mcp param": [["mcp-development", "MCP server parameters"]],
	"mcp arg": [["mcp-development", "MCP server arguments"]],
	"mcp flag": [["mcp-development", "MCP server flags"]],
	"mcp env var": [["mcp-development", "MCP server environment variables"]],
	"mcp secret": [["mcp-development", "MCP server secrets management"]],
	"mcp key": [["mcp-development", "MCP server key management"]],
	"mcp cert": [["mcp-development", "MCP server certificate management"]],
	"mcp ssl": [["mcp-development", "MCP server SSL setup"]],
	"mcp tls": [["mcp-development", "MCP server TLS setup"]],
	"mcp https": [["mcp-development", "MCP server HTTPS setup"]],
	"mcp cors": [["mcp-development", "MCP server CORS setup"]],
	"mcp csrf": [["mcp-development", "MCP server CSRF protection"]],
	"mcp xss": [["mcp-development", "MCP server XSS protection"]],
	"mcp sql injection": [["mcp-development", "MCP server SQL injection protection"]],
	"mcp security": [["mcp-development", "MCP server security hardening"]],
	"mcp vulnerability": [["mcp-development", "MCP server vulnerability scanning"]],
	"mcp penetration test": [["mcp-development", "MCP server penetration testing"]],
	"mcp security audit": [["mcp-development", "MCP server security audit"]],
}

// ============================================================
// Project type detection
// ============================================================

/**
 * Detects project framework/type from package.json and file extensions.
 * Returns framework identifiers that can boost skill confidence.
 */
export function detectProjectType(projectDir?: string): string[] {
	if (!projectDir) return []

	const frameworks: string[] = []

	try {
		// Check package.json
		const pkgPath = join(projectDir, "package.json")
		if (existsSync(pkgPath)) {
			const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
			const allDeps = {
				...pkg.dependencies,
				...pkg.devDependencies,
				...pkg.peerDependencies,
			}

			if (allDeps.react || allDeps["react-dom"]) frameworks.push("react")
			if (allDeps.vue || allDeps.nuxt) frameworks.push("vue")
			if (allDeps.svelte || allDeps["@sveltejs/kit"]) frameworks.push("svelte")
			if (allDeps.angular || allDeps["@angular/core"]) frameworks.push("angular")
			if (allDeps.next) frameworks.push("nextjs")
			if (allDeps.nestjs || allDeps["@nestjs/core"]) frameworks.push("nestjs")
			if (allDeps.express) frameworks.push("express")
			if (allDeps.hono) frameworks.push("hono")
			if (allDeps.electron) frameworks.push("electron")
			if (allDeps.tailwindcss) frameworks.push("tailwind")
			if (allDeps.jotai || allDeps.zustand || allDeps.redux) frameworks.push("state-management")
			if (allDeps.prisma || allDeps.drizzle) frameworks.push("orm")
			if (allDeps["sqlite3"] || allDeps["better-sqlite3"] || allDeps.kysely) frameworks.push("sqlite")
			if (allDeps.mongodb || allDeps.mongoose) frameworks.push("mongodb")
			if (allDeps.postgres || allDeps.pg) frameworks.push("postgresql")
			if (allDeps.redis || allDeps.ioredis) frameworks.push("redis")
			if (allDeps.docker || pkg.scripts?.docker) frameworks.push("docker")
			if (allDeps.vitest || allDeps.jest || allDeps["@playwright/test"]) frameworks.push("testing")
			if (allDeps.biome || allDeps.eslint || allDeps.prettier) frameworks.push("linting")
			if (allDeps.typescript) frameworks.push("typescript")
			if (allDeps.vite) frameworks.push("vite")
			if (allDeps.webpack || allDeps.esbuild) frameworks.push("bundler")
			if (allDeps.graphql || allDeps["@apollo/client"]) frameworks.push("graphql")
			if (allDeps.zod || allDeps.yup || allDeps.joi) frameworks.push("validation")
			if (allDeps.lucide || allDeps["@heroicons/react"] || allDeps["lucide-react"]) frameworks.push("icons")
			if (allDeps["@tanstack/react-query"] || allDeps.swr) frameworks.push("data-fetching")
			if (allDeps.framer || allDeps["framer-motion"]) frameworks.push("animation")
			if (allDeps.three || allDeps["@react-three/fiber"]) frameworks.push("3d")
		}

		// Check tsconfig.json for TypeScript
		const tsconfigPath = join(projectDir, "tsconfig.json")
		if (existsSync(tsconfigPath) && !frameworks.includes("typescript")) {
			frameworks.push("typescript")
		}

		// Check for common config files
		if (existsSync(join(projectDir, "Dockerfile")) || existsSync(join(projectDir, "docker-compose.yml"))) {
			if (!frameworks.includes("docker")) frameworks.push("docker")
		}
		if (existsSync(join(projectDir, ".github/workflows"))) {
			frameworks.push("ci-cd")
		}
	} catch {
		// Ignore errors
	}

	return frameworks
}

/**
 * Boosts skill confidence based on detected project frameworks.
 */
function applyFrameworkBoosts(matchedSkills: Map<string, SkillMatch>, frameworks: string[]): void {
	const frameworkSkillMap: Record<string, string[]> = {
		react: ["react-best-practices", "css-tailwind", "jotai-deep"],
		vue: ["vue-expert"],
		svelte: ["svelte"],
		angular: ["angular-expert"],
		nextjs: ["nextjs-developer"],
		nestjs: ["nestjs-expert"],
		express: ["express-expert"],
		hono: ["api-design", "api-builder"],
		electron: ["electron-ipc", "electron-security", "electron-packaging"],
		tailwind: ["css-tailwind"],
		"state-management": ["jotai-deep"],
		orm: ["database-designer", "database-migrator"],
		sqlite: ["sqlite-bun"],
		mongodb: ["mongodb-expert"],
		postgresql: ["sql-postgresql"],
		redis: ["redis-expert"],
		docker: ["docker-patterns"],
		testing: ["testing-patterns", "test-generation"],
		linting: ["biome-formatting"],
		typescript: ["typescript-patterns"],
		vite: ["vite"],
		bundler: ["webpack"],
		graphql: ["graphql"],
		validation: ["zod"],
		icons: ["lucide"],
		"data-fetching": ["react-query"],
		animation: ["animation"],
		"3d": ["three"],
		"ci-cd": ["cicd-assistant"],
	}

	for (const framework of frameworks) {
		const relatedSkills = frameworkSkillMap[framework] || []
		for (const skillName of relatedSkills) {
			const match = matchedSkills.get(skillName)
			if (match) {
				// Boost confidence by 15% for framework matches
				match.confidence = Math.min(100, match.confidence + 15)
				match.reason += ` + project uses ${framework}`
			} else {
				// Add as new match with base confidence
				matchedSkills.set(skillName, {
					name: skillName,
					confidence: 60,
					reason: `project uses ${framework}`,
				})
			}
		}
	}
}

// ============================================================
// File extension awareness
// ============================================================

/**
 * Detects file extensions mentioned in the prompt and returns relevant skills.
 * E.g., ".tsx" -> React skills, ".py" -> Python skills
 */
function detectFileExtensionsInPrompt(prompt: string): Array<[string, string]> {
	const results: Array<[string, string]> = []

	// File extension to skill mapping
	const extensionSkillMap: Record<string, Array<[string, string]>> = {
		".tsx": [["react-best-practices", "React/TSX file mentioned"], ["typescript-patterns", "TypeScript file"]],
		".jsx": [["react-best-practices", "React/JSX file mentioned"]],
		".ts": [["typescript-patterns", "TypeScript file mentioned"]],
		".js": [["javascript-expert", "JavaScript file mentioned"]],
		".vue": [["vue-expert", "Vue file mentioned"]],
		".svelte": [["svelte", "Svelte file mentioned"]],
		".angular": [["angular-expert", "Angular file mentioned"]],
		".py": [["python-automation", "Python file mentioned"]],
		".rs": [["rust-expert", "Rust file mentioned"]],
		".go": [["go-developer", "Go file mentioned"]],
		".java": [["java-expert", "Java file mentioned"]],
		".cs": [["csharp-expert", "C# file mentioned"]],
		".cpp": [["cpp-expert", "C++ file mentioned"]],
		".c": [["c-expert", "C file mentioned"]],
		".rb": [["ruby-expert", "Ruby file mentioned"]],
		".php": [["php-expert", "PHP file mentioned"]],
		".swift": [["swift-swiftui", "Swift file mentioned"]],
		".kt": [["kotlin-compose", "Kotlin file mentioned"]],
		".dart": [["flutter-expert", "Dart file mentioned"]],
		".sql": [["sql-postgresql", "SQL file mentioned"]],
		".graphql": [["graphql", "GraphQL file mentioned"]],
		".gql": [["graphql", "GraphQL file mentioned"]],
		".yaml": [["yaml-config", "YAML config file mentioned"]],
		".yml": [["yaml-config", "YAML config file mentioned"]],
		".json": [["json-schema", "JSON file mentioned"]],
		".toml": [["toml-config", "TOML config file mentioned"]],
		".md": [["markdown-rendering", "Markdown file mentioned"]],
		".mdx": [["mdx", "MDX file mentioned"]],
		".css": [["css-tailwind", "CSS file mentioned"]],
		".scss": [["scss", "SCSS file mentioned"]],
		".less": [["less", "Less file mentioned"]],
		".html": [["html-expert", "HTML file mentioned"]],
		".svg": [["svg-optimization", "SVG file mentioned"]],
		".png": [["image-processing", "Image file mentioned"]],
		".jpg": [["image-processing", "Image file mentioned"]],
		".jpeg": [["image-processing", "Image file mentioned"]],
		".gif": [["image-processing", "Image file mentioned"]],
		".webp": [["image-processing", "Image file mentioned"]],
		".mp4": [["video-processing", "Video file mentioned"]],
		".mov": [["video-processing", "Video file mentioned"]],
		".avi": [["video-processing", "Video file mentioned"]],
		".mp3": [["audio-processing", "Audio file mentioned"]],
		".wav": [["audio-processing", "Audio file mentioned"]],
		".pdf": [["pdf-generator", "PDF file mentioned"]],
		".docx": [["docx-parser", "Word document mentioned"]],
		".xlsx": [["excel-automation", "Excel file mentioned"]],
		".csv": [["csv-processor", "CSV file mentioned"]],
		".xml": [["xml-parser", "XML file mentioned"]],
		".env": [["env-config", "Environment config mentioned"]],
		".dockerfile": [["docker-patterns", "Dockerfile mentioned"]],
		".tf": [["terraform-expert", "Terraform file mentioned"]],
		".hcl": [["terraform-expert", "HCL file mentioned"]],
		".sh": [["bash-scripting", "Shell script mentioned"]],
		".bash": [["bash-scripting", "Bash script mentioned"]],
		".zsh": [["zsh-config", "Zsh config mentioned"]],
		".fish": [["fish-config", "Fish config mentioned"]],
		".ps1": [["powershell", "PowerShell script mentioned"]],
		".bat": [["batch-script", "Batch script mentioned"]],
		".cmd": [["batch-script", "Batch script mentioned"]],
	}

	// Check for file extensions in prompt (e.g., "component.tsx", "style.css")
	const extensionRegex = /\.[a-z]{2,4}\b/g
	let match
	while ((match = extensionRegex.exec(prompt)) !== null) {
		const ext = match[0].toLowerCase()
		const skills = extensionSkillMap[ext]
		if (skills) {
			results.push(...skills)
		}
	}

	return results
}

// ============================================================
// Core matching function
// ============================================================

/**
 * Detects relevant skills from a user prompt.
 * Returns skills sorted by confidence (highest first).
 * Optionally detects project type and boosts relevant skills.
 */
export function detectSkillsFromPrompt(prompt: string, skillsDir?: string, projectDir?: string): SkillDetectionResult {
	const lowerPrompt = prompt.toLowerCase()
	const matchedSkills = new Map<string, SkillMatch>()
	const detectedKeywords: string[] = []

	// Scan all keyword patterns
	for (const [pattern, skillEntries] of Object.entries(SKILL_KEYWORDS)) {
		if (lowerPrompt.includes(pattern)) {
			detectedKeywords.push(pattern)

			for (const [skillName, reason] of skillEntries) {
				const existing = matchedSkills.get(skillName)
				if (existing) {
					// Boost confidence if multiple patterns match
					existing.confidence = Math.min(100, existing.confidence + 20)
					existing.reason += ` + ${reason}`
				} else {
					matchedSkills.set(skillName, {
						name: skillName,
						confidence: 70,
						reason,
					})
				}
			}
		}
	}

	// Detect project type and boost relevant skills
	if (projectDir) {
		const frameworks = detectProjectType(projectDir)
		if (frameworks.length > 0) {
			applyFrameworkBoosts(matchedSkills, frameworks)
		}
	}

	// Detect file extensions in prompt and boost relevant skills
	const fileExtensionSkills = detectFileExtensionsInPrompt(lowerPrompt)
	for (const [skillName, reason] of fileExtensionSkills) {
		const existing = matchedSkills.get(skillName)
		if (existing) {
			existing.confidence = Math.min(100, existing.confidence + 10)
			existing.reason += ` + ${reason}`
		} else {
			matchedSkills.set(skillName, {
				name: skillName,
				confidence: 65,
				reason,
			})
		}
	}

	// Try to load skill descriptions and full content from SKILL.md files
	if (skillsDir && existsSync(skillsDir)) {
		for (const [skillName, match] of matchedSkills) {
			const skillMdPath = join(skillsDir, skillName, "SKILL.md")
			if (existsSync(skillMdPath)) {
				try {
					const content = readFileSync(skillMdPath, "utf-8")
					// Extract description from frontmatter
					const descMatch = content.match(/description:\s*(.+)/i)
					if (descMatch) {
						match.description = descMatch[1].trim()
					}
					// Load full content for high-confidence matches
					// Extract content after frontmatter (skip --- lines)
					const lines = content.split("\n")
					let afterFrontmatter = false
					let frontmatterCount = 0
					const contentLines: string[] = []
					for (const line of lines) {
						if (line.trim() === "---") {
							frontmatterCount++
							if (frontmatterCount === 2) {
								afterFrontmatter = true
							}
							continue
						}
						if (afterFrontmatter) {
							contentLines.push(line)
						}
					}
					if (contentLines.length > 0) {
						match.fullContent = contentLines.join("\n").trim()
					}
				} catch {
					// Ignore read errors
				}
			}
		}
	}

	// Sort by confidence (highest first)
	const skills = Array.from(matchedSkills.values()).sort((a, b) => b.confidence - a.confidence)

	log.info("Skill detection", { prompt: prompt.slice(0, 50), keywords: detectedKeywords, skills: skills.map((s) => s.name) })

	return { skills, keywords: detectedKeywords }
}

/**
 * Gets a formatted string of matched skills for injection into system prompts.
 * Loads full SKILL.md content for high-confidence matches.
 */
export function formatSkillsForPrompt(result: SkillDetectionResult): string {
	if (result.skills.length === 0) return ""

	const lines = ["## Auto-Detected Skills", ""]

	for (const skill of result.skills.slice(0, 5)) {
		lines.push(`### ${skill.name}`)
		if (skill.description) {
			lines.push(skill.description)
		}
		lines.push(`Confidence: ${skill.confidence}% | Reason: ${skill.reason}`)
		// Load full SKILL.md content for high-confidence matches
		if (skill.confidence >= 70 && skill.fullContent) {
			lines.push("")
			lines.push("**Instructions:**")
			lines.push("")
			lines.push(skill.fullContent)
		}
		lines.push("")
	}

	return lines.join("\n")
}

/**
 * Checks if a specific skill should be loaded based on the prompt.
 */
export function shouldLoadSkill(prompt: string, skillName: string): boolean {
	const lowerPrompt = prompt.toLowerCase()
	const skillLower = skillName.toLowerCase()

	// Direct name mention
	if (lowerPrompt.includes(skillLower)) return true

	// Check keyword patterns for this skill
	for (const [pattern, skillEntries] of Object.entries(SKILL_KEYWORDS)) {
		if (lowerPrompt.includes(pattern)) {
			for (const [name] of skillEntries) {
				if (name === skillName) return true
			}
		}
	}

	return false
}

/**
 * Lists all available skills from the skills directory.
 */
export function listAvailableSkills(skillsDir: string): string[] {
	if (!existsSync(skillsDir)) return []

	try {
		return readdirSync(skillsDir).filter((entry) => {
			const skillPath = join(skillsDir, entry)
			return (
				entry !== "skills-cursor" &&
				existsSync(join(skillPath, "SKILL.md"))
			)
		})
	} catch {
		return []
	}
}
