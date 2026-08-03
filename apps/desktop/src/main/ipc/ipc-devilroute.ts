/**
 * DevilRoute session-token refresher IPC.
 *
 * Exposes the gateway token-refresh feature to the renderer:
 *   - store the gateway admin password (via the safeStorage credential store),
 *   - trigger a manual refresh,
 *   - query whether a password is configured + the last refresh summary.
 *
 * The refresher itself lives in ../devilroute-token-refresher; this file is just
 * the IPC surface. Mirrors the registerOnboardingIpc() pattern.
 */

import { ipcMain } from "electron"
import { getCredential, storeCredential } from "../credential-store"
import {
	DEVILROUTE_ADMIN_CRED_ID,
	getDevilRouteTokenStatus,
	invalidateGatewaySession,
	runTokenRefresh,
} from "../devilroute-token-refresher"
import { withLogging } from "./utils"

export function registerDevilRouteTokenIpc(): void {
	// Save the gateway admin password (replaces any existing one) and kick off
	// an immediate refresh so the user sees results right away.
	ipcMain.handle(
		"devilroute:set-admin-password",
		withLogging("devilroute:set-admin-password", async (_, password: string) => {
			if (typeof password !== "string" || !password.trim()) {
				throw new Error("Password must not be empty")
			}
			storeCredential(DEVILROUTE_ADMIN_CRED_ID, password)
			invalidateGatewaySession()
			return await runTokenRefresh()
		}),
	)

	ipcMain.handle("devilroute:has-admin-password", () => {
		return getCredential(DEVILROUTE_ADMIN_CRED_ID) !== null
	})

	// Manual "Refresh now" button.
	ipcMain.handle(
		"devilroute:refresh-now",
		withLogging("devilroute:refresh-now", async () => {
			return await runTokenRefresh()
		}),
	)

	ipcMain.handle("devilroute:status", () => getDevilRouteTokenStatus())
}
