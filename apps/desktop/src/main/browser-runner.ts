/**
 * Browser Runner - Playwright-based browser automation
 * Runs in Electron main process
 */

import { chromium, firefox, webkit, Browser, BrowserContext, Page, BrowserType } from "playwright"

export interface BrowserOptions {
	headless?: boolean
	browser?: "chromium" | "firefox" | "webkit"
	viewport?: { width: number; height: number }
	userAgent?: string
	proxy?: { server: string; username?: string; password?: string } | null
	extraArgs?: string[]
}

export interface TabInfo {
	id: string
	url: string
	title: string
	favicon?: string
	active: boolean
	windowId: number
}

export interface ClickOptions {
	button?: "left" | "right" | "middle"
	clickCount?: number
	delay?: number
	position?: { x: number; y: number }
}

export interface TypeOptions {
	delay?: number
	noWaitAfter?: boolean
}

export interface ScreenshotOptions {
	fullPage?: boolean
	format?: "png" | "jpeg"
	quality?: number
}

export interface NavigateOptions {
	waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit"
	timeout?: number
}

export interface EvaluateOptions {
	timeout?: number
}

export interface Cookie {
	name: string
	value: string
	domain: string
	path: string
	expires: number
	httpOnly: boolean
	secure: boolean
	sameSite: "Strict" | "Lax" | "None"
}

export class BrowserRunner {
	private browser: Browser | null = null
	private contexts: Map<string, BrowserContext> = new Map()
	private pages: Map<string, Page> = new Map()
	private options: BrowserOptions & { headless: boolean; browser: "chromium" | "firefox" | "webkit"; viewport: { width: number; height: number }; proxy: { server: string; username?: string; password?: string } | null; extraArgs: string[]; userAgent: string }

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
				"--no-sandbox",
				"--disable-setuid-sandbox",
				...this.options.extraArgs,
			],
		}

		if (this.options.proxy) {
			launchOptions.proxy = this.options.proxy
		}

		this.browser = await this.getBrowserType().launch(launchOptions)
		try { console.log(`[BrowserRunner] ${this.options.browser} launched (headless: ${this.options.headless})`) } catch {}
	}

	async close(): Promise<void> {
		for (const [, context] of this.contexts) {
			await context.close()
		}
		this.contexts.clear()
		this.pages.clear()

		if (this.browser) {
			await this.browser.close()
			this.browser = null
			try { console.log("[BrowserRunner] Browser closed") } catch {}
		}
	}

	async newContext(options: any = {}): Promise<BrowserContext> {
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

	async type(pageId: string, selector: string, text: string, options: TypeOptions = {}): Promise<void> {
		const page = await this.getPage(pageId)
		await page.fill(selector, text, {
			noWaitAfter: options.noWaitAfter ?? false,
			timeout: 30000,
		})
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

	async evaluate<T = any>(pageId: string, script: string, args?: any, _options?: EvaluateOptions): Promise<T> {
		const page = await this.getPage(pageId)
		return page.evaluate(({ script, args }) => {
			const fn = new Function("args", script)
			return fn(args)
		}, { script, args })
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
					favicon: await page.evaluate(() => {
						const link = document.querySelector("link[rel='icon']") as HTMLLinkElement
						return link?.href
					}).catch(() => undefined),
					active: false,
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

	async closePage(pageId: string): Promise<void> {
		const page = this.pages.get(pageId)
		if (page) {
			await page.close()
			this.pages.delete(pageId)
		}
	}

	async getBrowser(): Promise<Browser> {
		if (!this.browser) await this.launch()
		return this.browser!
	}

	isRunning(): boolean {
		return this.browser !== null && this.browser.isConnected()
	}

	getPageCount(): number {
		return this.pages.size
	}

	getContextCount(): number {
		return this.contexts.size
	}
}