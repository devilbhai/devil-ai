/**
 * Share Button — dropdown with Share Session, Share Screen, Telegram options.
 * Matches the "Open" button style in the top bar.
 */
import { useAtomValue, useSetAtom } from "jotai"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, useCallback, useRef } from "react"
import {
	Share2Icon,
	MonitorIcon,
	LinkIcon,
	ChevronDownIcon,
	ForwardIcon,
} from "lucide-react"
import {
	collaborationAtom,
	collaborationEnabledAtom,
	collaborationStartingAtom,
	collaborationErrorAtom,
	startSharingAtom,
	stopSharingAtom,
} from "../../atoms/collaboration"
import { toggleTelegramForwardAtom, telegramForwardSessionsAtom } from "../../atoms/telegram-forward"

const isElectron = typeof window !== "undefined" && "devilAi" in window

interface ShareButtonProps {
	onShareScreen?: () => void
}

export function ShareButton({ onShareScreen }: ShareButtonProps) {
	const collab = useAtomValue(collaborationAtom)
	const enabled = useAtomValue(collaborationEnabledAtom)
	const starting = useAtomValue(collaborationStartingAtom)
	const error = useAtomValue(collaborationErrorAtom)
	const startSharing = useSetAtom(startSharingAtom)
	const stopSharing = useSetAtom(stopSharingAtom)
	const params = useParams({ strict: false }) as { sessionId?: string }
	const navigate = useNavigate()

	// Telegram forwarding
	const forwardSessions = useAtomValue(telegramForwardSessionsAtom)
	const toggleForward = useSetAtom(toggleTelegramForwardAtom)
	const isForwarding = params.sessionId ? forwardSessions.has(params.sessionId) : false
	const [hasToken, setHasToken] = useState(false)
	const [showNoTokenDialog, setShowNoTokenDialog] = useState(false)

	const [viewerCount, setViewerCount] = useState(0)
	const [copied, setCopied] = useState(false)
	const [showDropdown, setShowDropdown] = useState(false)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

	// Check Telegram token
	useEffect(() => {
		window.devilAi?.getSettings?.().then((s) => {
			setHasToken(!!s?.telegramBotToken)
		})
	}, [])

	// Poll viewer count when sharing is active
	useEffect(() => {
		if (!enabled || !isElectron) return

		const pollViewers = async () => {
			try {
				const count = await window.devilAi?.tunnel?.getViewers?.()
				setViewerCount(count ?? 0)
			} catch {
				// Ignore errors
			}
		}

		pollViewers()
		const interval = setInterval(pollViewers, 5000)
		return () => clearInterval(interval)
	}, [enabled])

	// Close dropdown on outside click
	useEffect(() => {
		if (!showDropdown) return
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest("[data-share-dropdown]")) {
				setShowDropdown(false)
			}
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [showDropdown])

	// Update dropdown position when showing
	useEffect(() => {
		if (showDropdown && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			setDropdownPosition({
				top: rect.bottom + 4,
				left: rect.right - 224, // w-56 = 224px, align right
			})
		}
	}, [showDropdown])

	const handleShareSession = useCallback(() => {
		setShowDropdown(false)
		if (enabled && collab.shareUrl) {
			navigator.clipboard.writeText(collab.shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} else if (params.sessionId) {
			startSharing(params.sessionId)
		}
	}, [enabled, collab.shareUrl, params.sessionId, startSharing])

	const handleShareScreen = useCallback(() => {
		setShowDropdown(false)
		onShareScreen?.()
	}, [onShareScreen])

	const handleTelegramForward = useCallback(() => {
		setShowDropdown(false)
		if (!hasToken) {
			setShowNoTokenDialog(true)
			return
		}
		if (params.sessionId) {
			toggleForward(params.sessionId)
		}
	}, [hasToken, params.sessionId, toggleForward])

	const handleStopSession = useCallback((e: React.MouseEvent) => {
		e.stopPropagation()
		stopSharing()
	}, [stopSharing])

	const isActive = enabled && collab.shareUrl
	const isStarting = starting

	return (
		<>
			{/* Main Button - matches "Open" button style */}
			<button
				ref={buttonRef}
				type="button"
				data-share-dropdown
				onClick={() => {
					if (isActive) {
						navigator.clipboard.writeText(collab.shareUrl!)
						setCopied(true)
						setTimeout(() => setCopied(false), 2000)
					} else {
						setShowDropdown(!showDropdown)
					}
				}}
				className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
					isActive
						? "border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20"
						: isStarting
							? "border-yellow-500/30 bg-yellow-500/10 text-yellow-600"
							: error
								? "border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20"
								: "border-border/50 bg-transparent text-foreground hover:bg-muted"
				}`}
			>
				<Share2Icon className="h-3.5 w-3.5" />
				{isActive ? (
					<>
						{copied ? "Copied!" : "Share"}
						{viewerCount > 0 && (
							<span className="ml-1 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
								{viewerCount}
							</span>
						)}
						<button
							type="button"
							onClick={handleStopSession}
							className="ml-1 rounded p-0.5 text-green-500/60 hover:bg-green-500/10 hover:text-green-600"
							title="Stop sharing"
						>
							<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
								<rect x="4" y="4" width="16" height="16" rx="2" />
							</svg>
						</button>
					</>
				) : isStarting ? (
					"Starting..."
				) : error ? (
					"Retry"
				) : (
					<>
						Share
						<ChevronDownIcon className={`h-3 w-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
					</>
				)}
			</button>

			{/* Dropdown - fixed position to avoid overflow issues */}
			{showDropdown && !isActive && !isStarting && (
				<div
					data-share-dropdown
					className="fixed z-[9999] w-56 rounded-xl border border-border/50 bg-background shadow-xl"
					style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
				>
					<div className="p-1.5">
						{/* Share Session */}
						<button
							type="button"
							onClick={handleShareSession}
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
						>
							<div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
								<LinkIcon className="size-4 text-green-500" />
							</div>
							<div>
								<p className="font-medium">Share Session</p>
								<p className="text-[11px] text-muted-foreground">Secure link with OTP</p>
							</div>
						</button>

						{/* Share Screen */}
						{isElectron && (
							<button
								type="button"
								onClick={handleShareScreen}
								className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
							>
								<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
									<MonitorIcon className="size-4 text-primary" />
								</div>
								<div>
									<p className="font-medium">Share Screen</p>
									<p className="text-[11px] text-muted-foreground">Remote desktop access</p>
								</div>
							</button>
						)}

						{/* Telegram Forward */}
						{isElectron && (
							<button
								type="button"
								onClick={handleTelegramForward}
								className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
									isForwarding ? "bg-blue-500/5" : ""
								}`}
							>
								<div className={`flex size-8 items-center justify-center rounded-lg ${
									isForwarding ? "bg-blue-500/20" : "bg-blue-500/10"
								}`}>
									<ForwardIcon className={`size-4 ${isForwarding ? "text-blue-500" : "text-blue-500/70"}`} />
								</div>
								<div>
									<p className="font-medium">{isForwarding ? "Stop Telegram" : "Telegram Forward"}</p>
									<p className="text-[11px] text-muted-foreground">
										{isForwarding ? "Click to stop forwarding" : "Forward messages to Telegram"}
									</p>
								</div>
							</button>
						)}
					</div>
				</div>
			)}

			{/* No Token Dialog */}
			{showNoTokenDialog && (
				<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
					<div className="w-96 rounded-xl border border-border bg-background p-6 shadow-xl">
						<h3 className="text-lg font-semibold">Telegram Bot Token Required</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							To use Telegram forwarding, you need to add your Telegram Bot Token first.
							Go to Settings → Setup to configure your bot token.
						</p>
						<div className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowNoTokenDialog(false)}
								className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									setShowNoTokenDialog(false)
									navigate({ to: "/settings/setup" })
								}}
								className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								Go to Settings
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
