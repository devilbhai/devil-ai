export interface BackgroundTask {
	id: string
	description: string
	status: "running" | "completed" | "failed"
	logs: string[]
	createdAt: number
}

const tasks = new Map<string, BackgroundTask>()

export function startTask(description: string): string {
	const id = `task_${Date.now()}`
	tasks.set(id, {
		id,
		description,
		status: "running",
		logs: [],
		createdAt: Date.now()
	})
	return id
}

export function logToTask(id: string, log: string) {
	const task = tasks.get(id)
	if (task) {
		task.logs.push(`[${new Date().toISOString()}] ${log}`)
	}
}

export function endTask(id: string, success: boolean = true) {
	const task = tasks.get(id)
	if (task) {
		task.status = success ? "completed" : "failed"
	}
}

export function getAllTasks(): BackgroundTask[] {
	return Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt)
}
