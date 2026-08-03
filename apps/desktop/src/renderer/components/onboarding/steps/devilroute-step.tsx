/**
 * Onboarding step: DevilRoute local gateway.
 *
 * DevilRoute (http://127.0.0.1:20128) is the local AI gateway that powers the
 * built-in "devil-ai" provider — OpenAI-compatible /v1 API + a web console at
 * /login. This step checks it, installs it if missing, and starts it.
 *
 * Shown both as part of the full wizard (new users) and as a standalone
 * re-onboarding screen (existing users on the next update, via the
 * `devilrouteV` gate).
 */

import { Button } from "@devil-ai/ui/components/button"
import { Spinner } from "@devil-ai/ui/components/spinner"
import { useCallback, useEffect, useRef, useState } from "react"
import {
	ArrowRightIcon,
	CheckCircle2Icon,
	DownloadIcon,
	RefreshCwIcon,
	ServerIcon,
	XCircleIcon,
} from "lucide-react"
import type { DevilRouteStatus } from "../../../../preload/api"

type Phase = "checking" | "ready" | "installing" | "success" | "error"

interface DevilRouteStepProps {
	onComplete: () => void
	onSkip?: () => void
}

export function DevilRouteStep({ onComplete, onSkip }: DevilRouteStepProps) {
	const [phase, setPhase] = useState<Phase>("checking")
	const [status, setStatus] = useState<DevilRouteStatus | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [installOutput, setInstallOutput] = useState<string[]>([])
	const terminalRef = useRef<HTMLDivElement>(null)
	const hasRun = useRef(false)

	const isElectron = typeof window !== "undefined" && "devilAi" in window

	const runCheck = useCallback(async () => {
		if (!isElectron) return
		setPhase("checking")
		setError(null)
		try {
			const result = await window.devilAi.onboarding.checkDevilRoute()
			setStatus(result)
			setPhase("ready")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not check the gateway")
			setPhase("error")
		}
	}, [isElectron])

	useEffect(() => {
		if (hasRun.current) return
		hasRun.current = true
		runCheck()
	}, [runCheck])

	// Auto-scroll terminal when new output arrives
	// biome-ignore lint/correctness/useExhaustiveDependencies: installOutput triggers scroll on new output
	useEffect(() => {
		if (terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight
		}
	}, [installOutput])

	const handleInstall = useCallback(async () => {
		if (!isElectron) return
		setPhase("installing")
		setError(null)
		setInstallOutput([])

		const cleanup = window.devilAi.onboarding.onInstallOutput((text) => {
			setInstallOutput((prev) => [...prev, text])
		})

		try {
			const result = await window.devilAi.onboarding.installDevilRoute()
			cleanup()
			if (result.success) {
				const recheck = await window.devilAi.onboarding.checkDevilRoute()
				setStatus(recheck)
				setPhase("success")
			} else {
				setError(result.error ?? "Installation failed")
				setInstallOutput((prev) => [
					...prev,
					`\nDevilRoute setup failed: ${result.error ?? "Unknown error"}\n`,
				])
				setPhase("error")
			}
		} catch (err) {
			cleanup()
			setError(err instanceof Error ? err.message : "Installation failed")
			setInstallOutput((prev) => [
				...prev,
				`\nError: ${err instanceof Error ? err.message : "Installation failed"}\n`,
			])
			setPhase("error")
		}
	}, [isElectron])

	const handleRetry = useCallback(() => {
		hasRun.current = false
		runCheck()
	}, [runCheck])

	const ready =
		phase === "ready" || phase === "success" || (phase === "checking" && status?.running)

	return (
		<div className="flex h-full flex-col items-center justify-center px-6">
			<div className="w-full max-w-lg space-y-6">
				<div className="text-center">
					<div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
						<ServerIcon className="size-6 text-primary" aria-hidden="true" />
					</div>
					<h2 className="text-xl font-semibold text-foreground">DevilRoute Gateway</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						A local AI gateway that speeds up every reply. It runs on your machine at{" "}
						<code className="rounded bg-muted px-1 py-0.5 text-xs">127.0.0.1:20128</code>.
					</p>
				</div>

				{/* Status card */}
				<div
					data-slot="onboarding-card"
					className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
				>
					<div className="mt-0.5 shrink-0">
						{phase === "checking" && <Spinner className="size-5" />}
						{ready && (
							<CheckCircle2Icon className="size-5 text-emerald-500" aria-hidden="true" />
						)}
						{phase === "installing" && <Spinner className="size-5" />}
						{phase === "error" && <XCircleIcon className="size-5 text-red-500" aria-hidden="true" />}
					</div>
					<div className="min-w-0 flex-1">
						{phase === "checking" && (
							<p className="text-sm font-medium text-foreground">Checking the gateway...</p>
						)}
						{ready && (
							<>
								<p className="text-sm font-medium text-foreground">
									{phase === "success"
										? "DevilRoute gateway is running"
										: status?.running
											? "DevilRoute gateway is running"
											: "DevilRoute is ready to start"}
								</p>
								{status?.running ? (
									<p className="mt-0.5 text-xs text-muted-foreground">
										http://127.0.0.1:20128/v1 — web console at{" "}
										<code className="rounded bg-muted px-1 py-0.5 text-[11px]">/login</code>
									</p>
								) : (
									<p className="mt-0.5 text-xs text-muted-foreground">
										Installed — start it to enable the local gateway.
									</p>
								)}
							</>
						)}
						{phase === "installing" && (
							<p className="text-sm font-medium text-foreground">
								Installing DevilRoute (this can take a few minutes on first run)...
							</p>
						)}
						{phase === "error" && (
							<>
								<p className="text-sm font-medium text-destructive">DevilRoute setup failed</p>
								<p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
							</>
						)}
					</div>
				</div>

				{/* Install terminal output */}
				{(phase === "installing" || installOutput.length > 0) && (
					<div
						ref={terminalRef}
						className="max-h-48 overflow-y-auto rounded-lg border border-border bg-zinc-950 p-3 font-mono text-xs text-zinc-300"
					>
						{installOutput.map((line, i) => (
							<div
								key={`line-${
									// biome-ignore lint/suspicious/noArrayIndexKey: terminal output lines are append-only
									i
								}`}
								className="whitespace-pre-wrap break-all"
							>
								{line}
							</div>
						))}
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-center gap-3">
					{phase === "checking" && (
						<Button size="default" disabled>
							Checking...
						</Button>
					)}

					{ready && (
						<Button size="default" onClick={onComplete} className="gap-2">
							Continue
							<ArrowRightIcon aria-hidden="true" className="size-4" />
						</Button>
					)}

					{phase === "ready" && !status?.running && (
						<Button size="default" variant="outline" onClick={handleInstall} className="gap-2">
							<DownloadIcon aria-hidden="true" className="size-3.5" />
							{status?.installed ? "Start Gateway" : "Install Gateway"}
						</Button>
					)}

					{phase === "error" && (
						<Button size="default" onClick={handleRetry} className="gap-2">
							<RefreshCwIcon aria-hidden="true" className="size-3.5" />
							Retry
						</Button>
					)}

					{onSkip && (ready || phase === "error") && (
						<Button size="default" variant="ghost" onClick={onSkip}>
							Skip for now
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
