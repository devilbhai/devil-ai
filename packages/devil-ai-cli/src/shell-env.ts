import { execFile } from "node:child_process"
import { createLogger } from "./logger.js"

const log = createLogger("shell-env")

let resolved = false
let resolvePromise: Promise<void> | null = null

export function waitForEnv(): Promise<void> {
	if (resolved) return Promise.resolve()
	if (resolvePromise) return resolvePromise
	resolvePromise = (async () => {
		try {
			await resolveShellEnv()
			resolved = true
		} catch (err) {
			log.warn("Could not resolve shell env, using current", err)
			resolved = true
		}
	})()
	return resolvePromise
}

function resolveShellEnv(): Promise<void> {
	return new Promise((resolve, reject) => {
		const shell = process.platform === "win32" ? "cmd.exe" : "bash"
		const shellArgs =
			process.platform === "win32" ? ["/c", "echo %PATH%"] : ["-l", "-c", "echo $PATH"]
		const timeout = 5000

		const child = execFile(
			shell,
			shellArgs,
			{ timeout, encoding: "utf-8", env: process.env },
			(err, stdout) => {
				if (err) {
					reject(err)
					return
				}
				const extraPath = stdout?.trim()
				if (extraPath) {
					const sep = process.platform === "win32" ? ";" : ":"
					process.env.PATH = `${extraPath}${sep}${process.env.PATH ?? ""}`
					log.debug("Shell PATH resolved")
				}
				resolve()
			},
		)

		child.on("error", reject)
	})
}
