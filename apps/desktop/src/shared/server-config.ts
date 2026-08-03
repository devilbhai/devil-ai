/**
 * Shared server configuration constants.
 *
 * Used by both the main process and the renderer. Keep this module
 * free of Electron or React imports so it can be bundled in either context.
 */

import type { LocalServerConfig, ServerSettings } from "../preload/api"

const getLocalServerName = (): string => {
	const platform = typeof process !== "undefined" ? process.platform : "unknown"
	if (platform === "darwin") return "This Mac"
	if (platform === "win32") return "This PC"
	return "This Machine"
}

/** The built-in local server entry. Always present, cannot be deleted. */
export const DEFAULT_LOCAL_SERVER: LocalServerConfig = {
	id: "local",
	name: getLocalServerName(),
	type: "local",
}

/** Default server settings for fresh installs. */
export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
	servers: [DEFAULT_LOCAL_SERVER],
	activeServerId: "local",
}

/** Default port for the local engine server */
export const DEFAULT_PORT = 4101
