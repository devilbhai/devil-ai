/**
 * Devil AI Voice Integration
 *
 * Voice-to-text and text-to-speech for hands-free operation
 */

export interface VoiceConfig {
	language: string
	continuous: boolean
	interimResults: boolean
	volume: number
	rate: number
	pitch: number
}

export interface VoiceResult {
	transcript: string
	confidence: number
	isFinal: boolean
	timestamp: Date
}

export class VoiceIntegration {
	private config: VoiceConfig
	private isListening: boolean = false
	private recognition: any = null
	private synthesis: SpeechSynthesis | null = null
	private onResult: ((result: VoiceResult) => void) | null = null
	private onInterim: ((result: VoiceResult) => void) | null = null

	constructor(config: Partial<VoiceConfig> = {}) {
		this.config = {
			language: "en-US",
			continuous: true,
			interimResults: true,
			volume: 1,
			rate: 1,
			pitch: 1,
			...config,
		}

		this.initSpeechRecognition()
		this.initSpeechSynthesis()
	}

	/**
	 * Initialize Speech Recognition
	 */
	private initSpeechRecognition(): void {
		if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
			const SpeechRecognition =
				(window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
			this.recognition = new SpeechRecognition()

			this.recognition.lang = this.config.language
			this.recognition.continuous = this.config.continuous
			this.recognition.interimResults = this.config.interimResults

			this.recognition.onresult = (event: any) => {
				const last = event.results.length - 1
				const result = event.results[last]

				const voiceResult: VoiceResult = {
					transcript: result[0].transcript,
					confidence: result[0].confidence,
					isFinal: result.isFinal,
					timestamp: new Date(),
				}

				if (result.isFinal && this.onResult) {
					this.onResult(voiceResult)
				} else if (!result.isFinal && this.onInterim) {
					this.onInterim(voiceResult)
				}
			}

			this.recognition.onerror = (event: any) => {
				console.error("Speech recognition error:", event.error)
			}

			this.recognition.onend = () => {
				if (this.isListening) {
					this.recognition.start()
				}
			}
		}
	}

	/**
	 * Initialize Speech Synthesis
	 */
	private initSpeechSynthesis(): void {
		if (typeof window !== "undefined" && "speechSynthesis" in window) {
			this.synthesis = window.speechSynthesis
		}
	}

	/**
	 * Start listening for voice input
	 */
	startListening(
		onResult: (result: VoiceResult) => void,
		onInterim?: (result: VoiceResult) => void,
	): void {
		if (!this.recognition) {
			console.error("Speech recognition not supported")
			return
		}

		this.onResult = onResult
		this.onInterim = onInterim || null
		this.isListening = true
		this.recognition.start()
		console.log("Voice recognition started")
	}

	/**
	 * Stop listening
	 */
	stopListening(): void {
		if (this.recognition) {
			this.isListening = false
			this.recognition.stop()
			console.log("Voice recognition stopped")
		}
	}

	/**
	 * Speak text aloud
	 */
	speak(text: string, callback?: () => void): void {
		if (!this.synthesis) {
			console.error("Speech synthesis not supported")
			return
		}

		// Cancel any ongoing speech
		this.synthesis.cancel()

		const utterance = new SpeechSynthesisUtterance(text)
		utterance.volume = this.config.volume
		utterance.rate = this.config.rate
		utterance.pitch = this.config.pitch

		utterance.onend = () => {
			if (callback) callback()
		}

		this.synthesis.speak(utterance)
	}

	/**
	 * Stop speaking
	 */
	stopSpeaking(): void {
		if (this.synthesis) {
			this.synthesis.cancel()
		}
	}

	/**
	 * Check if voice is supported
	 */
	isSupported(): { recognition: boolean; synthesis: boolean } {
		return {
			recognition: !!this.recognition,
			synthesis: !!this.synthesis,
		}
	}

	/**
	 * Set language
	 */
	setLanguage(language: string): void {
		this.config.language = language
		if (this.recognition) {
			this.recognition.lang = language
		}
	}

	/**
	 * Set voice properties
	 */
	setVoiceProperties(properties: { volume?: number; rate?: number; pitch?: number }): void {
		if (properties.volume !== undefined) this.config.volume = properties.volume
		if (properties.rate !== undefined) this.config.rate = properties.rate
		if (properties.pitch !== undefined) this.config.pitch = properties.pitch
	}

	/**
	 * Get available voices
	 */
	getVoices(): Promise<SpeechSynthesisVoice[]> {
		return new Promise((resolve) => {
			if (!this.synthesis) {
				resolve([])
				return
			}

			const voices = this.synthesis.getVoices()
			if (voices.length > 0) {
				resolve(voices)
			} else {
				this.synthesis.onvoiceschanged = () => {
					resolve(this.synthesis!.getVoices())
				}
			}
		})
	}
}

export default VoiceIntegration
