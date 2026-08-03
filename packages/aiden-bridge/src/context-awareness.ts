/**
 * Context Awareness System for Devil AI
 *
 * Maintains and utilizes context across interactions
 */

export interface ContextState {
	currentTask: string | null
	activeApplication: string | null
	recentFiles: string[]
	recentWebsites: string[]
	conversationTopic: string
	userPreferences: Map<string, any>
	sessionStartTime: Date
	lastInteraction: Date
}

export interface ContextWindow {
	messages: ContextMessage[]
	maxTokens: number
	currentTokens: number
}

export interface ContextMessage {
	role: "user" | "assistant" | "system"
	content: string
	timestamp: Date
	metadata?: Record<string, any>
}

export class ContextAwareness {
	private state: ContextState
	private contextWindow: ContextWindow
	private contextHistory: Map<string, any[]> = new Map()

	constructor() {
		this.state = {
			currentTask: null,
			activeApplication: null,
			recentFiles: [],
			recentWebsites: [],
			conversationTopic: "",
			userPreferences: new Map(),
			sessionStartTime: new Date(),
			lastInteraction: new Date(),
		}

		this.contextWindow = {
			messages: [],
			maxTokens: 4000,
			currentTokens: 0,
		}
	}

	/**
	 * Update context with new information
	 */
	updateContext(updates: Partial<ContextState>): void {
		Object.assign(this.state, updates)
		this.state.lastInteraction = new Date()
	}

	/**
	 * Add message to context window
	 */
	addMessage(message: ContextMessage): void {
		this.contextWindow.messages.push(message)

		// Estimate tokens (rough estimate: 1 token ≈ 4 characters)
		const messageTokens = Math.ceil(message.content.length / 4)
		this.contextWindow.currentTokens += messageTokens

		// Trim context if needed
		while (
			this.contextWindow.currentTokens > this.contextWindow.maxTokens &&
			this.contextWindow.messages.length > 1
		) {
			const removed = this.contextWindow.messages.shift()!
			this.contextWindow.currentTokens -= Math.ceil(removed.content.length / 4)
		}
	}

	/**
	 * Get relevant context for current query
	 */
	getRelevantContext(_query: string): any[] {
		const context: any[] = []

		// Add current state
		if (this.state.currentTask) {
			context.push({ type: "task", value: this.state.currentTask })
		}

		if (this.state.activeApplication) {
			context.push({ type: "application", value: this.state.activeApplication })
		}

		// Add recent files
		if (this.state.recentFiles.length > 0) {
			context.push({ type: "recentFiles", value: this.state.recentFiles.slice(0, 5) })
		}

		// Add recent websites
		if (this.state.recentWebsites.length > 0) {
			context.push({ type: "recentWebsites", value: this.state.recentWebsites.slice(0, 5) })
		}

		// Add conversation history
		const recentMessages = this.contextWindow.messages.slice(-5)
		if (recentMessages.length > 0) {
			context.push({ type: "conversationHistory", value: recentMessages })
		}

		// Add user preferences
		if (this.state.userPreferences.size > 0) {
			context.push({ type: "preferences", value: Object.fromEntries(this.state.userPreferences) })
		}

		return context
	}

	/**
	 * Track file access
	 */
	trackFileAccess(filePath: string): void {
		// Remove if exists
		const index = this.state.recentFiles.indexOf(filePath)
		if (index > -1) {
			this.state.recentFiles.splice(index, 1)
		}

		// Add to beginning
		this.state.recentFiles.unshift(filePath)

		// Keep only last 10
		if (this.state.recentFiles.length > 10) {
			this.state.recentFiles.pop()
		}
	}

	/**
	 * Track website visit
	 */
	trackWebsiteVisit(url: string): void {
		// Remove if exists
		const index = this.state.recentWebsites.indexOf(url)
		if (index > -1) {
			this.state.recentWebsites.splice(index, 1)
		}

		// Add to beginning
		this.state.recentWebsites.unshift(url)

		// Keep only last 10
		if (this.state.recentWebsites.length > 10) {
			this.state.recentWebsites.pop()
		}
	}

	/**
	 * Set user preference
	 */
	setPreference(key: string, value: any): void {
		this.state.userPreferences.set(key, value)
	}

	/**
	 * Get user preference
	 */
	getPreference(key: string): any {
		return this.state.userPreferences.get(key)
	}

	/**
	 * Detect topic from input
	 */
	detectTopic(input: string): string {
		const topics: Record<string, string[]> = {
			file: ["file", "folder", "document", "download", "organize", "backup"],
			web: ["search", "google", "website", "browse", "internet", "url"],
			system: ["computer", "system", "process", "memory", "cpu", "disk"],
			schedule: ["schedule", "calendar", "meeting", "reminder", "alarm", "event"],
			code: ["code", "program", "develop", "debug", "software", "api"],
			email: ["email", "mail", "inbox", "send", "message"],
			media: ["music", "video", "photo", "image", "play", "watch"],
		}

		const lowerInput = input.toLowerCase()

		for (const [topic, keywords] of Object.entries(topics)) {
			if (keywords.some((k) => lowerInput.includes(k))) {
				return topic
			}
		}

		return "general"
	}

	/**
	 * Get context summary
	 */
	getContextSummary(): string {
		const summary: string[] = []

		if (this.state.currentTask) {
			summary.push(`Current task: ${this.state.currentTask}`)
		}

		if (this.state.activeApplication) {
			summary.push(`Active app: ${this.state.activeApplication}`)
		}

		if (this.state.recentFiles.length > 0) {
			summary.push(`Recent files: ${this.state.recentFiles.slice(0, 3).join(", ")}`)
		}

		if (this.state.recentWebsites.length > 0) {
			summary.push(`Recent sites: ${this.state.recentWebsites.slice(0, 3).join(", ")}`)
		}

		if (this.state.conversationTopic) {
			summary.push(`Topic: ${this.state.conversationTopic}`)
		}

		return summary.join("\n") || "No context available"
	}

	/**
	 * Save context to history
	 */
	saveContext(sessionId: string): void {
		this.contextHistory.set(sessionId, [{ ...this.state }, { ...this.contextWindow }])
	}

	/**
	 * Load context from history
	 */
	loadContext(sessionId: string): boolean {
		const saved = this.contextHistory.get(sessionId)
		if (saved) {
			this.state = saved[0]
			this.contextWindow = saved[1]
			return true
		}
		return false
	}

	/**
	 * Clear context
	 */
	clearContext(): void {
		this.state = {
			currentTask: null,
			activeApplication: null,
			recentFiles: [],
			recentWebsites: [],
			conversationTopic: "",
			userPreferences: new Map(),
			sessionStartTime: new Date(),
			lastInteraction: new Date(),
		}

		this.contextWindow = {
			messages: [],
			maxTokens: 4000,
			currentTokens: 0,
		}
	}

	/**
	 * Get state
	 */
	getState(): ContextState {
		return { ...this.state }
	}

	/**
	 * Get context window
	 */
	getContextWindow(): ContextWindow {
		return { ...this.contextWindow }
	}
}

export default ContextAwareness
