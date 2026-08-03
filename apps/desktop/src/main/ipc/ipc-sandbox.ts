import { ipcMain } from "electron"
import { withLogging } from "../ipc/utils"
import { executeInSandbox } from "../sandbox-runner"

export function registerSandboxIpc() {
	ipcMain.handle(
		"sandbox:execute",
		withLogging("sandbox:execute", async (_, code: string, language: string) => {
			return executeInSandbox(code, language)
		}),
	)
}
