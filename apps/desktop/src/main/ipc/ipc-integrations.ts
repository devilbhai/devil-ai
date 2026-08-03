import { ipcMain } from "electron"
import { withLogging } from "../ipc/utils"
import { fetchAllTasks } from "../integrations/index"
import { getCredential, setCredential } from "../credential-store"

export function registerIntegrationsIpc() {
	ipcMain.handle(
		"integrations:fetchTasks",
		withLogging("integrations:fetchTasks", async () => {
			return fetchAllTasks()
		}),
	)

	ipcMain.handle(
		"integrations:getConfig",
		withLogging("integrations:getConfig", async () => {
			return {
				jiraUrl: getCredential("jira-url") || "",
				jiraEmail: getCredential("jira-email") || "",
				jiraToken: getCredential("jira-token") || "",
				linearToken: getCredential("linear-token") || "",
			}
		}),
	)

	ipcMain.handle(
		"integrations:setConfig",
		withLogging("integrations:setConfig", async (_, config: any) => {
			if (config.jiraUrl !== undefined) setCredential("jira-url", config.jiraUrl)
			if (config.jiraEmail !== undefined) setCredential("jira-email", config.jiraEmail)
			if (config.jiraToken !== undefined) setCredential("jira-token", config.jiraToken)
			if (config.linearToken !== undefined) setCredential("linear-token", config.linearToken)
		}),
	)
}
