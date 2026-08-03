/**
 * Settings tab for environment setup, migration management, and re-running onboarding.
 */

import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Spinner } from "@devil-ai/ui/components/spinner"
import { useAtomValue, useSetAtom } from "jotai"
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	ExternalLinkIcon,
	Loader2Icon,
	RefreshCwIcon,
	RotateCcwIcon,
	UndoIcon,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { OpenCodeCheckResult } from "../../../preload/api"
import { onboardingStateAtom } from "../../atoms/onboarding"
import { SettingsRow } from "./settings-row"
import { SettingsSection } from "./settings-section"

const isElectron = typeof window !== "undefined" && "devilAi" in window

// ============================================================
// Provider display metadata
// ============================================================

const PROVIDER_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	cursor: "Cursor",
	opencode: "Devil AI",
}

export function SetupSettings() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold">Setup</h2>
			</div>

		<OpenCodeStatusSection />
		<CloudflareTunnelSection />
		<MasterPasswordSection />
		<TelegramBotSection />
		<MigrationSection />
		<OnboardingSection />
		</div>
	)
}

// ============================================================
// Engine CLI status
// ============================================================

function OpenCodeStatusSection() {
	const [checking, setChecking] = useState(false)
	const [result, setResult] = useState<OpenCodeCheckResult | null>(null)

	const checkStatus = useCallback(async () => {
		if (!isElectron) return
		setChecking(true)
		try {
			const r = await window.devilAi.onboarding.checkOpenCode()
			setResult(r)
		} catch {
			// ignore
		} finally {
			setChecking(false)
		}
	}, [])

	useEffect(() => {
		checkStatus()
	}, [checkStatus])

	return (
		<SettingsSection title="Engine CLI">
			<SettingsRow label="Version" description={result?.path ?? "Checking..."}>
				<div className="flex items-center gap-2">
					{checking ? (
						<Spinner className="size-3.5" />
					) : result?.installed ? (
						<>
							<span className="text-sm text-muted-foreground">
								{result.version && /^\d+\.\d+/.test(result.version)
									? `v${result.version}`
									: result.version}
							</span>
							{result.compatible ? (
								<CheckCircle2Icon className="size-4 text-emerald-500" />
							) : (
								<AlertCircleIcon className="size-4 text-amber-500" />
							)}
						</>
					) : (
						<span className="text-sm text-red-500">Not found</span>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={checkStatus}
						disabled={checking}
						className="gap-1.5"
					>
						<RefreshCwIcon aria-hidden="true" className="size-3" />
						Check
					</Button>
				</div>
			</SettingsRow>

			{result && !result.compatible && result.message && (
				<div className="px-4 py-2 text-xs text-amber-500">{result.message}</div>
			)}
		</SettingsSection>
	)
}

// ============================================================
// Cloudflare Tunnel status
// ============================================================

function CloudflareTunnelSection() {
	const [checking, setChecking] = useState(false)
	const [installed, setInstalled] = useState<boolean | null>(null)

	const checkStatus = useCallback(async () => {
		if (!isElectron) return
		setChecking(true)
		try {
			const r = await window.devilAi.tunnel.check()
			setInstalled(r)
		} catch {
			// ignore
		} finally {
			setChecking(false)
		}
	}, [])

	useEffect(() => {
		checkStatus()
	}, [checkStatus])

	const installCommand = window.devilAi?.platform === "darwin"
		? "brew install cloudflare/cloudflare/cloudflared"
		: window.devilAi?.platform === "win32"
			? "winget install Cloudflare.cloudflared"
			: "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared"

	return (
		<SettingsSection title="Cloudflare Tunnel (Session Sharing)">
			<SettingsRow
				label="cloudflared"
				description={
					installed
						? "Installed - Ready for session sharing"
						: "Required for sharing sessions with others"
				}
			>
				<div className="flex items-center gap-2">
					{checking ? (
						<Spinner className="size-3.5" />
					) : installed ? (
						<>
							<span className="text-sm text-muted-foreground">Ready</span>
							<CheckCircle2Icon className="size-4 text-emerald-500" />
						</>
					) : (
						<span className="text-sm text-red-500">Not found</span>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={checkStatus}
						disabled={checking}
						className="gap-1.5"
					>
						<RefreshCwIcon aria-hidden="true" className="size-3" />
						Check
					</Button>
				</div>
			</SettingsRow>

			{!installed && !checking && (
				<div className="space-y-3">
					<div className="rounded-lg border border-border bg-muted/30 p-3">
						<p className="text-sm text-muted-foreground">
							To install cloudflared, run this command in your terminal:
						</p>
						<code className="mt-2 block rounded bg-background px-3 py-2 font-mono text-xs text-foreground">
							{installCommand}
						</code>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.open("https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/", "_blank")}
						className="gap-1.5"
					>
						<ExternalLinkIcon aria-hidden="true" className="size-3" />
						View Installation Guide
					</Button>
				</div>
			)}
		</SettingsSection>
	)
}

// ============================================================
// Master Password for Session Sharing
// ============================================================

function MasterPasswordSection() {
	const [masterPassword, setMasterPassword] = useState("")
	const [saved, setSaved] = useState(false)
	const [loading, setLoading] = useState(false)

	const loadPassword = useCallback(async () => {
		if (!isElectron) return
		try {
			const settings = await window.devilAi.getSettings()
			if (settings?.hasMasterPassword) {
				setMasterPassword("********") // placeholder so the user knows it is set
			}
		} catch {
			// Settings file doesn't exist yet
		}
	}, [])

	useEffect(() => {
		loadPassword()
	}, [loadPassword])

	const savePassword = useCallback(async () => {
		if (!isElectron) return
		setLoading(true)
		try {
			await window.devilAi.updateSettings({ masterPassword: masterPassword === "********" ? undefined : (masterPassword || "") })
			setSaved(true)
			setTimeout(() => setSaved(false), 2000)
		} catch (err) {
			console.error("Failed to save master password:", err)
		} finally {
			setLoading(false)
		}
	}, [masterPassword])

	return (
		<SettingsSection title="Session Sharing Security">
		<SettingsRow
			label="Master Password"
			description="Set a master password to access any shared session without needing the OTP"
		>
			<div className="flex items-center gap-2">
				<Input
					type="password"
					value={masterPassword}
					onChange={(e) => setMasterPassword(e.target.value)}
					placeholder="Leave empty to disable"
					className="h-8 w-48"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={savePassword}
					disabled={loading}
					className="gap-1.5"
				>
					{saved ? (
						<>
							<CheckCircle2Icon aria-hidden="true" className="size-3 text-emerald-500" />
							Saved
						</>
					) : (
						"Save"
					)}
				</Button>
			</div>
		</SettingsRow>
			<div className="rounded-lg border border-border bg-muted/30 p-3">
				<p className="text-sm text-muted-foreground">
					When sharing a session, a 6-digit OTP is generated. Viewers need either the OTP or this master password to access the shared session. Leave empty to disable master password access.
				</p>
			</div>
		</SettingsSection>
	)
}

// ============================================================
// Telegram Bot
// ============================================================

function TelegramBotSection() {
	const [token, setToken] = useState("")
	const [loading, setLoading] = useState(false)
	const [status, setStatus] = useState<{ running: boolean; tunnelUrl: string | null; userCount: number } | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [saved, setSaved] = useState(false)

	const loadToken = useCallback(async () => {
		if (!isElectron) return
		try {
			const settings = await window.devilAi.getSettings()
			if (settings?.telegramBotToken) {
				setToken(settings.telegramBotToken)
			}
			const s = await window.devilAi.telegram.getStatus()
			setStatus(s)
		} catch { /* ignore */ }
	}, [])

	useEffect(() => {
		loadToken()
	}, [loadToken])

	const saveAndStart = useCallback(async () => {
		if (!isElectron) return
		setLoading(true)
		setError(null)
		try {
			// Save token to settings
			await window.devilAi.updateSettings({ telegramBotToken: token || undefined, telegramBotEnabled: !!token.trim() })
			setSaved(true)
			setTimeout(() => setSaved(false), 2000)

			// If token provided, start the bot
			if (token.trim()) {
				await window.devilAi.telegram.start()
				const s = await window.devilAi.telegram.getStatus()
				setStatus(s)
				setError(null)
			} else {
				// Token cleared — stop the bot
				await window.devilAi.telegram.stop()
				setStatus(null)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start bot")
		} finally {
			setLoading(false)
		}
	}, [token])

	const stopBot = useCallback(async () => {
		if (!isElectron) return
		setLoading(true)
		try {
			await window.devilAi.updateSettings({ telegramBotEnabled: false })
			await window.devilAi.telegram.stop()
			const s = await window.devilAi.telegram.getStatus()
			setStatus(s)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to stop bot")
		} finally {
			setLoading(false)
		}
	}, [])

	return (
		<SettingsSection title="Telegram Bot">
		<SettingsRow
			label="Bot Token"
			description="Connect your Telegram bot to control Devil AI remotely"
		>
			<div className="flex items-center gap-2">
				<Input
					type="password"
					value={token}
					onChange={(e) => setToken(e.target.value)}
					placeholder="123456:ABC-..."
					className="h-8 w-64 font-mono"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={saveAndStart}
					disabled={loading}
					className="gap-1.5"
				>
					{loading ? (
						<Loader2Icon aria-hidden="true" className="size-3 animate-spin" />
					) : saved ? (
						<>
							<CheckCircle2Icon aria-hidden="true" className="size-3 text-emerald-500" />
							Saved
						</>
					) : (
						"Save & Start"
					)}
				</Button>
					{status?.running && (
						<Button
							variant="outline"
							size="sm"
							onClick={stopBot}
							disabled={loading}
							className="gap-1.5 text-red-500"
						>
							Stop
						</Button>
					)}
				</div>
			</SettingsRow>

			{status?.running && (
				<SettingsRow label="Status" description="Bot is active and receiving messages">
					<div className="flex items-center gap-2">
						<span className="text-sm text-emerald-500">Running</span>
						<CheckCircle2Icon className="size-4 text-emerald-500" />
					</div>
				</SettingsRow>
			)}

			{status?.tunnelUrl && (
				<SettingsRow label="Webhook URL" description="Auto-set via Cloudflare tunnel">
					<code className="max-w-sm truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
						{status.tunnelUrl}/webhook
					</code>
				</SettingsRow>
			)}

			{status?.running && (
				<SettingsRow label="Connected Users" description="Number of active Telegram conversations">
					<span className="text-sm text-muted-foreground">{status.userCount}</span>
				</SettingsRow>
			)}

			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
					<p className="text-sm text-red-500">{error}</p>
				</div>
			)}

			<div className="rounded-lg border border-border bg-muted/30 p-3">
				<p className="text-sm text-muted-foreground">
					Get a bot token from{" "}
					<a
						href="https://t.me/BotFather"
						target="_blank"
						rel="noopener noreferrer"
						className="text-foreground underline underline-offset-2 hover:text-foreground/80"
					>
						@BotFather
					</a>
					{" "}on Telegram. Commands: /start (welcome), /new (new conversation), /sessions (list sessions). The webhook URL is set automatically via Cloudflare tunnel and updates on each app restart.
				</p>
			</div>
		</SettingsSection>
	)
}

// ============================================================
// Migration management
// ============================================================

function MigrationSection() {
	const onboardingState = useAtomValue(onboardingStateAtom)
	const [restoring, setRestoring] = useState(false)
	const [restoreResult, setRestoreResult] = useState<string | null>(null)

	const handleRestore = useCallback(async () => {
		if (!isElectron) return
		setRestoring(true)
		setRestoreResult(null)
		try {
			const result = await window.devilAi.onboarding.restoreBackup()
			if (result.success) {
				setRestoreResult(`Restored ${result.restored.length} file(s)`)
			} else {
				setRestoreResult(`Errors: ${result.errors.join(", ")}`)
			}
		} catch (err) {
			setRestoreResult(err instanceof Error ? err.message : "Restore failed")
		} finally {
			setRestoring(false)
		}
	}, [])

	const migratedFrom = onboardingState.migratedFrom ?? []

	if (!onboardingState.migrationPerformed || migratedFrom.length === 0) {
		return (
			<SettingsSection title="Configuration Migration">
				<SettingsRow label="Status" description="No migration has been performed">
					<span className="text-sm text-muted-foreground">N/A</span>
				</SettingsRow>
			</SettingsSection>
		)
	}

	const migratedLabels = migratedFrom.map((p) => PROVIDER_LABELS[p] ?? p).join(", ")

	return (
		<SettingsSection title="Configuration Migration">
			<SettingsRow label="Migrated from" description={migratedLabels}>
				<CheckCircle2Icon className="size-4 text-emerald-500" />
			</SettingsRow>
			<SettingsRow
				label="Last migrated"
				description={
					onboardingState.completedAt
						? new Date(onboardingState.completedAt).toLocaleString()
						: "Unknown"
				}
			>
				<span className="text-xs text-muted-foreground">
					{migratedFrom.length} provider{migratedFrom.length === 1 ? "" : "s"}
				</span>
			</SettingsRow>
			<SettingsRow
				label="Restore backup"
				description="Undo the migration and restore original files"
			>
				<div className="flex items-center gap-2">
					{restoreResult && <span className="text-xs text-muted-foreground">{restoreResult}</span>}
					<Button
						variant="outline"
						size="sm"
						onClick={handleRestore}
						disabled={restoring}
						className="gap-1.5"
					>
						{restoring ? (
							<Spinner className="size-3" />
						) : (
							<UndoIcon aria-hidden="true" className="size-3" />
						)}
						Restore
					</Button>
				</div>
			</SettingsRow>
		</SettingsSection>
	)
}

// ============================================================
// Re-run onboarding
// ============================================================

function OnboardingSection() {
	const setOnboardingState = useSetAtom(onboardingStateAtom)

	const handleRerun = useCallback(() => {
		setOnboardingState({
			completed: false,
			completedAt: null,
			skippedSteps: [],
			migrationPerformed: false,
			migratedFrom: [],
			opencodeVersion: null,
			providersConnected: 0,
			devilrouteV: 0,
		})
		// Relaunch the app to show onboarding fresh
		if (isElectron) {
			window.devilAi.relaunch()
		}
	}, [setOnboardingState])

	return (
		<SettingsSection title="Onboarding">
			<SettingsRow
				label="Re-run setup"
				description="Reset and show the onboarding wizard again on next launch"
			>
				<Button variant="outline" size="sm" onClick={handleRerun} className="gap-1.5">
					<RotateCcwIcon aria-hidden="true" className="size-3" />
					Re-run Setup
				</Button>
			</SettingsRow>
		</SettingsSection>
	)
}
