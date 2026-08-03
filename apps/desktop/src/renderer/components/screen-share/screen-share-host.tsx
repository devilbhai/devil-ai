/**
 * Screen Share Host Dialog — Captures screen, creates WebRTC offer,
 * exchanges signals via REST through Cloudflare tunnel.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { MonitorIcon, CopyIcon, CheckIcon, XIcon, UsersIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"

interface ScreenShareDialogProps {
	onClose: () => void
}

export function ScreenShareDialog({ onClose }: ScreenShareDialogProps) {
	const [code, setCode] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [copied, setCopied] = useState(false)
	const [hasRemote, setHasRemote] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [sharing, setSharing] = useState(false)

	const pcRef = useRef<RTCPeerConnection | null>(null)
	const tunnelUrlRef = useRef<string | null>(null)
	const codeRef = useRef<string | null>(null)
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const streamRef = useRef<MediaStream | null>(null)

	const stopPolling = useCallback(() => {
		if (pollingRef.current) {
			clearInterval(pollingRef.current)
			pollingRef.current = null
		}
	}, [])

	const cleanup = useCallback(() => {
		stopPolling()
		pcRef.current?.close()
		pcRef.current = null
		tunnelUrlRef.current = null
		codeRef.current = null
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop())
			streamRef.current = null
		}
	}, [stopPolling])

	const stopSharing = useCallback(async () => {
		cleanup()
		if (window.devilAi?.screenShare) {
			await window.devilAi.screenShare.stop().catch(() => {})
		}
		setCode(null)
		setHasRemote(false)
		setSharing(false)
		onClose()
	}, [cleanup, onClose])

	const startSharing = useCallback(async () => {
		if (!window.devilAi?.screenShare) return

		setLoading(true)
		setError(null)

		try {
			// 1. Start signaling server + tunnel → get code
			const result = await window.devilAi.screenShare.start()
			if (!result.success || !result.code) {
				setError(result.error || "Failed to start sharing")
				setLoading(false)
				return
			}

			const shareCode = result.code ?? null
			const tunnelUrl = result.tunnelUrl ?? null
			setCode(shareCode)
			codeRef.current = shareCode
			tunnelUrlRef.current = tunnelUrl

			// 2. Capture screen using standard Web API
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 30 },
				},
				audio: false,
			})

			streamRef.current = stream
			setSharing(true)
			setLoading(false)

			// 3. Create WebRTC peer connection
			const pc = new RTCPeerConnection({
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
			})
			pcRef.current = pc

			// Add screen tracks
			for (const track of stream.getTracks()) {
				pc.addTrack(track, stream)
			}

			// Handle ICE candidates → post to signaling server
			let iceIndex = 0
			pc.onicecandidate = (event) => {
				if (event.candidate && tunnelUrlRef.current && codeRef.current) {
					fetch(`${tunnelUrlRef.current}/api/ice`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							code: codeRef.current,
							candidate: event.candidate.toJSON(),
						}),
					}).catch(() => {})
				}
			}

			pc.onconnectionstatechange = () => {
				if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
					setHasRemote(false)
				}
			}

			// 4. Create offer
			const offer = await pc.createOffer()
			await pc.setLocalDescription(offer)

			// 5. Post offer to signaling server
			await fetch(`${tunnelUrl}/api/offer`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					code: shareCode,
					offer: pc.localDescription?.toJSON(),
				}),
			})

			// 6. Poll for answer + ICE candidates from remote
			pollingRef.current = setInterval(async () => {
				if (!tunnelUrlRef.current || !codeRef.current) return
				try {
					// Poll answer
					const ansResp = await fetch(
						`${tunnelUrlRef.current}/api/answer?code=${encodeURIComponent(codeRef.current)}`,
					)
					if (ansResp.ok) {
						const { answer } = await ansResp.json()
						if (answer) {
							await pc.setRemoteDescription(new RTCSessionDescription(answer))
							setHasRemote(true)
						}
					}

					// Poll ICE candidates
					const iceResp = await fetch(
						`${tunnelUrlRef.current}/api/ice?code=${encodeURIComponent(codeRef.current)}&index=${iceIndex}`,
					)
					if (iceResp.ok) {
						const data = await iceResp.json()
						if (data.candidates) {
							for (const c of data.candidates) {
								await pc.addIceCandidate(new RTCIceCandidate(c))
							}
							iceIndex = data.nextIndex
						}
					}

					// Check status
					const statusResp = await fetch(
						`${tunnelUrlRef.current}/api/status?code=${encodeURIComponent(codeRef.current)}`,
					)
					if (statusResp.ok) {
						const status = await statusResp.json()
						if (status.stopped) {
							stopSharing()
						}
					}
				} catch {
					// Ignore poll errors
				}
			}, 500)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start sharing")
			setLoading(false)
			cleanup()
		}
	}, [cleanup, stopSharing])

	const copyCode = useCallback(() => {
		if (code) {
			navigator.clipboard.writeText(code)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}, [code])

	// Listen for stopped
	useEffect(() => {
		if (!window.devilAi?.screenShare) return
		const unsub = window.devilAi.screenShare.onStopped(() => {
			cleanup()
			setCode(null)
			setHasRemote(false)
			setSharing(false)
			onClose()
		})
		return unsub
	}, [cleanup, onClose])

	// Auto-start on mount
	useEffect(() => {
		if (!code && !loading) {
			startSharing()
		}
	}, [])

	// Cleanup on unmount
	useEffect(() => {
		return () => cleanup()
	}, [cleanup])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="w-[420px] rounded-xl border border-border/50 bg-background shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
							<MonitorIcon className="size-5 text-primary" />
						</div>
						<div>
							<h2 className="text-base font-semibold">Screen Sharing</h2>
							<p className="text-xs text-muted-foreground">
								{sharing ? "Your screen is being shared" : "Share your screen with a remote user"}
							</p>
						</div>
					</div>
					<button
						onClick={stopSharing}
						className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<XIcon className="size-4" />
					</button>
				</div>

				{/* Content */}
				<div className="p-5">
					{error && (
						<div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					{loading && (
						<div className="flex flex-col items-center py-8">
							<div className="mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-sm text-muted-foreground">Starting screen share...</p>
						</div>
					)}

					{code && !loading && (
						<div className="space-y-4">
							{/* Code display */}
							<div className="rounded-xl bg-muted/50 p-6 text-center">
								<p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Share this code
								</p>
								<div className="mb-3 flex items-center justify-center gap-2">
									<span className="font-mono text-3xl font-bold tracking-wider text-foreground">
										{code}
									</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={copyCode}
									className="gap-2"
								>
									{copied ? (
										<CheckIcon className="size-3.5 text-emerald-500" />
									) : (
										<CopyIcon className="size-3.5" />
									)}
									{copied ? "Copied!" : "Copy Code"}
								</Button>
							</div>

							{/* Status */}
							<div className="flex items-center justify-center gap-2 text-sm">
								{hasRemote ? (
									<>
										<UsersIcon className="size-4 text-emerald-500" />
										<span className="text-emerald-500 font-medium">Remote user connected</span>
									</>
								) : (
									<>
										<div className="size-2 animate-pulse rounded-full bg-amber-500" />
										<span className="text-muted-foreground">Waiting for remote user...</span>
									</>
								)}
							</div>

							{/* Instructions */}
							<div className="rounded-lg bg-muted/30 p-3">
								<p className="text-xs text-muted-foreground text-center">
									Share this code with the remote user. They can connect by pressing{" "}
									<kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
										{navigator.platform.includes("Mac") ? "Shift+Cmd+G" : "Shift+Ctrl+G"}
									</kbd>
									{" "}and entering this code.
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end border-t border-border/50 px-5 py-3">
					<Button variant="destructive" onClick={stopSharing} disabled={loading}>
						Stop Sharing
					</Button>
				</div>
			</div>
		</div>
	)
}
