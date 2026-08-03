/**
 * Session Organizer
 * 
 * Automatically organizes conversations into project-specific sessions.
 * Routes questions to the correct session based on content analysis.
 * 
 * @module session-organizer
 */

// ============================================================
// Types
// ============================================================

export interface SessionRoute {
	/** Target session ID */
	sessionId: string | null
	/** Target directory/project */
	directory: string
	/** Whether to create a new session */
	createNew: boolean
	/** Suggested title for new session */
	suggestedTitle?: string
	/** Reason for routing decision */
	reason: string
}

export interface ProjectSession {
	/** Project directory */
	directory: string
	/** Project name */
	name: string
	/** Session ID for this project */
	sessionId: string
	/** Session title */
	title: string
	/** Last activity timestamp */
	lastActivity: number
}

// ============================================================
// Global Topics (go to "General" session)
// ============================================================

const GENERAL_TOPICS = new Set([
	// Greetings
	"hello", "hi", "hey", "good morning", "good evening", "good afternoon",
	
	// General questions
	"what is", "who is", "how does", "explain", "define", "meaning of",
	"tell me about", "describe", "difference between", "compare",
	
	// Weather & time
	"weather", "temperature", "time in", "date today", "what day",
	
	// Math & calculations
	"calculate", "math", "formula", "equation", "convert",
	
	// General advice
	"advice", "suggestion", "recommend", "best practices", "tips",
	"how to learn", "learning path", "career advice",
	
	// News & current events
	"news", "latest", "recent", "current events", "happening",
	
	// Non-technical
	"recipe", "cook", "food", "restaurant", "movie", "music",
	"book", "game", "sport", "travel", "health", "fitness",
	
	// General coding (not project-specific)
	"what is react", "what is python", "what is docker",
	"how does git work", "what is api", "what is database",
	"explain algorithm", "what is design pattern",
	
	// Devil AI specific
	"who are you", "what are you", "devil ai", "help", "capabilities",
])

// ============================================================
// Project Keywords Mapping
// ============================================================

const PROJECT_KEYWORDS: Record<string, string[]> = {
	// Frontend frameworks
	"react": ["react", "jsx", "tsx", "component", "hook", "useState", "useEffect"],
	"vue": ["vue", "vuejs", "nuxt", "composition api", "sfc"],
	"angular": ["angular", "ng", "typescript", "decorator", "rxjs"],
	"svelte": ["svelte", "sveltekit", "store", "action"],
	
	// Backend frameworks
	"nextjs": ["nextjs", "next.js", "app router", "server component", "page.tsx"],
	"express": ["express", "middleware", "router", "req", "res"],
	"fastify": ["fastify", "route", "plugin"],
	"hono": ["hono", "edge", "cloudflare workers"],
	
	// Languages
	"typescript": ["typescript", "ts", "interface", "type", "generic"],
	"python": ["python", "pip", "django", "flask", "fastapi"],
	"rust": ["rust", "cargo", "rustc", "borrow", "ownership"],
	"go": ["go", "golang", "goroutine", "channel"],
	"java": ["java", "spring", "maven", "gradle"],
	
	// Databases
	"prisma": ["prisma", "schema.prisma", "migration", "prisma studio"],
	"drizzle": ["drizzle", "orm", "sql", "postgres"],
	"mongodb": ["mongodb", "mongoose", "collection", "document"],
	"sql": ["sql", "mysql", "postgres", "query", "select", "insert"],
	
	// DevOps
	"docker": ["docker", "container", "dockerfile", "compose"],
	"kubernetes": ["k8s", "kubernetes", "pod", "deployment", "service"],
	"aws": ["aws", "s3", "ec2", "lambda", "cloudfront"],
	"vercel": ["vercel", "deployment", "edge function"],
	
	// Tools
	"git": ["git", "commit", "push", "pull", "branch", "merge"],
	"github": ["github", "repository", "issue", "pull request", "action"],
	"eslint": ["eslint", "lint", "prettier", "code style"],
	
	// Project-specific patterns
	"electron": ["electron", "ipc", "preload", "main process", "renderer"],
	"tauri": ["tauri", "invoke", "command", "webview"],
}

// ============================================================
// Detection Functions
// ============================================================

/**
 * Analyzes a question and determines which session it should go to
 */
export function routeQuestion(
	question: string,
	availableSessions: ProjectSession[],
	currentDirectory?: string,
): SessionRoute {
	const lowerQuestion = question.toLowerCase()
	const words = lowerQuestion.split(/\s+/)
	
	// Check if it's a general topic
	const isGeneralTopic = Array.from(GENERAL_TOPICS).some(topic => 
		lowerQuestion.includes(topic)
	)
	
	if (isGeneralTopic) {
		// Find existing "General" session or create new one
		const generalSession = availableSessions.find(s => 
			s.name.toLowerCase() === "general" || 
			s.title.toLowerCase().includes("general") ||
			s.title.toLowerCase().includes("chat")
		)
		
		if (generalSession) {
			return {
				sessionId: generalSession.sessionId,
				directory: generalSession.directory,
				createNew: false,
				reason: "General topic routed to existing General session",
			}
		}
		
		// Need to create a new General session
		return {
			sessionId: null,
			directory: currentDirectory || "",
			createNew: true,
			suggestedTitle: "General Chat",
			reason: "General topic - creating new General session",
		}
	}
	
	// Check for project-specific keywords
	const matchedProjects: Array<{ project: ProjectSession; score: number }> = []
	
	for (const session of availableSessions) {
		let score = 0
		
		// Check if question mentions project name
		if (lowerQuestion.includes(session.name.toLowerCase())) {
			score += 0.5
		}
		
		// Check for project-specific keywords
		for (const [projectType, keywords] of Object.entries(PROJECT_KEYWORDS)) {
			if (session.name.toLowerCase().includes(projectType) || 
				session.title.toLowerCase().includes(projectType)) {
				const hasKeyword = keywords.some(kw => lowerQuestion.includes(kw))
				if (hasKeyword) {
					score += 0.3
				}
			}
		}
		
		if (score > 0) {
			matchedProjects.push({ project: session, score })
		}
	}
	
	// Sort by score and get best match
	matchedProjects.sort((a, b) => b.score - a.score)
	
	if (matchedProjects.length > 0 && matchedProjects[0].score > 0.3) {
		const bestMatch = matchedProjects[0].project
		return {
			sessionId: bestMatch.sessionId,
			directory: bestMatch.directory,
			createNew: false,
			reason: `Matched project: ${bestMatch.name} (score: ${matchedProjects[0].score})`,
		}
	}
	
	// Check if question is about current project (follow-up)
	if (currentDirectory) {
		const currentSession = availableSessions.find(s => s.directory === currentDirectory)
		if (currentSession) {
			// Check if it's a follow-up question
			const isFollowUp = words.some(w => 
				["this", "that", "it", "here", "above", "below"].includes(w)
			)
			if (isFollowUp) {
				return {
					sessionId: currentSession.sessionId,
					directory: currentDirectory,
					createNew: false,
					reason: "Follow-up question in current project",
				}
			}
		}
	}
	
	// No clear match - ask user or use current session
	if (currentDirectory) {
		const currentSession = availableSessions.find(s => s.directory === currentDirectory)
		if (currentSession) {
			return {
				sessionId: currentSession.sessionId,
				directory: currentDirectory,
				createNew: false,
				reason: "No clear project match - using current session",
			}
		}
	}
	
	// Fallback: create new session in current directory
	return {
		sessionId: null,
		directory: currentDirectory || "",
		createNew: true,
		suggestedTitle: extractSessionTitle(question),
		reason: "No matching session found - creating new session",
	}
}

/**
 * Extracts a suggested session title from the question
 */
function extractSessionTitle(question: string): string {
	// Remove common prefixes
	const cleaned = question
		.replace(/^(what|who|how|why|when|where|can|could|would|should|do|does|did|is|are|was|were)\s+(is|are|do|does|did|is|it|the|a|an)?\s*/i, '')
		.trim()
	
	// Take first few words
	const words = cleaned.split(/\s+/).slice(0, 4).join(' ')
	
	// Capitalize first letter
	return words.charAt(0).toUpperCase() + words.slice(1) || "New Chat"
}

/**
 * Gets all available sessions from the store
 */
export function getAvailableSessions(
	sessions: Map<string, { session: { id: string; title?: string }; directory: string }>,
): ProjectSession[] {
	const result: ProjectSession[] = []
	
	for (const [, entry] of sessions) {
		const session = entry.session
		const directory = entry.directory
		
		// Extract project name from directory
		const pathParts = directory.split('/')
		const projectName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'unknown'
		
		result.push({
			directory,
			name: projectName,
			sessionId: session.id,
			title: session.title || projectName,
			lastActivity: Date.now(), // TODO: track actual last activity
		})
	}
	
	return result
}

/**
 * Generates a user-friendly message for session routing
 */
export function getRoutingMessage(route: SessionRoute): string {
	if (route.createNew) {
		return `Creating new session "${route.suggestedTitle}" for this question.`
	}
	
	if (route.reason.includes("General")) {
		return `Moving to General Chat for this question.`
	}
	
	return `Routing to project: ${route.reason}`
}
