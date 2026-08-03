/**
 * Proactive Assistant System for Devil AI
 *
 * Anticipates user needs and takes action before being asked
 */

export interface ProactiveTask {
	id: string
	name: string
	description: string
	trigger: "time" | "event" | "condition" | "pattern"
	priority: "low" | "medium" | "high"
	enabled: boolean
	lastRun?: Date
	nextRun?: Date
	execute: () => Promise<any>
}

export interface UserPattern {
	action: string
	frequency: number
	timeOfDay: string[]
	daysOfWeek: number[]
	lastOccurrence: Date
}

export interface SystemAlert {
	type: "info" | "warning" | "error" | "success"
	title: string
	message: string
	action?: string
	timestamp: Date
}

export class ProactiveAssistant {
	private tasks: Map<string, ProactiveTask> = new Map()
	private patterns: Map<string, UserPattern> = new Map()
	private alerts: SystemAlert[] = []
	private monitoring: boolean = false

	constructor() {
		this.initializeDefaultTasks()
	}

	/**
	 * Initialize default proactive tasks
	 */
	private initializeDefaultTasks(): void {
		// File organization reminder
		this.addTask({
			id: "file-organize-reminder",
			name: "File Organization Reminder",
			description: "Remind user to organize downloads folder",
			trigger: "time",
			priority: "medium",
			enabled: true,
			execute: async () => {
				return {
					type: "reminder",
					message: "Your downloads folder has 15+ files. Would you like me to organize them?",
					action: "organize-downloads",
				}
			},
		})

		// System health check
		this.addTask({
			id: "system-health",
			name: "System Health Check",
			description: "Monitor system resources and alert if needed",
			trigger: "time",
			priority: "low",
			enabled: true,
			execute: async () => {
				// Simulate system check
				return {
					type: "info",
					message: "System running smoothly. CPU: 23%, Memory: 45%",
					data: { cpu: 23, memory: 45 },
				}
			},
		})

		// Backup reminder
		this.addTask({
			id: "backup-reminder",
			name: "Backup Reminder",
			description: "Remind user to backup important files",
			trigger: "time",
			priority: "high",
			enabled: true,
			execute: async () => {
				return {
					type: "reminder",
					message:
						"It's been 7 days since your last backup. Would you like me to backup your documents?",
					action: "backup-documents",
				}
			},
		})

		// Morning briefing
		this.addTask({
			id: "morning-briefing",
			name: "Morning Briefing",
			description: "Provide daily briefing at start of day",
			trigger: "time",
			priority: "medium",
			enabled: true,
			execute: async () => {
				return {
					type: "briefing",
					message:
						"Good morning! Here's your daily briefing:\n• 3 meetings today\n• 5 emails need response\n• Weather: 72°F, sunny\n• System: All operational",
					data: {
						meetings: 3,
						emails: 5,
						weather: "72°F, sunny",
						systemStatus: "operational",
					},
				}
			},
		})
	}

	/**
	 * Add proactive task
	 */
	addTask(task: ProactiveTask): void {
		this.tasks.set(task.id, task)
	}

	/**
	 * Remove task
	 */
	removeTask(taskId: string): void {
		this.tasks.delete(taskId)
	}

	/**
	 * Enable/disable task
	 */
	toggleTask(taskId: string, enabled: boolean): void {
		const task = this.tasks.get(taskId)
		if (task) {
			task.enabled = enabled
		}
	}

	/**
	 * Learn user pattern
	 */
	learnPattern(action: string, _context: any): void {
		const existing = this.patterns.get(action)

		if (existing) {
			existing.frequency++
			existing.lastOccurrence = new Date()

			// Update time patterns
			const hour = new Date().getHours()
			const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
			if (!existing.timeOfDay.includes(timeOfDay)) {
				existing.timeOfDay.push(timeOfDay)
			}

			// Update day patterns
			const dayOfWeek = new Date().getDay()
			if (!existing.daysOfWeek.includes(dayOfWeek)) {
				existing.daysOfWeek.push(dayOfWeek)
			}
		} else {
			const hour = new Date().getHours()
			const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
			const dayOfWeek = new Date().getDay()

			this.patterns.set(action, {
				action,
				frequency: 1,
				timeOfDay: [timeOfDay],
				daysOfWeek: [dayOfWeek],
				lastOccurrence: new Date(),
			})
		}
	}

	/**
	 * Predict next action
	 */
	predictNextAction(): string | null {
		const now = new Date()
		const hour = now.getHours()
		const dayOfWeek = now.getDay()

		const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

		let bestMatch: UserPattern | null = null
		let bestScore = 0

		for (const pattern of this.patterns.values()) {
			let score = 0

			// Time match
			if (pattern.timeOfDay.includes(timeOfDay)) {
				score += 3
			}

			// Day match
			if (pattern.daysOfWeek.includes(dayOfWeek)) {
				score += 2
			}

			// Frequency weight
			score += pattern.frequency * 0.5

			// Recency weight
			const hoursSinceLastUse =
				(now.getTime() - pattern.lastOccurrence.getTime()) / (1000 * 60 * 60)
			if (hoursSinceLastUse < 24) {
				score += 2
			}

			if (score > bestScore) {
				bestScore = score
				bestMatch = pattern
			}
		}

		return bestMatch && bestScore > 5 ? bestMatch.action : null
	}

	/**
	 * Check for proactive actions
	 */
	async checkProactiveActions(): Promise<SystemAlert[]> {
		const alerts: SystemAlert[] = []

		// Check tasks
		for (const task of this.tasks.values()) {
			if (task.enabled && this.shouldRunTask(task)) {
				try {
					const result = await task.execute()
					alerts.push({
						type: result.type || "info",
						title: task.name,
						message: result.message,
						action: result.action,
						timestamp: new Date(),
					})

					task.lastRun = new Date()
				} catch (error) {
					alerts.push({
						type: "error",
						title: "Task Error",
						message: `Failed to run ${task.name}: ${error}`,
						timestamp: new Date(),
					})
				}
			}
		}

		// Check predictions
		const predictedAction = this.predictNextAction()
		if (predictedAction) {
			alerts.push({
				type: "info",
				title: "Predicted Action",
				message: `Based on your patterns, you might want to ${predictedAction}`,
				action: predictedAction,
				timestamp: new Date(),
			})
		}

		this.alerts.push(...alerts)
		return alerts
	}

	/**
	 * Should run task
	 */
	private shouldRunTask(task: ProactiveTask): boolean {
		const now = new Date()

		if (!task.lastRun) {
			return true
		}

		const hoursSinceLastRun = (now.getTime() - task.lastRun.getTime()) / (1000 * 60 * 60)

		// Different intervals based on priority
		switch (task.priority) {
			case "high":
				return hoursSinceLastRun >= 1 // Every hour
			case "medium":
				return hoursSinceLastRun >= 4 // Every 4 hours
			case "low":
				return hoursSinceLastRun >= 24 // Daily
			default:
				return false
		}
	}

	/**
	 * Start monitoring
	 */
	startMonitoring(intervalMs: number = 60000): void {
		this.monitoring = true

		setInterval(async () => {
			if (this.monitoring) {
				await this.checkProactiveActions()
			}
		}, intervalMs)
	}

	/**
	 * Stop monitoring
	 */
	stopMonitoring(): void {
		this.monitoring = false
	}

	/**
	 * Get recent alerts
	 */
	getRecentAlerts(limit: number = 10): SystemAlert[] {
		return this.alerts.slice(-limit)
	}

	/**
	 * Clear alerts
	 */
	clearAlerts(): void {
		this.alerts = []
	}

	/**
	 * Get user patterns
	 */
	getUserPatterns(): UserPattern[] {
		return Array.from(this.patterns.values())
	}

	/**
	 * Get task list
	 */
	getTasks(): ProactiveTask[] {
		return Array.from(this.tasks.values())
	}
}

export default ProactiveAssistant
