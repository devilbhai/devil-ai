/**
 * Share Banner — shows share URL and OTP in the chat area when sharing is active.
 * Auto-copies the URL to clipboard when sharing starts.
 */
import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"
import { Share2Icon, CopyIcon, CheckIcon, XIcon } from "lucide-react"
import {
	collaborationAtom,
	collaborationEnabledAtom,
	stopSharingAtom,
} from "../../atoms/collaboration"
import { useSetAtom } from "jotai"

export function ShareBanner() {
	const collab = useAtomValue(collaborationAtom)
	const enabled = useAtomValue(collaborationEnabledAtom)
	const stopSharing = useSetAtom(stopSharingAtom)
	const [copied, setCopied] = useState<"url" | "otp" | null>(null)
	const [autoCopied, setAutoCopied] = useState(false)

	const isActive = enabled && collab.shareUrl

	// Auto-copy URL when sharing starts
	useEffect(() => {
		if (isActive && collab.shareUrl && !autoCopied) {
			navigator.clipboard.writeText(collab.shareUrl).then(() => {
				setAutoCopied(true)
				setCopied("url")
				setTimeout(() => setCopied(null), 2000)
			})
		}
	}, [isActive, collab.shareUrl, autoCopied])

	// Reset autoCopy flag when sharing stops
	useEffect(() => {
		if (!isActive) {
			setAutoCopied(false)
		}
	}, [isActive])

	if (!isActive) return null

	const handleCopyUrl = () => {
		navigator.clipboard.writeText(collab.shareUrl!)
		setCopied("url")
		setTimeout(() => setCopied(null), 2000)
	}

	const handleCopyOtp = () => {
		if (collab.otp) {
			navigator.clipboard.writeText(collab.otp)
			setCopied("otp")
			setTimeout(() => setCopied(null), 2000)
		}
	}

	const handleCopyAll = () => {
		const text = `Join my session: ${collab.shareUrl}${collab.otp ? `\nOTP: ${collab.otp}` : ""}`
		navigator.clipboard.writeText(text)
		setCopied("url")
		setTimeout(() => setCopied(null), 2000)
	}

	return (
		<div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
			<Share2Icon className="size-4 shrink-0 text-green-500" />

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-green-500">Session Shared</span>
					{autoCopied && (
						<span className="text-[10px] text-green-500/70">(URL auto-copied)</span>
					)}
				</div>

				<div className="mt-1 flex items-center gap-2">
					{/* URL */}
					<button
						type="button"
						onClick={handleCopyUrl}
						className="group flex min-w-0 items-center gap-1.5 rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs transition-colors hover:bg-green-500/20"
					>
						<span className="truncate font-mono text-green-400">{collab.shareUrl}</span>
						{copied === "url" ? (
							<CheckIcon className="size-3 shrink-0 text-green-400" />
						) : (
							<CopyIcon className="size-3 shrink-0 text-green-500/50 group-hover:text-green-400" />
						)}
					</button>

					{/* OTP */}
					{collab.otp && (
						<button
							type="button"
							onClick={handleCopyOtp}
							className="group flex items-center gap-1 rounded border border-orange-500/20 bg-orange-500/10 px-2 py-1 transition-colors hover:bg-orange-500/20"
						>
							<span className="text-[10px] text-orange-400">OTP:</span>
							<span className="font-mono text-xs font-bold text-orange-300">{collab.otp}</span>
							{copied === "otp" ? (
								<CheckIcon className="size-3 text-orange-400" />
							) : (
								<CopyIcon className="size-3 text-orange-500/50 group-hover:text-orange-400" />
							)}
						</button>
					)}

					{/* Copy All button */}
					<button
						type="button"
						onClick={handleCopyAll}
						className="shrink-0 rounded bg-green-500/15 px-2 py-1 text-[10px] font-medium text-green-500 transition-colors hover:bg-green-500/25"
					>
						Copy All
					</button>
				</div>
			</div>

			{/* Stop button */}
			<button
				type="button"
				onClick={stopSharing}
				className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
				title="Stop sharing"
			>
				<XIcon className="size-4" />
			</button>
		</div>
	)
}
