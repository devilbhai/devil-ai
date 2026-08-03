/**
 * Built-in Terminal — Real Mac-like terminal with xterm.js + node-pty.
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { TerminalIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Terminal } from "xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import "xterm/css/xterm.css"

interface TerminalTab {
	id: string
	name: string
	terminal: Terminal
	fitAddon: FitAddon
	disposables: (() => void)[]
}

export function TerminalPage() {
	const [tabs, setTabs] = useState<TerminalTab[]>([])
	const [activeTab, setActiveTab] = useState<string | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const tabsRef = useRef<TerminalTab[]>([])
	tabsRef.current = tabs

	const spawnTerminal = useCallback(async (tabId: string, terminal: Terminal) => {
		if (!window.devilAi?.terminal) return []

		const disposables: (() => void)[] = []

		// Create pty in main process
		const result = await window.devilAi.terminal.create(tabId, terminal.cols, terminal.rows)
		if (!result?.success) return []

		// pty → xterm: data from shell appears on screen
		const unsubData = window.devilAi.terminal.onData((id, data) => {
			if (id === tabId) {
				terminal.write(data)
			}
		})
		disposables.push(unsubData)

		// pty → xterm: process exited
		const unsubExit = window.devilAi.terminal.onExit((id, code) => {
			if (id === tabId) {
				terminal.write(`\r\n\x1b[38;5;240m[exited ${code}]\x1b[0m\r\n`)
				unsubData()
				unsubExit()
			}
		})
		disposables.push(unsubExit)

		// xterm → pty: user types on keyboard
		const inputDisp = terminal.onData((data) => {
			window.devilAi?.terminal?.write(tabId, data)
		})
		disposables.push(() => inputDisp.dispose())

		// xterm → pty: terminal resized
		const resizeDisp = terminal.onResize(({ cols, rows }) => {
			window.devilAi?.terminal?.resize(tabId, cols, rows)
		})
		disposables.push(() => resizeDisp.dispose())

		return disposables
	}, [])

	const createNewTab = useCallback(async () => {
		if (!window.devilAi?.terminal) return

		const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

		const terminal = new Terminal({
			cursorBlink: true,
			cursorStyle: "bar",
			cursorWidth: 2,
			fontFamily: '"SF Mono", "Menlo", "Monaco", "Liberation Mono", "Courier New", monospace',
			fontSize: 13,
			lineHeight: 1.3,
			letterSpacing: 0,
			allowProposedApi: true,
			drawBoldTextInBrightColors: true,
			theme: {
				background: "#0d1117",
				foreground: "#c9d1d9",
				cursor: "#58a6ff",
				cursorAccent: "#0d1117",
				selectionBackground: "#264f78",
				selectionForeground: "#c9d1d9",
				black: "#0d1117",
				red: "#ff7b72",
				green: "#3fb950",
				yellow: "#d29922",
				blue: "#58a6ff",
				magenta: "#bc8cff",
				cyan: "#39c5cf",
				white: "#c9d1d9",
				brightBlack: "#484f58",
				brightRed: "#ffa198",
				brightGreen: "#56d364",
				brightYellow: "#e3b341",
				brightBlue: "#79c0ff",
				brightMagenta: "#d2a8ff",
				brightCyan: "#56d4dd",
				brightWhite: "#f0f6fc",
			},
		})

		const fitAddon = new FitAddon()
		terminal.loadAddon(fitAddon)
		terminal.loadAddon(new WebLinksAddon())

		const disposables = await spawnTerminal(id, terminal)

		const tab: TerminalTab = {
			id,
			name: "zsh",
			terminal,
			fitAddon,
			disposables,
		}

		setTabs((prev) => [...prev, tab])
		setActiveTab(id)
	}, [spawnTerminal])

	// Create first tab
	useEffect(() => {
		if (tabsRef.current.length === 0 && window.devilAi?.terminal) {
			createNewTab()
		}
	}, [createNewTab])

	// Attach active terminal to DOM
	useEffect(() => {
		if (!activeTab || !containerRef.current) return

		const tab = tabs.find((t) => t.id === activeTab)
		if (!tab) return

		const container = containerRef.current
		while (container.firstChild) container.removeChild(container.firstChild)
		tab.terminal.open(container)

		requestAnimationFrame(() => {
			tab.fitAddon.fit()
			tab.terminal.focus()
		})
	}, [activeTab, tabs])

	// Resize on window resize
	useEffect(() => {
		const onResize = () => {
			const tab = tabs.find((t) => t.id === activeTab)
			if (tab) tab.fitAddon.fit()
		}
		window.addEventListener("resize", onResize)
		return () => window.removeEventListener("resize", onResize)
	}, [activeTab, tabs])

	const closeTab = (id: string) => {
		const tab = tabs.find((t) => t.id === id)
		if (tab) {
			for (const d of tab.disposables) d()
			window.devilAi?.terminal?.kill(id)
			tab.terminal.dispose()
		}
		setTabs((prev) => {
			const next = prev.filter((t) => t.id !== id)
			if (activeTab === id) setActiveTab(next[next.length - 1]?.id ?? null)
			return next
		})
	}

	if (!window.devilAi?.terminal) {
		return (
			<div className="flex h-full items-center justify-center bg-[#0d1117]">
				<div className="text-center">
					<TerminalIcon className="mx-auto mb-3 size-12 text-[#484f58]" />
					<p className="text-sm font-medium text-[#8b949e]">Terminal not available</p>
					<p className="mt-1 text-xs text-[#484f58]">Restart the app to load terminal support</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col">
			{/* Tab bar — macOS style */}
			<div className="flex items-center border-b border-[#21262d] bg-[#161b22] px-2">
				<div className="flex flex-1 overflow-x-auto">
					{tabs.map((tab) => (
						<div
							key={tab.id}
							className={`group flex cursor-pointer items-center gap-1.5 border-r border-[#21262d] px-3 py-1.5 text-xs transition-colors ${
								activeTab === tab.id
									? "bg-[#0d1117] text-[#c9d1d9]"
									: "text-[#8b949e] hover:bg-[#0d1117]/60 hover:text-[#c9d1d9]"
							}`}
							onClick={() => setActiveTab(tab.id)}
						>
							<TerminalIcon className="size-3 opacity-50" />
							<span>{tab.name}</span>
							{tabs.length > 1 && (
								<button
									className="ml-1 rounded p-0.5 opacity-0 hover:bg-[#21262d] group-hover:opacity-100"
									onClick={(e) => {
										e.stopPropagation()
										closeTab(tab.id)
									}}
								>
									<XIcon className="size-2.5" />
								</button>
							)}
						</div>
					))}
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 w-7 p-0 text-[#8b949e] hover:text-[#c9d1d9]"
					onClick={createNewTab}
				>
					<PlusIcon className="size-3.5" />
				</Button>
			</div>

			{/* Terminal viewport */}
			<div className="flex-1 overflow-hidden bg-[#0d1117] p-2 pl-3">
				<div
					ref={containerRef}
					className="h-full w-full bg-[#0d1117]"
				/>
			</div>
		</div>
	)
}
