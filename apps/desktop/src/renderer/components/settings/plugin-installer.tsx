/**
 * Plugin Installer - Install MCP servers, skills, and plugins from GitHub repos.
 */

import { useState, useCallback, useEffect } from "react"
import { useAtomValue } from "jotai"
import { puzzleIconAtom } from "../../atoms/feature-flags"
import { installPlugin, listInstalledPlugins, uninstallPlugin } from "../../services/backend"
import { SettingsSection } from "./settings-section"
import {
	DownloadIcon,
	TrashIcon,
	LoaderIcon,
	CheckCircleIcon,
	XCircleIcon,
	ServerIcon,
	BookOpenIcon,
	PackageIcon,
} from "lucide-react"

// ============================================================
// Types
// ============================================================

interface InstallStatus {
	loading: boolean
	result: null | {
		success: boolean
		message: string
		type: string
		name: string
	}
}

// ============================================================
// Component
// ============================================================

export function PluginInstaller() {
	useAtomValue(puzzleIconAtom) // Feature flag (loaded for potential future use)
	const [url, setUrl] = useState("")
	const [forcedType, setForcedType] = useState<"mcp" | "skill" | "plugin" | "">("")
	const [installStatus, setInstallStatus] = useState<InstallStatus>({
		loading: false,
		result: null,
	})
	const [installed, setInstalled] = useState<{
		mcpServers: string[]
		skills: string[]
		plugins: string[]
	}>({ mcpServers: [], skills: [], plugins: [] })
	const [loadingList, setLoadingList] = useState(true)

	// Load installed plugins on mount
	useEffect(() => {
		listInstalledPlugins()
			.then(setInstalled)
			.catch(() => {})
			.finally(() => setLoadingList(false))
	}, [])

	const handleInstall = useCallback(async () => {
		if (!url.trim()) return

		setInstallStatus({ loading: true, result: null })

		try {
			const type = forcedType || undefined
			const result = await installPlugin(url.trim(), type as "mcp" | "skill" | "plugin" | undefined)
			setInstallStatus({ loading: false, result })

			// Refresh list on success
			if (result.success) {
				const updated = await listInstalledPlugins()
				setInstalled(updated)
				setUrl("")
			}
		} catch (err) {
			setInstallStatus({
				loading: false,
				result: {
					success: false,
					message: err instanceof Error ? err.message : "Installation failed",
					type: "unknown",
					name: "",
				},
			})
		}
	}, [url, forcedType])

	const handleUninstall = useCallback(async (name: string, type: "mcp" | "skill" | "plugin") => {
		try {
			await uninstallPlugin(name, type)
			const updated = await listInstalledPlugins()
			setInstalled(updated)
		} catch {
			// Ignore errors
		}
	}, [])

	const totalInstalled = installed.mcpServers.length + installed.skills.length + installed.plugins.length

	return (
		<div className="space-y-6">
			{/* Install Form */}
			<SettingsSection title="Install from GitHub">
				<div className="space-y-3 px-4 py-3">
					<div className="flex gap-2">
						<input
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://github.com/user/repo"
							className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleInstall()
							}}
							disabled={installStatus.loading}
						/>
						<select
							value={forcedType}
							onChange={(e) => setForcedType(e.target.value as typeof forcedType)}
							className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
							disabled={installStatus.loading}
						>
							<option value="">Auto-detect</option>
							<option value="mcp">MCP Server</option>
							<option value="skill">Skill</option>
							<option value="plugin">Plugin</option>
						</select>
						<button
							type="button"
							onClick={handleInstall}
							disabled={installStatus.loading || !url.trim()}
							className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
						>
							{installStatus.loading ? (
								<LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" />
							) : (
								<DownloadIcon aria-hidden="true" className="size-3.5" />
							)}
							Install
						</button>
					</div>

					{/* Status message */}
					{installStatus.result && (
						<div
							className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
								installStatus.result.success
									? "bg-green-500/10 text-green-500"
									: "bg-destructive/10 text-destructive"
							}`}
						>
							{installStatus.result.success ? (
								<CheckCircleIcon aria-hidden="true" className="size-4 shrink-0 mt-0.5" />
							) : (
								<XCircleIcon aria-hidden="true" className="size-4 shrink-0 mt-0.5" />
							)}
							<div>
								<div>{installStatus.result.message}</div>
								{installStatus.result.success && (
									<div className="mt-1 text-xs opacity-75">
										Type: {installStatus.result.type} | Name: {installStatus.result.name}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</SettingsSection>

			{/* Installed List */}
			<SettingsSection title={`Installed (${totalInstalled})`}>
				{loadingList ? (
					<div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
						<LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" />
						Loading...
					</div>
				) : totalInstalled === 0 ? (
					<div className="px-4 py-3 text-sm text-muted-foreground">
						No plugins installed. Install from GitHub above.
					</div>
				) : (
					<div className="divide-y divide-border">
						{/* MCP Servers */}
						{installed.mcpServers.map((name) => (
							<InstalledItem
								key={`mcp-${name}`}
								name={name}
								type="mcp"
								icon={<ServerIcon aria-hidden="true" className="size-4" />}
								onUninstall={handleUninstall}
							/>
						))}

						{/* Skills */}
						{installed.skills.map((name) => (
							<InstalledItem
								key={`skill-${name}`}
								name={name}
								type="skill"
								icon={<BookOpenIcon aria-hidden="true" className="size-4" />}
								onUninstall={handleUninstall}
							/>
						))}

						{/* Plugins */}
						{installed.plugins.map((name) => (
							<InstalledItem
								key={`plugin-${name}`}
								name={name}
								type="plugin"
								icon={<PackageIcon aria-hidden="true" className="size-4" />}
								onUninstall={handleUninstall}
							/>
						))}
					</div>
				)}
			</SettingsSection>
		</div>
	)
}

// ============================================================
// Sub-component for installed items
// ============================================================

function InstalledItem({
	name,
	type,
	icon,
	onUninstall,
}: {
	name: string
	type: "mcp" | "skill" | "plugin"
	icon: React.ReactNode
	onUninstall: (name: string, type: "mcp" | "skill" | "plugin") => void
}) {
	const [removing, setRemoving] = useState(false)

	const handleRemove = useCallback(async () => {
		setRemoving(true)
		try {
			await onUninstall(name, type)
		} finally {
			setRemoving(false)
		}
	}, [name, type, onUninstall])

	const typeColors = {
		mcp: "bg-blue-500/10 text-blue-500",
		skill: "bg-purple-500/10 text-purple-500",
		plugin: "bg-green-500/10 text-green-500",
	}

	return (
		<div className="flex items-center justify-between gap-3 px-4 py-2.5">
			<div className="flex items-center gap-2.5 min-w-0">
				<div className={`rounded-md p-1 ${typeColors[type]}`}>{icon}</div>
				<div className="min-w-0">
					<div className="text-sm font-medium truncate">{name}</div>
					<div className="text-xs text-muted-foreground capitalize">{type}</div>
				</div>
			</div>
			<button
				type="button"
				onClick={handleRemove}
				disabled={removing}
				className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
				title={`Remove ${name}`}
			>
				{removing ? (
					<LoaderIcon aria-hidden="true" className="size-4 animate-spin" />
				) : (
					<TrashIcon aria-hidden="true" className="size-4" />
				)}
			</button>
		</div>
	)
}
