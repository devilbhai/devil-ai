/**
 * Devil AI IPC handlers
 * 
 * Handles communication between renderer and Devil AI agent
 */

import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { createLogger } from "../logger"

const log = createLogger("devil-ai")

// Devil AI agent instance (will be set from main/index.ts)
let devilAIAgent: any = null

export function setDevilAIAgent(agent: any) {
	devilAIAgent = agent
}

export function registerDevilAIIpc(): void {
	// Process input with JARVIS personality
	ipcMain.handle(
		"devil-ai:process",
		withLogging("devil-ai:process", async (_, input: string) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.processInputWithPersonality(input)
		}),
	)

	// Execute task
	ipcMain.handle(
		"devil-ai:execute",
		withLogging("devil-ai:execute", async (_, prompt: string) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.executeTask(prompt)
		}),
	)

	// Get greeting
	ipcMain.handle("devil-ai:greeting", () => {
		if (!devilAIAgent) {
			return "Devil AI not initialized"
		}
		return devilAIAgent.getGreeting()
	})

	// Get response by type
	ipcMain.handle("devil-ai:response", (_, type: string) => {
		if (!devilAIAgent) {
			return "Devil AI not initialized"
		}
		return devilAIAgent.getResponse(type as any)
	})

	// Set language
	ipcMain.handle("devil-ai:set-language", (_, lang: string) => {
		if (!devilAIAgent) {
			return false
		}
		devilAIAgent.setLanguage(lang as 'en' | 'hi' | 'gu')
		return true
	})

	// Speak text
	ipcMain.handle("devil-ai:speak", async (_, text: string) => {
		if (!devilAIAgent) {
			return false
		}
		await devilAIAgent.speak(text)
		return true
	})

	// Control smart home
	ipcMain.handle(
		"devil-ai:smart-home",
		withLogging("devil-ai:smart-home", async (_, command: string) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.controlSmartHome(command)
		}),
	)

	// Get daily briefing
	ipcMain.handle(
		"devil-ai:briefing",
		withLogging("devil-ai:briefing", async () => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.getDailyBriefing()
		}),
	)

	// Get proactive suggestions
	ipcMain.handle(
		"devil-ai:suggestions",
		withLogging("devil-ai:suggestions", async () => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.getProactiveSuggestions()
		}),
	)

	// Get system status
	ipcMain.handle("devil-ai:status", () => {
		if (!devilAIAgent) {
			return { initialized: false }
		}
		return devilAIAgent.getFullStatus()
	})

	// Play sound effect
	ipcMain.handle("devil-ai:sound", async (_, effect: string) => {
		if (!devilAIAgent) {
			return false
		}
		await devilAIAgent.playSound(effect as any)
		return true
	})

	// Organize files
	ipcMain.handle(
		"devil-ai:organize",
		withLogging("devil-ai:organize", async (_, directory: string) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.organizeFiles(directory)
		}),
	)

	// Search web
	ipcMain.handle(
		"devil-ai:search",
		withLogging("devil-ai:search", async (_, query: string) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.search(query)
		}),
	)

	// Browse website
	ipcMain.handle(
		"devil-ai:browse",
		withLogging("devil-ai:browse", async (_, url: string) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.browse(url)
		}),
	)

	// Use tool
	ipcMain.handle(
		"devil-ai:tool",
		withLogging("devil-ai:tool", async (_, toolName: string, params: any) => {
			if (!devilAIAgent) {
				throw new Error("Devil AI not initialized")
			}
			return await devilAIAgent.useTool(toolName, params)
		}),
	)

	log.info("Devil AI IPC handlers registered")
}
