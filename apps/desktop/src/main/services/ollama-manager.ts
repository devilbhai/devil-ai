import { spawn, type ChildProcess } from "child_process"
import { app } from "electron"
import fs from "fs"
import path from "path"
import { createLogger } from "../../renderer/lib/logger"

const log = createLogger("ollama-manager")

export class OllamaManager {
	private static instance: OllamaManager
	private ollamaProcess: ChildProcess | null = null
	private ollamaDir: string
	private ollamaBinary: string

	private constructor() {
		// Use a hidden directory in the user's appData or home
		this.ollamaDir = path.join(app.getPath("userData"), "bin")
		this.ollamaBinary = path.join(
			this.ollamaDir,
			process.platform === "win32" ? "ollama.exe" : "ollama",
		)
	}

	public static getInstance(): OllamaManager {
		if (!OllamaManager.instance) {
			OllamaManager.instance = new OllamaManager()
		}
		return OllamaManager.instance
	}

	public isInstalled(): boolean {
		return fs.existsSync(this.ollamaBinary)
	}

	public async install(onProgress?: (msg: string) => void): Promise<void> {
		if (this.isInstalled()) {
			if (onProgress) onProgress("Ollama is already installed.\n")
			return
		}

		if (!fs.existsSync(this.ollamaDir)) {
			fs.mkdirSync(this.ollamaDir, { recursive: true })
		}

		if (process.platform === "darwin") {
			if (onProgress) onProgress("Downloading Ollama Mac CLI (.tgz) (this may take a minute)...\n")
			const tarPath = path.join(this.ollamaDir, "ollama.tgz")
			await this.runCommand(
				`curl -sL https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz -o "${tarPath}"`,
				[],
				undefined,
			)
			if (onProgress) onProgress("Extracting Ollama...\n")
			await this.runCommand(
				`tar -xzf "${tarPath}" -C "${this.ollamaDir}"`,
				[],
				onProgress,
			)
			if (fs.existsSync(tarPath)) {
				fs.unlinkSync(tarPath)
			}
			fs.chmodSync(this.ollamaBinary, 0o755)
		} else if (process.platform === "linux") {
			if (onProgress) onProgress("Downloading Ollama Linux CLI (this may take a minute)...\n")
			await this.runCommand(
				`curl -sL https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64 -o "${this.ollamaBinary}"`,
				[],
				undefined,
			)
			fs.chmodSync(this.ollamaBinary, 0o755)
		} else if (process.platform === "win32") {
			if (onProgress) onProgress("Downloading Ollama Windows CLI (this may take a minute)...\n")
			const zipPath = path.join(this.ollamaDir, "ollama.zip")
			await this.runCommand(
				`curl -sL https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip -o "${zipPath}"`,
				[],
				undefined,
			)
			if (onProgress) onProgress("Extracting Ollama Windows CLI...\n")
			await this.runCommand(
				`powershell -command "Expand-Archive -Force '${zipPath}' '${this.ollamaDir}'"`,
				[],
				onProgress,
			)
			if (fs.existsSync(zipPath)) {
				fs.unlinkSync(zipPath)
			}
		} else {
			throw new Error("Unsupported platform for auto-installing Ollama.")
		}

		if (onProgress) onProgress("Ollama CLI installed successfully.\n")
	}

	public async start(): Promise<void> {
		if (!this.isInstalled()) {
			throw new Error("Ollama is not installed. Please install it first.")
		}

		if (this.ollamaProcess) {
			log.info("Ollama is already running in the background.")
			return
		}

		log.info("Starting Ollama background process...")
		
		// Set OLLAMA_HOST to explicitly bind to localhost
		this.ollamaProcess = spawn(`"${this.ollamaBinary}"`, ["serve"], {
			env: { ...process.env, OLLAMA_HOST: "127.0.0.1:11434" },
			detached: false, // We want it to die when the app dies
			windowsHide: true,
			shell: true
		})

		this.ollamaProcess.stdout?.on("data", (data) => {
			log.info(`[Ollama] ${data.toString().trim()}`)
		})

		this.ollamaProcess.stderr?.on("data", (data) => {
			log.info(`[Ollama] ${data.toString().trim()}`)
		})

		this.ollamaProcess.on("close", (code) => {
			log.info(`Ollama process exited with code ${code}`)
			this.ollamaProcess = null
		})

		// Wait for API to be ready
		for (let i = 0; i < 30; i++) {
			try {
				const res = await fetch("http://127.0.0.1:11434/")
				if (res.ok) {
					log.info("Ollama background service is ready.")
					return
				}
			} catch (e) {
				// Ignore
			}
			await new Promise((r) => setTimeout(r, 1000))
		}
		throw new Error("Ollama service did not start in time.")
	}

	public async stop(): Promise<void> {
		if (this.ollamaProcess) {
			log.info("Stopping Ollama background process...")
			this.ollamaProcess.kill()
			this.ollamaProcess = null
		}
	}

	public async pullModel(model: string, onProgress?: (msg: string) => void): Promise<void> {
		if (!this.isInstalled()) throw new Error("Ollama is not installed.")
		
		if (onProgress) onProgress(`Pulling ${model} in background (this may take a few minutes)...\n`)
		// Run without onProgress to prevent \r spam from breaking the UI
		await this.runCommand(`"${this.ollamaBinary}"`, ["pull", model])
		if (onProgress) onProgress(`Successfully pulled ${model}.\n`)
	}

	public async listModels(): Promise<string[]> {
		try {
			const res = await fetch("http://127.0.0.1:11434/api/tags")
			if (!res.ok) return []
			const data = await res.json()
			return data.models?.map((m: any) => m.name) || []
		} catch {
			return []
		}
	}

	private runCommand(command: string, args: string[], onProgress?: (text: string) => void): Promise<void> {
		return new Promise((resolve, reject) => {
			// If args is provided, command is just the executable
			const child = args.length > 0 
				? spawn(command, args, { shell: true })
				: spawn(command, [], { shell: true })
				
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
}
