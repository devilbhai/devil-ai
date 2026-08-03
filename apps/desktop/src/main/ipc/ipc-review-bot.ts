/**
 * IPC handlers for AI Code Review Bot.
 */

import { ipcMain } from "electron"
import { createLogger } from "../logger"
import { withLogging } from "./utils"
import { reviewPR, configureReviewBot, type ReviewBotConfig } from "../review-bot"
import { getPR, type GitProvider } from "../git-provider-api"

const log = createLogger("ipc-review-bot")

export function registerReviewBotIpc(): void {
	ipcMain.handle(
		"review-bot:reviewPR",
		withLogging("review-bot:reviewPR", async (_event, args: {
			provider: GitProvider
			repository: string
			prNumber: number
		}) => {
			return reviewPR(args.provider, args.repository, args.prNumber)
		}),
	)

	ipcMain.handle(
		"review-bot:configure",
		withLogging("review-bot:configure", (_event, args: Partial<ReviewBotConfig>) => {
			configureReviewBot(args)
			return { success: true }
		}),
	)

	ipcMain.handle(
		"review-bot:getPRInfo",
		withLogging("review-bot:getPRInfo", async (_event, args: {
			provider: GitProvider
			repository: string
			prNumber: number
			token: string
		}) => {
			try {
				const pr = await getPR(args.provider, args.repository, args.prNumber, args.token)
				return { success: true, pr }
			} catch (err) {
				return { success: false, error: String(err) }
			}
		}),
	)

	log.info("Review Bot IPC handlers registered")
}
