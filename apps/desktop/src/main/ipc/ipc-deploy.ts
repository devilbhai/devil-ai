/**
 * IPC handlers for One-Click Deploy.
 */

import { ipcMain } from "electron"
import { createLogger } from "../logger"
import { withLogging } from "./utils"
import {
	deploy,
	detectFramework,
	getDeployStatus,
	listActiveDeploys,
	type DeployConfig,
	type DeployProvider,
} from "../deploy"

const log = createLogger("ipc-deploy")

export function registerDeployIpc(): void {
	ipcMain.handle(
		"deploy:detectFramework",
		withLogging("deploy:detectFramework", (_event, args: { projectDir: string }) => {
			const preset = detectFramework(args.projectDir)
			if (!preset) return { success: true, framework: null }
			return {
				success: true,
				framework: {
					name: preset.name,
					buildCommand: preset.buildCommand,
					outputDir: preset.outputDir,
					framework: preset.framework,
				},
			}
		}),
	)

	ipcMain.handle(
		"deploy:deploy",
		withLogging("deploy:deploy", async (_event, args: {
			provider: DeployProvider
			projectDir: string
			projectName?: string
			buildCommand?: string
			outputDir?: string
			installCommand?: string
			nodeVersion?: string
			envVars?: Record<string, string>
			startCommand?: string
		}) => {
			const config: DeployConfig = {
				provider: args.provider,
				projectDir: args.projectDir,
				projectName: args.projectName,
				buildCommand: args.buildCommand,
				outputDir: args.outputDir,
				installCommand: args.installCommand,
				nodeVersion: args.nodeVersion,
				envVars: args.envVars,
			}
			return deploy(config)
		}),
	)

	ipcMain.handle(
		"deploy:getStatus",
		withLogging("deploy:getStatus", (_event, args: { deployId: string }) => {
			const status = getDeployStatus(args.deployId)
			return { success: true, status }
		}),
	)

	ipcMain.handle(
		"deploy:listActive",
		withLogging("deploy:listActive", () => {
			return { success: true, deploys: listActiveDeploys() }
		}),
	)

	log.info("Deploy IPC handlers registered")
}
