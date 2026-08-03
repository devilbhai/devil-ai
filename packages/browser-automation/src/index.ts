/**
 * Devil AI Browser Automation
 * Main entry point for browser automation package
 */

export * from "./browser-runner"
export { BrowserRunner } from "./browser-runner"
export * from "./extension-client"
export { ExtensionClient } from "./extension-client"
export type {
	BrowserOptions,
	ClickOptions,
	EvaluateOptions,
	ScreenshotOptions,
	TabInfo,
	TypeOptions,
} from "./types"
