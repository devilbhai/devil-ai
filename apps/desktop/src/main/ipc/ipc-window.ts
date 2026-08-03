import { ipcMain } from "electron"
import { createWindow } from "../index"
import { withLogging } from "../ipc/utils"

export function registerWindowIpc() {
	ipcMain.handle(
		"window:open",
		withLogging("window:open", async (_, route: string) => {
			await createWindow(route)
		}),
	)
}
