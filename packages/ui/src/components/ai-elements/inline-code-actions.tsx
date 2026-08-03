import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CodeIcon, BugIcon, TestTubeIcon, WandIcon, SearchIcon } from "lucide-react"

interface CodeAction {
	id: string
	label: string
	icon: React.ReactNode
	prompt: string
}

const CODE_ACTIONS: CodeAction[] = [
	{
		id: "explain",
		label: "Explain",
		icon: <SearchIcon aria-hidden="true" className="size-3.5" />,
		prompt: "Explain this code:",
	},
	{
		id: "refactor",
		label: "Refactor",
		icon: <WandIcon aria-hidden="true" className="size-3.5" />,
		prompt: "Refactor this code to be cleaner and more maintainable:",
	},
	{
		id: "fix",
		label: "Fix Bugs",
		icon: <BugIcon aria-hidden="true" className="size-3.5" />,
		prompt: "Find and fix any bugs in this code:",
	},
	{
		id: "tests",
		label: "Add Tests",
		icon: <TestTubeIcon aria-hidden="true" className="size-3.5" />,
		prompt: "Write unit tests for this code:",
	},
	{
		id: "optimize",
		label: "Optimize",
		icon: <CodeIcon aria-hidden="true" className="size-3.5" />,
		prompt: "Optimize this code for better performance:",
	},
]

interface InlineCodeActionsProps {
	onAction: (prompt: string, code: string) => void
}

export function InlineCodeActions({ onAction }: InlineCodeActionsProps) {
	const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
	const [selectedCode, setSelectedCode] = useState<string>("")
	const menuRef = useRef<HTMLDivElement>(null)

	const handleSelection = useCallback(() => {
		const selection = window.getSelection()
		if (!selection || selection.isCollapsed) {
			setPosition(null)
			setSelectedCode("")
			return
		}

		const text = selection.toString().trim()
		if (!text || text.length < 10) {
			setPosition(null)
			setSelectedCode("")
			return
		}

		// Check if selection is inside a code block
		const range = selection.getRangeAt(0)
		const container = range.commonAncestorContainer
		const codeBlock =
			container instanceof HTMLElement
				? container.closest("pre, code, [data-streamdown='code-block']")
				: container.parentElement?.closest("pre, code, [data-streamdown='code-block']")

		if (!codeBlock) {
			setPosition(null)
			setSelectedCode("")
			return
		}

		const rect = range.getBoundingClientRect()
		setPosition({
			x: rect.left + rect.width / 2,
			y: rect.top - 10,
		})
		setSelectedCode(text)
	}, [])

	useEffect(() => {
		document.addEventListener("mouseup", handleSelection)
		document.addEventListener("selectionchange", handleSelection)
		return () => {
			document.removeEventListener("mouseup", handleSelection)
			document.removeEventListener("selectionchange", handleSelection)
		}
	}, [handleSelection])

	// Close menu when clicking outside
	useEffect(() => {
		if (!position) return
		const handleClick = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setPosition(null)
				setSelectedCode("")
			}
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [position])

	const handleAction = useCallback(
		(action: CodeAction) => {
			onAction(action.prompt, selectedCode)
			setPosition(null)
			setSelectedCode("")
			window.getSelection()?.removeAllRanges()
		},
		[selectedCode, onAction],
	)

	if (!position) return null

	return createPortal(
		<div
			ref={menuRef}
			className="fixed z-50 flex items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
			style={{
				left: position.x,
				top: position.y,
				transform: "translate(-50%, -100%)",
			}}
		>
			{CODE_ACTIONS.map((action) => (
				<button
					key={action.id}
					type="button"
					onClick={() => handleAction(action)}
					className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					title={action.label}
				>
					{action.icon}
					{action.label}
				</button>
			))}
		</div>,
		document.body,
	)
}
