import { ipcMain } from "electron"
import { withLogging } from "./utils"

export function registerPluginIpc() {
	ipcMain.handle(
		"plugin:install",
		withLogging(
			"plugin:install",
			async (_: any, url: string, type?: "mcp" | "skill" | "plugin") => {
				const { installFromGitHub } = await import("../plugin-installer")
				return installFromGitHub(url, type)
			},
		),
	)

	ipcMain.handle(
		"plugin:list",
		withLogging("plugin:list", async () => {
			const { listInstalled } = await import("../plugin-installer")
			return listInstalled()
		}),
	)

	ipcMain.handle(
		"plugin:uninstall",
		withLogging("plugin:uninstall", async (_: any, name: string, type: "mcp" | "skill" | "plugin") => {
			const { uninstall } = await import("../plugin-installer")
			return uninstall(name, type)
		}),
	)
}
