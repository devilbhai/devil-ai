/**
 * Devil AI File Automation
 *
 * Advanced file management, organization, and automation
 */

import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

export interface FileRule {
	name: string
	pattern: RegExp
	destination: string
	action: "move" | "copy" | "rename" | "delete"
	enabled: boolean
}

export interface FileOperation {
	id: string
	type: "organize" | "backup" | "cleanup" | "search" | "sync"
	source: string
	destination?: string
	status: "pending" | "running" | "completed" | "failed"
	result?: string
	error?: string
	timestamp: Date
}

export interface FileStats {
	totalFiles: number
	totalSize: number
	byType: Record<string, number>
	byAge: Record<string, number>
}

export class FileAutomation {
	private rules: FileRule[] = []
	private operations: Map<string, FileOperation> = new Map()
	private watchedPaths: Map<string, fs.FSWatcher> = new Map()

	constructor() {
		this.initDefaultRules()
	}

	/**
	 * Initialize default file organization rules
	 */
	private initDefaultRules(): void {
		this.rules = [
			{
				name: "Documents",
				pattern: /\.(pdf|doc|docx|txt|rtf|odt)$/i,
				destination: "~/Documents",
				action: "move",
				enabled: true,
			},
			{
				name: "Images",
				pattern: /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i,
				destination: "~/Pictures",
				action: "move",
				enabled: true,
			},
			{
				name: "Videos",
				pattern: /\.(mp4|avi|mkv|mov|wmv|flv)$/i,
				destination: "~/Movies",
				action: "move",
				enabled: true,
			},
			{
				name: "Music",
				pattern: /\.(mp3|wav|flac|aac|ogg|m4a)$/i,
				destination: "~/Music",
				action: "move",
				enabled: true,
			},
			{
				name: "Archives",
				pattern: /\.(zip|rar|7z|tar|gz)$/i,
				destination: "~/Downloads/Archives",
				action: "move",
				enabled: true,
			},
			{
				name: "Code",
				pattern: /\.(js|ts|py|java|cpp|html|css|json)$/i,
				destination: "~/Code",
				action: "move",
				enabled: false,
			},
		]
	}

	/**
	 * Organize files in a directory
	 */
	async organizeDirectory(directory: string): Promise<FileOperation> {
		const operationId = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

		const operation: FileOperation = {
			id: operationId,
			type: "organize",
			source: directory,
			status: "running",
			timestamp: new Date(),
		}

		this.operations.set(operationId, operation)

		try {
			const files = await this.readDirectory(directory)
			let movedCount = 0
			let errorCount = 0

			for (const file of files) {
				const filePath = path.join(directory, file)
				const stat = await this.getFileStat(filePath)

				if (!stat.isFile()) continue

				for (const rule of this.rules) {
					if (!rule.enabled) continue

					if (rule.pattern.test(file)) {
						try {
							await this.applyRule(filePath, file, rule)
							movedCount++
						} catch (err) {
							errorCount++
							console.error(`Failed to apply rule ${rule.name} to ${file}:`, err)
						}
						break
					}
				}
			}

			operation.status = "completed"
			operation.result = `Organized ${movedCount} files, ${errorCount} errors`
		} catch (err) {
			operation.status = "failed"
			operation.error = err instanceof Error ? err.message : "Unknown error"
		}

		return operation
	}

	/**
	 * Apply a file rule
	 */
	private async applyRule(filePath: string, fileName: string, rule: FileRule): Promise<void> {
		const destinationDir = rule.destination.replace("~", os.homedir())

		// Create destination directory if it doesn't exist
		if (!fs.existsSync(destinationDir)) {
			fs.mkdirSync(destinationDir, { recursive: true })
		}

		const destinationPath = path.join(destinationDir, fileName)

		switch (rule.action) {
			case "move":
				await this.moveFile(filePath, destinationPath)
				break
			case "copy":
				await this.copyFile(filePath, destinationPath)
				break
			case "rename": {
				const newName = this.generateNewName(fileName, rule.name)
				await this.moveFile(filePath, path.join(path.dirname(filePath), newName))
				break
			}
			case "delete":
				await this.deleteFile(filePath)
				break
		}
	}

	/**
	 * Move file
	 */
	private async moveFile(source: string, destination: string): Promise<void> {
		return new Promise((resolve, reject) => {
			fs.rename(source, destination, (err) => {
				if (err) reject(err)
				else resolve()
			})
		})
	}

	/**
	 * Copy file
	 */
	private async copyFile(source: string, destination: string): Promise<void> {
		return new Promise((resolve, reject) => {
			fs.copyFile(source, destination, (err) => {
				if (err) reject(err)
				else resolve()
			})
		})
	}

	/**
	 * Delete file
	 */
	private async deleteFile(filePath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			fs.unlink(filePath, (err) => {
				if (err) reject(err)
				else resolve()
			})
		})
	}

	/**
	 * Generate new filename
	 */
	private generateNewName(originalName: string, category: string): string {
		const timestamp = Date.now()
		const ext = path.extname(originalName)
		const baseName = path.basename(originalName, ext)
		return `${category}_${timestamp}_${baseName}${ext}`
	}

	/**
	 * Read directory contents
	 */
	private async readDirectory(directory: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			fs.readdir(directory, (err, files) => {
				if (err) reject(err)
				else resolve(files)
			})
		})
	}

	/**
	 * Get file stats
	 */
	private async getFileStat(filePath: string): Promise<fs.Stats> {
		return new Promise((resolve, reject) => {
			fs.stat(filePath, (err, stat) => {
				if (err) reject(err)
				else resolve(stat)
			})
		})
	}

	/**
	 * Search files by pattern
	 */
	async searchFiles(directory: string, pattern: RegExp): Promise<string[]> {
		const results: string[] = []

		const searchDir = async (dir: string) => {
			const files = await this.readDirectory(dir)

			for (const file of files) {
				const filePath = path.join(dir, file)
				const stat = await this.getFileStat(filePath)

				if (stat.isDirectory()) {
					await searchDir(filePath)
				} else if (pattern.test(file)) {
					results.push(filePath)
				}
			}
		}

		await searchDir(directory)
		return results
	}

	/**
	 * Get file statistics
	 */
	async getFileStats(directory: string): Promise<FileStats> {
		const stats: FileStats = {
			totalFiles: 0,
			totalSize: 0,
			byType: {},
			byAge: {},
		}

		const analyzeDir = async (dir: string) => {
			const files = await this.readDirectory(dir)

			for (const file of files) {
				const filePath = path.join(dir, file)
				const stat = await this.getFileStat(filePath)

				if (stat.isDirectory()) {
					await analyzeDir(filePath)
				} else {
					stats.totalFiles++
					stats.totalSize += stat.size

					const ext = path.extname(file).toLowerCase()
					stats.byType[ext] = (stats.byType[ext] || 0) + 1

					const age = this.getFileAge(stat.mtime)
					stats.byAge[age] = (stats.byAge[age] || 0) + 1
				}
			}
		}

		await analyzeDir(directory)
		return stats
	}

	/**
	 * Get file age category
	 */
	private getFileAge(mtime: Date): string {
		const now = new Date()
		const diff = now.getTime() - mtime.getTime()
		const days = diff / (1000 * 60 * 60 * 24)

		if (days < 7) return "week"
		if (days < 30) return "month"
		if (days < 365) return "year"
		return "older"
	}

	/**
	 * Watch directory for changes
	 */
	watchDirectory(directory: string, callback: (event: string, filename: string) => void): void {
		const watcher = fs.watch(directory, (event, filename) => {
			if (filename) {
				callback(event, filename)
			}
		})

		this.watchedPaths.set(directory, watcher)
	}

	/**
	 * Stop watching directory
	 */
	stopWatching(directory: string): void {
		const watcher = this.watchedPaths.get(directory)
		if (watcher) {
			watcher.close()
			this.watchedPaths.delete(directory)
		}
	}

	/**
	 * Add custom rule
	 */
	addRule(rule: FileRule): void {
		this.rules.push(rule)
	}

	/**
	 * Remove rule
	 */
	removeRule(name: string): void {
		this.rules = this.rules.filter((r) => r.name !== name)
	}

	/**
	 * Get all rules
	 */
	getRules(): FileRule[] {
		return [...this.rules]
	}

	/**
	 * Get operation history
	 */
	getOperations(): FileOperation[] {
		return Array.from(this.operations.values())
	}

	/**
	 * Backup directory
	 */
	async backupDirectory(source: string, destination: string): Promise<FileOperation> {
		const operationId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

		const operation: FileOperation = {
			id: operationId,
			type: "backup",
			source,
			destination,
			status: "running",
			timestamp: new Date(),
		}

		this.operations.set(operationId, operation)

		try {
			// Create backup directory with timestamp
			const backupDir = `${destination}_backup_${Date.now()}`
			await this.copyDirectory(source, backupDir)

			operation.status = "completed"
			operation.result = `Backup created at ${backupDir}`
		} catch (err) {
			operation.status = "failed"
			operation.error = err instanceof Error ? err.message : "Unknown error"
		}

		return operation
	}

	/**
	 * Copy directory recursively
	 */
	private async copyDirectory(source: string, destination: string): Promise<void> {
		await fs.promises.mkdir(destination, { recursive: true })

		const files = await this.readDirectory(source)

		for (const file of files) {
			const sourcePath = path.join(source, file)
			const destPath = path.join(destination, file)

			const stat = await this.getFileStat(sourcePath)

			if (stat.isDirectory()) {
				await this.copyDirectory(sourcePath, destPath)
			} else {
				await this.copyFile(sourcePath, destPath)
			}
		}
	}
}

export default FileAutomation
