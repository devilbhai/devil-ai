import { useEffect, useState, useRef } from "react"
import { usePromptInputController } from "@devil-ai/ui/components/ai-elements/prompt-input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@devil-ai/ui/components/tooltip"
import { MicIcon } from "lucide-react"

interface SpeechRecognitionEvent extends Event {
	resultIndex: number
	results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
	length: number
	item(index: number): SpeechRecognitionResult
	[index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
	length: number
	item(index: number): SpeechRecognitionAlternative
	[index: number]: SpeechRecognitionAlternative
	isFinal: boolean
}

interface SpeechRecognitionAlternative {
	transcript: string
	confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string
	message: string
}

interface WebkitSpeechRecognition extends EventTarget {
	continuous: boolean
	interimResults: boolean
	lang: string
	maxAlternatives: number
	onstart: (() => void) | null
	onresult: ((event: SpeechRecognitionEvent) => void) | null
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
	onend: (() => void) | null
	start(): void
	abort(): void
	stop(): void
}

declare global {
	interface Window {
		webkitSpeechRecognition: new () => WebkitSpeechRecognition
		SpeechRecognition: new () => WebkitSpeechRecognition
	}
}

export function VoicePairProgrammingButton({ disabled }: { disabled: boolean }) {
	const controller = usePromptInputController()
	const [isListening, setIsListening] = useState(false)
	const recognitionRef = useRef<WebkitSpeechRecognition | null>(null)

	const controllerRef = useRef(controller)
	useEffect(() => {
		controllerRef.current = controller
	}, [controller])

	useEffect(() => {
		if (isListening) {
			const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
			if (!SpeechRecognitionCtor) {
				console.error("Speech recognition not supported")
				setIsListening(false)
				return
			}

			const recognition = new SpeechRecognitionCtor()
			recognition.continuous = true
			recognition.interimResults = true
			recognition.lang = "en-US"
			recognition.maxAlternatives = 1

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				let interimText = ""
				let finalText = ""

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const result = event.results[i]
					const transcript = result[0].transcript

					if (result.isFinal) {
						finalText += transcript
					} else {
						interimText += transcript
					}
				}

				if (finalText) {
					const current = controllerRef.current.textInput.value
					const separator = current && !current.endsWith(" ") ? " " : ""
					controllerRef.current.textInput.setInput(current + separator + finalText.trim())
				}
			}

			recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
				if (event.error !== "aborted") {
					console.error("Speech recognition error:", event.error)
				}
				setIsListening(false)
			}

			recognition.onend = () => {
				setIsListening(false)
			}

			try {
				recognition.start()
				recognitionRef.current = recognition
			} catch (err) {
				console.error("Failed to start speech recognition:", err)
				setIsListening(false)
			}
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.abort()
				recognitionRef.current = null
			}
		}
	}, [isListening])

	const toggleListening = () => {
		setIsListening((prev) => !prev)
	}

	return (
		<Tooltip>
			<TooltipTrigger render={
				<button
					type="button"
					onClick={toggleListening}
					disabled={disabled && !isListening}
					className={`flex h-7 items-center justify-center rounded-md px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
						isListening ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse" : "text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<MicIcon className="size-4 shrink-0" />
				</button>
			} />
			<TooltipContent side="top">
				{isListening ? "Listening (Click to stop)" : "Voice Input"}
			</TooltipContent>
		</Tooltip>
	)
}
