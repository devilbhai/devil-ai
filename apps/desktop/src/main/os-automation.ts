import { spawn } from "node:child_process"
import { showPcControlBanner, hidePcControlBanner } from "./pc-control-banner"

export interface OSAutomationResult {
	success: boolean
	output?: string
	error?: string
}

/**
 * Executes a native OS automation script (AppleScript on macOS, PowerShell on Windows).
 * Automatically shows the "Devil AI Controlling your PC" banner while executing.
 */
export async function executeOsAutomation(scriptContent: string, platform: "mac" | "win"): Promise<OSAutomationResult> {
	return new Promise((resolve) => {
		showPcControlBanner()

		let command = ""
		let args: string[] = []

		if (platform === "mac") {
			command = "osascript"
			args = ["-e", scriptContent]
		} else {
			command = "powershell"
			args = ["-NoProfile", "-Command", scriptContent]
		}

		const child = spawn(command, args)

		let stdout = ""
		let stderr = ""

		child.stdout.on("data", (data) => {
			stdout += data.toString()
		})

		child.stderr.on("data", (data) => {
			stderr += data.toString()
		})

		child.on("close", (code) => {
			hidePcControlBanner()
			
			if (code === 0) {
				resolve({ success: true, output: stdout.trim() })
			} else {
				resolve({ success: false, error: stderr.trim() || `Process exited with code ${code}` })
			}
		})

		child.on("error", (err) => {
			hidePcControlBanner()
			resolve({ success: false, error: err.message })
		})
	})
}
