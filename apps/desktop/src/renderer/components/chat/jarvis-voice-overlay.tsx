import { useEffect, useRef, useState } from "react"
import { JarvisOrb } from "@devil-ai/ui/components/ai-elements/jarvis-orb"
import { startContinuousVoiceSession, VoiceRecognitionState, VoiceSessionControls } from "../../services/voice-recognition"
import { speakText, stopSpeaking } from "../../services/text-to-speech"
import { XIcon } from "lucide-react"

interface JarvisVoiceOverlayProps {
	onClose: () => void
	onSubmitCommand: (command: string) => void
	latestReply?: string
	isWorking?: boolean
}

export function JarvisVoiceOverlay({ onClose, onSubmitCommand, latestReply, isWorking }: JarvisVoiceOverlayProps) {
	const [state, setState] = useState<VoiceRecognitionState>("idle")
	const [transcript, setTranscript] = useState("")
	const [chatHistory, setChatHistory] = useState<{role: "user" | "assistant", text: string}[]>([])
	const [showApiKeyInput, setShowApiKeyInput] = useState(false)
	const [apiKey, setApiKey] = useState("")
	const [errorMessage, setErrorMessage] = useState("")
	
	const sessionControlsRef = useRef<VoiceSessionControls | null>(null)

	// Load custom key from localStorage if it exists
	useEffect(() => {
		const stored = localStorage.getItem("devil-stt-groq-key")
		if (stored) {
			setApiKey(stored)
		}
	}, [])

	const prevIsWorkingRef = useRef(isWorking)

	// Trigger speech ONLY when AI finishes generating the reply
	useEffect(() => {
		if (prevIsWorkingRef.current && !isWorking && latestReply) {
			setChatHistory(prev => [...prev, { role: "assistant", text: latestReply }])
			setState("speaking")
			
			// Tell the STT session we are speaking, so it increases VAD threshold for interruptions
			sessionControlsRef.current?.pauseListening()
			
			// Read out the complete reply
			speakText(latestReply, "hi-IN", () => {
				// Once speaking is done (and not interrupted), go back to listening
				setState("listening")
				sessionControlsRef.current?.resumeListening()
			})
		}
		prevIsWorkingRef.current = isWorking
	}, [isWorking, latestReply])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopListening()
			stopSpeaking()
		}
	}, [])

	const startListening = () => {
		if (showApiKeyInput) return
		
		stopSpeaking()
		setTranscript("")
		sessionControlsRef.current = startContinuousVoiceSession(
			(result) => {
				setTranscript(result.text)
				if (result.isFinal) {
					setChatHistory(prev => [...prev, { role: "user", text: result.text }])
					setState("processing")
					
					// Auto submit the recognized text so Devil AI can reply
					setTimeout(() => {
						onSubmitCommand(result.text)
					}, 200)
				}
			},
			(newState) => {
				setState(newState)
			},
			(err) => {
				console.error("Jarvis Voice Error:", err)
				if (err.includes("MISSING_API_KEY")) {
					setShowApiKeyInput(true)
					setErrorMessage("API Key not found.")
				} else {
					setErrorMessage(err)
				}
				setState("error")
			},
			() => {
				// INTERRUPTED!
				console.log("User interrupted the TTS!")
				stopSpeaking()
				setState("listening")
				sessionControlsRef.current?.resumeListening()
			},
			undefined,
			apiKey
		)
	}

	const stopListening = () => {
		if (sessionControlsRef.current) {
			sessionControlsRef.current.stop()
			sessionControlsRef.current = null
		}
	}

	const handleOrbClick = () => {
		if (state === "listening") {
			stopListening() // Force early stop
		} else if (state === "idle" || state === "error") {
			startListening()
		}
	}

	const handleSaveKey = () => {
		if (apiKey.trim()) {
			localStorage.setItem("devil-stt-groq-key", apiKey.trim())
			setShowApiKeyInput(false)
			setState("idle")
		}
	}

	return (
		<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
			{/* Close button */}
			<button
				onClick={onClose}
				className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
			>
				<XIcon className="size-6" />
			</button>

			{/* The Pro-Level Jarvis Orb */}
			<div
				className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
				onClick={handleOrbClick}
			>
				<JarvisOrb state={state} size={300} />
			</div>

			{/* Status Text */}
			<div className="mt-12 text-center max-w-xl px-6 flex flex-col items-center">
				<h2 className="text-2xl font-bold tracking-tight mb-2 opacity-80 transition-all">
					{state === "listening" && "Listening..."}
					{state === "speaking" && "Speaking..."}
					{state === "processing" && (isWorking ? "Thinking..." : "Processing...")}
					{state === "idle" && "Tap waveform to speak"}
					{state === "error" && "Microphone Error / Blocked"}
				</h2>
				
				{state === "error" && errorMessage && (
					<p className="text-sm text-red-400 mb-4">{errorMessage}</p>
				)}
				
				{/* API Key Input Fallback */}
				{showApiKeyInput && (
					<div className="mt-4 p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4">
						<p className="text-sm font-medium mb-3 text-muted-foreground">
							Devil AI cloud STT key not found. Please enter your Groq API key directly to enable ultra-fast voice mode:
						</p>
						<div className="flex space-x-2">
							<input
								type="password"
								placeholder="gsk_..."
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							/>
							<button 
								onClick={handleSaveKey}
								className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
							>
								Save
							</button>
						</div>
					</div>
				)}
				
				{/* Live Transcript History */}
				<div className="mt-8 w-full max-w-2xl flex flex-col items-center space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar mask-image-fade">
					{chatHistory.slice(-4).map((msg, idx) => (
						<p key={idx} className={`text-lg font-medium transition-all duration-300 animate-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'text-primary' : 'text-muted-foreground opacity-80'}`}>
							{msg.text}
						</p>
					))}
					{state === "listening" && transcript && (
						<p className="text-lg font-medium text-primary animate-pulse opacity-70">
							"{transcript}"
						</p>
					)}
				</div>
			</div>
			
			<style>{`
				.no-scrollbar::-webkit-scrollbar { display: none; }
				.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
				.mask-image-fade { mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); }
			`}</style>
		</div>
	)
}
