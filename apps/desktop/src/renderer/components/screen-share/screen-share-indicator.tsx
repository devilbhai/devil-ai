/**
 * Screen Share Red Dot — Shows in top bar when screen is being shared.
 * Click to stop sharing.
 */

import { useCallback, useEffect, useState } from "react"
import { XIcon } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@devil-ai/ui/components/tooltip"

interface ScreenShareIndicatorProps {
	onClick?: () => void
}

export function ScreenShareIndicator({ onClick }: ScreenShareIndicatorProps) {
	const [isSharing, setIsSharing] = useState(false)
	const [hasRemote, setHasRemote] = useState(false)

	useEffect(() => {
		if (!window.devilAi?.screenShare) return

		// Check initial status
		window.devilAi.screenShare.getStatus().then((status) => {
			setIsSharing(status.isSharing)
		})

		// Listen for remote connected
		const unsubConnected = window.devilAi.screenShare.onRemoteConnected(() => {
			setHasRemote(true)
		})

		// Listen for stopped
		const unsubStopped = window.devilAi.screenShare.onStopped(() => {
			setIsSharing(false)
			setHasRemote(false)
		})

		// Poll status (simple approach)
		const interval = setInterval(async () => {
			try {
				const status = await window.devilAi.screenShare.getStatus()
				setIsSharing(status.isSharing)
				setHasRemote(status.sessions.some((s) => s.hasRemote))
			} catch {
				// Ignore
			}
		}, 2000)

		return () => {
			unsubConnected()
			unsubStopped()
			clearInterval(interval)
		}
	}, [])

	const handleClick = useCallback(async () => {
		if (onClick) {
			onClick()
			return
		}

		// Stop sharing
		try {
			await window.devilAi?.screenShare?.stop()
			setIsSharing(false)
			setHasRemote(false)
		} catch (err) {
			console.error("Failed to stop sharing:", err)
		}
	}, [onClick])

	if (!isSharing) return null

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<button
						onClick={handleClick}
						className="group flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 transition-colors hover:bg-red-500/20"
					>
						<div className="relative">
							<div className="size-2 rounded-full bg-red-500" />
							<div className="absolute inset-0 size-2 animate-ping rounded-full bg-red-500 opacity-75" />
						</div>
						<span className="text-[10px] font-semibold text-red-500">
							{hasRemote ? "SHARING • LIVE" : "SHARING"}
						</span>
						<XIcon className="size-3 text-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
					</button>
				}
			>
				{hasRemote ? "Screen is being viewed remotely • Click to stop" : "Screen sharing active • Click to stop"}
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{hasRemote ? "Remote user connected • Click to stop" : "Sharing screen • Click to stop"}
			</TooltipContent>
		</Tooltip>
	)
}
