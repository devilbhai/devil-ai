/**
 * IPC handlers for Browser Automation
 */

import { ipcMain } from "electron"
import { withLogging } from "./utils"
import { BrowserRunner } from "../browser-runner"

let browserRunner: BrowserRunner | null = null

export function registerBrowserAutomationIpc(): void {
	const HANDLER_PREFIX = "browser"

	// Initialize browser
	ipcMain.handle(
		`${HANDLER_PREFIX}:init`,
		withLogging(`${HANDLER_PREFIX}:init`, async (_, options: any) => {
			if (!browserRunner) {
				browserRunner = new BrowserRunner(options)
			}
			await browserRunner.launch()
			return { success: true }
		}),
	)

	// Close browser
	ipcMain.handle(
		`${HANDLER_PREFIX}:close`,
		withLogging(`${HANDLER_PREFIX}:close`, async () => {
			if (browserRunner) {
				await browserRunner.close()
				browserRunner = null
			}
			return { success: true }
		}),
	)

	// Create new tab
	ipcMain.handle(
		`${HANDLER_PREFIX}:new-tab`,
		withLogging(`${HANDLER_PREFIX}:new-tab`, async (_, url?: string) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const { page, pageId } = await browserRunner.newPage()
			if (url) {
				await browserRunner.navigate(pageId, url)
			}
			return { pageId, url: page.url() }
		}),
	)

	// Navigate
	ipcMain.handle(
		`${HANDLER_PREFIX}:navigate`,
		withLogging(`${HANDLER_PREFIX}:navigate`, async (_, pageId: string, url: string, options: any) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.navigate(pageId, url, options)
			return { success: true }
		}),
	)

	// Click
	ipcMain.handle(
		`${HANDLER_PREFIX}:click`,
		withLogging(`${HANDLER_PREFIX}:click`, async (_, pageId: string, selector: string, options: any) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.click(pageId, selector, options)
			return { success: true }
		}),
	)

	// Type
	ipcMain.handle(
		`${HANDLER_PREFIX}:type`,
		withLogging(`${HANDLER_PREFIX}:type`, async (_, pageId: string, selector: string, text: string, options: any) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.type(pageId, selector, text, options)
			return { success: true }
		}),
	)

	// Screenshot
	ipcMain.handle(
		`${HANDLER_PREFIX}:screenshot`,
		withLogging(`${HANDLER_PREFIX}:screenshot`, async (_, pageId: string, options: any) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const data = await browserRunner.screenshot(pageId, options)
			return { data }
		}),
	)

	// Evaluate
	ipcMain.handle(
		`${HANDLER_PREFIX}:evaluate`,
		withLogging(`${HANDLER_PREFIX}:evaluate`, async (_, pageId: string, script: string, args: any) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const result = await browserRunner.evaluate(pageId, script, args)
			return { result }
		}),
	)

	// Get content
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-content`,
		withLogging(`${HANDLER_PREFIX}:get-content`, async (_, pageId: string) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const content = await browserRunner.getContent(pageId)
			return { content }
		}),
	)

	// Get text
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-text`,
		withLogging(`${HANDLER_PREFIX}:get-text`, async (_, pageId: string) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const text = await browserRunner.getText(pageId)
			return { text }
		}),
	)

	// Wait for selector
	ipcMain.handle(
		`${HANDLER_PREFIX}:wait-for-selector`,
		withLogging(`${HANDLER_PREFIX}:wait-for-selector`, async (_, pageId: string, selector: string, timeout: number) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.waitForSelector(pageId, selector, timeout)
			return { success: true }
		}),
	)

	// Get cookies
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-cookies`,
		withLogging(`${HANDLER_PREFIX}:get-cookies`, async (_, pageId: string) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const cookies = await browserRunner.getCookies(pageId)
			return { cookies }
		}),
	)

	// Set cookies
	ipcMain.handle(
		`${HANDLER_PREFIX}:set-cookies`,
		withLogging(`${HANDLER_PREFIX}:set-cookies`, async (_, pageId: string, cookies: any[]) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.setCookies(pageId, cookies)
			return { success: true }
		}),
	)

	// Press key
	ipcMain.handle(
		`${HANDLER_PREFIX}:press-key`,
		withLogging(`${HANDLER_PREFIX}:press-key`, async (_, pageId: string, key: string) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.pressKey(pageId, key)
			return { success: true }
		}),
	)

	// Get tabs
	ipcMain.handle(
		`${HANDLER_PREFIX}:get-tabs`,
		withLogging(`${HANDLER_PREFIX}:get-tabs`, async () => {
			if (!browserRunner) throw new Error("Browser not initialized")
			const tabs = await browserRunner.getTabs()
			return { tabs }
		}),
	)

	// Close page
	ipcMain.handle(
		`${HANDLER_PREFIX}:close-page`,
		withLogging(`${HANDLER_PREFIX}:close-page`, async (_, pageId: string) => {
			if (!browserRunner) throw new Error("Browser not initialized")
			await browserRunner.closePage(pageId)
			return { success: true }
		}),
	)

	// Get runner status
	ipcMain.handle(
		`${HANDLER_PREFIX}:status`,
		withLogging(`${HANDLER_PREFIX}:status`, async () => {
			if (!browserRunner) return { running: false }
			return {
				running: browserRunner.isRunning(),
				pageCount: browserRunner.getPageCount(),
				contextCount: browserRunner.getContextCount(),
			}
		}),
	)
}