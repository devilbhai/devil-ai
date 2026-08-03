import { spawn } from "child_process"
import fs from "fs"

function runCommand(command: string, args: string[], onProgress?: (text: string) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { shell: true })
		
		child.stdout.on("data", (data) => {
			if (onProgress) onProgress(data.toString())
		})
		
		child.stderr.on("data", (data) => {
			if (onProgress) onProgress(data.toString())
		})
		
		child.on("close", (code) => {
			if (code === 0) resolve()
			else reject(new Error(`Command failed with code ${code}`))
		})
		
		child.on("error", (err) => reject(err))
	})
}

export async function installLocalEngine(engine: string, onProgress?: (text: string) => void): Promise<void> {
	if (engine !== "ollama") {
		throw new Error(`Engine ${engine} is not currently supported for auto-install.`)
	}

	try {
		if (process.platform === "darwin") {
			const isInstalled = fs.existsSync("/Applications/Ollama.app")
			
			if (!isInstalled) {
				if (onProgress) onProgress("Downloading Ollama for macOS (approx 150MB)...\n")
				await runCommand("curl -# -L https://ollama.com/download/Ollama-darwin.zip -o /tmp/Ollama.zip", [], onProgress)
				
				if (onProgress) onProgress("\nExtracting Ollama...\n")
				await runCommand("unzip -q -o /tmp/Ollama.zip -d /Applications", [], onProgress)
				
				if (onProgress) onProgress("Cleaning up...\n")
				await runCommand("rm -f /tmp/Ollama.zip", [], onProgress)
			}
			
			if (onProgress) onProgress("Starting Ollama background service...\n")
			await runCommand("open -a Ollama", [], onProgress)
			
			// Wait for the service to actually start (polling)
			if (onProgress) onProgress("Waiting for Ollama engine to start (Please allow any Mac security prompts)...\n")
			let ready = false
			for (let i = 0; i < 30; i++) {
				try {
					const res = await fetch("http://127.0.0.1:11434/")
					if (res.ok) { ready = true; break }
				} catch (e) {
					// ignore
				}
				await new Promise(r => setTimeout(r, 1000))
			}
			
			if (!ready) {
				throw new Error("Ollama service did not start in time. Please open it manually from your Applications folder.")
			}
			
			if (onProgress) onProgress("Removing old models to save space...\n")
			await runCommand("/Applications/Ollama.app/Contents/Resources/ollama rm qwen2.5-coder:3b || true", [], onProgress)
			
			if (onProgress) onProgress("Pulling Llama 3.2 (3B) (Fast offline agentic model)...\n")
			// Use the bundled CLI since /usr/local/bin/ollama might not be symlinked yet
			await runCommand("/Applications/Ollama.app/Contents/Resources/ollama pull llama3.2", [], onProgress)
			
		} else {
			// Linux
			if (onProgress) onProgress("Downloading and installing Ollama for Linux...\n")
			await runCommand("curl -fsSL https://ollama.com/install.sh | sh", [], onProgress)
			
			if (onProgress) onProgress("\nRemoving old models...\n")
			await runCommand("ollama rm qwen2.5-coder:3b || true", [], onProgress)
			
			if (onProgress) onProgress("\nPulling Llama 3.2 (3B) model...\n")
			await runCommand("ollama pull llama3.2", [], onProgress)
		}
		
		// Register Ollama provider with engine server automatically
		try {
			// Fetch models from Ollama first to populate config
			let ollamaModels: any = {}
			try {
				const res = await fetch("http://127.0.0.1:11434/api/tags")
				if (res.ok) {
					const data = await res.json()
					if (data.models && Array.isArray(data.models)) {
						for (const m of data.models) {
							ollamaModels[m.name] = {
								_launch: true,
								name: m.name,
								tool_call: true
							}
						}
					}
				}
			} catch (err) {
				console.warn("Failed to fetch models from Ollama", err)
			}
			
			if (Object.keys(ollamaModels).length === 0) {
				ollamaModels["llama3.2:latest"] = {
					_launch: true,
					name: "llama3.2:latest",
					tool_call: true
				}
			}
			const res = await fetch("http://127.0.0.1:4101/global/config", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: "openai/qwen:4b",
					provider: {
						openai: {
							options: {
								baseURL: "http://127.0.0.1:11434/v1"
							},
							env: ["OPENAI_API_KEY=ollama"],
							models: {
								"qwen:4b": {
									name: "qwen:4b",
									tool_call: true
								}
							}
						}
					}
				})
			})
			if (!res.ok) {
				const text = await res.text()
				throw new Error(`Failed to update config: ${res.status} ${text}`)
			}
			if (onProgress) onProgress("\nSuccessfully linked with engine server!\n")
		} catch (e) {
			console.warn("Failed to update engine config", e)
		}
		
		if (onProgress) onProgress("\nInstallation complete! Devil AI will now detect your local engine.\n")
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to install Ollama: ${msg}`)
	}
}
