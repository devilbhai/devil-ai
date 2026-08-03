import { ipcMain } from "electron"
import { withLogging } from "./utils"
import type { MigrationProvider } from "../onboarding-steps/migration"
import {
	checkDevilRouteInstallation,
	checkGitInstallation,
	checkOpenCodeInstallation,
	detectProviders,
	executeMigration,
	installDevilRoute,
	installGit,
	installOpenCode,
	installCloudflared,
	installAgentReach,
	previewMigration,
	restoreMigrationBackup,
	scanProvider,
	checkPythonInstallation,
} from "../onboarding"

export function registerOnboardingIpc() {
	// --- Onboarding ---

	ipcMain.handle(
		"onboarding:check-opencode",
		withLogging("onboarding:check-opencode", async () => await checkOpenCodeInstallation()),
	)

	ipcMain.handle(
		"onboarding:install-opencode",
		withLogging("onboarding:install-opencode", async () => await installOpenCode()),
	)

	ipcMain.handle(
		"onboarding:check-devilroute",
		withLogging("onboarding:check-devilroute", async () => await checkDevilRouteInstallation()),
	)

	ipcMain.handle(
		"onboarding:install-devilroute",
		withLogging("onboarding:install-devilroute", async () => await installDevilRoute()),
	)

	ipcMain.handle(
		"onboarding:check-git",
		withLogging("onboarding:check-git", async () => await checkGitInstallation()),
	)

	ipcMain.handle(
		"onboarding:install-git",
		withLogging("onboarding:install-git", async () => await installGit()),
	)

	ipcMain.handle(
		"onboarding:install-cloudflared",
		withLogging("onboarding:install-cloudflared", async () => await installCloudflared()),
	)

	ipcMain.handle(
		"onboarding:detect-providers",
		withLogging("onboarding:detect-providers", async () => await detectProviders()),
	)

	ipcMain.handle(
		"onboarding:scan-provider",
		withLogging(
			"onboarding:scan-provider",
			async (_, provider: MigrationProvider) => await scanProvider(provider),
		),
	)

	ipcMain.handle(
		"onboarding:preview-migration",
		withLogging(
			"onboarding:preview-migration",
			async (_, provider: MigrationProvider, scanResult: unknown, categories: string[]) =>
				await previewMigration(provider, scanResult, categories),
		),
	)

	ipcMain.handle(
		"onboarding:execute-migration",
		withLogging(
			"onboarding:execute-migration",
			async (_, provider: MigrationProvider, scanResult: unknown, categories: string[]) =>
				await executeMigration(provider, scanResult, categories),
		),
	)

	ipcMain.handle(
		"onboarding:restore-backup",
		withLogging("onboarding:restore-backup", async () => await restoreMigrationBackup()),
	)

	// --- Internet Search (Agent-Reach) ---

	ipcMain.handle(
		"onboarding:check-python",
		withLogging("onboarding:check-python", async () => await checkPythonInstallation()),
	)

	ipcMain.handle(
		"onboarding:install-agent-reach",
		withLogging("onboarding:install-agent-reach", async () => await installAgentReach()),
	)
}
