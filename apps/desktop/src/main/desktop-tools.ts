import fs from "node:fs/promises"
import { BrowserRunner } from "./browser-runner"
import { createLogger } from "./logger"
import { getSettings } from "./settings-store"

const log = createLogger("desktop-tools")

// Singleton browser instance
let runner: BrowserRunner | null = null

export async function handleBrowserSubagent(action: string, url?: string, selector?: string, text?: string): Promise<any> {
	if (!runner) {
		runner = new BrowserRunner({ headless: false })
		await runner.launch()
	}

	const tabs = await runner.getTabs()
	const pageId = tabs.length > 0 ? tabs[0].id : (await runner.newPage()).pageId

	try {
		switch (action) {
			case "navigate":
				if (url) await runner.navigate(pageId, url)
				return { success: true, text: await runner.getText(pageId) }
			case "click":
				if (selector) await runner.click(pageId, selector)
				return { success: true, text: await runner.getText(pageId) }
			case "type":
				if (selector && text) await runner.type(pageId, selector, text)
				return { success: true }
			case "screenshot":
				const base64 = await runner.screenshot(pageId)
				return { success: true, image: `data:image/png;base64,${base64}` }
			default:
				return { success: false, error: "Unknown action" }
		}
	} catch (err: any) {
		log.error("Browser subagent failed", err)
		return { success: false, error: err.message }
	}
}

export async function handleGenerateImage(prompt: string): Promise<any> {
	// In a real implementation, we would call DALL-E or Stable Diffusion API here.
	// For now, we return a mockup placeholder that embeds cleanly in markdown.
	const placeholderUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`
	return {
		success: true,
		markdown: `![Generated Image for: ${prompt}](${placeholderUrl})`
	}
}

export async function handleMultiReplace(filePath: string, chunks: { target: string; replacement: string }[]): Promise<any> {
	try {
		let content = await fs.readFile(filePath, "utf-8")
		
		for (const chunk of chunks) {
			if (!content.includes(chunk.target)) {
				return { success: false, error: `Target string not found in file: ${chunk.target.substring(0, 50)}...` }
			}
			content = content.replace(chunk.target, chunk.replacement)
		}
		
		await fs.writeFile(filePath, content, "utf-8")
		return { success: true }
	} catch (err: any) {
		log.error("MultiReplace failed", err)
		return { success: false, error: err.message }
	}
}

export async function handleInvokeSubagent(prompt: string): Promise<any> {
	// Call engine session API locally
	const settings = getSettings()
	const localServer = settings.servers.servers.find((s: any) => s.type === "local") as any
	const serverUrl = localServer?.url || "http://localhost:3100"

	try {
		// Create session
		const createRes = await fetch(`${serverUrl}/api/session`, { method: "POST", body: JSON.stringify({ title: "Subagent Task" }) })
		const session = await createRes.json()
		
		// Prompt session
		await fetch(`${serverUrl}/api/session/${session.id}/prompt`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ parts: [{ type: "text", text: prompt }] })
		})

		return { success: true, sessionId: session.id, message: "Subagent spawned successfully in background." }
	} catch (err: any) {
		return { success: false, error: err.message }
	}
}
