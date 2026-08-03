/**
 * Project Context Detector
 * 
 * Detects if a user's question is related to the current project.
 * If not, suggests creating a new session to keep conversations organized.
 * 
 * @module project-context-detector
 */

import { createLogger } from "./logger"

const log = createLogger("project-context-detector")

// ============================================================
// Types
// ============================================================

export interface ProjectContextResult {
	/** Whether the question is project-related */
	isProjectRelated: boolean
	/** Confidence score (0-1) */
	confidence: number
	/** Reason for the decision */
	reason: string
	/** Suggested action */
	suggestion: "continue" | "new-session" | "ask-user"
}

export interface ProjectInfo {
	/** Project directory path */
	directory: string
	/** Project name (from directory or package.json) */
	name: string
	/** Project type (e.g., "node", "python", "rust") */
	type: string
	/** Recent files in the project */
	recentFiles: string[]
	/** Key technologies/frameworks used */
	technologies: string[]
}

// ============================================================
// Project-agnostic keywords (topics that are NOT project-specific)
// ============================================================

const GLOBAL_TOPICS = new Set([
	// General knowledge
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
])

// ============================================================
// Project-specific indicators
// ============================================================

const PROJECT_INDICATORS = new Set([
	// File operations
	"this file", "that file", "the file", "current file", "open file",
	"edit file", "create file", "delete file", "modify file",
	
	// Code references
	"this function", "that function", "the function", "current function",
	"this component", "that component", "the component",
	"this class", "that class", "the class",
	"this module", "that module", "the module",
	
	// Project-specific
	"our project", "this project", "the project", "current project",
	"the codebase", "our code", "this code", "that code",
	"the implementation", "this implementation",
	
	// Build & run
	"build", "compile", "run", "test", "deploy", "start", "stop",
	"install", "setup", "configure", "fix", "debug", "error",
	
	// Version control
	"commit", "push", "pull", "merge", "branch", "git",
	
	// Specific file types
	".js", ".ts", ".tsx", ".jsx", ".py", ".rs", ".go", ".java",
	".css", ".html", ".json", ".yaml", ".yml", ".md",
])

// ============================================================
// Detection Functions
// ============================================================

/**
 * Analyzes if a question is related to the current project
 */
export function detectProjectRelevance(
	question: string,
	projectInfo: ProjectInfo,
	recentConversation: string[] = [],
): ProjectContextResult {
	const lowerQuestion = question.toLowerCase()
	const words = lowerQuestion.split(/\s+/)
	
	// Score tracking
	let projectScore = 0
	let globalScore = 0
	let reasons: string[] = []
	
	// Check for project-specific file references
	const hasFileReference = PROJECT_INDICATORS.has(lowerQuestion) ||
		words.some(w => PROJECT_INDICATORS.has(w))
	if (hasFileReference) {
		projectScore += 0.3
		reasons.push("contains project-specific reference")
	}
	
	// Check if question mentions project name
	if (projectInfo.name && lowerQuestion.includes(projectInfo.name.toLowerCase())) {
		projectScore += 0.4
		reasons.push(`mentions project name: ${projectInfo.name}`)
	}
	
	// Check if question mentions project technologies
	if (projectInfo.technologies.length > 0) {
		const mentionsTech = projectInfo.technologies.some(tech => 
			lowerQuestion.includes(tech.toLowerCase())
		)
		if (mentionsTech) {
			projectScore += 0.2
			reasons.push("mentions project technology")
		}
	}
	
	// Check if question mentions recent files
	if (projectInfo.recentFiles.length > 0) {
		const mentionsFile = projectInfo.recentFiles.some(file => {
			const fileName = file.split('/').pop()?.toLowerCase() || ''
			return lowerQuestion.includes(fileName)
		})
		if (mentionsFile) {
			projectScore += 0.3
			reasons.push("mentions recent project file")
		}
	}
	
	// Check for global/non-project topics
	const isGlobalTopic = Array.from(GLOBAL_TOPICS).some(topic => 
		lowerQuestion.includes(topic)
	)
	if (isGlobalTopic) {
		globalScore += 0.4
		reasons.push("contains general knowledge topic")
	}
	
	// Check for explicit project context in conversation
	if (recentConversation.length > 0) {
		const lastMessage = recentConversation[recentConversation.length - 1]?.toLowerCase() || ""
		const isFollowUp = words.some(w => lastMessage.includes(w))
		if (isFollowUp) {
			projectScore += 0.2
			reasons.push("follows up on previous conversation")
		}
	}
	
	// Check for question patterns that suggest general inquiry
	const isGeneralQuestion = /^(what|who|where|when|why|how)\s+(is|are|was|were|do|does|did|can|could|would|should|will)/.test(lowerQuestion)
	if (isGeneralQuestion && !hasFileReference) {
		globalScore += 0.2
		reasons.push("general question pattern")
	}
	
	// Calculate final scores
	const totalScore = projectScore + globalScore
	const projectRelated = projectScore > globalScore
	const confidence = Math.min(Math.abs(projectScore - globalScore) / Math.max(totalScore, 0.01), 1)
	
	// Determine suggestion
	let suggestion: "continue" | "new-session" | "ask-user"
	if (confidence > 0.6) {
		suggestion = projectRelated ? "continue" : "new-session"
	} else {
		suggestion = "ask-user"
	}
	
	const result: ProjectContextResult = {
		isProjectRelated: projectRelated,
		confidence,
		reason: reasons.join("; ") || "insufficient signals",
		suggestion,
	}
	
	log.debug("Project context detection", {
		question: question.slice(0, 50),
		projectScore,
		globalScore,
		result,
	})
	
	return result
}

/**
 * Gets project info from directory path
 */
export async function getProjectInfo(directory: string): Promise<ProjectInfo> {
	const info: ProjectInfo = {
		directory,
		name: directory.split('/').pop() || 'unknown',
		type: 'unknown',
		recentFiles: [],
		technologies: [],
	}
	
	try {
		// Extract project name from directory path
		// Common patterns: /path/to/project-name, /path/to/project-name/src
		const pathParts = directory.split('/')
		const projectName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'unknown'
		info.name = projectName
		
		// Detect project type from directory structure
		if (directory.includes('node_modules') || directory.includes('package.json')) {
			info.type = 'node'
			info.technologies.push('nodejs')
		}
		if (directory.includes('requirements.txt') || directory.includes('setup.py')) {
			info.type = 'python'
			info.technologies.push('python')
		}
		if (directory.includes('Cargo.toml')) {
			info.type = 'rust'
			info.technologies.push('rust')
		}
		if (directory.includes('go.mod')) {
			info.type = 'go'
			info.technologies.push('go')
		}
	} catch (err) {
		log.debug("Failed to extract project info", { directory }, err)
	}
	
	return info
}

/**
 * Generates a user-friendly message for session switching
 */
export function getSessionSwitchMessage(result: ProjectContextResult, projectName: string): string {
	if (result.suggestion === "new-session") {
		return `This question seems unrelated to the current project (${projectName}). I'll create a new session for this to keep our conversation organized.`
	}
	
	if (result.suggestion === "ask-user") {
		return `I'm not sure if this question is related to ${projectName}. Would you like me to:\n\n1. **Reply here** (if it's project-related)\n2. **Create a new session** (if it's a general question)\n\nJust let me know!`
	}
	
	return ""
}
