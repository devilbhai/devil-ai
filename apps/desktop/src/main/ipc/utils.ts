import { net, BrowserWindow } from "electron"
import { createLogger } from "../logger"

const log = createLogger("ipc")

interface SerializedRequest {
	url: string
	method: string
	headers: Record<string, string>
	body: string | null
}

interface SerializedResponse {
	status: number
	statusText: string
	headers: Record<string, string>
	body: string | null
}

const FETCH_PROXY_TIMEOUT_MS = 30_000

const ALLOWED_HOSTS = [
	"127.0.0.1",
	"localhost",
	"opencode.ai",
	"github.com",
	"api.github.com",
]

/**
 * Validates a proxy target URL against an exact allowlist and blocks
 * private / link-local / metadata addresses to prevent SSRF.
 */
function isAllowedFetchTarget(rawUrl: string): boolean {
	let parsed: URL
	try {
		parsed = new URL(rawUrl)
	} catch {
		return false
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return false
	}

	// Reject embedded credentials
	if (parsed.username || parsed.password) {
		return false
	}

	const hostname = parsed.hostname.toLowerCase()

	// Block numeric / private / link-local / metadata hosts.
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname === "[::1]") {
		// Only permit explicit loopback entries from the allowlist.
		return hostname === "127.0.0.1"
	}
	if (hostname.endsWith(".internal") || hostname.endsWith(".local")) {
		return hostname === "localhost"
	}

	const matched = ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
	if (!matched) return false

	// For known hosts, force the canonical scheme (https unless loopback).
	if ((hostname === "127.0.0.1" || hostname === "localhost") && parsed.protocol !== "http:") {
		return false
	}
	if (hostname !== "127.0.0.1" && hostname !== "localhost" && parsed.protocol !== "https:") {
		return false
	}

	return true
}

export async function handleFetchProxy(
	_event: Electron.IpcMainInvokeEvent,
	req: SerializedRequest,
): Promise<SerializedResponse> {
	if (!isAllowedFetchTarget(req.url)) {
		throw new Error(`SSRF Prevention: Blocked fetch to unapproved origin: ${req.url}`)
	}

	log.info("IPC fetch proxy →", { method: req.method, url: req.url })
	const start = Date.now()
	const response = await net.fetch(req.url, {
		method: req.method,
		headers: req.headers,
		body: req.body ?? undefined,
		signal: AbortSignal.timeout(FETCH_PROXY_TIMEOUT_MS),
	})

	const body = await response.text()
	const headers: Record<string, string> = {}
	response.headers.forEach((value, key) => {
		headers[key] = value
	})
	const durationMs = Date.now() - start

	log.info("IPC fetch proxy ←", {
		method: req.method,
		url: req.url,
		status: response.status,
		bodyLength: body.length,
		durationMs,
	})

	return {
		status: response.status,
		statusText: response.statusText,
		headers,
		body,
	}
}

export function withLogging<TArgs extends unknown[], TResult>(
	channel: string,
	handler: (...args: TArgs) => TResult | Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
	return async (...args: TArgs) => {
		const start = Date.now()
		try {
			const result = await handler(...args)
			const durationMs = Date.now() - start
			if (durationMs > 500) {
				log.warn(`Handler "${channel}" slow`, { durationMs })
			}
			return result
		} catch (err) {
			log.error(`Handler "${channel}" failed`, { durationMs: Date.now() - start }, err)
			throw err
		}
	}
}

export function broadcast(channel: string, ...args: unknown[]): void {
	for (const win of BrowserWindow.getAllWindows()) {
		win.webContents.send(channel, ...args)
	}
}
