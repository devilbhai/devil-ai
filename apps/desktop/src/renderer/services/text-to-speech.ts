/**
 * Text-to-Speech service using Web Speech API
 */

let currentAudio: HTMLAudioElement | null = null

export async function speakText(text: string, lang: string = "hi-IN", onEnd?: () => void) {
	if (typeof window === "undefined") return

	stopSpeaking()

	try {
		// Attempt Pro TTS first
		if ((window as any).devilAi?.ttsSynthesize) {
			const res = await (window as any).devilAi.ttsSynthesize({ text })
			if (res.audioContent) {
				const audio = new Audio("data:audio/mp3;base64," + res.audioContent)
				currentAudio = audio
				
				audio.onended = () => {
					currentAudio = null
					onEnd?.()
				}
				audio.onerror = () => {
					currentAudio = null
					onEnd?.()
				}
				
				await audio.play()
				return
			}
		}
	} catch (e) {
		console.warn("Pro TTS failed, falling back to Web Speech API", e)
	}

	// Fallback to basic Web Speech API
	if (!("speechSynthesis" in window)) {
		onEnd?.()
		return
	}

	const utterance = new SpeechSynthesisUtterance(text)
	const voices = window.speechSynthesis.getVoices()
	const targetVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]))
	
	if (targetVoice) {
		utterance.voice = targetVoice
	}
	
	utterance.lang = lang
	utterance.rate = 1.05
	utterance.pitch = 0.9

	if (onEnd) {
		utterance.onend = onEnd
		utterance.onerror = onEnd
	}

	window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0
		currentAudio = null
	}
	if (typeof window !== "undefined" && "speechSynthesis" in window) {
		window.speechSynthesis.cancel()
	}
}
