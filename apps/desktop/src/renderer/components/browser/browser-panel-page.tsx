/**
 * Browser Panel - Built-in browser with AI automation
 * Allows Devil AI to control a browser like a human
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"
import { ScrollArea } from "@devil-ai/ui/components/scroll-area"
import {
	GlobeIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	RefreshCwIcon,
	HomeIcon,
	CameraIcon,
	EyeIcon,
	CopyIcon,
	Loader2Icon,
	PlusIcon,
	XIcon,
	CpuIcon,
	BrainIcon,
	SendIcon,
	LockIcon,
} from "lucide-react"

const isElectron = typeof window !== "undefined" && "devilAi" in window

// ============================================================
// Types
// ============================================================

interface Tab {
	id: string
	url: string
	title: string
	favicon?: string
}

interface BrowserAction {
	id: string
	type: "navigate" | "click" | "type" | "screenshot" | "evaluate" | "wait"
	target?: string
	value?: string
	timestamp: number
	status: "pending" | "running" | "completed" | "error"
	result?: string
}

// ============================================================
// Main Component
// ============================================================

export function BrowserPanelPage() {
	const [tabs, setTabs] = useState<Tab[]>([])
	const [activeTabId, setActiveTabId] = useState<string | null>(null)
	const [url, setUrl] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [screenshot, setScreenshot] = useState<string | null>(null)
	const [status, setStatus] = useState<"idle" | "running" | "error">("idle")
	const [history, setHistory] = useState<BrowserAction[]>([])
	const [aiPrompt, setAiPrompt] = useState("")
	const [isAiThinking, setIsAiThinking] = useState(false)
	const screenshotIntervalRef = useRef<NodeJS.Timeout | null>(null)

	const activeTab = tabs.find((t) => t.id === activeTabId)

	// Initialize browser
	const initBrowser = useCallback(async () => {
		if (!isElectron) return
		try {
			setIsLoading(true)
			await window.devilAi.browser.init({ headless: true, viewport: { width: 1280, height: 720 } })
			const result = await window.devilAi.browser.newTab("https://www.google.com")
			const tabsResult = await window.devilAi.browser.getTabs()
			setTabs(tabsResult.tabs.map((t) => ({ id: String(t.id), url: t.url, title: t.title })))
			setActiveTabId(result.pageId)
			setUrl(result.url)
			setStatus("idle")
		} catch (err) {
			console.error("Failed to init browser:", err)
			setStatus("error")
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Close browser
	const closeBrowser = useCallback(async () => {
		if (!isElectron) return
		try {
			await window.devilAi.browser.close()
			setTabs([])
			setActiveTabId(null)
			setScreenshot(null)
			setHistory([])
		} catch (err) {
			console.error("Failed to close browser:", err)
		}
	}, [])

	// Navigate to URL
	const navigateTo = useCallback(async (targetUrl: string) => {
		if (!isElectron || !activeTabId) return
		try {
			setIsLoading(true)
			let finalUrl = targetUrl
			if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
				finalUrl = `https://${finalUrl}`
			}
			await window.devilAi.browser.navigate(activeTabId, finalUrl)
			setUrl(finalUrl)
			await refreshScreenshot()
			const tabsResult = await window.devilAi.browser.getTabs()
			setTabs(tabsResult.tabs.map((t) => ({ id: String(t.id), url: t.url, title: t.title })))
		} catch (err) {
			console.error("Failed to navigate:", err)
		} finally {
			setIsLoading(false)
		}
	}, [activeTabId])

	// Refresh screenshot
	const refreshScreenshot = useCallback(async () => {
		if (!isElectron || !activeTabId) return
		try {
			const result = await window.devilAi.browser.screenshot(activeTabId)
			setScreenshot(`data:image/png;base64,${result.data}`)
		} catch (err) {
			console.error("Failed to take screenshot:", err)
		}
	}, [activeTabId])

	// Click element
	const clickElement = useCallback(async (selector: string) => {
		if (!isElectron || !activeTabId) return
		try {
			setIsLoading(true)
			await window.devilAi.browser.click(activeTabId, selector)
			await refreshScreenshot()
			addAction({ type: "click", target: selector, status: "completed" })
		} catch (err) {
			addAction({ type: "click", target: selector, status: "error", result: String(err) })
		} finally {
			setIsLoading(false)
		}
	}, [activeTabId, refreshScreenshot])

	// Type text
	const typeText = useCallback(async (selector: string, text: string) => {
		if (!isElectron || !activeTabId) return
		try {
			setIsLoading(true)
			await window.devilAi.browser.type(activeTabId, selector, text)
			await refreshScreenshot()
			addAction({ type: "type", target: selector, value: text, status: "completed" })
		} catch (err) {
			addAction({ type: "type", target: selector, value: text, status: "error", result: String(err) })
		} finally {
			setIsLoading(false)
		}
	}, [activeTabId, refreshScreenshot])

	// Press key
	const pressKey = useCallback(async (key: string) => {
		if (!isElectron || !activeTabId) return
		try {
			await window.devilAi.browser.pressKey(activeTabId, key)
			await refreshScreenshot()
		} catch (err) {
			console.error("Failed to press key:", err)
		}
	}, [activeTabId, refreshScreenshot])

	// Get page text
	const getPageText = useCallback(async () => {
		if (!isElectron || !activeTabId) return ""
		try {
			const result = await window.devilAi.browser.getText(activeTabId)
			return result.text
		} catch (err) {
			console.error("Failed to get text:", err)
			return ""
		}
	}, [activeTabId])

	// Execute JavaScript
	const executeScript = useCallback(async (script: string) => {
		if (!isElectron || !activeTabId) return
		try {
			setIsLoading(true)
			const result = await window.devilAi.browser.evaluate(activeTabId, script)
			await refreshScreenshot()
			addAction({ type: "evaluate", value: script, status: "completed", result: String(result.result) })
			return result.result
		} catch (err) {
			addAction({ type: "evaluate", value: script, status: "error", result: String(err) })
		} finally {
			setIsLoading(false)
		}
	}, [activeTabId, refreshScreenshot])

	// Add action to history
	const addAction = useCallback((action: Omit<BrowserAction, "id" | "timestamp">) => {
		const newAction: BrowserAction = {
			...action,
			id: `action_${Date.now()}`,
			timestamp: Date.now(),
		}
		setHistory((prev) => [newAction, ...prev].slice(0, 50))
	}, [])

	// AI Command handler
	const handleAiCommand = useCallback(async () => {
		if (!aiPrompt.trim() || isAiThinking) return
		const command = aiPrompt.trim().toLowerCase()
		setAiPrompt("")
		setIsAiThinking(true)

		try {
			// Parse simple commands
			if (command.startsWith("go to ") || command.startsWith("open ")) {
				const targetUrl = command.replace(/^(go to|open)\s+/i, "")
				await navigateTo(targetUrl)
				addAction({ type: "navigate", target: targetUrl, status: "completed" })
			} else if (command === "screenshot" || command === "capture") {
				await refreshScreenshot()
				addAction({ type: "screenshot", status: "completed" })
			} else if (command.startsWith("click ")) {
				const selector = command.replace(/^click\s+/i, "")
				await clickElement(selector)
			} else if (command.startsWith("type ")) {
				const parts = command.replace(/^type\s+/i, "").split(" in ")
				if (parts.length === 2) {
					await typeText(parts[1].trim(), parts[0].trim())
				}
			} else if (command === "get text" || command === "read page") {
				const text = await getPageText()
				addAction({ type: "evaluate", status: "completed", result: text.slice(0, 500) })
			} else if (command.startsWith("js ")) {
				const script = command.replace(/^js\s+/i, "")
				await executeScript(script)
			} else if (command === "back") {
				await pressKey("Alt+ArrowLeft")
			} else if (command === "forward") {
				await pressKey("Alt+ArrowRight")
			} else if (command === "refresh" || command === "reload") {
				await pressKey("F5")
			} else {
				addAction({ type: "evaluate", status: "error", result: `Unknown command: ${command}` })
			}
		} finally {
			setIsAiThinking(false)
		}
	}, [aiPrompt, isAiThinking, navigateTo, refreshScreenshot, clickElement, typeText, getPageText, executeScript, pressKey, addAction])

	// Auto-refresh screenshot every 2 seconds
	useEffect(() => {
		if (activeTabId && !isLoading) {
			screenshotIntervalRef.current = setInterval(refreshScreenshot, 2000)
		}
		return () => {
			if (screenshotIntervalRef.current) {
				clearInterval(screenshotIntervalRef.current)
			}
		}
	}, [activeTabId, isLoading, refreshScreenshot])

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
						<GlobeIcon className="h-4 w-4 text-blue-500" />
					</div>
					<div>
						<h1 className="text-sm font-semibold">Browser</h1>
						<p className="text-xs text-muted-foreground">AI-powered web automation</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{status === "idle" ? (
						<Button size="sm" onClick={initBrowser} className="gap-1.5">
							<PlusIcon className="h-3.5 w-3.5" />
							Launch Browser
						</Button>
					) : (
						<Button size="sm" variant="destructive" onClick={closeBrowser} className="gap-1.5">
							<XIcon className="h-3.5 w-3.5" />
							Close
						</Button>
					)}
				</div>
			</div>

			{/* Browser Chrome */}
			{tabs.length > 0 && (
				<div className="border-b border-border">
					{/* Tabs */}
					<div className="flex items-center gap-1 px-2 pt-2">
						{tabs.map((tab) => (
							<div
								key={tab.id}
								className={`group flex items-center gap-2 rounded-t-lg px-3 py-1.5 text-xs cursor-pointer transition-colors ${
									tab.id === activeTabId
										? "bg-background text-foreground border border-b-0 border-border"
										: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
								}`}
								onClick={() => setActiveTabId(tab.id)}
							>
								{tab.favicon ? (
									<img src={tab.favicon} alt="" className="h-3 w-3" />
								) : (
									<GlobeIcon className="h-3 w-3" />
								)}
								<span className="max-w-[120px] truncate">{tab.title || "New Tab"}</span>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										// Close tab logic
									}}
									className="opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<XIcon className="h-3 w-3" />
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={async () => {
								if (!isElectron) return
								const result = await window.devilAi.browser.newTab()
								const tabsResult = await window.devilAi.browser.getTabs()
								setTabs(tabsResult.tabs.map((t) => ({ id: String(t.id), url: t.url, title: t.title })))
								setActiveTabId(result.pageId)
							}}
							className="rounded-t-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
						>
							<PlusIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{/* Navigation Bar */}
					<div className="flex items-center gap-2 px-3 py-2">
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => pressKey("Alt+ArrowLeft")}
							>
								<ArrowLeftIcon className="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => pressKey("Alt+ArrowRight")}
							>
								<ArrowRightIcon className="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => refreshScreenshot()}
							>
								<RefreshCwIcon className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => navigateTo("https://www.google.com")}
							>
								<HomeIcon className="h-3.5 w-3.5" />
							</Button>
						</div>

						{/* URL Bar */}
						<div className="flex-1 relative">
							<div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
								{activeTab?.url?.startsWith("https") ? (
									<LockIcon className="h-3 w-3 text-green-500" />
								) : (
									<GlobeIcon className="h-3 w-3 text-muted-foreground" />
								)}
								<input
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") navigateTo(url)
									}}
									placeholder="Enter URL or search..."
									className="flex-1 bg-transparent text-xs outline-none"
								/>
							</div>
						</div>

						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={refreshScreenshot}
							>
								<CameraIcon className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Browser Viewport */}
				<div className="flex-1 flex flex-col">
					{screenshot ? (
						<div className="flex-1 overflow-auto bg-muted/20 p-2">
							<img
								src={screenshot}
								alt="Browser viewport"
								className="w-full h-auto rounded-lg border border-border shadow-lg"
							/>
						</div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-center p-8">
							<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-4">
								<GlobeIcon className="h-10 w-10 text-blue-500/50" />
							</div>
							<h2 className="text-lg font-semibold mb-2">Browser Not Launched</h2>
							<p className="text-sm text-muted-foreground max-w-md mb-4">
								Click "Launch Browser" to start a new browser session. Devil AI can then control it like a human - clicking, typing, navigating, and filling forms.
							</p>
							<Button onClick={initBrowser} className="gap-2">
								<PlusIcon className="h-4 w-4" />
								Launch Browser
							</Button>
						</div>
					)}
				</div>

				{/* AI Control Panel */}
				<div className="w-80 border-l border-border flex flex-col">
					{/* AI Header */}
					<div className="border-b border-border p-3">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
								<BrainIcon className="h-4 w-4 text-purple-500" />
							</div>
							<div>
								<h3 className="text-xs font-semibold">AI Browser Control</h3>
								<p className="text-[10px] text-muted-foreground">Tell AI what to do</p>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="border-b border-border p-3">
						<p className="text-[10px] font-medium text-muted-foreground mb-2">QUICK ACTIONS</p>
						<div className="grid grid-cols-2 gap-1.5">
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-[10px] justify-start gap-1.5"
								onClick={refreshScreenshot}
							>
								<CameraIcon className="h-3 w-3" />
								Screenshot
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-[10px] justify-start gap-1.5"
								onClick={async () => {
									const text = await getPageText()
									addAction({ type: "evaluate", status: "completed", result: text.slice(0, 200) })
								}}
							>
								<EyeIcon className="h-3 w-3" />
								Read Page
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-[10px] justify-start gap-1.5"
								onClick={() => executeScript("document.title")}
							>
								<CpuIcon className="h-3 w-3" />
								Get Title
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-[10px] justify-start gap-1.5"
								onClick={() => executeScript("JSON.stringify(Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href})).slice(0, 20))")}
							>
								<CopyIcon className="h-3 w-3" />
								Get Links
							</Button>
						</div>
					</div>

					{/* AI Input */}
					<div className="border-b border-border p-3">
						<p className="text-[10px] font-medium text-muted-foreground mb-2">AI COMMAND</p>
						<div className="flex gap-2">
							<Input
								value={aiPrompt}
								onChange={(e) => setAiPrompt(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleAiCommand()
								}}
								placeholder="e.g., go to google.com, click #button..."
								className="h-8 text-xs"
								disabled={isAiThinking}
							/>
							<Button
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={handleAiCommand}
								disabled={isAiThinking || !aiPrompt.trim()}
							>
								{isAiThinking ? (
									<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
								) : (
									<SendIcon className="h-3.5 w-3.5" />
								)}
							</Button>
						</div>
						<div className="mt-2 flex flex-wrap gap-1">
							{["go to google.com", "screenshot", "get text", "back", "refresh"].map((cmd) => (
								<button
									key={cmd}
									type="button"
									onClick={() => setAiPrompt(cmd)}
									className="rounded-md bg-muted px-2 py-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
								>
									{cmd}
								</button>
							))}
						</div>
					</div>

					{/* Action History */}
					<div className="flex-1 overflow-hidden flex flex-col">
						<p className="text-[10px] font-medium text-muted-foreground px-3 pt-3 pb-1">ACTION HISTORY</p>
						<ScrollArea className="flex-1">
							<div className="space-y-1 px-3 pb-3">
								{history.length === 0 ? (
									<p className="text-[10px] text-muted-foreground text-center py-4">No actions yet</p>
								) : (
									history.map((action) => (
										<div
											key={action.id}
											className="rounded-lg border border-border p-2 text-[10px]"
										>
											<div className="flex items-center justify-between mb-1">
												<Badge
													variant="outline"
													className={`text-[8px] ${
														action.status === "completed"
															? "border-green-500/50 text-green-500"
															: action.status === "error"
																? "border-red-500/50 text-red-500"
																: "border-yellow-500/50 text-yellow-500"
													}`}
												>
													{action.status}
												</Badge>
												<span className="text-muted-foreground">
													{new Date(action.timestamp).toLocaleTimeString()}
												</span>
											</div>
											<p className="font-medium">{action.type}: {action.target || action.value?.slice(0, 30)}</p>
											{action.result && (
												<p className="text-muted-foreground mt-1 line-clamp-2">{action.result}</p>
											)}
										</div>
									))
								)}
							</div>
						</ScrollArea>
					</div>

					{/* Status Bar */}
					<div className="border-t border-border p-2">
						<div className="flex items-center justify-between text-[10px] text-muted-foreground">
							<div className="flex items-center gap-2">
								<div className={`h-1.5 w-1.5 rounded-full ${status === "idle" ? "bg-green-500" : status === "running" ? "bg-yellow-500" : "bg-red-500"}`} />
								<span>{status === "idle" ? "Ready" : status === "running" ? "Running" : "Error"}</span>
							</div>
							<span>{tabs.length} tab(s)</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
