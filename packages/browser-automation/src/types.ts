/**
 * Type definitions for browser automation
 */

export interface BrowserOptions {
	headless?: boolean
	browser?: "chromium" | "firefox" | "webkit"
	viewport?: { width: number; height: number }
	userAgent?: string
	proxy?: { server: string; username?: string; password?: string }
	extraArgs?: string[]
}

export interface TabInfo {
	id: string | number
	url: string
	title: string
	favicon?: string
	active: boolean
	windowId?: number
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
	quality?: number
	format?: "png" | "jpeg"
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

export interface NavigateOptions {
	waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit"
	timeout?: number
}

export interface BrowserContextOptions {
	viewport?: { width: number; height: number }
	userAgent?: string
	locale?: string
	timezoneId?: string
	geolocation?: { latitude: number; longitude: number }
	permissions?: string[]
	colorScheme?: "light" | "dark" | "no-preference"
	recordVideo?: { dir: string; size?: { width: number; height: number } }
}

export interface PageActionResult {
	success: boolean
	error?: string
}

export interface ExtensionMessage {
	type: string
	payload?: any
	id?: number
	result?: any
	error?: string
}
