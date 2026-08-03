/**
 * Live Collaboration — extends Tunnel Manager with real-time multi-editor support.
 *
 * Builds on top of the existing Cloudflare tunnel infrastructure to add
 * real-time collaboration for code editing and cursor sync.
 *
 * Architecture:
 * - Host runs a WebSocket server alongside the existing HTTP server
 * - Peers connect via WebSocket for real-time cursor and selection sync
 * - File changes are broadcast to all peers
 */

import { createServer, type Server, type IncomingMessage } from "node:http"
import type { Duplex } from "node:stream"
import crypto from "node:crypto"
import { createLogger } from "./logger"

const log = createLogger("live-collaboration")

// ============================================================
// Types
// ============================================================

export interface Collaborator {
	id: string
	name: string
	color: string
	cursor?: CursorPosition
	selection?: SelectionRange
	connectedAt: number
	lastSeen: number
}

export interface CursorPosition {
	file: string
	line: number
	column: number
}

export interface SelectionRange {
	file: string
	startLine: number
	startColumn: number
	endLine: number
	endColumn: number
}

export interface CollaborationState {
	active: boolean
	roomId: string | null
	peers: Collaborator[]
	localPeer: Collaborator | null
}

export interface FileChange {
	file: string
	operation: "insert" | "delete" | "replace"
	position: { line: number; column: number }
	content?: string
	length?: number
	timestamp: number
	peerId: string
}

type StateChangeCallback = (state: CollaborationState) => void
type CollaboratorsChangeCallback = (peers: Collaborator[]) => void
type FileChangeCallback = (change: FileChange) => void

// ============================================================
// Collaboration colors (for cursors)
// ============================================================

const PEER_COLORS = [
	"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
	"#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
	"#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA",
]

function getRandomColor(): string {
	return PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)]
}

// ============================================================
// Simple WebSocket implementation (RFC 6455)
// ============================================================

interface WebSocketConnection {
	id: string
	send: (data: string) => void
	close: () => void
}

function generateAcceptKey(key: string): string {
	const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
	return crypto.createHash("sha1").update(key + GUID).digest("base64")
}

function sendWebSocketFrame(socket: Duplex, data: string): void {
	const payload = Buffer.from(data)

	let header: Buffer
	if (payload.length < 126) {
		header = Buffer.alloc(2)
		header[0] = 0x81 // FIN + text frame
		header[1] = payload.length // No mask bit (server-to-client)
	} else if (payload.length < 65536) {
		header = Buffer.alloc(4)
		header[0] = 0x81
		header[1] = 126
		header.writeUInt16BE(payload.length, 2)
	} else {
		header = Buffer.alloc(10)
		header[0] = 0x81
		header[1] = 127
		header.writeBigUInt64BE(BigInt(payload.length), 2)
	}

	try {
		const frame = Buffer.concat([header, payload])
		socket.write(frame)
	} catch { /* ignore */ }
}

/**
 * Parse an incoming WebSocket frame from client data.
 * Returns the decoded payload string, or null if incomplete/invalid.
 */
function parseWebSocketFrame(buffer: Buffer): { payload: string; bytesUsed: number } | null {
	if (buffer.length < 2) return null

	const firstByte = buffer[0]
	const secondByte = buffer[1]
	const opcode = firstByte & 0x0f
	const isMasked = (secondByte & 0x80) !== 0
	let payloadLength = secondByte & 0x7f
	let offset = 2

	// Only handle text frames (opcode 1) and close frames (opcode 8)
	if (opcode !== 1 && opcode !== 8) return null

	if (payloadLength === 126) {
		if (buffer.length < 4) return null
		payloadLength = buffer.readUInt16BE(2)
		offset = 4
	} else if (payloadLength === 127) {
		if (buffer.length < 10) return null
		payloadLength = Number(buffer.readBigUInt64BE(2))
		offset = 10
	}

	// Handle close frame
	if (opcode === 8) {
		return { payload: "", bytesUsed: offset }
	}

	const totalFrameLength = offset + (isMasked ? 4 : 0) + payloadLength
	if (buffer.length < totalFrameLength) return null

	let maskKey: Buffer | null = null
	if (isMasked) {
		maskKey = buffer.subarray(offset, offset + 4)
		offset += 4
	}

	const payload = buffer.subarray(offset, offset + payloadLength)

	// Unmask if needed
	if (isMasked && maskKey) {
		for (let i = 0; i < payload.length; i++) {
			payload[i] = payload[i]! ^ maskKey[i % 4]!
		}
	}

	return {
		payload: payload.toString("utf-8"),
		bytesUsed: totalFrameLength,
	}
}

// ============================================================
// Collaboration Manager
// ============================================================

class LiveCollaborationManager {
	private state: CollaborationState = {
		active: false,
		roomId: null,
		peers: [],
		localPeer: null,
	}
	private httpServer: Server | null = null
	private wsConnections = new Map<string, WebSocketConnection>()
	private callbacks = {
		onStateChange: null as StateChangeCallback | null,
		onCollaboratorsChange: null as CollaboratorsChangeCallback | null,
		onFileChange: null as FileChangeCallback | null,
	}

	/**
	 * Start a collaboration session (host mode).
	 */
	async startSession(roomId: string, hostName: string, port: number = 4102): Promise<void> {
		if (this.state.active) {
			log.warn("Collaboration session already active")
			return
		}

		const peerId = `host-${Date.now().toString(36)}`
		const color = getRandomColor()

		this.state = {
			active: true,
			roomId,
			peers: [],
			localPeer: {
				id: peerId,
				name: hostName,
				color,
				connectedAt: Date.now(),
				lastSeen: Date.now(),
			},
		}

		// Start HTTP server for WebSocket upgrade
		this.httpServer = createServer()

		this.httpServer.on("upgrade", (req: IncomingMessage, socket: Duplex, _head: Buffer) => {
			if (req.url !== "/collab") {
				socket.destroy()
				return
			}

			// WebSocket handshake
			const key = req.headers["sec-websocket-key"] || ""
			const acceptKey = generateAcceptKey(key)

			const headers = [
				"HTTP/1.1 101 Switching Protocols",
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Sec-WebSocket-Accept: ${acceptKey}`,
				"",
				"",
			].join("\r\n")

			socket.write(headers)

			const wsId = `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
			const ws: WebSocketConnection = {
				id: wsId,
				send: (data: string) => sendWebSocketFrame(socket, data),
				close: () => {
					try { socket.end() } catch { /* ignore */ }
				},
			}

			this.wsConnections.set(wsId, ws)
			log.info("New collaborator connected", { wsId })

			// Send welcome message
			ws.send(JSON.stringify({
				type: "welcome",
				roomId,
				peerId: wsId,
				peers: this.state.peers,
			}))

			// Broadcast peer joined
			this.broadcast({
				type: "peer-joined",
				peer: {
					id: wsId,
					name: `Peer ${this.wsConnections.size}`,
					color: getRandomColor(),
					connectedAt: Date.now(),
					lastSeen: Date.now(),
				},
			}, ws)

			// Handle incoming WebSocket frames
			let incomingBuffer = Buffer.alloc(0)
			socket.on("data", (chunk: Buffer) => {
				incomingBuffer = Buffer.concat([incomingBuffer, chunk])

				// Process complete frames
				while (incomingBuffer.length > 0) {
					const result = parseWebSocketFrame(incomingBuffer)
					if (!result) break

					incomingBuffer = incomingBuffer.subarray(result.bytesUsed)

					// Handle close frame
					if (result.payload === "") {
						socket.end()
						return
					}

					try {
						const parsed = JSON.parse(result.payload)
						this.handleMessage(wsId, parsed)
					} catch {
						// Not valid JSON, ignore
					}
				}
			})

			socket.on("close", () => {
				this.wsConnections.delete(wsId)
				this.state.peers = this.state.peers.filter((p) => p.id !== wsId)
				this.broadcast({ type: "peer-left", peerId: wsId })
				this.notifyStateChange()
				log.info("Collaborator disconnected", { wsId })
			})
		})

		this.httpServer.listen(port)
		this.notifyStateChange()
		log.info("Collaboration session started", { roomId, peerId, port })
	}

	/**
	 * Leave the current collaboration session.
	 */
	leaveSession(): void {
		if (!this.state.active) return

		// Close all client connections
		this.wsConnections.forEach((ws) => ws.close())
		this.wsConnections.clear()

		// Close server
		this.httpServer?.close()
		this.httpServer = null

		this.state = {
			active: false,
			roomId: null,
			peers: [],
			localPeer: null,
		}

		this.notifyStateChange()
		log.info("Left collaboration session")
	}

	/**
	 * Broadcast local cursor position to all peers.
	 */
	broadcastCursor(file: string, line: number, column: number): void {
		if (!this.state.localPeer) return

		this.broadcast({
			type: "cursor-update",
			peerId: this.state.localPeer.id,
			cursor: { file, line, column },
		})
	}

	/**
	 * Broadcast local selection range to all peers.
	 */
	broadcastSelection(file: string, startLine: number, startColumn: number, endLine: number, endColumn: number): void {
		if (!this.state.localPeer) return

		this.broadcast({
			type: "selection-update",
			peerId: this.state.localPeer.id,
			selection: { file, startLine, startColumn, endLine, endColumn },
		})
	}

	/**
	 * Broadcast a file change to all peers.
	 */
	broadcastFileChange(change: Omit<FileChange, "timestamp" | "peerId">): void {
		if (!this.state.localPeer) return

		const fullChange: FileChange = {
			...change,
			timestamp: Date.now(),
			peerId: this.state.localPeer.id,
		}

		this.broadcast({
			type: "file-change",
			change: fullChange,
		})
	}

	/**
	 * Get current state.
	 */
	getState(): CollaborationState {
		return { ...this.state }
	}

	/**
	 * Subscribe to state changes.
	 */
	onStateChange(callback: StateChangeCallback): void {
		this.callbacks.onStateChange = callback
	}

	/**
	 * Subscribe to collaborator changes.
	 */
	onCollaboratorsChange(callback: CollaboratorsChangeCallback): void {
		this.callbacks.onCollaboratorsChange = callback
	}

	/**
	 * Subscribe to file changes from peers.
	 */
	onFileChange(callback: FileChangeCallback): void {
		this.callbacks.onFileChange = callback
	}

	// --- Private ---

	private handleMessage(peerId: string, msg: Record<string, unknown>): void {
		switch (msg.type) {
			case "cursor-update": {
				const peer = this.state.peers.find((p) => p.id === peerId)
				if (peer) {
					peer.cursor = msg.cursor as CursorPosition
					peer.lastSeen = Date.now()
					this.broadcast({ ...msg, peerId }, this.wsConnections.get(peerId))
				}
				break
			}
			case "selection-update": {
				const peer = this.state.peers.find((p) => p.id === peerId)
				if (peer) {
					peer.selection = msg.selection as SelectionRange
					peer.lastSeen = Date.now()
					this.broadcast({ ...msg, peerId }, this.wsConnections.get(peerId))
				}
				break
			}
			case "file-change": {
				const change = msg.change as FileChange
				change.peerId = peerId
				change.timestamp = Date.now()
				this.callbacks.onFileChange?.(change)
				this.broadcast({ ...msg, peerId }, this.wsConnections.get(peerId))
				break
			}
			default:
				log.warn("Unknown message type", { type: msg.type })
		}
	}

	private broadcast(msg: Record<string, unknown>, exclude?: WebSocketConnection): void {
		const data = JSON.stringify(msg)
		this.wsConnections.forEach((ws) => {
			if (ws !== exclude) {
				ws.send(data)
			}
		})
	}

	private notifyStateChange(): void {
		this.callbacks.onStateChange?.({ ...this.state })
		this.callbacks.onCollaboratorsChange?.(this.state.peers)
	}
}

// ============================================================
// Singleton
// ============================================================

let collabManager: LiveCollaborationManager | null = null

export function getCollaborationManager(): LiveCollaborationManager {
	if (!collabManager) {
		collabManager = new LiveCollaborationManager()
	}
	return collabManager
}

export function getCollaborationState(): CollaborationState {
	return collabManager?.getState() ?? {
		active: false,
		roomId: null,
		peers: [],
		localPeer: null,
	}
}
