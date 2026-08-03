/**
 * Lightweight tagged logger for the Electron main process.
 *
 * Usage:
 *   const log = createLogger("opencode-manager")
 *   log.info("Server started", { url, pid })
 *   log.error("Spawn failed", err)
 */

export interface Logger {
	debug: (...args: unknown[]) => void
	info: (...args: unknown[]) => void
	warn: (...args: unknown[]) => void
	error: (...args: unknown[]) => void
}

function safeLog(fn: (...args: unknown[]) => void, tag: string, ...args: unknown[]) {
	try {
		fn(tag, ...args)
	} catch (err: unknown) {
		// Ignore EPIPE errors when pipe is closed
		if (err instanceof Error && (err.message.includes("EPIPE") || err.message.includes("write"))) {
			return
		}
		// Don't re-throw logging errors
	}
}

export function createLogger(module: string): Logger {
	const tag = `[main:${module}]`
	return {
		debug: (...args: unknown[]) => safeLog(console.debug, tag, ...args),
		info: (...args: unknown[]) => safeLog(console.log, tag, ...args),
		warn: (...args: unknown[]) => safeLog(console.warn, tag, ...args),
		error: (...args: unknown[]) => safeLog(console.error, tag, ...args),
	}
}
