import { exec } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import os from "node:os"
import crypto from "node:crypto"

export interface ExecutionResult {
	stdout: string
	stderr: string
	exitCode: number
	duration: number
}

const TIMEOUT_MS = 10000 // 10 seconds

export async function executeInSandbox(code: string, language: string): Promise<ExecutionResult> {
	const startTime = Date.now()
	const sandboxId = crypto.randomBytes(8).toString("hex")
	const sandboxDir = path.join(os.tmpdir(), `devil-ai-sandbox-${sandboxId}`)

	try {
		await fs.mkdir(sandboxDir, { recursive: true })

		let command = ""
		let filename = ""

		switch (language) {
			case "javascript":
				filename = "index.js"
				command = `node ${filename}`
				break
			case "typescript":
				filename = "index.ts"
				// Note: Requires ts-node or bun/tsx in the environment. We'll try npx tsx.
				command = `npx tsx ${filename}`
				break
			case "python":
				filename = "main.py"
				// Try python3 first, fallback to python is handled by shell if python3 isn't available
				command = `python3 ${filename} || python ${filename}`
				break
			case "bash":
				filename = "script.sh"
				command = `bash ${filename}`
				break
			default:
				throw new Error(`Unsupported language: ${language}`)
		}

		const filePath = path.join(sandboxDir, filename)
		await fs.writeFile(filePath, code, "utf-8")

		return await new Promise<ExecutionResult>((resolve) => {
			exec(
				command,
				{
					cwd: sandboxDir,
					timeout: TIMEOUT_MS,
					maxBuffer: 1024 * 1024 * 5, // 5MB limit
				},
				(error, stdout, stderr) => {
					let exitCode = 0
					if (error) {
						exitCode = error.code ?? 1
						if (error.killed) {
							stderr += "\n\nError: Execution timed out."
						}
					}
					resolve({
						stdout: stdout.toString(),
						stderr: stderr.toString(),
						exitCode,
						duration: Date.now() - startTime,
					})
				},
			)
		})
	} catch (err: any) {
		return {
			stdout: "",
			stderr: `Sandbox Error: ${err.message}`,
			exitCode: 1,
			duration: Date.now() - startTime,
		}
	} finally {
		// Cleanup
		try {
			await fs.rm(sandboxDir, { recursive: true, force: true })
		} catch (e) {
			// Ignore cleanup errors
		}
	}
}
