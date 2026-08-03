/**
 * Browser Runner - Uses Playwright directly in Node.js/Electron main process
 */

import {
	type Browser,
	type BrowserContext,
	type BrowserType,
	chromium,
	firefox,
	type Page,
	webkit,
} from "playwright"
import type {
	BrowserContextOptions,
	BrowserOptions,
	ClickOptions,
	Cookie,
	EvaluateOptions,
	NavigateOptions,
	ScreenshotOptions,
	TabInfo,
	TypeOptions,
} from "./types"

export class BrowserRunner {
	private browser: Browser | null = null
	private contexts: Map<string, BrowserContext> = new Map()
	private pages: Map<string, Page> = new Map()
	private options: Required<BrowserOptions>

	constructor(options: BrowserOptions = {}) {
		this.options = {
			headless: options.headless ?? true,
			browser: options.browser ?? "chromium",
			viewport: options.viewport ?? { width: 1280, height: 720 },
			userAgent: options.userAgent ?? "",
			proxy: options.proxy ?? null,
			extraArgs: options.extraArgs ?? [],
		}
	}

	private getBrowserType(): BrowserType {
		switch (this.options.browser) {
			case "firefox":
				return firefox
			case "webkit":
				return webkit
			default:
				return chromium
		}
	}

	async launch(): Promise<void> {
		if (this.browser) return

		const launchOptions: any = {
			headless: this.options.headless,
			args: [
				"--disable-web-security",
				"--disable-features=IsolateOrigins,site-per-process",
				...this.options.extraArgs,
			],
		}

		if (this.options.proxy) {
			launchOptions.proxy = this.options.proxy
		}

		this.browser = await this.getBrowserType().launch(launchOptions)
		console.log(
			`[BrowserRunner] ${this.options.browser} launched (headless: ${this.options.headless})`,
		)
	}

	async close(): Promise<void> {
		for (const [_id, context] of this.contexts) {
			await context.close()
		}
		this.contexts.clear()
		this.pages.clear()

		if (this.browser) {
			await this.browser.close()
			this.browser = null
			console.log("[BrowserRunner] Browser closed")
		}
	}

	async newContext(options: BrowserContextOptions = {}): Promise<BrowserContext> {
		if (!this.browser) await this.launch()

		const context = await this.browser!.newContext({
			viewport: this.options.viewport,
			userAgent: this.options.userAgent || undefined,
			...options,
		})

		const contextId = `ctx_${Date.now()}_${Math.random().toString(36).slice(2)}`
		this.contexts.set(contextId, context)
		return context
	}

	async newPage(contextId?: string): Promise<{ page: Page; pageId: string }> {
		let context: BrowserContext

		if (contextId && this.contexts.has(contextId)) {
			context = this.contexts.get(contextId)!
		} else {
			context = await this.newContext()
			contextId = [...this.contexts.entries()].find(([, c]) => c === context)![0]
		}

		const page = await context.newPage()
		const pageId = `page_${Date.now()}_${Math.random().toString(36).slice(2)}`
		this.pages.set(pageId, page)

		// Clean up when page closes
		page.on("close", () => {
			this.pages.delete(pageId)
		})

		return { page, pageId }
	}

	async getPage(pageId: string): Promise<Page> {
		const page = this.pages.get(pageId)
		if (!page) throw new Error(`Page not found: ${pageId}`)
		return page
	}

	async navigate(pageId: string, url: string, options: NavigateOptions = {}): Promise<void> {
		const page = await this.getPage(pageId)
		await page.goto(url, {
			waitUntil: options.waitUntil ?? "domcontentloaded",
			timeout: options.timeout ?? 30000,
		})
	}

	async click(pageId: string, selector: string, options: ClickOptions = {}): Promise<void> {
		const page = await this.getPage(pageId)
		await page.click(selector, {
			button: options.button ?? "left",
			clickCount: options.clickCount ?? 1,
			delay: options.delay,
			position: options.position,
			force: true,
		})
	}

	async type(
		pageId: string,
		selector: string,
		text: string,
		options: TypeOptions = {},
	): Promise<void> {
		const page = await this.getPage(pageId)
		await page.fill(selector, text, {
			noWaitAfter: options.noWaitAfter ?? false,
			timeout: 30000,
		})
		// Type character by character for realism
		if (options.delay) {
			await page.type(selector, text, { delay: options.delay })
		}
	}

	async pressKey(pageId: string, key: string): Promise<void> {
		const page = await this.getPage(pageId)
		await page.keyboard.press(key)
	}

	async screenshot(pageId: string, options: ScreenshotOptions = {}): Promise<string> {
		const page = await this.getPage(pageId)
		const buffer = await page.screenshot({
			fullPage: options.fullPage ?? false,
			type: options.format ?? "png",
			quality: options.quality,
		})
		return buffer.toString("base64")
	}

	async evaluate<T = any>(
		pageId: string,
		script: string,
		args?: any,
		options: EvaluateOptions = {},
	): Promise<T> {
		const page = await this.getPage(pageId)
		return page.evaluate(script, args, { timeout: options.timeout ?? 30000 })
	}

	async getContent(pageId: string): Promise<string> {
		const page = await this.getPage(pageId)
		return page.content()
	}

	async getText(pageId: string): Promise<string> {
		const page = await this.getPage(pageId)
		return page.evaluate(() => document.body.innerText)
	}

	async waitForSelector(pageId: string, selector: string, timeout = 30000): Promise<void> {
		const page = await this.getPage(pageId)
		await page.waitForSelector(selector, { timeout })
	}

	async waitForNavigation(pageId: string, timeout = 30000): Promise<void> {
		const page = await this.getPage(pageId)
		await page.waitForLoadState("networkidle", { timeout })
	}

	async getCookies(pageId: string): Promise<Cookie[]> {
		const page = await this.getPage(pageId)
		const context = page.context()
		return context.cookies()
	}

	async setCookies(pageId: string, cookies: Cookie[]): Promise<void> {
		const page = await this.getPage(pageId)
		await page.context().addCookies(cookies)
	}

	async getTabs(): Promise<TabInfo[]> {
		if (!this.browser) return []

		const tabs: TabInfo[] = []
		for (const context of this.browser.contexts()) {
			for (const page of context.pages()) {
				tabs.push({
					id: this.getPageId(page) || "",
					url: page.url(),
					title: await page.title().catch(() => ""),
					favicon: await page
						.evaluate(() => {
							const link = document.querySelector("link[rel='icon']") as HTMLLinkElement
							return link?.href
						})
						.catch(() => undefined),
					active: false, // Would need to track this
					windowId: 0,
				})
			}
		}
		return tabs
	}

	private getPageId(page: Page): string | null {
		for (const [id, p] of this.pages) {
			if (p === page) return id
		}
		return null
	}

	async getBrowser(): Promise<Browser> {
		if (!this.browser) await this.launch()
		return this.browser!
	}

	isRunning(): boolean {
		return this.browser?.isConnected()
	}

	getPageCount(): number {
		return this.pages.size
	}

	getContextCount(): number {
		return this.contexts.size
	}
}

// Singleton instance
let defaultRunner: BrowserRunner | null = null

export function getBrowserRunner(options?: BrowserOptions): BrowserRunner {
	if (!defaultRunner) {
		defaultRunner = new BrowserRunner(options)
	}
	return defaultRunner
}

export async function closeBrowserRunner(): Promise<void> {
	if (defaultRunner) {
		await defaultRunner.close()
		defaultRunner = null
	}
}
