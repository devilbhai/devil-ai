/**
 * Onboarding Step 2: Environment Check.
 *
 * Verifies the engine is installed and compatible. Offers install/update
 * if needed. When the engine is not found locally, shows any mDNS-discovered
 * servers on the network as an alternative connection path.
 */

import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Label } from "@devil-ai/ui/components/label"
import { Spinner } from "@devil-ai/ui/components/spinner"
import { useAtomValue } from "jotai"
import {
	AlertCircleIcon,
	ArrowRightIcon,
	CheckCircle2Icon,
	CircleAlertIcon,
	DownloadIcon,
	GlobeIcon,
	Loader2Icon,
	RadarIcon,
	RefreshCwIcon,
	XCircleIcon,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { GitCheckResult, OpenCodeCheckResult, PythonCheckResult, RemoteServerConfig } from "../../../../preload/api"
import { discoveredMdnsServersAtom } from "../../../atoms/connection"
import { useServerActions } from "../../../hooks/use-servers"

// ============================================================
// Types
// ============================================================

type CheckStatus = "pending" | "running" | "success" | "warning" | "error"

interface CheckItem {
	id: string
	label: string
	status: CheckStatus
	detail?: string
}

interface EnvironmentCheckStepProps {
	onComplete: (version: string | null) => void
	onSkip: () => void
}

// ============================================================
// Component
// ============================================================

export function EnvironmentCheckStep({ onComplete, onSkip }: EnvironmentCheckStepProps) {
	const [checks, setChecks] = useState<CheckItem[]>([
		{ id: "locate", label: "Locating Devil AI Engine", status: "pending" },
		{ id: "version", label: "Checking version compatibility", status: "pending" },
		{ id: "git", label: "Checking Git installation", status: "pending" },
		{ id: "cloudflared", label: "Checking Cloudflare Tunnel (for sharing)", status: "pending" },
	])
	const [openCodeResult, setOpenCodeResult] = useState<OpenCodeCheckResult | null>(null)
	const [gitResult, setGitResult] = useState<GitCheckResult | null>(null)
	const [pythonResult, setPythonResult] = useState<PythonCheckResult | null>(null)
	const [cloudflaredInstalled, setCloudflaredInstalled] = useState<boolean | null>(null)
	const [installing, setInstalling] = useState(false)
	const [installingTarget, setInstallingTarget] = useState<"opencode" | "git" | "cloudflared" | "agent-reach" | null>(null)
	const [installOutput, setInstallOutput] = useState<string[]>([])
	const [allDone, setAllDone] = useState(false)
	const [savingMdnsId, setSavingMdnsId] = useState<string | null>(null)
	const hasRun = useRef(false)
	const terminalRef = useRef<HTMLDivElement>(null)

	const isElectron = typeof window !== "undefined" && "devilAi" in window

	// mDNS discovered servers (scanner starts before onboarding renders)
	const discoveredServers = useAtomValue(discoveredMdnsServersAtom)
	const { saveDiscoveredServer, switchServer, addServer, testConnection } = useServerActions()

	// Manual server form state
	const [showManualForm, setShowManualForm] = useState(false)
	const [manualUrl, setManualUrl] = useState("")
	const [manualUsername, setManualUsername] = useState("")
	const [manualPassword, setManualPassword] = useState("")
	const [manualTesting, setManualTesting] = useState(false)
	const [manualTestResult, setManualTestResult] = useState<string | null | undefined>(undefined)
	const [manualSaving, setManualSaving] = useState(false)

	const updateCheck = useCallback((id: string, update: Partial<CheckItem>) => {
		setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)))
	}, [])

	// --- Run checks ---

	const runChecks = useCallback(async () => {
		if (!isElectron) return

		// Reset
		setAllDone(false)
		setOpenCodeResult(null)
		setGitResult(null)
		setCloudflaredInstalled(null)
		setChecks([
			{ id: "locate", label: "Locating Devil AI Engine", status: "running" },
			{ id: "version", label: "Checking version compatibility", status: "pending" },
			{ id: "git", label: "Checking Git installation", status: "pending" },
			{ id: "python", label: "Checking Python installation", status: "pending" },
			{ id: "cloudflared", label: "Checking Cloudflare Tunnel (for sharing)", status: "pending" },
		])

		try {
			// Step 1: Check engine installation
			const result = await window.devilAi.onboarding.checkOpenCode()
			setOpenCodeResult(result)

			if (!result.installed) {
				updateCheck("locate", {
					status: "error",
					label: "Devil AI Engine not found",
					detail: "Install the engine to continue",
				})
				// Still check Git while the engine is missing
				await runGitCheck()
				return
			}

			updateCheck("locate", {
				status: "success",
				label: `Engine ${result.version} found`,
				detail: result.path ?? undefined,
			})

			// Step 2: Version compatibility
			updateCheck("version", { status: "running" })
			await new Promise((r) => setTimeout(r, 300)) // Brief pause for visual feedback

			if (result.compatibility === "too-old") {
				updateCheck("version", {
					status: "error",
					label: "Version not compatible",
					detail: result.message ?? undefined,
				})
				await runGitCheck()
				return
			}

			if (result.compatibility === "blocked") {
				updateCheck("version", {
					status: "error",
					label: "Version blocked",
					detail: result.message ?? undefined,
				})
				await runGitCheck()
				return
			}

			if (result.compatibility === "too-new") {
				updateCheck("version", {
					status: "warning",
					label: "Newer than tested",
					detail: result.message ?? undefined,
				})
			} else {
				updateCheck("version", {
					status: "success",
					label: "Version compatible",
				})
			}

			// Step 3: Check Git
			await runGitCheck()
		} catch (err) {
			const message = err instanceof Error ? err.message : "Check failed"
			updateCheck("locate", { status: "error", detail: message })
		}
	}, [isElectron, updateCheck])

	const runGitCheck = useCallback(async () => {
		updateCheck("git", { status: "running" })
		try {
			const git = await window.devilAi.onboarding.checkGit()
			setGitResult(git)

			if (!git.installed) {
				updateCheck("git", {
					status: "error",
					label: "Git not found",
					detail: git.message ?? "Install Git for version control features",
				})
			} else {
				updateCheck("git", {
					status: "success",
					label: `Git ${git.version} found`,
					detail: git.path ?? undefined,
				})
			}
		} catch {
			updateCheck("git", {
				status: "warning",
				label: "Git check skipped",
				detail: "Could not verify Git installation",
			})
		}

		// Check Python
		await runPythonCheck()
	}, [updateCheck])

	const runPythonCheck = useCallback(async () => {
		updateCheck("python", { status: "running" })
		try {
			const py = await window.devilAi.onboarding.checkPython()
			setPythonResult(py)

			if (!py.installed) {
				updateCheck("python", {
					status: "warning", // It's a warning, not an error. They can proceed without it but we prompt them.
					label: "Python not found",
					detail: py.message ?? "Install Python 3 for Agent Reach features",
				})
			} else {
				updateCheck("python", {
					status: "success",
					label: `Python ${py.version} found`,
					detail: py.path ?? undefined,
				})
			}
		} catch {
			updateCheck("python", {
				status: "warning",
				label: "Python check skipped",
				detail: "Could not verify Python installation",
			})
		}

		// Check cloudflared
		await runCloudflaredCheck()
	}, [updateCheck])

	const runCloudflaredCheck = useCallback(async () => {
		updateCheck("cloudflared", { status: "running" })
		try {
			const installed = await window.devilAi.tunnel.check()
			setCloudflaredInstalled(installed)

			if (!installed) {
				updateCheck("cloudflared", {
					status: "error",
					label: "Cloudflare Tunnel not found",
					detail: "Required for screen sharing and session sharing features",
				})
			} else {
				updateCheck("cloudflared", {
					status: "success",
					label: "Cloudflare Tunnel found",
					detail: "Ready for screen sharing and session sharing",
				})
			}
		} catch {
			updateCheck("cloudflared", {
				status: "error",
				label: "Cloudflare Tunnel check failed",
				detail: "Could not verify installation",
			})
		}
		setAllDone(true)
	}, [updateCheck])

	useEffect(() => {
		if (hasRun.current) return
		hasRun.current = true
		runChecks()
	}, [runChecks])

	// --- Install handler ---

	const handleInstall = useCallback(
		async (target: "opencode" | "git" | "cloudflared" | "agent-reach") => {
			if (!isElectron) return
			setInstalling(true)
			setInstallingTarget(target)
			setInstallOutput([])

			const cleanup = window.devilAi.onboarding.onInstallOutput((text) => {
				setInstallOutput((prev) => [...prev, text])
			})

			try {
				let result: { success: boolean; error?: string }

				if (target === "opencode") {
					result = await window.devilAi.onboarding.installOpenCode()
				} else if (target === "git") {
					result = await window.devilAi.onboarding.installGit()
				} else if (target === "agent-reach") {
					result = await window.devilAi.onboarding.installAgentReach()
				} else {
					// cloudflared installation
					result = await installCloudflared()
				}

				cleanup()

				if (result.success) {
					setInstalling(false)
					setInstallingTarget(null)
					// Re-run checks after install
					hasRun.current = false
					runChecks()
				} else {
					setInstallOutput((prev) => [
						...prev,
						`\nInstallation failed: ${result.error ?? "Unknown error"}`,
					])
					setInstalling(false)
					setInstallingTarget(null)
				}
			} catch (err) {
				cleanup()
				setInstallOutput((prev) => [
					...prev,
					`\nError: ${err instanceof Error ? err.message : "Installation failed"}`,
				])
				setInstalling(false)
				setInstallingTarget(null)
			}
		},
		[isElectron, runChecks],
	)

	const installCloudflared = async (): Promise<{ success: boolean; error?: string }> => {
		try {
			const result = await window.devilAi.onboarding.installCloudflared()
			return result
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : "Installation failed" }
		}
	}

	// Auto-scroll terminal when new output arrives
	// biome-ignore lint/correctness/useExhaustiveDependencies: installOutput triggers scroll on new output
	useEffect(() => {
		if (terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight
		}
	}, [installOutput])

	// --- Manual server connection ---

	const handleManualTest = useCallback(async () => {
		setManualTesting(true)
		setManualTestResult(undefined)
		const result = await testConnection(
			manualUrl.trim(),
			manualUsername.trim() || undefined,
			manualPassword || undefined,
		)
		setManualTestResult(result)
		setManualTesting(false)
	}, [manualUrl, manualUsername, manualPassword, testConnection])

	const handleManualConnect = useCallback(async () => {
		if (!isElectron || !manualUrl.trim()) return

		setManualSaving(true)
		try {
			const id = `remote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
			const url = manualUrl.trim()
			// Derive a name from the URL hostname
			let name = "Remote Server"
			try {
				const parsed = new URL(url)
				name = parsed.hostname
			} catch {
				// Use default name
			}

			const server: RemoteServerConfig = {
				id,
				name,
				type: "remote",
				url,
				username: manualUsername.trim() || undefined,
				hasPassword: !!manualPassword,
			}

			await addServer(server, manualPassword || undefined)
			await switchServer(id)

			// Skip the environment check since we're using a remote server
			onComplete(null)
		} finally {
			setManualSaving(false)
		}
	}, [isElectron, manualUrl, manualUsername, manualPassword, addServer, switchServer, onComplete])

	// --- Connect to discovered server ---

	const handleConnectDiscovered = useCallback(
		async (mdnsId: string) => {
			const mdnsServer = discoveredServers.find((s) => s.id === mdnsId)
			if (!mdnsServer) return

			setSavingMdnsId(mdnsId)
			try {
				await saveDiscoveredServer(mdnsServer)

				// The newly saved server gets an auto-generated ID. Find it in settings
				// and switch to it.
				const settings = await window.devilAi.getSettings()
				const saved = settings.servers?.servers.find(
					(s) =>
						s.type === "remote" &&
						s.url.includes(`:${mdnsServer.port}`) &&
						s.name === mdnsServer.name,
				)
				if (saved) {
					await switchServer(saved.id)
				}

				// Skip the environment check since we're using a remote server
				onComplete(null)
			} finally {
				setSavingMdnsId(null)
			}
		},
		[discoveredServers, saveDiscoveredServer, switchServer, onComplete],
	)

	// --- Render ---

	const needsOpenCodeInstall = openCodeResult && !openCodeResult.installed
	const needsOpenCodeUpdate = openCodeResult?.compatibility === "too-old"
	const needsGitInstall = gitResult && !gitResult.installed
	const needsPythonInstall = pythonResult && !pythonResult.installed
	
	const needsCloudflaredInstall = cloudflaredInstalled === false
	const showOpenCodeInstallUI = needsOpenCodeInstall || needsOpenCodeUpdate
	const showGitInstallUI = needsGitInstall && !showOpenCodeInstallUI
	
	const showPythonInstallUI = needsPythonInstall && !showOpenCodeInstallUI && !showGitInstallUI
	const showAgentReachInstallBtn = !needsPythonInstall && !showOpenCodeInstallUI && !showGitInstallUI && !showPythonInstallUI
	
	const showCloudflaredInstallUI = needsCloudflaredInstall && !showOpenCodeInstallUI && !showGitInstallUI && !showPythonInstallUI && !showAgentReachInstallBtn
	
	const showInstallUI = showOpenCodeInstallUI || showGitInstallUI || showPythonInstallUI || showAgentReachInstallBtn || showCloudflaredInstallUI
	const showRemoteOption = showOpenCodeInstallUI && !installing
	const manualUrlValid = manualUrl.trim().length > 0

	return (
		<div className="flex h-full flex-col items-center justify-center px-6">
			<div className="w-full max-w-lg space-y-6">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-foreground">Environment Check</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Verifying your setup is ready for Devil-ai.
					</p>
				</div>

				{/* Check list */}
				<div className="space-y-3">
					{checks.map((check) => (
						<div
							key={check.id}
							data-slot="onboarding-card"
							className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
						>
							<div className="mt-0.5 shrink-0">
								<CheckStatusIcon status={check.status} />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-foreground">{check.label}</p>
								{check.detail && (
									<p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>
								)}
							</div>
						</div>
					))}
				</div>

				{/* Install UI */}
				{showInstallUI && !installing && (
					<div
						data-slot="onboarding-card"
						className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
					>
					{showOpenCodeInstallUI && (
						<>
							<p className="text-sm text-muted-foreground">
								{needsOpenCodeUpdate
									? "Your engine version is too old. Update to continue."
									: "Devil AI needs the engine to function. Install it to continue."}
							</p>
							<Button size="sm" onClick={() => handleInstall("opencode")} className="gap-2">
								<DownloadIcon aria-hidden="true" className="size-3.5" />
								{needsOpenCodeUpdate ? "Update Engine" : "Install Engine"}
							</Button>
							<p className="text-xs text-muted-foreground/60">
								Or run: curl -fsSL https://opencode.ai/install | bash
							</p>
						</>
					)}
						{showGitInstallUI && (
							<>
								<p className="text-sm text-muted-foreground">
									Git is not installed. Install Git for version control features (commit, branch, diff).
								</p>
								<div className="flex gap-2">
									<Button size="sm" onClick={() => handleInstall("git")} className="gap-2">
										<DownloadIcon aria-hidden="true" className="size-3.5" />
										Install Git
									</Button>
									<Button size="sm" variant="outline" onClick={onSkip}>
										Skip for now
									</Button>
								</div>
								{window.devilAi?.platform === "win32" && (
									<p className="text-xs text-muted-foreground/60">
										Uses winget to install Git for Windows silently
									</p>
								)}
							</>
						)}
						{showPythonInstallUI && (
							<>
								<p className="text-sm text-muted-foreground">
									Python 3 is not installed. Python is required for Agent Reach internet search capabilities.
								</p>
								<div className="flex gap-2">
									<Button size="sm" onClick={() => {
										if (window.devilAi?.platform === "win32") {
											window.open("https://www.python.org/downloads/windows/")
										} else {
											window.open("https://www.python.org/downloads/")
										}
									}} className="gap-2">
										<DownloadIcon aria-hidden="true" className="size-3.5" />
										Download Python
									</Button>
									<Button size="sm" variant="outline" onClick={onSkip}>
										Skip for now
									</Button>
								</div>
								<p className="text-xs text-muted-foreground/60">
									Please install Python and then click Re-check.
								</p>
							</>
						)}
						{showAgentReachInstallBtn && (
							<>
								<p className="text-sm text-muted-foreground">
									Install Agent Reach to enable AI internet search and web interaction features.
								</p>
								<div className="flex gap-2">
									<Button size="sm" onClick={() => handleInstall("agent-reach")} className="gap-2">
										<DownloadIcon aria-hidden="true" className="size-3.5" />
										Install Agent Reach
									</Button>
									<Button size="sm" variant="outline" onClick={onSkip}>
										Skip for now
									</Button>
								</div>
								<p className="text-xs text-muted-foreground/60">
									Uses Python venv to securely install Agent Reach
								</p>
							</>
						)}
						{showCloudflaredInstallUI && (
							<>
								<p className="text-sm text-muted-foreground">
									Cloudflare Tunnel is required for screen sharing and session sharing features.
								</p>
								<Button size="sm" onClick={() => handleInstall("cloudflared")} className="gap-2">
									<DownloadIcon aria-hidden="true" className="size-3.5" />
									Install Cloudflare Tunnel
								</Button>
								<p className="text-xs text-muted-foreground/60">
									{window.devilAi?.platform === "darwin"
										? "Uses Homebrew to install cloudflared"
										: window.devilAi?.platform === "win32"
											? "Uses winget to install cloudflared"
											: "Downloads cloudflared binary"}
								</p>
							</>
						)}
					</div>
				)}

				{/* Remote server alternative (shown when CLI is missing) */}
				{showRemoteOption && (
					<div
						data-slot="onboarding-card"
						className="space-y-4 rounded-lg border border-border bg-muted/30 p-4"
					>
						<div className="flex items-center gap-2">
							<GlobeIcon aria-hidden="true" className="size-4 text-primary" />
							<p className="text-sm font-medium text-foreground">Or connect to a remote server</p>
						</div>
						<p className="text-xs text-muted-foreground">
							Connect to a Devil AI Engine running on another machine instead of installing
							locally.
						</p>

						{/* mDNS discovered servers */}
						{discoveredServers.length > 0 && (
							<div className="space-y-2">
								<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<RadarIcon aria-hidden="true" className="size-3" />
									Discovered on your network
								</p>
								<div className="space-y-1.5">
									{discoveredServers.map((server) => {
										const displayAddr =
											server.addresses.find((a) => !a.includes(":")) || server.host
										const isSaving = savingMdnsId === server.id

										return (
											<button
												key={server.id}
												type="button"
												disabled={isSaving}
												onClick={() => handleConnectDiscovered(server.id)}
												className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
											>
												<RadarIcon
													aria-hidden="true"
													className="size-4 shrink-0 text-muted-foreground"
												/>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-foreground">
														{server.name}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{displayAddr}:{server.port}
													</p>
												</div>
												{isSaving ? (
													<Loader2Icon
														aria-hidden="true"
														className="size-4 shrink-0 animate-spin text-primary"
													/>
												) : (
													<ArrowRightIcon
														aria-hidden="true"
														className="size-4 shrink-0 text-muted-foreground"
													/>
												)}
											</button>
										)
									})}
								</div>
							</div>
						)}

						{/* Manual connect form */}
						{!showManualForm ? (
							<button
								type="button"
								onClick={() => setShowManualForm(true)}
								className="flex w-full items-center gap-3 rounded-md border border-dashed border-border bg-background px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
							>
								<GlobeIcon aria-hidden="true" className="size-4 shrink-0" />
								<span>Connect manually by URL...</span>
							</button>
						) : (
							<div className="space-y-3 rounded-md border border-border bg-background p-3">
								<div className="space-y-1.5">
									<Label htmlFor="onboard-url" className="text-xs">
										Server URL
									</Label>
									<Input
										id="onboard-url"
										placeholder="https://engine.example.com:4096"
										value={manualUrl}
										onChange={(e) => {
											setManualUrl(e.target.value)
											setManualTestResult(undefined)
										}}
										className="h-8 text-sm"
									/>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div className="space-y-1.5">
										<Label htmlFor="onboard-username" className="text-xs">
											Username
										</Label>
									<Input
										id="onboard-username"
										placeholder="admin"
										value={manualUsername}
										onChange={(e) => setManualUsername(e.target.value)}
										className="h-8 text-sm"
									/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="onboard-password" className="text-xs">
											Password
										</Label>
										<Input
											id="onboard-password"
											type="password"
											placeholder="Optional"
											value={manualPassword}
											onChange={(e) => setManualPassword(e.target.value)}
											className="h-8 text-sm"
										/>
									</div>
								</div>

								{/* Test result */}
								{manualTestResult === null && (
									<p className="flex items-center gap-1 text-xs text-green-600">
										<CheckCircle2Icon aria-hidden="true" className="size-3" />
										Connection successful
									</p>
								)}
								{manualTestResult !== null && manualTestResult !== undefined && (
									<p className="flex items-center gap-1 text-xs text-destructive">
										<CircleAlertIcon aria-hidden="true" className="size-3" />
										{manualTestResult}
									</p>
								)}

								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled={!manualUrlValid || manualTesting}
										onClick={handleManualTest}
									>
										{manualTesting && (
											<Loader2Icon aria-hidden="true" className="size-3 animate-spin" />
										)}
										Test
									</Button>
									<Button
										size="sm"
										disabled={!manualUrlValid || manualSaving}
										onClick={handleManualConnect}
									>
										{manualSaving && (
											<Loader2Icon aria-hidden="true" className="size-3 animate-spin" />
										)}
										Connect
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setShowManualForm(false)
											setManualTestResult(undefined)
										}}
									>
										Cancel
									</Button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Install terminal output */}
				{(installing || installOutput.length > 0) && (
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
					{installing && (
						<div className="mt-1 flex items-center gap-2 text-zinc-400">
							<Spinner className="size-3" />
							Installing {installingTarget === "git" ? "Git" : installingTarget === "cloudflared" ? "Cloudflare Tunnel" : installingTarget === "agent-reach" ? "Agent Reach" : "Engine"}...
						</div>
					)}
					</div>
				)}

				{/* Retry / Continue buttons */}
				<div className="flex justify-center gap-3">
					{!allDone && !showOpenCodeInstallUI && !installing && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								hasRun.current = false
								runChecks()
							}}
							className="gap-2"
						>
							<RefreshCwIcon aria-hidden="true" className="size-3.5" />
							Re-check
						</Button>
					)}

					{allDone && openCodeResult?.installed && cloudflaredInstalled && (
						<Button
							size="default"
							onClick={() => onComplete(openCodeResult?.version ?? null)}
							className="gap-2"
						>
							Continue
							<ArrowRightIcon aria-hidden="true" className="size-4" />
						</Button>
					)}
					{allDone && openCodeResult?.installed && !cloudflaredInstalled && (
						<p className="text-xs text-muted-foreground text-center">
							Install Cloudflare Tunnel to continue
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

// ============================================================
// Sub-components
// ============================================================

function CheckStatusIcon({ status }: { status: CheckStatus }) {
	switch (status) {
		case "pending":
			return <div className="size-4 rounded-full border border-muted-foreground/20" />
		case "running":
			return <Spinner className="size-4" />
		case "success":
			return <CheckCircle2Icon className="size-4 text-emerald-500" />
		case "warning":
			return <AlertCircleIcon className="size-4 text-amber-500" />
		case "error":
			return <XCircleIcon className="size-4 text-red-500" />
	}
}
