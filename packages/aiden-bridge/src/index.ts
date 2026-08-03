/**
 * Devil AI Agent Bridge - JARVIS-like System
 *
 * This module provides the bridge between Devil AI desktop app
 * and the Devil AI autonomous agent engine.
 *
 * Features JARVIS-like personality, proactive assistance,
 * context awareness, smart home control, and multilingual support.
 */

import { ContextAwareness } from "./context-awareness"
import { ConversationFlow } from "./conversation-flow"
import { JarvisEffects } from "./jarvis-effects"
import { JARVISPersonality } from "./jarvis-personality"
import { MultilingualVoice } from "./multilingual-voice"
import { ProactiveAssistant } from "./proactive-assistant"
import { RealtimeInfo } from "./realtime-info"
import { SmartHomeControl } from "./smart-home"
import { WakeWordDetector } from "./wake-word"

export interface DevilAIConfig {
	serverUrl?: string
	workDir?: string
}

export interface DevilAITask {
	id: string
	prompt: string
	status: "pending" | "running" | "completed" | "failed"
	result?: string
	error?: string
	createdAt: Date
	completedAt?: Date
}

export interface ProviderInfo {
	id: string
	name: string
	configured: boolean
	models: string[]
}

export class DevilAIAgent {
	private tasks: Map<string, DevilAITask> = new Map()
	private serverUrl: string | null = null
	private wakeWordDetector: WakeWordDetector
	private personality: JARVISPersonality
	private proactive: ProactiveAssistant
	private context: ContextAwareness
	private smartHome: SmartHomeControl
	private realtime: RealtimeInfo
	private conversation: ConversationFlow
	private multilingualVoice: MultilingualVoice
	private effects: JarvisEffects

	constructor(config: DevilAIConfig = {}) {
		this.config = {
			workDir: process.cwd(),
			...config,
		}
		this.wakeWordDetector = new WakeWordDetector()
		this.personality = new JARVISPersonality()
		this.proactive = new ProactiveAssistant()
		this.context = new ContextAwareness()
		this.smartHome = new SmartHomeControl()
		this.realtime = new RealtimeInfo()
		this.conversation = new ConversationFlow()
		this.multilingualVoice = new MultilingualVoice()
		this.effects = new JarvisEffects()
	}

	/**
	 * Initialize the Devil AI agent
	 * Connects to existing OpenCode server - no API key needed!
	 */
	async initialize(): Promise<void> {
		console.log("🎯 Devil AI initializing...")
		console.log("Using existing OpenCode server providers")

		// Play boot sequence sound
		await this.effects.playBootSequence()

		// Get server URL from OpenCode manager
		this.serverUrl = await this.detectServerUrl()

		if (this.serverUrl) {
			console.log(`✅ Devil AI connected to server: ${this.serverUrl}`)

			// Check available providers
			const providers = await this.getAvailableProviders()
			console.log(`📋 Available providers: ${providers.map((p) => p.name).join(", ")}`)
		} else {
			console.warn("⚠️ OpenCode server not detected. Devil AI will use fallback mode.")
		}

		// Start proactive assistant
		this.proactive.startMonitoring(60000)

		// Get greeting from personality
		const greeting = this.personality.getGreeting()
		console.log(`💬 ${greeting}`)

		// Speak greeting
		await this.speak(greeting)
	}

	/**
	 * Detect OpenCode server URL
	 */
	private async detectServerUrl(): Promise<string | null> {
		// Try default ports
		const ports = [4101, 4102, 4103]

		for (const port of ports) {
			try {
				const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
					method: "GET",
					signal: AbortSignal.timeout(1000),
				})

				if (response.ok) {
					return `http://127.0.0.1:${port}`
				}
			} catch {
				// Port not available, try next
			}
		}

		return null
	}

	/**
	 * Get available providers from OpenCode server
	 */
	async getAvailableProviders(): Promise<ProviderInfo[]> {
		if (!this.serverUrl) {
			return []
		}

		try {
			const response = await fetch(`${this.serverUrl}/api/providers`)
			if (response.ok) {
				const data = await response.json()
				return data.providers || []
			}
		} catch (error) {
			console.warn("Failed to fetch providers:", error)
		}

		return []
	}

	/**
	 * Execute a task using Devil AI agent
	 * Automatically uses configured providers from OpenCode server
	 */
	async executeTask(prompt: string): Promise<DevilAITask> {
		const taskId = `devil-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

		const task: DevilAITask = {
			id: taskId,
			prompt,
			status: "pending",
			createdAt: new Date(),
		}

		this.tasks.set(taskId, task)

		try {
			task.status = "running"

			// Play thinking sound
			await this.effects.playSound("thinking")

			if (this.serverUrl) {
				// Use OpenCode server's agent endpoint
				const response = await fetch(`${this.serverUrl}/api/agent/execute`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt,
						useExistingProviders: true,
						agentName: "Devil AI",
					}),
				})

				if (response.ok) {
					const result = await response.json()
					task.status = "completed"
					task.result = result.output || "Task completed"

					// Play success sound
					await this.effects.playSound("success")
				} else {
					throw new Error(`Server error: ${response.status}`)
				}
			} else {
				// Fallback: direct execution (simulated)
				console.log(`Devil AI executing task (fallback mode): ${taskId}`)
				await new Promise((resolve) => setTimeout(resolve, 1000))

				task.status = "completed"
				task.result = `Task completed (fallback mode): ${prompt}`

				// Play success sound
				await this.effects.playSound("success")
			}

			task.completedAt = new Date()
		} catch (error) {
			task.status = "failed"
			task.error = error instanceof Error ? error.message : "Unknown error"

			// Play error sound
			await this.effects.playSound("error")
		}

		return task
	}

	/**
	 * Process input with JARVIS personality
	 */
	async processInputWithPersonality(input: string): Promise<string> {
		// Update context
		this.context.updateContext({ currentTask: input })

		// Learn pattern
		this.proactive.learnPattern(input, { timestamp: new Date() })

		// Process conversation
		const _result = this.conversation.processInput(input)

		// Get personality response
		const personalityResponse = this.personality.generateResponse(input)

		// Speak response
		await this.speak(personalityResponse.text)

		return personalityResponse.text
	}

	/**
	 * Get task status
	 */
	getTask(taskId: string): DevilAITask | undefined {
		return this.tasks.get(taskId)
	}

	/**
	 * List all tasks
	 */
	listTasks(): DevilAITask[] {
		return Array.from(this.tasks.values())
	}

	/**
	 * Get available skills from Devil AI
	 */
	async getSkills(): Promise<string[]> {
		return [
			"file-management",
			"browser-automation",
			"code-assistance",
			"web-research",
			"task-scheduling",
			"smart-home-control",
			"personality-system",
			"proactive-assistance",
			"context-awareness",
			"real-time-info",
			"multilingual-support",
			"voice-interaction",
			"animated-ui",
		]
	}

	/**
	 * Get available tools from Devil AI
	 */
	async getTools(): Promise<string[]> {
		return [
			"file_read",
			"file_write",
			"file_patch",
			"file_search",
			"file_organize",
			"shell_exec",
			"web_search",
			"web_scrape",
			"browser_navigate",
			"browser_click",
			"browser_type",
			"memory_add",
			"memory_search",
			"memory_get",
			"system_info",
			"process_list",
			"smart_home_control",
			"weather",
			"news",
			"calendar",
			"translate",
			"voice_control",
		]
	}

	/**
	 * Get Devil AI identity
	 */
	getIdentity(): { name: string; version: string; description: string } {
		return {
			name: "Devil AI",
			version: "3.0.0",
			description:
				"JARVIS-like autonomous AI agent with personality, proactive assistance, smart home control, and multilingual support",
		}
	}

	/**
	 * Start wake word detection
	 */
	startWakeWordDetection(callback: (result: any) => void): void {
		this.wakeWordDetector.startListening(callback)
	}

	/**
	 * Stop wake word detection
	 */
	stopWakeWordDetection(): void {
		this.wakeWordDetector.stopListening()
	}

	/**
	 * Process input for wake words
	 */
	processInput(input: string): { detected: boolean; task: string } {
		const wakeResult = this.wakeWordDetector.processInput(input)

		if (wakeResult.detected) {
			const task = this.wakeWordDetector.extractTask(input, wakeResult.phrase)
			return { detected: true, task }
		}

		return { detected: false, task: "" }
	}

	/**
	 * Add custom wake phrase
	 */
	addWakePhrase(phrase: string): void {
		this.wakeWordDetector.addPhrase(phrase)
	}

	/**
	 * Remove wake phrase
	 */
	removeWakePhrase(phrase: string): void {
		this.wakeWordDetector.removePhrase(phrase)
	}

	/**
	 * Get available wake phrases
	 */
	getWakePhrases(): string[] {
		return this.wakeWordDetector.getPhrases()
	}

	/**
	 * Get personality
	 */
	getPersonality(): JARVISPersonality {
		return this.personality
	}

	/**
	 * Get proactive assistant
	 */
	getProactive(): ProactiveAssistant {
		return this.proactive
	}

	/**
	 * Get context awareness
	 */
	getContext(): ContextAwareness {
		return this.context
	}

	/**
	 * Get smart home control
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

	/**
	 * Get conversation flow
	 */
	getConversation(): ConversationFlow {
		return this.conversation
	}

	/**
	 * Get multilingual voice
	 */
	getMultilingualVoice(): MultilingualVoice {
		return this.multilingualVoice
	}

	/**
	 * Get effects
	 */
	getEffects(): JarvisEffects {
		return this.effects
	}

	/**
	 * Set language
	 */
	setLanguage(lang: "en" | "hi" | "gu"): void {
		this.multilingualVoice.setLanguage(lang)
		console.log(`Language set to: ${lang}`)
	}

	/**
	 * Get greeting in current language
	 */
	getGreeting(): string {
		return this.multilingualVoice.getGreeting()
	}

	/**
	 * Get response in current language
	 */
	getResponse(type: "welcome" | "thinking" | "done" | "error" | "farewell"): string {
		return this.multilingualVoice.getResponse(type)
	}

	/**
	 * Speak text in current language
	 */
	async speak(text: string): Promise<void> {
		try {
			await this.multilingualVoice.speak(text)
		} catch (error) {
			console.warn("Speech synthesis failed:", error)
		}
	}

	/**
	 * Start listening in current language
	 */
	startListening(
		onResult: (transcript: string, isFinal: boolean) => void,
		onError?: (error: string) => void,
	): void {
		this.multilingualVoice.startListening(onResult, onError)
	}

	/**
	 * Stop listening
	 */
	stopListening(): void {
		this.multilingualVoice.stopListening()
	}

	/**
	 * Translate text
	 */
	translate(text: string, from: "en" | "hi" | "gu", to: "en" | "hi" | "gu"): string {
		return this.multilingualVoice.translate(text, from, to)
	}

	/**
	 * Detect language from text
	 */
	detectLanguage(text: string): "en" | "hi" | "gu" {
		return this.multilingualVoice.detectLanguage(text)
	}

	/**
	 * Control smart home device
	 */
	async controlSmartHome(command: string): Promise<string> {
		const response = await this.smartHome.processVoiceCommand(command)

		// Play sound based on command
		if (command.includes("on")) {
			await this.effects.playSound("success")
		} else if (command.includes("off")) {
			await this.effects.playSound("click")
		}

		return response
	}

	/**
	 * Get daily briefing
	 */
	async getDailyBriefing(): Promise<string> {
		const briefing = await this.realtime.getDailyBriefing()

		// Speak briefing
		await this.speak(briefing)

		return briefing
	}

	/**
	 * Get proactive suggestions
	 */
	async getProactiveSuggestions(): Promise<any[]> {
		return this.proactive.checkProactiveActions()
	}

	/**
	 * Play sound effect
	 */
	async playSound(
		effect: "click" | "success" | "error" | "notification" | "thinking" | "complete",
	): Promise<void> {
		await this.effects.playSound(effect)
	}

	/**
	 * Get system status with all components
	 */
	getFullStatus(): {
		identity: { name: string; version: string; description: string }
		server: string | null
		initialized: boolean
		components: string[]
		smartHomeDevices: number
		pendingTasks: number
		context: any
		language: string
		voiceAvailable: boolean
	} {
		return {
			identity: this.getIdentity(),
			server: this.serverUrl,
			initialized: true,
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
				"multilingual",
				"effects",
			],
			smartHomeDevices: this.smartHome.getAllDevices().length,
			pendingTasks: this.proactive.getTasks().length,
			context: this.context.getState(),
			language: this.multilingualVoice.getCurrentLanguage().code,
			voiceAvailable: this.multilingualVoice.isSynthesisAvailable(),
		}
	}
}

export { BrowserControl } from "./browser-control"
export { ContextAwareness } from "./context-awareness"
export { ConversationFlow } from "./conversation-flow"
export { DevilAI } from "./devil-ai"
export { FileAutomation } from "./file-automation"
export { JarvisEffects } from "./jarvis-effects"
export { JARVISPersonality } from "./jarvis-personality"
export { MultilingualVoice } from "./multilingual-voice"
export { ProactiveAssistant } from "./proactive-assistant"
export { RealtimeInfo } from "./realtime-info"
export { SmartHomeControl } from "./smart-home"
export { DevilAITools } from "./tools"
// Export all components
export { VoiceIntegration } from "./voice"
export { WakeWordDetector } from "./wake-word"

// UI components - export types only (React components should be in renderer)
export interface ChatMessage {
	id: string
	role: "user" | "assistant"
	content: string
	timestamp: Date
	isTyping?: boolean
	emotion?: "happy" | "neutral" | "concerned" | "excited" | "thinking"
	audioLevel?: number
}

export interface DevilAIChatProps {
	messages: ChatMessage[]
	onSendMessage: (message: string) => void
	isListening: boolean
	isSpeaking: boolean
	audioLevel: number
	language: "en" | "hi" | "gu"
}

// Export with legacy name for backward compatibility
export const AidenBridge = DevilAIAgent
export type AidenBridgeConfig = DevilAIConfig
export type AidenTask = DevilAITask

export default DevilAIAgent
