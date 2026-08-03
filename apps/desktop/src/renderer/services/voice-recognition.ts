export type VoiceRecognitionState = "idle" | "listening" | "processing" | "error" | "speaking"

export interface VoiceResult {
	text: string
	confidence: number
	isFinal: boolean
}

export function isVoiceSupported(): boolean {
	return typeof window !== "undefined" && typeof navigator !== "undefined" && !!navigator.mediaDevices
}

export interface VoiceSessionControls {
	stop: () => void
	pauseListening: () => void
	resumeListening: () => void
}

export function startContinuousVoiceSession(
	onResult: (result: VoiceResult) => void,
	onStateChange: (state: VoiceRecognitionState) => void,
	onError?: (error: string) => void,
	onInterrupt?: () => void,
	language?: string,
	customKey?: string
): VoiceSessionControls {
	if (!isVoiceSupported()) {
		onError?.("Voice recognition not supported in this browser")
		onStateChange("error")
		return { stop: () => {}, pauseListening: () => {}, resumeListening: () => {} }
	}

	let mediaRecorder: MediaRecorder | null = null
	let stream: MediaStream | null = null
	let audioContext: AudioContext | null = null
	let rafId: number | null = null
	
	let isSessionActive = true
	let isListeningPaused = false
	let isSpeaking = false
	
	let lastSpeechTime = Date.now()
	let hasSpoken = false

	const startNewRecordingChunk = () => {
		if (!isSessionActive || !stream || isListeningPaused) return
		
		mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
		const audioChunks: Blob[] = []
		
		mediaRecorder.addEventListener("dataavailable", event => {
			if (event.data.size > 0) {
				audioChunks.push(event.data)
			}
		})

		mediaRecorder.addEventListener("stop", async () => {
			if (!isSessionActive || audioChunks.length === 0 || !hasSpoken) return
			
			const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
			hasSpoken = false
			
			const reader = new FileReader()
			reader.readAsDataURL(audioBlob)
			reader.onloadend = async () => {
				const result = reader.result as string
				const base64Audio = result.split(',')[1]
				
				try {
					const res = await (window as any).devilAi.sttTranscribe({ base64Audio, language, customKey })
					if (res.error) {
						onError?.(res.error)
						onStateChange("error")
					} else if (res.text && res.text.trim().length > 0) {
						onResult({ text: res.text, confidence: 1, isFinal: true })
						// The UI will transition to "processing" and then "speaking"
					} else {
						// Empty transcript, just resume listening
						if (!isListeningPaused) {
							onStateChange("listening")
							startNewRecordingChunk()
						}
					}
				} catch (e: any) {
					onError?.(e.message || "IPC Error")
					onStateChange("error")
				}
			}
		})
		
		mediaRecorder.start()
		onStateChange("listening")
		lastSpeechTime = Date.now()
	}

	navigator.mediaDevices.getUserMedia({ 
		audio: { 
			echoCancellation: true, 
			noiseSuppression: true, 
			autoGainControl: true 
		} 
	}).then(s => {
		stream = s
		
		// Setup silence and human voice detection
		audioContext = new AudioContext()
		const source = audioContext.createMediaStreamSource(stream)
		
		// Add Bandpass Filter (300Hz - 3400Hz) to ignore fans and ACs
		const bandpass = audioContext.createBiquadFilter()
		bandpass.type = "bandpass"
		bandpass.frequency.value = 1850 // Center of human voice
		bandpass.Q.value = 0.5 // Wide enough to cover 300 to 3400Hz
		
		source.connect(bandpass)
		
		const analyser = audioContext.createAnalyser()
		bandpass.connect(analyser)
		
		analyser.fftSize = 512
		const bufferLength = analyser.frequencyBinCount
		const dataArray = new Uint8Array(bufferLength)

		const checkSilence = () => {
			if (!isSessionActive) return
			
			if (!isListeningPaused) {
				analyser.getByteFrequencyData(dataArray)
				const sum = dataArray.reduce((a, b) => a + b, 0)
				const average = sum / bufferLength

				// Threshold for human speech (filtered)
				const threshold = isSpeaking ? 35 : 12 // Require much louder voice to interrupt TTS

				if (average > threshold) {
					lastSpeechTime = Date.now()
					if (!hasSpoken) {
						hasSpoken = true
						if (isSpeaking) {
							// Interruption detected!
							onInterrupt?.()
						}
					}
				} else {
					// Silence detected
					if (hasSpoken && Date.now() - lastSpeechTime > 1500) {
						// Stop chunk and process
						if (mediaRecorder && mediaRecorder.state === "recording") {
							mediaRecorder.requestData() // ensure final chunk is saved
							mediaRecorder.stop()
							onStateChange("processing")
						}
					}
				}
			}
			
			rafId = requestAnimationFrame(checkSilence)
		}
		
		checkSilence()
		startNewRecordingChunk()
		
	}).catch(e => {
		console.error("Mic error:", e)
		onError?.("Microphone access denied or unavailable.")
		onStateChange("error")
	})

	return {
		stop: () => {
			isSessionActive = false
			if (rafId !== null) {
				cancelAnimationFrame(rafId)
				rafId = null
			}
			if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop()
			if (audioContext) audioContext.close()
			if (stream) stream.getTracks().forEach(track => track.stop())
		},
		pauseListening: () => {
			isListeningPaused = true
			isSpeaking = true
			if (mediaRecorder && mediaRecorder.state !== "inactive") {
				mediaRecorder.stop()
			}
		},
		resumeListening: () => {
			isListeningPaused = false
			isSpeaking = false
			hasSpoken = false
			startNewRecordingChunk()
		}
	}
}

export function getVoiceLanguages(): { code: string; label: string }[] {
	return [
		{ code: "en-IN", label: "English (India)" },
		{ code: "en-US", label: "English (US)" },
		{ code: "en-GB", label: "English (UK)" },
		{ code: "hi-IN", label: "Hindi" },
		{ code: "gu-IN", label: "Gujarati" },
	]
}
