import { execSync } from "node:child_process"
import os from "node:os"

try {
	const port = process.argv[2]
	if (!port) process.exit(0)

	if (os.platform() === "win32") {
		const out = execSync(`netstat -ano | findstr :${port}`).toString()
		const lines = out.trim().split("\n")
		for (const line of lines) {
			const parts = line.trim().split(/\s+/)
			const pid = parts[parts.length - 1]
			if (pid && pid !== "0") {
				try {
					execSync(`taskkill /F /PID ${pid}`)
				} catch (_e) {}
			}
		}
	} else {
		try {
			const pid = execSync(`lsof -t -i:${port}`).toString().trim()
			if (pid) {
				execSync(`kill -9 ${pid}`)
			}
		} catch (_e) {
			// lsof returns 1 if no process found
		}
	}
} catch (_e) {
	// ignore
}
