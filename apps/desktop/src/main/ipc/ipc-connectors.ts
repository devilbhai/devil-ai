import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { 
	getConnectorStatuses, 
	setConnectorCredential, 
	deleteConnectorCredential, 
	testConnectorConnection 
} from "../services/connector-manager"

export function registerConnectorsIpc() {
	ipcMain.handle(
		"connectors:get",
		withLogging("connectors:get", async () => {
			return getConnectorStatuses()
		}),
	)

	ipcMain.handle(
		"connectors:set-credential",
		withLogging("connectors:set-credential", async (_, id: string, credentials: Record<string, string>) => {
			setConnectorCredential(id, credentials)
			return true
		}),
	)

	ipcMain.handle(
		"connectors:delete-credential",
		withLogging("connectors:delete-credential", async (_, id: string) => {
			deleteConnectorCredential(id)
			return true
		}),
	)

	ipcMain.handle(
		"connectors:test-connection",
		withLogging("connectors:test-connection", async (_, id: string, credentials: Record<string, string>) => {
			return await testConnectorConnection(id, credentials)
		}),
	)

	// Token sync handlers
	ipcMain.handle(
		"connectors:sync-tokens",
		withLogging("connectors:sync-tokens", async (_, userEmail: string) => {
			const { syncTokensFromServer } = await import("../connectors/token-sync")
			return await syncTokensFromServer(userEmail)
		}),
	)

	ipcMain.handle(
		"connectors:get-tokens",
		withLogging("connectors:get-tokens", async (_, userEmail: string) => {
			const { getConnectorTokens } = await import("../connectors/token-sync")
			return getConnectorTokens(userEmail)
		}),
	)

	ipcMain.handle(
		"connectors:is-connected",
		withLogging("connectors:is-connected", async (_, userEmail: string, connectorId: string) => {
			const { isConnectorConnected } = await import("../connectors/token-sync")
			return isConnectorConnected(userEmail, connectorId)
		}),
	)

	// Connector tool execution
	ipcMain.handle(
		"connectors:execute-tool",
		withLogging("connectors:execute-tool", async (_, userEmail: string, toolName: string, params: Record<string, unknown>) => {
			const { executeConnectorTool } = await import("../connectors/connector-tools")
			return await executeConnectorTool(userEmail, toolName, params)
		}),
	)

	ipcMain.handle(
		"connectors:list-tools",
		withLogging("connectors:list-tools", async (_, userEmail: string) => {
			const { getAvailableToolNames } = await import("../connectors/connector-tools")
			return getAvailableToolNames(userEmail)
		}),
	)
}
