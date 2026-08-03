/**
 * Devil AI Wake Word Detection
 *
 * Detects "Hey Devil AI" and other wake phrases to trigger agent response.
 */

export interface WakeWordConfig {
	phrases: string[]
	sensitivity: number
	cooldownMs: number
}

export interface WakeWordResult {
	detected: boolean
	phrase: string
	timestamp: Date
	confidence: number
}

export class WakeWordDetector {
	private config: WakeWordConfig
	private lastDetection: Date | null = null
	private listener: ((result: WakeWordResult) => void) | null = null

	constructor(config: Partial<WakeWordConfig> = {}) {
		this.config = {
			phrases: ["hey devil ai", "devil ai", "hey devil", "devil", "hey assistant", "assistant"],
			sensitivity: 0.8,
			cooldownMs: 2000,
			...config,
		}
	}

	/**
	 * Start listening for wake words
	 */
	startListening(callback: (result: WakeWordResult) => void): void {
		this.listener = callback
		console.log("Wake word detector started")
		console.log("Listening for:", this.config.phrases.join(", "))
	}

	/**
	 * Stop listening
	 */
	stopListening(): void {
		this.listener = null
		console.log("Wake word detector stopped")
	}

	/**
	 * Process input text for wake words
	 */
	processInput(text: string): WakeWordResult {
		const result: WakeWordResult = {
			detected: false,
			phrase: "",
			timestamp: new Date(),
			confidence: 0,
		}

		// Check cooldown
		if (this.lastDetection) {
			const timeSinceLastDetection = Date.now() - this.lastDetection.getTime()
			if (timeSinceLastDetection < this.config.cooldownMs) {
				return result
			}
		}

		// Normalize input
		const normalizedInput = text.toLowerCase().trim()

		// Check for wake phrases
		for (const phrase of this.config.phrases) {
			const normalizedPhrase = phrase.toLowerCase()

			if (normalizedInput.includes(normalizedPhrase)) {
				// Calculate confidence based on phrase match
				const confidence = this.calculateConfidence(normalizedInput, normalizedPhrase)

				if (confidence >= this.config.sensitivity) {
					result.detected = true
					result.phrase = phrase
					result.confidence = confidence
					this.lastDetection = new Date()

					// Notify listener
					if (this.listener) {
						this.listener(result)
					}

					break
				}
			}
		}

		return result
	}

	/**
	 * Calculate confidence score for wake word detection
	 */
	private calculateConfidence(input: string, phrase: string): number {
		// Exact match
		if (input === phrase) {
			return 1.0
		}

		// Starts with phrase
		if (input.startsWith(phrase)) {
			return 0.9
		}

		// Contains phrase
		if (input.includes(phrase)) {
			// Check if phrase is at the beginning (higher confidence)
			const phraseIndex = input.indexOf(phrase)
			if (phraseIndex < 10) {
				return 0.85
			}
			return 0.8
		}

		// Partial match (e.g., "hey dev" for "hey devil ai")
		const words = phrase.split(" ")
		const inputWords = input.split(" ")

		let matchingWords = 0
		for (let i = 0; i < words.length; i++) {
			if (inputWords[i]?.startsWith(words[i])) {
				matchingWords++
			}
		}

		const partialConfidence = (matchingWords / words.length) * 0.7
		return partialConfidence
	}

	/**
	 * Extract task from input after wake word
	 */
	extractTask(fullInput: string, wakePhrase: string): string {
		// Remove wake phrase from input
		const normalizedInput = fullInput.toLowerCase()
		const normalizedPhrase = wakePhrase.toLowerCase()

		const phraseIndex = normalizedInput.indexOf(normalizedPhrase)
		if (phraseIndex !== -1) {
			const taskPart = fullInput.substring(phraseIndex + wakePhrase.length).trim()

			// Remove common prefixes
			const prefixes = [",", ".", "!", "?", "please", "can you", "could you", "help me"]
			let task = taskPart

			for (const prefix of prefixes) {
				if (task.toLowerCase().startsWith(prefix)) {
					task = task.substring(prefix.length).trim()
				}
			}

			return task
		}

		return fullInput
	}

	/**
	 * Get available wake phrases
	 */
	getPhrases(): string[] {
		return [...this.config.phrases]
	}

	/**
	 * Add new wake phrase
	 */
	addPhrase(phrase: string): void {
		if (!this.config.phrases.includes(phrase.toLowerCase())) {
			this.config.phrases.push(phrase.toLowerCase())
			console.log(`Added wake phrase: ${phrase}`)
		}
	}

	/**
	 * Remove wake phrase
	 */
	removePhrase(phrase: string): void {
		const index = this.config.phrases.indexOf(phrase.toLowerCase())
		if (index !== -1) {
			this.config.phrases.splice(index, 1)
			console.log(`Removed wake phrase: ${phrase}`)
		}
	}

	/**
	 * Update sensitivity
	 */
	setSensitivity(sensitivity: number): void {
		this.config.sensitivity = Math.max(0, Math.min(1, sensitivity))
		console.log(`Wake word sensitivity set to: ${this.config.sensitivity}`)
	}
}

export default WakeWordDetector
