import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@devil-ai/ui/components/select"
import { Switch } from "@devil-ai/ui/components/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@devil-ai/ui/components/alert-dialog"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { type DisplayMode, autoThemeScheduleAtom, displayModeAtom, opaqueWindowsAtom } from "../../atoms/preferences"
import { pageAgentConfigAtom } from "../../atoms/page-agent"
import { useAvailableThemes, useCurrentTheme, useSetTheme, useColorScheme, useSetColorScheme, useAppIcon, useSetAppIcon } from "../../hooks/use-theme"
import { fetchOpenInTargets, setOpenInPreferred } from "../../services/backend"
import { isTelemetryEnabled, setTelemetryEnabled, initTelemetry } from "../../lib/telemetry"
import { SettingsRow } from "./settings-row"
import { SettingsSection } from "./settings-section"
import { MonitorIcon, MoonIcon, SunIcon, BatteryIcon, BarChart3Icon } from "lucide-react"

const isElectron = typeof window !== "undefined" && "devilAi" in window

export function GeneralSettings() {
	return (
		<div className="mx-auto max-w-4xl space-y-6 pb-10">
			<SettingsSection title="General">
				<OpenDestinationRow />
				<PageAgentSettingsRow />
				<TelemetryRow />
				<PreventSleepRow />
			</SettingsSection>

			<SettingsSection title="Appearance">
				<ColorSchemeRow />
				<ThemeStyleRow />
				{isElectron && window.devilAi?.platform === "darwin" && <AppIconRow />}
				<AutoThemeScheduleRow />
				<OpaqueWindowsRow />
				<DisplayModeRow />
			</SettingsSection>
		</div>
	)
}

function OpenDestinationRow() {
	const [targets, setTargets] = useState<{ id: string; label: string; available: boolean }[]>([])
	const [preferred, setPreferred] = useState<string | null>(null)

	useEffect(() => {
		if (!isElectron) return
		fetchOpenInTargets().then((result) => {
			setTargets(result.targets.filter((t) => t.available))
			setPreferred(result.preferredTarget)
		})
	}, [])

	const handleChange = useCallback(async (value: string) => {
		setPreferred(value)
		await setOpenInPreferred(value)
	}, [])

	if (targets.length === 0) return null

	return (
		<SettingsRow
			label="Default open destination"
			description="Where files and folders open by default"
		>
			<Select
				value={preferred ?? undefined}
				onValueChange={(v) => {
					if (v !== null) handleChange(v)
				}}
			>
				<SelectTrigger className="min-w-[180px]">
					<SelectValue placeholder="Select..." />
				</SelectTrigger>
				<SelectContent>
					{targets.map((t) => (
						<SelectItem key={t.id} value={t.id}>
							{t.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</SettingsRow>
	)
}
function ColorSchemeRow() {
	const colorScheme = useColorScheme()
	const setColorScheme = useSetColorScheme()

	const options = [
		{ value: "light", label: "Light", icon: SunIcon },
		{ value: "dark", label: "Dark", icon: MoonIcon },
		{ value: "system", label: "System", icon: MonitorIcon },
	]

	return (
		<SettingsRow label="Color Scheme" description="Use light, dark, or match your system">
			<div className="flex items-center rounded-md border border-border">
				{options.map((opt) => {
					const Icon = opt.icon
					const isActive = colorScheme === opt.value
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => setColorScheme(opt.value as any)}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors first:rounded-l-md last:rounded-r-md ${
								isActive
									? "bg-accent text-accent-foreground font-medium"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<Icon aria-hidden="true" className="size-3.5" />
							{opt.label}
						</button>
					)
				})}
			</div>
		</SettingsRow>
	)
}

function ThemeStyleRow() {
	const availableThemes = useAvailableThemes()
	const currentTheme = useCurrentTheme()
	const setTheme = useSetTheme()

	return (
		<SettingsRow label="Theme Style" description="Customize Devil AI's UI appearance">
			<Select value={currentTheme.id} onValueChange={(v) => v && setTheme(v)}>
				<SelectTrigger className="min-w-[180px]">
					<SelectValue placeholder="Select theme..." />
				</SelectTrigger>
				<SelectContent>
					{availableThemes.map((theme) => (
						<SelectItem key={theme.id} value={theme.id}>
							{theme.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</SettingsRow>
	)
}

function AppIconRow() {
	const appIcon = useAppIcon()
	const setAppIcon = useSetAppIcon()

	const ICONS = [
		{ id: "default", name: "Default" },
		{ id: "devil-1", name: "Minimal Red Pitchfork" },
		{ id: "devil-2", name: "Minimal Cute Outline" },
		{ id: "devil-3", name: "Minimal Flame" },
		{ id: "devil-4", name: "Fiery Ember" },
		{ id: "devil-5", name: "Brass Steampunk" },
		{ id: "devil-6", name: "Origami Clean" },
		{ id: "devil-7", name: "Holo Emblem" },
		{ id: "devil-8", name: "Crystal Skull" },
		{ id: "devil-9", name: "Liquid Chrome" },
		{ id: "devil-10", name: "Tribal Ink" },
	]

	return (
		<SettingsRow label="App Icon" description="Choose a custom dock icon">
			<Select value={appIcon} onValueChange={(v) => v && setAppIcon(v)}>
				<SelectTrigger className="min-w-[180px]">
					<SelectValue placeholder="Select icon..." />
				</SelectTrigger>
				<SelectContent>
					{ICONS.map((icon) => (
						<SelectItem key={icon.id} value={icon.id}>
							{icon.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</SettingsRow>
	)
}

function AutoThemeScheduleRow() {
	const schedule = useAtomValue(autoThemeScheduleAtom)
	const setSchedule = useSetAtom(autoThemeScheduleAtom)
	const colorScheme = useColorScheme()

	const formatTime = (hour: number, minute: number) => {
		return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
	}

	const parseTime = (timeStr: string): { hour: number; minute: number } => {
		const [hour, minute] = timeStr.split(":").map(Number)
		return { hour: hour ?? 0, minute: minute ?? 0 }
	}

	const handleToggle = useCallback(
		(checked: boolean) => {
			setSchedule((prev) => ({ ...prev, enabled: checked }))
		},
		[setSchedule],
	)

	const handleDarkStartChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { hour, minute } = parseTime(e.target.value)
			setSchedule((prev) => ({ ...prev, darkStartHour: hour, darkStartMinute: minute }))
		},
		[setSchedule],
	)

	const handleDarkEndChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { hour, minute } = parseTime(e.target.value)
			setSchedule((prev) => ({ ...prev, darkEndHour: hour, darkEndMinute: minute }))
		},
		[setSchedule],
	)

	if (colorScheme !== "system") return null

	return (
		<SettingsRow
			label="Scheduled Dark Mode"
			description="Automatically switch between light and dark based on time of day"
		>
			<div className="flex items-center gap-4">
				<Switch checked={schedule.enabled} onCheckedChange={handleToggle} />
				{schedule.enabled && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>Dark from</span>
						<input
							type="time"
							value={formatTime(schedule.darkStartHour, schedule.darkStartMinute)}
							onChange={handleDarkStartChange}
							className="rounded border border-border bg-background px-2 py-1 text-sm"
						/>
						<span>to</span>
						<input
							type="time"
							value={formatTime(schedule.darkEndHour, schedule.darkEndMinute)}
							onChange={handleDarkEndChange}
							className="rounded border border-border bg-background px-2 py-1 text-sm"
						/>
					</div>
				)}
			</div>
		</SettingsRow>
	)
}

function OpaqueWindowsRow() {
	const opaque = useAtomValue(opaqueWindowsAtom)
	const setOpaque = useSetAtom(opaqueWindowsAtom)
	const [showDialog, setShowDialog] = useState(false)
	const [pendingChecked, setPendingChecked] = useState(false)

	const handleToggle = useCallback((checked: boolean) => {
		setPendingChecked(checked)
		setShowDialog(true)
	}, [])

	const handleConfirm = useCallback(async () => {
		setOpaque(pendingChecked)
		if (isElectron) {
			await window.devilAi.setOpaqueWindows(pendingChecked)
			window.devilAi.relaunch()
		}
	}, [pendingChecked, setOpaque])

	return (
		<>
			<SettingsRow
				label="Opaque Windows"
				description="Use solid background colors instead of translucent materials. Requires app restart."
			>
				<Switch checked={opaque} onCheckedChange={handleToggle} />
			</SettingsRow>

			<AlertDialog open={showDialog} onOpenChange={setShowDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restart Required</AlertDialogTitle>
						<AlertDialogDescription>
							Changing the window background material requires Devil AI to restart. Are you sure you want to restart now?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm}>Restart Now</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

function DisplayModeRow() {
	const displayMode = useAtomValue(displayModeAtom)
	const setDisplayMode = useSetAtom(displayModeAtom)

	return (
		<SettingsRow
			label="Display mode"
			description="Adjust how much detail is shown in conversations"
		>
			<Select
				value={displayMode}
				onValueChange={(v) => setDisplayMode(v as DisplayMode)}
				items={{ default: "Default", verbose: "Verbose" }}
			>
				<SelectTrigger className="min-w-[140px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="default">Default</SelectItem>
					<SelectItem value="verbose">Verbose</SelectItem>
				</SelectContent>
			</Select>
		</SettingsRow>
	)
}

function PageAgentSettingsRow() {
	const config = useAtomValue(pageAgentConfigAtom)
	const setConfig = useSetAtom(pageAgentConfigAtom)

	return (
		<SettingsRow
			label="Alibaba Page Agent"
			description="Enable in-browser AI agent for DOM automation. Uses your chat model — no separate API key needed. (Press Cmd+Shift+A to toggle panel)"
		>
			<div className="flex items-center gap-2">
				<Switch 
					checked={config.enabled} 
					onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked, useChatProvider: true }))} 
				/>
				<span className="text-sm font-medium">Enable Page Agent</span>
			</div>
		</SettingsRow>
	)
}

function TelemetryRow() {
	const [enabled, setEnabled] = useState(isTelemetryEnabled())

	const handleToggle = useCallback((checked: boolean) => {
		setEnabled(checked)
		setTelemetryEnabled(checked)
		if (checked) {
			initTelemetry()
		}
	}, [])

	return (
		<SettingsRow
			label="Enable Telemetry"
			description="Collect usage data and error logs to help improve Devil AI. Data is stored locally first, then synced to server every hour."
		>
			<div className="flex items-center gap-2">
				<BarChart3Icon className="size-4 text-muted-foreground" />
				<Switch checked={enabled} onCheckedChange={handleToggle} />
			</div>
		</SettingsRow>
	)
}

function PreventSleepRow() {
	const [enabled, setEnabled] = useState(() => {
		try {
			return localStorage.getItem("devil-ai-prevent-sleep") === "true"
		} catch {
			return false
		}
	})

	const handleToggle = useCallback(async (checked: boolean) => {
		setEnabled(checked)
		localStorage.setItem("devil-ai-prevent-sleep", String(checked))
		
		// Tell main process to toggle power save blocker
		if (isElectron && window.devilAi?.preventSleep !== undefined) {
			await window.devilAi.preventSleep(checked)
		}
	}, [])

	return (
		<SettingsRow
			label="Prevent Sleep"
			description="Prevent the computer from sleeping while the app is running. Useful for long-running tasks and downloads."
		>
			<div className="flex items-center gap-2">
				<BatteryIcon className="size-4 text-muted-foreground" />
				<Switch checked={enabled} onCheckedChange={handleToggle} />
		</div>
	</SettingsRow>
)
}
