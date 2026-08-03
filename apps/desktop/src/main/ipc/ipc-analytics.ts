import { ipcMain } from "electron"
import { getDashboardStats, trackSessionStart, trackSessionEnd } from "../analytics/index"
import { withLogging } from "../ipc/utils"

export function registerAnalyticsIpc() {
	ipcMain.handle(
		"analytics:getDashboardStats",
		withLogging("analytics:getDashboardStats", async () => {
			return getDashboardStats()
		}),
	)

	ipcMain.handle(
		"analytics:trackSessionStart",
		withLogging("analytics:trackSessionStart", async (_, id: string, projectId?: string, modelName?: string) => {
			return trackSessionStart(id, projectId, modelName)
		}),
	)

	ipcMain.handle(
		"analytics:trackSessionEnd",
		withLogging("analytics:trackSessionEnd", async (_, id: string) => {
			return trackSessionEnd(id)
		}),
	)
}
