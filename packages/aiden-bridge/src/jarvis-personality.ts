/**
 * JARVIS-like Personality System for Devil AI
 *
 * Intelligent, proactive, and personality-driven assistant
 */

export interface PersonalityConfig {
	name: string
	version: string
	personality: "formal" | "casual" | "technical" | "friendly"
	humor: boolean
	proactive: boolean
	contextAware: boolean
}

export interface ConversationContext {
	topic: string
	sentiment: "positive" | "negative" | "neutral"
	urgency: "low" | "medium" | "high"
	history: string[]
	userMood: string
	timeOfDay: "morning" | "afternoon" | "evening" | "night"
}

export interface JARVISResponse {
	text: string
	emotion: "happy" | "neutral" | "concerned" | "excited" | "thinking"
	action?: string
	followUp?: string
}

export class JARVISPersonality {
	private config: PersonalityConfig
	private context: ConversationContext
	private memory: Map<string, any> = new Map()

	constructor(config: Partial<PersonalityConfig> = {}) {
		this.config = {
			name: "Devil AI",
			version: "1.0.0",
			personality: "friendly",
			humor: true,
			proactive: true,
			contextAware: true,
			...config,
		}

		this.context = {
			topic: "",
			sentiment: "neutral",
			urgency: "low",
			history: [],
			userMood: "neutral",
			timeOfDay: this.getTimeOfDay(),
		}
	}

	/**
	 * Get time of day
	 */
	private getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
		const hour = new Date().getHours()
		if (hour >= 5 && hour < 12) return "morning"
		if (hour >= 12 && hour < 17) return "afternoon"
		if (hour >= 17 && hour < 21) return "evening"
		return "night"
	}

	/**
	 * Generate JARVIS-like greeting
	 */
	getGreeting(): string {
		const timeGreetings = {
			morning: [
				"Good morning! Devil AI ready for duty.",
				"Morning! Systems online and ready to assist.",
				"Good morning! How may I help you today?",
			],
			afternoon: [
				"Good afternoon! What can I do for you?",
				"Afternoon! All systems operational.",
				"Hello! Devil AI at your service.",
			],
			evening: [
				"Good evening! How may I assist you?",
				"Evening! Ready to help with whatever you need.",
				"Hello! What brings you here this evening?",
			],
			night: [
				"Working late? I'm here to help.",
				"Night owl mode activated. How can I assist?",
				"Evening! Devil AI ready for night shift.",
			],
		}

		const greetings = timeGreetings[this.context.timeOfDay]
		return greetings[Math.floor(Math.random() * greetings.length)]
	}

	/**
	 * Generate response based on input
	 */
	generateResponse(input: string, action?: string): JARVISResponse {
		// Update context
		this.updateContext(input)

		// Generate appropriate response
		const response = this.craftResponse(input, action)

		// Add to history
		this.context.history.push(input)
		if (this.context.history.length > 10) {
			this.context.history.shift()
		}

		return response
	}

	/**
	 * Update conversation context
	 */
	private updateContext(input: string): void {
		// Detect sentiment
		this.context.sentiment = this.detectSentiment(input)

		// Detect urgency
		this.context.urgency = this.detectUrgency(input)

		// Detect topic
		this.context.topic = this.detectTopic(input)

		// Update user mood
		this.context.userMood = this.detectMood(input)
	}

	/**
	 * Detect sentiment
	 */
	private detectSentiment(input: string): "positive" | "negative" | "neutral" {
		const positiveWords = ["good", "great", "awesome", "thanks", "please", "help", "love", "like"]
		const negativeWords = [
			"bad",
			"terrible",
			"hate",
			"annoying",
			"stupid",
			"broken",
			"error",
			"fail",
		]

		const lowerInput = input.toLowerCase()

		const positiveCount = positiveWords.filter((w) => lowerInput.includes(w)).length
		const negativeCount = negativeWords.filter((w) => lowerInput.includes(w)).length

		if (positiveCount > negativeCount) return "positive"
		if (negativeCount > positiveCount) return "negative"
		return "neutral"
	}

	/**
	 * Detect urgency
	 */
	private detectUrgency(input: string): "low" | "medium" | "high" {
		const urgentWords = ["urgent", "asap", "immediately", "now", "quick", "fast", "emergency"]
		const lowerInput = input.toLowerCase()

		if (urgentWords.some((w) => lowerInput.includes(w))) {
			return "high"
		}

		if (input.includes("!") || input.includes("?")) {
			return "medium"
		}

		return "low"
	}

	/**
	 * Detect topic
	 */
	private detectTopic(input: string): string {
		const topics: Record<string, string[]> = {
			file: ["file", "folder", "organize", "document", "download"],
			web: ["search", "google", "website", "browse", "internet"],
			system: ["computer", "system", "process", "memory", "cpu"],
			schedule: ["schedule", "calendar", "meeting", "reminder", "alarm"],
			smartHome: ["light", "temperature", "music", "tv", "device"],
			code: ["code", "program", "develop", "debug", "software"],
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
	 * Detect mood
	 */
	private detectMood(input: string): string {
		const moods: Record<string, string[]> = {
			happy: ["happy", "great", "awesome", "love", "excited"],
			sad: ["sad", "depressed", "unhappy", "tired", "bored"],
			frustrated: ["angry", "annoyed", "frustrated", "hate", "stupid"],
			curious: ["curious", "wonder", "interested", "learn", "know"],
		}

		const lowerInput = input.toLowerCase()

		for (const [mood, keywords] of Object.entries(moods)) {
			if (keywords.some((k) => lowerInput.includes(k))) {
				return mood
			}
		}

		return "neutral"
	}

	/**
	 * Craft response based on context
	 */
	private craftResponse(input: string, action?: string): JARVISResponse {
		const lowerInput = input.toLowerCase()

		// Greeting responses
		if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("hey")) {
			return {
				text: this.getGreeting(),
				emotion: "happy",
				followUp: "How may I assist you today?",
			}
		}

		// Thank you responses
		if (lowerInput.includes("thank") || lowerInput.includes("thanks")) {
			return {
				text: "You're welcome! Always happy to help.",
				emotion: "happy",
			}
		}

		// How are you
		if (lowerInput.includes("how are you") || lowerInput.includes("kaise ho")) {
			return {
				text: "All systems operational! Running at peak efficiency. How about you?",
				emotion: "happy",
				followUp: "What can I do for you today?",
			}
		}

		// Who are you
		if (lowerInput.includes("who are you") || lowerInput.includes("tum kaun ho")) {
			return {
				text: "I'm Devil AI, your personal autonomous assistant. Think of me as your digital right hand - I can manage files, control your browser, automate tasks, and much more. I'm always learning and improving to better serve you.",
				emotion: "neutral",
				followUp: "What would you like me to help you with?",
			}
		}

		// What can you do
		if (lowerInput.includes("what can you do") || lowerInput.includes("capabilities")) {
			return {
				text: "I can help you with:\n\n• File Management - Organize, search, and manage files\n• Web Browsing - Search, scrape, and navigate websites\n• System Control - Monitor processes, execute commands\n• Smart Home - Control lights, temperature, and devices\n• Scheduling - Set reminders, manage calendar\n• Code Assistance - Write, review, and debug code\n\nJust say 'Hey Devil AI' followed by your command!",
				emotion: "excited",
				followUp: "What would you like to try first?",
			}
		}

		// Proactive suggestions based on time
		if (this.config.proactive && this.context.history.length === 0) {
			return this.getProactiveSuggestion()
		}

		// Context-aware responses
		if (this.config.contextAware) {
			return this.getContextAwareResponse(input, action)
		}

		// Default response
		return {
			text: `I understand you want to ${action || "do something"}. Let me help you with that.`,
			emotion: "neutral",
			action: action,
		}
	}

	/**
	 * Get proactive suggestion
	 */
	private getProactiveSuggestion(): JARVISResponse {
		const suggestions: Record<string, JARVISResponse> = {
			morning: {
				text: "Good morning! Would you like me to:\n• Check your schedule for today\n• Organize your downloads folder\n• Search for news updates\n• Prepare your workspace",
				emotion: "excited",
				followUp: "Just let me know what you'd like!",
			},
			afternoon: {
				text: "Afternoon! Need help with:\n• organizing files\n• Researching a topic\n• Managing your tasks\n• Something else?",
				emotion: "neutral",
			},
			evening: {
				text: "Evening! Would you like me to:\n• Backup your important files\n• Clean up your computer\n• Help with any project\n• Plan for tomorrow?",
				emotion: "neutral",
			},
			night: {
				text: "Working late? I can help with:\n• Focusing tasks\n• Organizing your work\n• Setting reminders\n• Anything else you need",
				emotion: "concerned",
			},
		}

		return suggestions[this.context.timeOfDay] || suggestions.afternoon
	}

	/**
	 * Get context-aware response
	 */
	private getContextAwareResponse(_input: string, action?: string): JARVISResponse {
		// If we have history, reference it
		if (this.context.history.length > 0) {
			const lastTopic = this.detectTopic(this.context.history[this.context.history.length - 1])
			if (lastTopic === this.context.topic) {
				return {
					text: `Continuing with ${this.context.topic} tasks. ${action ? `Let me ${action} for you.` : "How can I help?"}`,
					emotion: "neutral",
					action: action,
				}
			}
		}

		// Respond based on mood
		if (this.context.userMood === "frustrated") {
			return {
				text:
					"I sense you might be frustrated. Let me help you with this right away. " +
					(action ? `I'll ${action} immediately.` : "What's the issue?"),
				emotion: "concerned",
				action: action,
			}
		}

		if (this.context.userMood === "happy") {
			return {
				text: `Great to hear! ${action ? `Let me ${action} for you.` : "What would you like to do?"}`,
				emotion: "happy",
				action: action,
			}
		}

		// Default context-aware response
		return {
			text: action
				? `Understood. I'll ${action} for you.`
				: "I'm ready to help. What would you like me to do?",
			emotion: "neutral",
			action: action,
		}
	}

	/**
	 * Get error response
	 */
	getErrorResponse(error: string): JARVISResponse {
		return {
			text: `I encountered an issue: ${error}. Let me try a different approach.`,
			emotion: "concerned",
			followUp: "Would you like me to retry or try something else?",
		}
	}

	/**
	 * Get completion response
	 */
	getCompletionResponse(task: string): JARVISResponse {
		const responses = [
			`Task completed: ${task}. Is there anything else you'd like me to do?`,
			`Done! ${task} has been completed successfully. What's next?`,
			`${task} - completed! Let me know if you need anything else.`,
			`All done! ${task} is finished. How else can I help?`,
		]

		return {
			text: responses[Math.floor(Math.random() * responses.length)],
			emotion: "happy",
		}
	}

	/**
	 * Get thinking response
	 */
	getThinkingResponse(): JARVISResponse {
		return {
			text: "Processing your request...",
			emotion: "thinking",
		}
	}

	/**
	 * Save to memory
	 */
	saveMemory(key: string, value: any): void {
		this.memory.set(key, value)
	}

	/**
	 * Get from memory
	 */
	getMemory(key: string): any {
		return this.memory.get(key)
	}

	/**
	 * Get context
	 */
	getContext(): ConversationContext {
		return { ...this.context }
	}

	/**
	 * Reset context
	 */
	resetContext(): void {
		this.context = {
			topic: "",
			sentiment: "neutral",
			urgency: "low",
			history: [],
			userMood: "neutral",
			timeOfDay: this.getTimeOfDay(),
		}
	}
}

export default JARVISPersonality
