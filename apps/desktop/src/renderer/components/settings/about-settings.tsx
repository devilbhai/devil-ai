import { Button } from "@devil-ai/ui/components/button"
import { CheckCircle2Icon, DownloadIcon, Loader2Icon, ExternalLinkIcon, RefreshCwIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useUpdater } from "../../hooks/use-updater"
import { SettingsRow } from "./settings-row"
import { SettingsSection } from "./settings-section"

const isElectron = typeof window !== "undefined" && "devilAi" in window

export function AboutSettings() {
	const [appVersion, setAppVersion] = useState("")
	const [isDev, setIsDev] = useState(false)

	const updater = useUpdater()

	useEffect(() => {
		if (!isElectron) return
		window.devilAi.getAppInfo().then((info) => {
			setAppVersion(info.version)
			setIsDev(info.isDev)
		})
	}, [])



	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold">About</h2>
			</div>

			<SettingsSection>
				<SettingsRow label="Version" description={isDev ? "Development build" : undefined}>
					<span className="text-sm text-muted-foreground">{appVersion || "..."}</span>
				</SettingsRow>
				<SettingsRow
					label="Updates"
				description={
						updater.status === "available"
							? updater.canAutoInstall
								? `Version ${updater.version} available`
								: `Version ${updater.version} available (download from website)`
							: updater.status === "ready"
								? "Update downloaded, restart to apply"
								: updater.status === "latest"
									? "You're using the latest version"
									: updater.status === "error"
										? (updater.error ?? "Update check failed")
										: undefined
				}
				>
					{updater.status === "idle" && (
						<Button variant="outline" size="sm" onClick={updater.checkForUpdates}>
							Check for updates
						</Button>
					)}
					{updater.status === "checking" && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
							Checking...
						</div>
					)}
					{updater.status === "latest" && (
						<div className="flex items-center gap-2">
							<CheckCircle2Icon aria-hidden="true" className="size-4 text-emerald-500" />
							<span className="text-sm text-emerald-500">Up to date</span>
							<Button variant="ghost" size="sm" onClick={updater.checkForUpdates} className="ml-2 gap-1.5">
								<RefreshCwIcon aria-hidden="true" className="size-3" />
								Re-check
							</Button>
						</div>
					)}
					{updater.status === "available" && (
						<Button variant="outline" size="sm" onClick={updater.downloadUpdate} className="gap-1.5">
							<DownloadIcon aria-hidden="true" className="size-4" />
							{updater.canAutoInstall ? `Download v${updater.version}` : "Download from website"}
						</Button>
					)}
					{updater.status === "downloading" && (
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
								{updater.progress
									? `Downloading... ${Math.round(updater.progress.percent)}%`
									: "Downloading..."}
							</div>
							{updater.progress && (
								<div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
									<div
										className="h-full rounded-full bg-primary transition-all duration-300"
										style={{ width: `${updater.progress.percent}%` }}
									/>
								</div>
							)}
							{updater.progress && (
								<span className="text-xs text-muted-foreground/60">
									{(updater.progress.transferred / 1048576).toFixed(0)}MB / {(updater.progress.total / 1048576).toFixed(0)}MB
								</span>
							)}
						</div>
					)}
					{updater.status === "ready" && (
						<Button variant="default" size="sm" onClick={updater.installUpdate} className="gap-1.5">
							<RefreshCwIcon aria-hidden="true" className="size-3" />
							Restart & Install
						</Button>
					)}
					{updater.status === "error" && (
						<Button variant="outline" size="sm" onClick={updater.checkForUpdates} className="gap-1.5">
							<RefreshCwIcon aria-hidden="true" className="size-3" />
							Retry
						</Button>
					)}
				</SettingsRow>
		</SettingsSection>

		<SettingsSection title="Credits">
				<div className="space-y-4">
					<div className="rounded-lg border border-border bg-muted/30 p-4">
						<div className="space-y-3">
							<div>
								<h3 className="text-lg font-bold text-foreground">Devil AI</h3>
								<p className="text-sm text-muted-foreground">
									The AI-powered coding companion that sees what you see.
								</p>
							</div>
							<div className="space-y-1.5 text-sm">
								<p className="text-muted-foreground">
									<span className="font-medium text-foreground">Created by </span>
									<span className="font-semibold text-primary">Devil Bhai</span>
								</p>
								<p className="text-xs text-muted-foreground/70 italic">
									"Building the future of coding, one commit at a time."
								</p>
							</div>
							<div className="border-t border-border pt-3">
								<p className="text-xs text-muted-foreground/60">
									Built with Electron, React, TypeScript, and a passion for developer experience.
								</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 px-2 text-xs"
						onClick={() => window.open("https://github.com/devilbhai", "_blank")}
					>
						<ExternalLinkIcon aria-hidden="true" className="size-3" />
						GitHub
					</Button>
					</div>
				</div>
			</SettingsSection>
		</div>
	)
}
