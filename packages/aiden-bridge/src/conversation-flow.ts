/**
 * Natural Conversation Flow System for Devil AI
 *
 * Handles multi-turn conversations and context switching
 */

export interface ConversationState {
	currentTopic: string
	topicHistory: string[]
	pendingActions: PendingAction[]
	clarificationNeeded: boolean
	lastQuestion?: string
	responseContext?: string
}

export interface PendingAction {
	id: string
	action: string
	parameters: Record<string, any>
	status: "pending" | "in_progress" | "completed" | "failed"
	createdAt: Date
}

export interface ConversationTurn {
	user: string
	assistant: string
	timestamp: Date
	topic: string
	intent: string
}

export interface Intent {
	name: string
	confidence: number
	entities: Record<string, any>
}

export class ConversationFlow {
	private state: ConversationState
	private history: ConversationTurn[] = []
	private intents: Map<string, (input: string) => Intent> = new Map()

	constructor() {
		this.state = {
			currentTopic: "general",
			topicHistory: [],
			pendingActions: [],
			clarificationNeeded: false,
		}

		this.initializeIntents()
	}

	/**
	 * Initialize intent detectors
	 */
	private initializeIntents(): void {
		// Greeting intent
		this.intents.set("greeting", (input: string) => {
			const lowerInput = input.toLowerCase()
			const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
			const match = greetings.some((g) => lowerInput.includes(g))
			return {
				name: "greeting",
				confidence: match ? 0.9 : 0.1,
				entities: {},
			}
		})

		// File operation intent
		this.intents.set("file_operation", (input: string) => {
			const lowerInput = input.toLowerCase()
			const fileKeywords = ["file", "folder", "organize", "backup", "search", "find"]
			const match = fileKeywords.some((k) => lowerInput.includes(k))
			return {
				name: "file_operation",
				confidence: match ? 0.8 : 0.2,
				entities: this.extractFileEntities(input),
			}
		})

		// Web search intent
		this.intents.set("web_search", (input: string) => {
			const lowerInput = input.toLowerCase()
			const searchKeywords = ["search", "google", "look up", "find online", "browse"]
			const match = searchKeywords.some((k) => lowerInput.includes(k))
			return {
				name: "web_search",
				confidence: match ? 0.85 : 0.15,
				entities: this.extractSearchEntities(input),
			}
		})

		// System command intent
		this.intents.set("system_command", (input: string) => {
			const lowerInput = input.toLowerCase()
			const systemKeywords = ["system", "cpu", "memory", "process", "status", "health"]
			const match = systemKeywords.some((k) => lowerInput.includes(k))
			return {
				name: "system_command",
				confidence: match ? 0.8 : 0.2,
				entities: {},
			}
		})

		// Schedule intent
		this.intents.set("schedule", (input: string) => {
			const lowerInput = input.toLowerCase()
			const scheduleKeywords = ["schedule", "calendar", "meeting", "reminder", "alarm", "event"]
			const match = scheduleKeywords.some((k) => lowerInput.includes(k))
			return {
				name: "schedule",
				confidence: match ? 0.85 : 0.15,
				entities: this.extractScheduleEntities(input),
			}
		})

		// Smart home intent
		this.intents.set("smart_home", (input: string) => {
			const lowerInput = input.toLowerCase()
			const homeKeywords = ["light", "temperature", "thermostat", "music", "speaker", "device"]
			const match = homeKeywords.some((k) => lowerInput.includes(k))
			return {
				name: "smart_home",
				confidence: match ? 0.8 : 0.2,
				entities: this.extractHomeEntities(input),
			}
		})
	}

	/**
	 * Extract file entities
	 */
	private extractFileEntities(input: string): Record<string, any> {
		const entities: Record<string, any> = {}

		// Extract file type
		if (input.includes("pdf")) entities.fileType = "pdf"
		if (input.includes("image") || input.includes("photo")) entities.fileType = "image"
		if (input.includes("video")) entities.fileType = "video"
		if (input.includes("document") || input.includes("doc")) entities.fileType = "document"

		// Extract action
		if (input.includes("organize")) entities.action = "organize"
		if (input.includes("backup")) entities.action = "backup"
		if (input.includes("search") || input.includes("find")) entities.action = "search"
		if (input.includes("delete")) entities.action = "delete"

		// Extract location
		if (input.includes("downloads")) entities.location = "downloads"
		if (input.includes("documents")) entities.location = "documents"
		if (input.includes("desktop")) entities.location = "desktop"

		return entities
	}

	/**
	 * Extract search entities
	 */
	private extractSearchEntities(input: string): Record<string, any> {
		const entities: Record<string, any> = {}

		// Extract search query (everything after search keywords)
		const searchPatterns = ["search for", "google", "look up", "find online", "browse"]
		for (const pattern of searchPatterns) {
			if (input.toLowerCase().includes(pattern)) {
				const index = input.toLowerCase().indexOf(pattern)
				entities.query = input.substring(index + pattern.length).trim()
				break
			}
		}

		// Extract platform
		if (input.includes("youtube")) entities.platform = "youtube"
		if (input.includes("google")) entities.platform = "google"
		if (input.includes("github")) entities.platform = "github"

		return entities
	}

	/**
	 * Extract schedule entities
	 */
	private extractScheduleEntities(input: string): Record<string, any> {
		const entities: Record<string, any> = {}

		// Extract time
		const timeMatch = input.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/)
		if (timeMatch) entities.time = timeMatch[1]

		// Extract date
		const datePatterns = [
			"today",
			"tomorrow",
			"next week",
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
		]
		for (const pattern of datePatterns) {
			if (input.toLowerCase().includes(pattern)) {
				entities.date = pattern
				break
			}
		}

		// Extract event type
		if (input.includes("meeting")) entities.eventType = "meeting"
		if (input.includes("reminder")) entities.eventType = "reminder"
		if (input.includes("alarm")) entities.eventType = "alarm"

		return entities
	}

	/**
	 * Extract smart home entities
	 */
	private extractHomeEntities(input: string): Record<string, any> {
		const entities: Record<string, any> = {}

		// Extract device type
		if (input.includes("light") || input.includes("lamp")) entities.deviceType = "light"
		if (input.includes("temperature") || input.includes("thermostat"))
			entities.deviceType = "thermostat"
		if (input.includes("music") || input.includes("speaker")) entities.deviceType = "speaker"

		// Extract action
		if (input.includes("turn on") || input.includes("on")) entities.action = "on"
		if (input.includes("turn off") || input.includes("off")) entities.action = "off"
		if (input.includes("dim")) entities.action = "dim"
		if (input.includes("brighten")) entities.action = "brighten"
		if (input.includes("set")) entities.action = "set"

		// Extract value
		const valueMatch = input.match(/(\d+)/)
		if (valueMatch) entities.value = parseInt(valueMatch[1], 10)

		return entities
	}

	/**
	 * Process user input
	 */
	processInput(input: string): { response: string; intent: Intent; needsClarification: boolean } {
		// Detect intent
		const intent = this.detectIntent(input)

		// Check if clarification is needed
		const needsClarification = this.checkClarificationNeeded(input, intent)

		// Generate response
		let response: string

		if (needsClarification) {
			response = this.generateClarificationQuestion(intent)
		} else {
			response = this.generateResponse(input, intent)
		}

		// Update state
		this.updateState(input, intent, response)

		// Add to history
		this.history.push({
			user: input,
			assistant: response,
			timestamp: new Date(),
			topic: this.state.currentTopic,
			intent: intent.name,
		})

		return { response, intent, needsClarification }
	}

	/**
	 * Detect intent from input
	 */
	private detectIntent(input: string): Intent {
		let bestIntent: Intent = { name: "unknown", confidence: 0, entities: {} }

		for (const [_name, detector] of this.intents.entries()) {
			const intent = detector(input)
			if (intent.confidence > bestIntent.confidence) {
				bestIntent = intent
			}
		}

		return bestIntent
	}

	/**
	 * Check if clarification is needed
	 */
	private checkClarificationNeeded(_input: string, intent: Intent): boolean {
		// Check if we have enough information
		if (intent.name === "file_operation" && !intent.entities.action) {
			return true
		}

		if (intent.name === "web_search" && !intent.entities.query) {
			return true
		}

		if (intent.name === "schedule" && !intent.entities.eventType) {
			return true
		}

		if (intent.name === "smart_home" && !intent.entities.deviceType) {
			return true
		}

		return false
	}

	/**
	 * Generate clarification question
	 */
	private generateClarificationQuestion(intent: Intent): string {
		switch (intent.name) {
			case "file_operation":
				return "What would you like me to do with files? I can organize, backup, search, or delete them."
			case "web_search":
				return "What would you like me to search for?"
			case "schedule":
				return "What type of event would you like to schedule? Meeting, reminder, or alarm?"
			case "smart_home":
				return "Which device would you like to control? Lights, thermostat, or speaker?"
			default:
				return "Could you please provide more details about what you'd like me to do?"
		}
	}

	/**
	 * Generate response
	 */
	private generateResponse(input: string, intent: Intent): string {
		switch (intent.name) {
			case "greeting":
				return this.generateGreetingResponse()
			case "file_operation":
				return this.generateFileResponse(intent.entities)
			case "web_search":
				return this.generateSearchResponse(intent.entities)
			case "system_command":
				return this.generateSystemResponse()
			case "schedule":
				return this.generateScheduleResponse(intent.entities)
			case "smart_home":
				return this.generateHomeResponse(intent.entities)
			default:
				return this.generateDefaultResponse(input)
		}
	}

	/**
	 * Generate greeting response
	 */
	private generateGreetingResponse(): string {
		const greetings = [
			"Hello! How can I help you today?",
			"Hi there! What can I do for you?",
			"Hey! Ready to assist with whatever you need.",
			"Hello! Devil AI at your service.",
		]
		return greetings[Math.floor(Math.random() * greetings.length)]
	}

	/**
	 * Generate file response
	 */
	private generateFileResponse(entities: Record<string, any>): string {
		const action = entities.action || "organize"
		const location = entities.location || "downloads"

		return `I'll ${action} your ${location} folder. Let me do that for you now.`
	}

	/**
	 * Generate search response
	 */
	private generateSearchResponse(entities: Record<string, any>): string {
		const query = entities.query || "your search"
		const platform = entities.platform || "Google"

		return `I'll search ${platform} for "${query}". Let me find that for you.`
	}

	/**
	 * Generate system response
	 */
	private generateSystemResponse(): string {
		return "Checking system status for you. One moment..."
	}

	/**
	 * Generate schedule response
	 */
	private generateScheduleResponse(entities: Record<string, any>): string {
		const eventType = entities.eventType || "event"
		const time = entities.time || "the specified time"

		return `I'll set up a ${eventType} for ${time}. Let me create that for you.`
	}

	/**
	 * Generate home response
	 */
	private generateHomeResponse(entities: Record<string, any>): string {
		const deviceType = entities.deviceType || "device"
		const action = entities.action || "adjust"

		return `I'll ${action} the ${deviceType} for you. One moment...`
	}

	/**
	 * Generate default response
	 */
	private generateDefaultResponse(input: string): string {
		return `I understand you want to: "${input}". Let me help you with that.`
	}

	/**
	 * Update state
	 */
	private updateState(_input: string, intent: Intent, _response: string): void {
		// Update topic
		if (intent.name !== "unknown") {
			if (this.state.currentTopic !== intent.name) {
				this.state.topicHistory.push(this.state.currentTopic)
				this.state.currentTopic = intent.name
			}
		}

		// Update clarification state
		this.state.clarificationNeeded = false
		this.state.lastQuestion = undefined
	}

	/**
	 * Get conversation history
	 */
	getHistory(limit: number = 10): ConversationTurn[] {
		return this.history.slice(-limit)
	}

	/**
	 * Get current state
	 */
	getState(): ConversationState {
		return { ...this.state }
	}

	/**
	 * Clear history
	 */
	clearHistory(): void {
		this.history = []
		this.state = {
			currentTopic: "general",
			topicHistory: [],
			pendingActions: [],
			clarificationNeeded: false,
		}
	}

	/**
	 * Add pending action
	 */
	addPendingAction(action: string, parameters: Record<string, any>): string {
		const id = `action_${Date.now()}`
		this.state.pendingActions.push({
			id,
			action,
			parameters,
			status: "pending",
			createdAt: new Date(),
		})
		return id
	}

	/**
	 * Complete pending action
	 */
	completePendingAction(actionId: string, success: boolean): void {
		const action = this.state.pendingActions.find((a) => a.id === actionId)
		if (action) {
			action.status = success ? "completed" : "failed"
		}
	}

	/**
	 * Get pending actions
	 */
	getPendingActions(): PendingAction[] {
		return this.state.pendingActions.filter((a) => a.status === "pending")
	}
}

export default ConversationFlow
