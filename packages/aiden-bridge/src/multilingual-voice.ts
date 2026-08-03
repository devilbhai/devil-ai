/**
 * Multilingual Voice Support for Devil AI
 *
 * Hindi, English, and Gujarati voice recognition and synthesis
 */

export interface LanguageConfig {
	code: "en" | "hi" | "gu"
	name: string
	nativeName: string
	voiceName: string
	speechRecognitionLang: string
	greetings: string[]
	responses: Record<string, string[]>
}

export class MultilingualVoice {
	private currentLanguage: "en" | "hi" | "gu" = "en"
	private languages: Map<string, LanguageConfig> = new Map()
	private synth: SpeechSynthesis | null = null
	private recognition: any = null

	constructor() {
		this.initializeLanguages()
		this.initializeSpeech()
	}

	/**
	 * Initialize language configurations
	 */
	private initializeLanguages(): void {
		// English
		this.languages.set("en", {
			code: "en",
			name: "English",
			nativeName: "English",
			voiceName: "Google UK English Male",
			speechRecognitionLang: "en-US",
			greetings: [
				"Hello! How can I help you?",
				"Hi there! Devil AI ready to assist.",
				"Good day! What can I do for you?",
			],
			responses: {
				welcome: ["Welcome back!", "Good to see you!", "Hello again!"],
				thinking: ["Let me think about that...", "Processing...", "One moment..."],
				done: ["Done!", "Completed!", "All set!"],
				error: ["Something went wrong.", "Let me try again.", "I encountered an issue."],
				farewell: ["Goodbye!", "See you later!", "Take care!"],
			},
		})

		// Hindi
		this.languages.set("hi", {
			code: "hi",
			name: "Hindi",
			nativeName: "हिंदी",
			voiceName: "Google Hindi",
			speechRecognitionLang: "hi-IN",
			greetings: [
				"नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
				"हैलो! Devil AI आपकी सेवा में है।",
				"नमस्कार! बताइए मैं आपके लिए क्या कर सकता हूँ?",
			],
			responses: {
				welcome: ["वापस स्वागत है!", "अच्छा लगा आपको देखकर!", "फिर से नमस्ते!"],
				thinking: ["मैं सोच रहा हूँ...", "प्रोसेस हो रहा है...", "एक मिनट..."],
				done: ["हो गया!", "काम पूरा हुआ!", "तैयार है!"],
				error: ["कुछ गड़बड़ हुई।", "फिर से कोशिश करता हूँ।", "समस्या आ गई।"],
				farewell: ["अलविदा!", "फिर मिलेंगे!", "अपना ख्याल रखना!"],
			},
		})

		// Gujarati
		this.languages.set("gu", {
			code: "gu",
			name: "Gujarati",
			nativeName: "ગુજરાતી",
			voiceName: "Google Gujarati",
			speechRecognitionLang: "gu-IN",
			greetings: [
				"નમસ્તે! હું તમને કેવી રીતે મદદ કરી શકું?",
				"હેલો! Devil AI તમારી સેવામાં છે.",
				"નમસ્કાર! જણાવો હું તમારા માટે શું કરી શકું?",
			],
			responses: {
				welcome: ["પાછા આવ્યા તેનું સ્વાગત છે!", "તમને જોઈને સારું લાગ્યું!", "ફરી નમસ્તે!"],
				thinking: ["હું વિચારી રહ્યો છું...", "પ્રોસેસ થઈ રહ્યું છે...", "એક મિનિટ..."],
				done: ["થઈ ગયું!", "કામ પૂરું થયું!", "તૈયાર છે!"],
				error: ["કંઈક ખોટું થયું.", "ફરી પ્રયાસ કરું છું.", "સમસ્યા આવી."],
				farewell: ["આવજો!", "ફરી મળીશું!", "પોતાનું ધ્યાન રાખજો!"],
			},
		})
	}

	/**
	 * Initialize speech synthesis and recognition
	 */
	private initializeSpeech(): void {
		if (typeof window !== "undefined") {
			this.synth = window.speechSynthesis

			// Initialize speech recognition
			const SpeechRecognition =
				(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
			if (SpeechRecognition) {
				this.recognition = new SpeechRecognition()
				this.recognition.continuous = true
				this.recognition.interimResults = true
			}
		}
	}

	/**
	 * Set current language
	 */
	setLanguage(lang: "en" | "hi" | "gu"): void {
		this.currentLanguage = lang
		const config = this.languages.get(lang)

		if (this.recognition && config) {
			this.recognition.lang = config.speechRecognitionLang
		}

		console.log(`Language set to: ${config?.nativeName}`)
	}

	/**
	 * Get current language
	 */
	getCurrentLanguage(): LanguageConfig {
		return this.languages.get(this.currentLanguage)!
	}

	/**
	 * Get greeting in current language
	 */
	getGreeting(): string {
		const config = this.getCurrentLanguage()
		return config.greetings[Math.floor(Math.random() * config.greetings.length)]
	}

	/**
	 * Get response in current language
	 */
	getResponse(type: "welcome" | "thinking" | "done" | "error" | "farewell"): string {
		const config = this.getCurrentLanguage()
		const responses = config.responses[type]
		return responses[Math.floor(Math.random() * responses.length)]
	}

	/**
	 * Speak text in current language
	 */
	speak(text: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.synth) {
				reject(new Error("Speech synthesis not available"))
				return
			}

			// Cancel any ongoing speech
			this.synth.cancel()

			const utterance = new SpeechSynthesisUtterance(text)
			const config = this.getCurrentLanguage()

			// Find voice for current language
			const voices = this.synth.getVoices()
			const voice =
				voices.find((v) => v.name.includes(config.voiceName)) ||
				voices.find((v) => v.lang.startsWith(config.code))

			if (voice) {
				utterance.voice = voice
			}

			utterance.lang = config.speechRecognitionLang
			utterance.rate = 1.0
			utterance.pitch = 1.0
			utterance.volume = 1.0

			utterance.onend = () => resolve()
			utterance.onerror = (event) => reject(event.error)

			this.synth.speak(utterance)
		})
	}

	/**
	 * Start listening
	 */
	startListening(
		onResult: (transcript: string, isFinal: boolean) => void,
		onError?: (error: string) => void,
	): void {
		if (!this.recognition) {
			onError?.("Speech recognition not available")
			return
		}

		this.recognition.onresult = (event: any) => {
			const last = event.results.length - 1
			const transcript = event.results[last][0].transcript
			const isFinal = event.results[last].isFinal

			onResult(transcript, isFinal)
		}

		this.recognition.onerror = (event: any) => {
			onError?.(event.error)
		}

		this.recognition.start()
		console.log(`Listening in ${this.getCurrentLanguage().nativeName}...`)
	}

	/**
	 * Stop listening
	 */
	stopListening(): void {
		if (this.recognition) {
			this.recognition.stop()
		}
	}

	/**
	 * Translate text (simple dictionary-based)
	 */
	translate(text: string, from: "en" | "hi" | "gu", to: "en" | "hi" | "gu"): string {
		// Simple translation dictionary
		const translations: Record<string, Record<string, string>> = {
			hello: { hi: "नमस्तે", gu: "નમસ્તે" },
			goodbye: { hi: "अलविदा", gu: "આવજો" },
			"thank you": { hi: "धन्यवाद", gu: "આભાર" },
			yes: { hi: "हाँ", gu: "હા" },
			no: { hi: "नहीं", gu: "ના" },
			please: { hi: "कृपया", gu: "કૃપા કરીને" },
			help: { hi: "मदद", gu: "મદદ" },
			files: { hi: "फ़ाइलें", gu: "ફાઈલો" },
			search: { hi: "खोजें", gu: "શોધો" },
			open: { hi: "खोलें", gu: "ખોલો" },
			close: { hi: "बंद करें", gu: "બંધ કરો" },
		}

		if (from === to) return text

		const lowerText = text.toLowerCase()

		for (const [english, langs] of Object.entries(translations)) {
			if (lowerText.includes(english)) {
				const translated = langs[to]
				if (translated) {
					return text.replace(new RegExp(english, "gi"), translated)
				}
			}
		}

		return text
	}

	/**
	 * Detect language from text
	 */
	detectLanguage(text: string): "en" | "hi" | "gu" {
		// Simple detection based on character ranges
		const hindiRange = /[\u0900-\u097F]/
		const gujaratiRange = /[\u0A80-\u0AFF]/

		if (hindiRange.test(text)) return "hi"
		if (gujaratiRange.test(text)) return "gu"
		return "en"
	}

	/**
	 * Get available voices for current language
	 */
	getAvailableVoices(): SpeechSynthesisVoice[] {
		if (!this.synth) return []

		const config = this.getCurrentLanguage()
		return this.synth
			.getVoices()
			.filter((v) => v.lang.startsWith(config.code) || v.name.includes(config.voiceName))
	}

	/**
	 * Check if speech synthesis is available
	 */
	isSynthesisAvailable(): boolean {
		return this.synth !== null
	}

	/**
	 * Check if speech recognition is available
	 */
	isRecognitionAvailable(): boolean {
		return this.recognition !== null
	}
}

export default MultilingualVoice
