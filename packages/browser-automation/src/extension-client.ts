/**
 * Extension Client - Connects to browser extension via WebSocket
 * Allows controlling real browser tabs
 */

import type { ExtensionMessage, TabInfo } from "./types"

export class ExtensionClient {
	private ws: WebSocket | null = null
	private url: string
	private requestId = 0
	private pendingRequests = new Map<
		number,
		{ resolve: (value: any) => void; reject: (error: Error) => void }
	>()
	private eventHandlers = new Map<string, Set<(payload: any) => void>>()
	private reconnectAttempts = 0
	private maxReconnectAttempts = 10
	private reconnectDelay = 1000
	private connected = false

	constructor(url = "ws://localhost:9223") {
		this.url = url
	}

	async connect(): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) return

		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(this.url)

				this.ws.onopen = () => {
					console.log("[ExtensionClient] Connected to browser extension")
					this.connected = true
					this.reconnectAttempts = 0
					this.emit("connected", {})
					resolve()
				}

				this.ws.onmessage = (event) => {
					try {
						const msg: ExtensionMessage = JSON.parse(event.data)
						this.handleMessage(msg)
					} catch (e) {
						console.error("[ExtensionClient] Parse error", e)
					}
				}

				this.ws.onclose = () => {
					console.log("[ExtensionClient] Disconnected")
					this.connected = false
					this.emit("disconnected", {})
					this.attemptReconnect()
				}

				this.ws.onerror = (err) => {
					console.error("[ExtensionClient] WebSocket error", err)
					if (!this.connected) reject(err)
				}
			} catch (e) {
				reject(e)
			}
		})
	}

	private attemptReconnect() {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error("[ExtensionClient] Max reconnect attempts reached")
			return
		}

		this.reconnectAttempts++
		const delay = this.reconnectDelay * this.reconnectAttempts
		console.log(`[ExtensionClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

		setTimeout(() => {
			this.connect().catch(() => {})
		}, delay)
	}

	private handleMessage(msg: ExtensionMessage) {
		const { id, result, error, type, payload } = msg

		// Handle request responses
		if (id && this.pendingRequests.has(id)) {
			const { resolve, reject } = this.pendingRequests.get(id)!
			this.pendingRequests.delete(id)
			if (error) reject(new Error(error))
			else resolve(result)
			return
		}

		// Handle events
		if (type && this.eventHandlers.has(type)) {
			for (const handler of this.eventHandlers.get(type)!) {
				handler(payload)
			}
		}
	}

	private async sendRequest(type: string, payload: any): Promise<any> {
		if (!this.connected) {
			await this.connect()
		}

		return new Promise((resolve, reject) => {
			const id = ++this.requestId
			this.pendingRequests.set(id, { resolve, reject })

			this.ws!.send(JSON.stringify({ type, payload, id }))

			// Timeout
			setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id)
					reject(new Error(`Request timeout: ${type}`))
				}
			}, 30000)
		})
	}

	on(event: string, handler: (payload: any) => void): () => void {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, new Set())
		}
		this.eventHandlers.get(event)!.add(handler)

		return () => {
			this.eventHandlers.get(event)?.delete(handler)
		}
	}

	private emit(event: string, payload: any) {
		const handlers = this.eventHandlers.get(event)
		if (handlers) {
			for (const handler of handlers) {
				handler(payload)
			}
		}
	}

	// ============================================================
	// Tab Management
	// ============================================================

	async getTabs(): Promise<TabInfo[]> {
		return this.sendRequest("getTabs", {})
	}

	async createTab(url: string): Promise<TabInfo> {
		return this.sendRequest("createTab", { url })
	}

	async switchTab(tabId: number): Promise<void> {
		await this.sendRequest("switchTab", { tabId })
	}

	async closeTab(tabId: number): Promise<void> {
		await this.sendRequest("closeTab", { tabId })
	}

	async reloadTab(tabId: number): Promise<void> {
		await this.sendRequest("reloadTab", { tabId })
	}

	// ============================================================
	// Page Actions
	// ============================================================

	async click(tabId: number, selector: string): Promise<void> {
		await this.sendRequest("click", { tabId, selector })
	}

	async type(tabId: number, selector: string, text: string): Promise<void> {
		await this.sendRequest("type", { tabId, selector, text })
	}

	async screenshot(
		tabId: number,
		options: { fullPage?: boolean; format?: string; quality?: number } = {},
	): Promise<string> {
		const result = await this.sendRequest("screenshot", { tabId, options })
		return result.data
	}

	async evaluate(tabId: number, script: string, args?: any): Promise<any> {
		const result = await this.sendRequest("evaluate", { tabId, script, args })
		return result
	}

	async getContent(tabId: number): Promise<string> {
		const result = await this.sendRequest("getContent", { tabId })
		return result.content
	}

	async getText(tabId: number): Promise<string> {
		const result = await this.sendRequest("getText", { tabId })
		return result.text
	}

	async waitForSelector(tabId: number, selector: string, timeout = 30000): Promise<void> {
		await this.sendRequest("waitForSelector", { tabId, selector, timeout })
	}

	async getCookies(tabId: number): Promise<any[]> {
		return this.sendRequest("getCookies", { tabId })
	}

	async setCookies(tabId: number, cookies: any[]): Promise<void> {
		await this.sendRequest("setCookies", { tabId, cookies })
	}

	async pressKey(tabId: number, key: string): Promise<void> {
		await this.sendRequest("pressKey", { tabId, key })
	}

	// ============================================================
	// Connection
	// ============================================================

	isConnected(): boolean {
		return this.connected
	}

	disconnect(): void {
		this.ws?.close()
		this.ws = null
		this.connected = false
	}
}

// Singleton
let defaultClient: ExtensionClient | null = null

export function getExtensionClient(url?: string): ExtensionClient {
	if (!defaultClient) {
		defaultClient = new ExtensionClient(url)
	}
	return defaultClient
}
