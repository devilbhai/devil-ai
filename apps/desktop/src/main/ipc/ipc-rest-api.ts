/**
 * IPC handlers for REST API and Cloudflare Tunnel.
 */

import { ipcMain } from "electron"
import {
	startRestApi,
	stopRestApi,
	getRestApiStatus,
	generateApiKey,
	revokeApiKey,
	listApiKeys,
	type RestApiConfig,
} from "../rest-api"
import { withLogging } from "./utils"

const HANDLER_PREFIX = "rest-api"

export function registerRestApiIpc(): void {
	// Start REST API server
	ipcMain.handle(
		`${HANDLER_PREFIX}:start`,
		withLogging(`${HANDLER_PREFIX}:start`, async (_, config: RestApiConfig) => {
			return startRestApi(config)
		}),
	)

	// Stop REST API server
	ipcMain.handle(
		`${HANDLER_PREFIX}:stop`,
		withLogging(`${HANDLER_PREFIX}:stop`, async () => {
			return stopRestApi()
		}),
	)

	// Get status
	ipcMain.handle(
		`${HANDLER_PREFIX}:status`,
		withLogging(`${HANDLER_PREFIX}:status`, async () => {
			return getRestApiStatus()
		}),
	)

	// Generate API key
	ipcMain.handle(
		`${HANDLER_PREFIX}:generate-key`,
		withLogging(`${HANDLER_PREFIX}:generate-key`, async (_, name: string, expiresAt?: string) => {
			return generateApiKey(name, expiresAt)
		}),
	)

	// Revoke API key
	ipcMain.handle(
		`${HANDLER_PREFIX}:revoke-key`,
		withLogging(`${HANDLER_PREFIX}:revoke-key`, async (_, key: string) => {
			return revokeApiKey(key)
		}),
	)

	// List API keys
	ipcMain.handle(
		`${HANDLER_PREFIX}:list-keys`,
		withLogging(`${HANDLER_PREFIX}:list-keys`, async () => {
			return listApiKeys()
		}),
	)
}
