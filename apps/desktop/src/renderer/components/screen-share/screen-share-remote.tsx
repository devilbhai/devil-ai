/**
 * Screen Share Remote Dialog — Enter code to connect to remote screen.
 * Polls host's tunnel for WebRTC offer, creates answer, exchanges ICE candidates.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { MonitorIcon, XIcon, WifiIcon, WifiOffIcon, MaximizeIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"

interface ScreenShareRemoteDialogProps {
	onClose: () => void
}

export function ScreenShareRemoteDialog({ onClose }: ScreenShareRemoteDialogProps) {
	const [code, setCode] = useState("")
	const [loading, setLoading] = useState(false)
	const [connected, setConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
	const tunnelUrlRef = useRef<string | null>(null)
	const codeRef = useRef<string | null>(null)
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const stopPolling = useCallback(() => {
		if (pollingRef.current) {
			clearInterval(pollingRef.current)
			pollingRef.current = null
		}
	}, [])

	const disconnect = useCallback(() => {
		stopPolling()
		if (tunnelUrlRef.current && codeRef.current) {
			fetch(`${tunnelUrlRef.current}/api/stop`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: codeRef.current }),
			}).catch(() => {})
		}
		peerConnectionRef.current?.close()
		peerConnectionRef.current = null
		tunnelUrlRef.current = null
		codeRef.current = null
		setStream(null)
		setConnected(false)
		setCode("")
	}, [stopPolling])

	const handleClose = useCallback(() => {
		disconnect()
		onClose()
	}, [disconnect, onClose])

	const connect = useCallback(async () => {
		if (!window.devilAi?.screenShare || code.length < 5) return

		setLoading(true)
		setError(null)

		try {
			// 1. Join session via tunnel
			const result = await window.devilAi.screenShare.join(code)
			if (!result.success) {
				setError(result.error || "Failed to connect")
				setLoading(false)
				return
			}

			const tunnelUrl = result.tunnelUrl
			if (!tunnelUrl) {
				setError("No tunnel URL received")
				setLoading(false)
				return
			}

			tunnelUrlRef.current = tunnelUrl
			codeRef.current = code

			// 2. Create WebRTC peer connection (receive only)
			const pc = new RTCPeerConnection({
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
			})
			peerConnectionRef.current = pc

			// Receive remote stream
			pc.ontrack = (event) => {
				if (event.streams[0]) {
					setStream(event.streams[0])
					setConnected(true)
					setLoading(false)
				}
			}

			// Send ICE candidates to host via tunnel
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
					setConnected(false)
				}
			}

			// Receive only — video + audio
			pc.addTransceiver("video", { direction: "recvonly" })
			pc.addTransceiver("audio", { direction: "recvonly" })

			// 3. Poll for host's offer
			let iceIndex = 0
			let offerSet = false

			pollingRef.current = setInterval(async () => {
				if (!tunnelUrlRef.current || !codeRef.current) return
				try {
					// Poll offer (only if not yet set)
					if (!offerSet) {
						const offerResp = await fetch(
							`${tunnelUrlRef.current}/api/offer?code=${encodeURIComponent(codeRef.current)}`,
						)
						if (offerResp.ok) {
							const { offer } = await offerResp.json()
							if (offer) {
								await pc.setRemoteDescription(new RTCSessionDescription(offer))
								offerSet = true

								// Create answer
								const answer = await pc.createAnswer()
								await pc.setLocalDescription(answer)

								// Post answer to host
								await fetch(`${tunnelUrlRef.current}/api/answer`, {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
										code: codeRef.current,
										answer: pc.localDescription?.toJSON(),
									}),
								})
							}
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

					// Check if stopped
					const statusResp = await fetch(
						`${tunnelUrlRef.current}/api/status?code=${encodeURIComponent(codeRef.current)}`,
					)
					if (statusResp.ok) {
						const status = await statusResp.json()
						if (status.stopped) {
							disconnect()
						}
					}
				} catch {
					// Ignore poll errors
				}
			}, 500)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection failed")
			setLoading(false)
		}
	}, [code, disconnect])

	// Attach stream to video element
	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream
		}
	}, [stream])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopPolling()
			peerConnectionRef.current?.close()
		}
	}, [stopPolling])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="w-[480px] rounded-xl border border-border/50 bg-background shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
							<MonitorIcon className="size-5 text-primary" />
						</div>
						<div>
							<h2 className="text-base font-semibold">Remote Screen</h2>
							<p className="text-xs text-muted-foreground">Connect to a remote user's screen</p>
						</div>
					</div>
					<button
						onClick={handleClose}
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

					{!connected ? (
						/* Code input */
						<div className="space-y-4">
							<div>
								<label className="mb-2 block text-xs font-medium text-muted-foreground">
									Enter connection code
								</label>
								<Input
									type="text"
									placeholder="tunnel-id:otp"
									value={code}
									onChange={(e) => setCode(e.target.value.trim())}
									onKeyDown={(e) => {
										if (e.key === "Enter" && code.length >= 5 && !loading) {
											connect()
										}
									}}
									className="h-12 font-mono text-sm"
									disabled={loading}
									autoFocus
								/>
							</div>

							<Button
								onClick={connect}
								disabled={code.length < 5 || loading}
								className="w-full"
							>
								{loading ? (
									<>
										<div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
										Connecting...
									</>
								) : (
									<>
										<WifiIcon className="mr-2 size-4" />
										Connect
									</>
								)}
							</Button>

							<p className="text-xs text-muted-foreground text-center">
								Ask the host for their connection code
							</p>
						</div>
					) : (
						/* Remote view */
						<div className="space-y-4">
							<div className="relative overflow-hidden rounded-lg bg-black">
								<video
									ref={videoRef}
									autoPlay
									playsInline
									muted
									className="w-full"
								/>
								<div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1">
									<div className="size-2 animate-pulse rounded-full bg-red-500" />
									<span className="text-[10px] font-medium text-white">LIVE</span>
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => {
										if (videoRef.current) {
											if (document.fullscreenElement) {
												document.exitFullscreen()
											} else {
												videoRef.current.requestFullscreen()
											}
										}
									}}
									className="flex-1"
								>
									<MaximizeIcon className="mr-2 size-4" />
									Fullscreen
								</Button>
								<Button
									variant="destructive"
									onClick={disconnect}
									className="flex-1"
								>
									<WifiOffIcon className="mr-2 size-4" />
									Disconnect
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
