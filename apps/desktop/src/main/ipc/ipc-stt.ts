import { ipcMain } from "electron"
import path from "path"
import fs from "fs/promises"
import os from "os"
import { createLogger } from "../logger"

const log = createLogger("ipc-stt")

export function setupSttIpc() {
	ipcMain.handle("stt:transcribe", async (_event, { base64Audio, language, customKey }: { base64Audio: string, language?: string, customKey?: string }) => {
		try {
			let config: any = {}
			
			// Try to read opencode config files
			const home = os.homedir()
			const pathsToTry = [
				path.join(home, ".config", "opencode", "opencode.jsonc"),
				path.join(home, ".config", "opencode", "opencode.json"),
				path.join(process.cwd(), "opencode.json"),
			]
			
			for (const p of pathsToTry) {
				try {
					const raw = await fs.readFile(p, "utf-8")
					// Naive JSON/JSONC parse
					config = JSON.parse(raw.replace(/\/\/.*$/gm, ''))
					if (config.provider) break
				} catch (e) {
					// try next
				}
			}

			const providers = config.provider || {}
			
			// Extract OpenCode Zen / PrivateMode AI key
			let agentRouterKey = ""
			if (providers["privatemode-ai"]?.options?.apiKey) {
				agentRouterKey = providers["privatemode-ai"].options.apiKey
			}
			
			// Standard local keys
			let groqKey = ""
			let openaiKey = ""
			
			if (providers.groq?.options?.apiKey) groqKey = providers.groq.options.apiKey
			if (providers.openai?.options?.apiKey) openaiKey = providers.openai.options.apiKey
			
			groqKey = customKey || groqKey || process.env.GROQ_API_KEY || ""
			openaiKey = openaiKey || process.env.OPENAI_API_KEY || ""

			if (!groqKey && !openaiKey && !agentRouterKey) {
				return { error: "MISSING_API_KEY" }
			}

			const audioBuffer = Buffer.from(base64Audio, "base64")
			const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" })
			
			const languageCode = language ? language.split("-")[0] : "en" // Default to english or auto
			log.debug("Using language code for STT:", languageCode)

			// 1. Try Groq Local Key
			if (groqKey) {
				const form = new FormData()
				form.append("file", file)
				form.append("model", "whisper-large-v3")
				
				const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
					method: "POST",
					headers: { Authorization: `Bearer ${groqKey}` },
					body: form
				})
				
				if (res.ok) {
					const data = await res.json()
					return { text: data.text }
				} else {
					log.error("Groq STT Failed:", res.status, await res.text())
				}
			}

			// 2. Try OpenCode Zen (AgentRouter Cloud)
			if (agentRouterKey) {
				const form = new FormData()
				form.append("file", file)
				form.append("model", "whisper-1") // AgentRouter will route this to Groq/OpenAI automatically!
				
				const res = await fetch("https://agentrouter.org/v1/audio/transcriptions", {
					method: "POST",
					headers: { Authorization: `Bearer ${agentRouterKey}` },
					body: form
				})
				
				if (res.ok) {
					const data = await res.json()
					return { text: data.text }
				} else {
					log.error("AgentRouter STT Failed:", res.status, await res.text())
				}
			}

			// 3. Try OpenAI Local Key
			if (openaiKey) {
				const form = new FormData()
				form.append("file", file)
				form.append("model", "whisper-1")
				
				const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
					method: "POST",
					headers: { Authorization: `Bearer ${openaiKey}` },
					body: form
				})
				
				if (res.ok) {
					const data = await res.json()
					return { text: data.text }
				} else {
					log.error("OpenAI STT Failed:", res.status, await res.text())
				}
			}

			return { error: "Failed to transcribe audio. All API attempts failed." }
		} catch (error: any) {
			log.error("STT Error:", error.message)
			return { error: error.message }
		}
	})

	ipcMain.handle("tts:synthesize", async (_event, { text, customKey }: { text: string, customKey?: string }) => {
		try {
			let config: any = {}
			const home = os.homedir()
			const pathsToTry = [
				path.join(home, ".config", "opencode", "opencode.jsonc"),
				path.join(home, ".config", "opencode", "opencode.json"),
				path.join(process.cwd(), "opencode.json"),
			]
			for (const p of pathsToTry) {
				try {
					const raw = await fs.readFile(p, "utf-8")
					config = JSON.parse(raw.replace(/\/\/.*$/gm, ''))
					if (config.provider) break
				} catch (e) {
					// ignore
				}
			}

			const providers = config.provider || {}
			let agentRouterKey = providers["privatemode-ai"]?.options?.apiKey || ""
			let openaiKey = providers.openai?.options?.apiKey || customKey || process.env.OPENAI_API_KEY || ""
			let groqKey = providers.groq?.options?.apiKey || customKey || process.env.GROQ_API_KEY || ""

			// Groq doesn't have TTS yet, so we use OpenAI or AgentRouter for TTS
			let apiKey = openaiKey || agentRouterKey
			let url = openaiKey ? "https://api.openai.com/v1/audio/speech" : "https://agentrouter.org/v1/audio/speech"
			
			if (!apiKey) {
				// Fallback to groq key if agentrouter allows it for TTS somehow, otherwise fail
				if (groqKey && !openaiKey) {
					apiKey = groqKey
					url = "https://agentrouter.org/v1/audio/speech"
				} else {
					return { error: "MISSING_API_KEY" }
				}
			}

			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					model: "tts-1",
					input: text,
					voice: "alloy",
					response_format: "mp3"
				})
			})

			if (!res.ok) {
				const errText = await res.text()
				return { error: `TTS Failed: ${res.status} ${errText}` }
			}

			const arrayBuffer = await res.arrayBuffer()
			const base64Audio = Buffer.from(arrayBuffer).toString("base64")
			
			return { audioContent: base64Audio }
		} catch (error: any) {
			log.error("TTS Error:", error.message)
			return { error: error.message }
		}
	})
}

