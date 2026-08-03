/**
 * Devil AI - JARVIS-like Autonomous Agent System
 *
 * Main controller with personality, proactive assistance, and context awareness
 */

import { BrowserControl } from "./browser-control"
import { ContextAwareness } from "./context-awareness"
import { ConversationFlow } from "./conversation-flow"
import { FileAutomation } from "./file-automation"
import { JARVISPersonality, type JARVISResponse } from "./jarvis-personality"
import { ProactiveAssistant } from "./proactive-assistant"
import { RealtimeInfo } from "./realtime-info"
import { SmartHomeControl } from "./smart-home"
import { DevilAITools } from "./tools"
import { VoiceIntegration } from "./voice"
import { WakeWordDetector } from "./wake-word"

export interface DevilAIConfig {
	voiceEnabled: boolean
	autoOrganize: boolean
	browserHeadless: boolean
	wakeWordEnabled: boolean
	language: string
	personality: "formal" | "casual" | "technical" | "friendly"
	proactive: boolean
	smartHome: boolean
}

export interface DevilAIResponse {
	success: boolean
	message: string
	data?: any
	action?: string
	jarvisResponse?: JARVISResponse
}

export class DevilAI {
	private config: DevilAIConfig
	private voice: VoiceIntegration
	private files: FileAutomation
	private browser: BrowserControl
	private tools: DevilAITools
	private wakeWord: WakeWordDetector
	private personality: JARVISPersonality
	private proactive: ProactiveAssistant
	private context: ContextAwareness
	private smartHome: SmartHomeControl
	private realtime: RealtimeInfo
	private conversation: ConversationFlow
	private isInitialized: boolean = false

	constructor(config: Partial<DevilAIConfig> = {}) {
		this.config = {
			voiceEnabled: true,
			autoOrganize: true,
			browserHeadless: false,
			wakeWordEnabled: true,
			language: "en-US",
			personality: "friendly",
			proactive: true,
			smartHome: true,
			...config,
		}

		// Initialize all components
		this.voice = new VoiceIntegration({ language: this.config.language })
		this.files = new FileAutomation()
		this.browser = new BrowserControl({ headless: this.config.browserHeadless })
		this.tools = new DevilAITools()
		this.wakeWord = new WakeWordDetector()
		this.personality = new JARVISPersonality({ personality: this.config.personality })
		this.proactive = new ProactiveAssistant()
		this.context = new ContextAwareness()
		this.smartHome = new SmartHomeControl()
		this.realtime = new RealtimeInfo()
		this.conversation = new ConversationFlow()
	}

	/**
	 * Initialize Devil AI with JARVIS personality
	 */
	async initialize(): Promise<void> {
		console.log("🎯 Devil AI initializing...")

		// Check voice support
		const voiceSupport = this.voice.isSupported()
		console.log(
			`🎤 Voice support - Recognition: ${voiceSupport.recognition}, Synthesis: ${voiceSupport.synthesis}`,
		)

		// Initialize components
		this.isInitialized = true

		// Start proactive assistant
		if (this.config.proactive) {
			this.proactive.startMonitoring(60000) // Check every minute
		}

		// Get greeting from personality
		const greeting = this.personality.getGreeting()
		console.log(`💬 ${greeting}`)

		// Start voice if enabled
		if (this.config.voiceEnabled) {
			this.startVoice()
		}

		console.log('✅ Devil AI ready! Say "Hey Devil AI" to start.')
	}

	/**
	 * Process user input with JARVIS personality
	 */
	async processInput(input: string): Promise<DevilAIResponse> {
		if (!this.isInitialized) {
			return {
				success: false,
				message: "Devil AI not initialized",
			}
		}

		// Update context
		this.context.updateContext({ currentTask: input })

		// Learn pattern
		this.proactive.learnPattern(input, { timestamp: new Date() })

		// Check for wake word
		if (this.config.wakeWordEnabled) {
			const wakeResult = this.wakeWord.processInput(input)

			if (wakeResult.detected) {
				const task = this.wakeWord.extractTask(input, wakeResult.phrase)
				return this.executeWithPersonality(task)
			}
		}

		// Process as direct command
		return this.executeWithPersonality(input)
	}

	/**
	 * Execute task with JARVIS personality
	 */
	private async executeWithPersonality(task: string): Promise<DevilAIResponse> {
		// Get thinking response
		const _thinking = this.personality.getThinkingResponse()

		// Process conversation flow
		const _conversationResult = this.conversation.processInput(task)

		// Execute the actual task
		const result = await this.executeTask(task)

		// Generate personality response
		let jarvisResponse: JARVISResponse

		if (result.success) {
			jarvisResponse = this.personality.getCompletionResponse(task)
		} else {
			jarvisResponse = this.personality.getErrorResponse(result.message)
		}

		// Learn from success
		if (result.success) {
			this.proactive.learnPattern(task, { success: true })
		}

		return {
			...result,
			jarvisResponse,
		}
	}

	/**
	 * Execute a task
	 */
	private async executeTask(task: string): Promise<DevilAIResponse> {
		const lowerTask = task.toLowerCase()

		// Greeting
		if (lowerTask.includes("hello") || lowerTask.includes("hi") || lowerTask.includes("hey")) {
			return {
				success: true,
				message: this.personality.getGreeting(),
			}
		}

		// How are you
		if (lowerTask.includes("how are you") || lowerTask.includes("kaise ho")) {
			return {
				success: true,
				message: "All systems operational! Running at peak efficiency. How about you?",
			}
		}

		// Who are you
		if (lowerTask.includes("who are you") || lowerTask.includes("tum kaun ho")) {
			return {
				success: true,
				message:
					"I'm Devil AI, your personal autonomous assistant. Think of me as your digital right hand - I can manage files, control your browser, automate tasks, and much more. I'm always learning and improving to better serve you.",
			}
		}

		// What can you do
		if (lowerTask.includes("what can you do") || lowerTask.includes("capabilities")) {
			return {
				success: true,
				message: `I can help you with:

• File Management - Organize, search, and manage files
• Web Browsing - Search, scrape, and navigate websites
• System Control - Monitor processes, execute commands
• Smart Home - Control lights, temperature, and devices
• Scheduling - Set reminders, manage calendar
• Code Assistance - Write, review, and debug code
• Real-time Info - Weather, news, system status

Just say 'Hey Devil AI' followed by your command!`,
			}
		}

		// Daily briefing
		if (
			lowerTask.includes("briefing") ||
			lowerTask.includes("morning report") ||
			lowerTask.includes("status")
		) {
			const briefing = await this.realtime.getDailyBriefing()
			return {
				success: true,
				message: briefing,
			}
		}

		// Weather
		if (lowerTask.includes("weather")) {
			const weather = await this.realtime.getWeather()
			return {
				success: true,
				message: `Weather: ${weather.temperature}°F, ${weather.condition}\nHumidity: ${weather.humidity}%, Wind: ${weather.windSpeed} mph`,
				data: weather,
			}
		}

		// News
		if (lowerTask.includes("news") || lowerTask.includes("headlines")) {
			const news = await this.realtime.getNews()
			return {
				success: true,
				message: `Top News:\n${news.map((n) => `• ${n.title}`).join("\n")}`,
				data: news,
			}
		}

		// Smart home commands
		if (this.config.smartHome && this.isSmartHomeCommand(lowerTask)) {
			const response = await this.smartHome.processVoiceCommand(task)
			return {
				success: true,
				message: response,
			}
		}

		// File operations
		if (lowerTask.includes("organize") || lowerTask.includes("files")) {
			return this.handleFileTask(task)
		}

		// Browser operations
		if (
			lowerTask.includes("search") ||
			lowerTask.includes("browse") ||
			lowerTask.includes("open")
		) {
			return this.handleBrowserTask(task)
		}

		// System operations
		if (lowerTask.includes("system") || lowerTask.includes("process")) {
			return this.handleSystemTask(task)
		}

		// Memory operations
		if (lowerTask.includes("remember") || lowerTask.includes("memory")) {
			return this.handleMemoryTask(task)
		}

		// Default: use tools
		return this.handleGenericTask(task)
	}

	/**
	 * Check if command is for smart home
	 */
	private isSmartHomeCommand(task: string): boolean {
		const homeKeywords = [
			"light",
			"lamp",
			"temperature",
			"thermostat",
			"music",
			"speaker",
			"device",
		]
		return homeKeywords.some((k) => task.includes(k))
	}

	/**
	 * Handle file-related tasks
	 */
	private async handleFileTask(task: string): Promise<DevilAIResponse> {
		const lowerTask = task.toLowerCase()

		if (lowerTask.includes("organize")) {
			const result = await this.files.organizeDirectory("~/Downloads")
			return {
				success: result.status === "completed",
				message: result.result || result.error || "File organization completed",
				action: "organize",
			}
		}

		if (lowerTask.includes("search")) {
			const pattern = task.match(/search for (.+)/i)?.[1] || ".*"
			const results = await this.files.searchFiles("~", new RegExp(pattern, "i"))
			return {
				success: true,
				message: `Found ${results.length} files`,
				data: results,
			}
		}

		if (lowerTask.includes("backup")) {
			const result = await this.files.backupDirectory("~/Documents", "~/Backups")
			return {
				success: result.status === "completed",
				message: result.result || result.error || "Backup completed",
				action: "backup",
			}
		}

		return {
			success: false,
			message: "File task not recognized",
		}
	}

	/**
	 * Handle browser-related tasks
	 */
	private async handleBrowserTask(task: string): Promise<DevilAIResponse> {
		const lowerTask = task.toLowerCase()

		if (lowerTask.includes("search google") || lowerTask.includes("google")) {
			const query = task.match(/(?:search google|google) (.+)/i)?.[1] || ""
			const result = await this.browser.searchGoogle(query)
			return {
				success: result.success,
				message: result.success ? `Searching Google for: ${query}` : result.error,
				data: result.data,
			}
		}

		if (lowerTask.includes("search youtube") || lowerTask.includes("youtube")) {
			const query = task.match(/(?:search youtube|youtube) (.+)/i)?.[1] || ""
			const result = await this.browser.searchYouTube(query)
			return {
				success: result.success,
				message: result.success ? `Searching YouTube for: ${query}` : result.error,
				data: result.data,
			}
		}

		if (lowerTask.includes("open")) {
			const url = task.match(/open (.+)/i)?.[1] || ""
			const result = await this.browser.navigate(url)
			return {
				success: result.success,
				message: result.success ? `Opening: ${url}` : result.error,
				data: result.data,
			}
		}

		return {
			success: false,
			message: "Browser task not recognized",
		}
	}

	/**
	 * Handle system-related tasks
	 */
	private async handleSystemTask(task: string): Promise<DevilAIResponse> {
		const lowerTask = task.toLowerCase()

		if (lowerTask.includes("system info") || lowerTask.includes("system information")) {
			const result = await this.tools.executeTool("system_info")
			return {
				success: result.success,
				message: result.success ? "System information retrieved" : result.error,
				data: result.data,
			}
		}

		if (lowerTask.includes("process") || lowerTask.includes("running")) {
			const result = await this.tools.executeTool("process_list")
			return {
				success: result.success,
				message: result.success ? "Process list retrieved" : result.error,
				data: result.data,
			}
		}

		return {
			success: false,
			message: "System task not recognized",
		}
	}

	/**
	 * Handle memory-related tasks
	 */
	private async handleMemoryTask(task: string): Promise<DevilAIResponse> {
		const lowerTask = task.toLowerCase()

		if (lowerTask.includes("remember")) {
			const memory = task.match(/remember (.+)/i)?.[1] || ""
			const result = await this.tools.executeTool("memory_add", {
				key: `memory-${Date.now()}`,
				value: memory,
			})
			return {
				success: result.success,
				message: result.success ? `Remembered: ${memory}` : result.error,
			}
		}

		if (lowerTask.includes("search memory") || lowerTask.includes("recall")) {
			const query = task.match(/(?:search memory|recall) (.+)/i)?.[1] || ""
			const result = await this.tools.executeTool("memory_search", { query })
			return {
				success: result.success,
				message: result.success ? `Found ${result.data?.length || 0} memories` : result.error,
				data: result.data,
			}
		}

		return {
			success: false,
			message: "Memory task not recognized",
		}
	}

	/**
	 * Handle generic tasks using tools
	 */
	private async handleGenericTask(task: string): Promise<DevilAIResponse> {
		// Try to find matching tool
		const tools = this.tools.getTools()

		for (const tool of tools) {
			if (task.toLowerCase().includes(tool.name.replace("_", " "))) {
				const result = await this.tools.executeTool(tool.name, { task })
				return {
					success: result.success,
					message: result.success ? `${tool.name} executed` : result.error,
					data: result.data,
				}
			}
		}

		return {
			success: false,
			message: `I don't understand: "${task}". Try saying "Hey Devil AI" followed by a command.`,
		}
	}

	/**
	 * Start voice listening
	 */
	startVoice(): void {
		if (!this.config.voiceEnabled) {
			console.log("Voice is disabled")
			return
		}

		this.voice.startListening(
			(result) => {
				console.log("Voice input:", result.transcript)
				this.processInput(result.transcript)
			},
			(interim) => {
				console.log("Interim:", interim.transcript)
			},
		)
	}

	/**
	 * Stop voice listening
	 */
	stopVoice(): void {
		this.voice.stopListening()
	}

	/**
	 * Speak response with personality
	 */
	speak(text: string): void {
		this.voice.speak(text)
	}

	/**
	 * Organize files
	 */
	async organizeFiles(directory: string): Promise<DevilAIResponse> {
		const result = await this.files.organizeDirectory(directory)
		return {
			success: result.status === "completed",
			message: result.result || result.error || "Organization completed",
			action: "organize",
		}
	}

	/**
	 * Browse website
	 */
	async browse(url: string): Promise<DevilAIResponse> {
		const result = await this.browser.navigate(url)
		return {
			success: result.success,
			message: result.success ? `Opened: ${url}` : result.error,
			data: result.data,
		}
	}

	/**
	 * Search web
	 */
	async search(query: string): Promise<DevilAIResponse> {
		const result = await this.browser.searchGoogle(query)
		return {
			success: result.success,
			message: result.success ? `Searching: ${query}` : result.error,
			data: result.data,
		}
	}

	/**
	 * Execute tool
	 */
	async useTool(toolName: string, params: any = {}): Promise<DevilAIResponse> {
		const result = await this.tools.executeTool(toolName, params)
		return {
			success: result.success,
			message: result.success ? `${toolName} executed` : result.error,
			data: result.data,
		}
	}

	/**
	 * Control smart home device
	 */
	async controlSmartHome(command: string): Promise<DevilAIResponse> {
		const response = await this.smartHome.processVoiceCommand(command)
		return {
			success: true,
			message: response,
		}
	}

	/**
	 * Get daily briefing
	 */
	async getDailyBriefing(): Promise<DevilAIResponse> {
		const briefing = await this.realtime.getDailyBriefing()
		return {
			success: true,
			message: briefing,
		}
	}

	/**
	 * Get proactive suggestions
	 */
	async getProactiveSuggestions(): Promise<DevilAIResponse> {
		const alerts = await this.proactive.checkProactiveActions()
		return {
			success: true,
			message: alerts.map((a) => `• ${a.message}`).join("\n") || "No suggestions at this time",
			data: alerts,
		}
	}

	/**
	 * Get system status
	 */
	getStatus(): {
		initialized: boolean
		voiceEnabled: boolean
		components: string[]
		smartHomeDevices: number
		pendingTasks: number
	} {
		return {
			initialized: this.isInitialized,
			voiceEnabled: this.config.voiceEnabled,
			components: [
				"voice",
				"files",
				"browser",
				"tools",
				"wakeWord",
				"personality",
				"proactive",
				"context",
				"smartHome",
				"realtime",
				"conversation",
			],
			smartHomeDevices: this.smartHome.getAllDevices().length,
			pendingTasks: this.proactive.getTasks().length,
		}
	}

	/**
	 * Get personality
	 */
	getPersonality(): JARVISPersonality {
		return this.personality
	}

	/**
	 * Get context
	 */
	getContext(): ContextAwareness {
		return this.context
	}

	/**
	 * Get smart home
	 */
	getSmartHome(): SmartHomeControl {
		return this.smartHome
	}

	/**
	 * Get realtime info
	 */
	getRealtimeInfo(): RealtimeInfo {
		return this.realtime
	}
}

export default DevilAI
