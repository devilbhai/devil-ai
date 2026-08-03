import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@devil-ai/ui/components/dialog"
import { Switch } from "@devil-ai/ui/components/switch"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { useAtom, useAtomValue } from "jotai"
import {
	premiumSectionsEnabledAtom,
	voiceInputEnabledAtom,
	ragEnabledAtom,
	ocrEnabledAtom,
	pluginInstallerEnabledAtom,
	terminalEnabledAtom,
	databaseViewerEnabledAtom,
	apiTesterEnabledAtom,
	analyticsEnabledAtom,
	fzfEnabledAtom,
	codegraphEnabledAtom,
	ponytailEnabledAtom,
	userFeaturesAtom,
	addUserFeatureAtom,
	toggleUserFeatureAtom,
	removeUserFeatureAtom,
} from "../../atoms/feature-flags"
import { Suspense, lazy, useCallback, useState } from "react"
import { logFeatureEvent, getFeatureEvents } from "../../lib/feature-telemetry"
import { SettingsSection } from "./settings-section"
import { EyeIcon, TrashIcon, SearchIcon, CodeIcon, WrenchIcon } from "lucide-react"

// Lazy-loaded preview components (only imported when dialog opens)
const PremiumPreview = lazy(() =>
	import("../premium/premium-preview").then((m) => ({ default: m.PremiumPreview })),
)
const PluginInstallerView = lazy(() =>
	import("./plugin-installer").then((m) => ({ default: m.PluginInstaller })),
)

// ============================================================
// Built-in feature toggle definitions
// ============================================================

type BuiltInFeature = {
	id: string
	label: string
	description: string
	atom: typeof premiumSectionsEnabledAtom
	telemetryId: string
	icon?: typeof EyeIcon
}

const BUILT_IN_FEATURES: BuiltInFeature[] = [
	{
		id: "voiceInput",
		label: "Voice Input (Whisper / Web Speech)",
		description: "Speak to type — uses Web Speech API (free, built-in)",
		atom: voiceInputEnabledAtom,
		telemetryId: "voiceInput",
	},
	{
		id: "rag",
		label: "Local RAG (LanceDB)",
		description: "Session context memory for smarter responses",
		atom: ragEnabledAtom,
		telemetryId: "rag",
	},
	{
		id: "ocr",
		label: "Image OCR (Tesseract.js)",
		description: "Extract text from pasted/uploaded images",
		atom: ocrEnabledAtom,
		telemetryId: "ocr",
	},
	{
		id: "premiumSections",
		label: "Premium UI Sections",
		description: "Enable premium hero/testimonials sections",
		atom: premiumSectionsEnabledAtom,
		telemetryId: "premiumSections",
	},
	{
		id: "pluginInstaller",
		label: "Plugin Installer (MCP / Skills / Plugins)",
		description: "Install MCP servers, skills, and plugins from GitHub",
		atom: pluginInstallerEnabledAtom,
		telemetryId: "pluginInstaller",
	},
	{
		id: "terminal",
		label: "Built-in Terminal",
		description: "Embedded terminal for running commands without leaving the app",
		atom: terminalEnabledAtom,
		telemetryId: "terminal",
	},
	{
		id: "databaseViewer",
		label: "Database Viewer",
		description: "Browse and query SQLite database tables directly",
		atom: databaseViewerEnabledAtom,
		telemetryId: "databaseViewer",
	},
	{
		id: "apiTester",
		label: "API Tester",
		description: "Built-in REST API testing tool (like Postman)",
		atom: apiTesterEnabledAtom,
		telemetryId: "apiTester",
	},
	{
		id: "analytics",
		label: "Analytics Dashboard",
		description: "Track usage stats, costs, and productivity metrics",
		atom: analyticsEnabledAtom,
		telemetryId: "analytics",
	},
	{
		id: "fzf",
		label: "fzf (Fuzzy Finder)",
		description: "Fast file search and filtering for command palette and file picker",
		atom: fzfEnabledAtom,
		telemetryId: "fzf",
		icon: SearchIcon,
	},
	{
		id: "codegraph",
		label: "CodeGraph (Code Knowledge Graph)",
		description: "AI-powered code understanding via knowledge graphs",
		atom: codegraphEnabledAtom,
		telemetryId: "codegraph",
		icon: CodeIcon,
	},
	{
		id: "ponytail",
		label: "Ponytail (Code Quality)",
		description: "Detect over-engineering in generated code",
		atom: ponytailEnabledAtom,
		telemetryId: "ponytail",
		icon: WrenchIcon,
	},
]

// ============================================================
// Component
// ============================================================

export function ExperimentalFeaturesSettings() {
	const userFeatures = useAtomValue(userFeaturesAtom)
	const [, addUserFeature] = useAtom(addUserFeatureAtom)
	const [, toggleUserFeature] = useAtom(toggleUserFeatureAtom)
	const [, removeUserFeature] = useAtom(removeUserFeatureAtom)

	const [newFeatureName, setNewFeatureName] = useState("")
	const [previewOpen, setPreviewOpen] = useState(false)
	const [previewType, setPreviewType] = useState<"premium" | "pluginInstaller">("premium")

	const handleAdd = useCallback(() => {
		const name = newFeatureName.trim()
		if (!name) return
		addUserFeature(name)
		logFeatureEvent(`user:${name}`, "added")
		setNewFeatureName("")
	}, [newFeatureName, addUserFeature])

	const handleToggleUser = useCallback(
		(id: string, name: string, enabled: boolean) => {
			toggleUserFeature(id)
			logFeatureEvent(`user:${name}`, enabled ? "disabled" : "enabled")
		},
		[toggleUserFeature],
	)

	const handleRemoveUser = useCallback(
		(id: string, name: string) => {
			removeUserFeature(id)
			logFeatureEvent(`user:${name}`, "removed")
		},
		[removeUserFeature],
	)

	const openPreview = useCallback((type: "premium" | "pluginInstaller") => {
		setPreviewType(type)
		setPreviewOpen(true)
	}, [])

	const events = getFeatureEvents(10)

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold">Experimental Features</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Toggle optional features including developer tools. These are loaded lazily to avoid affecting app startup.
				</p>
			</div>

			{/* Built-in feature toggles + preview buttons */}
			<SettingsSection title="Built-in Features">
				{BUILT_IN_FEATURES.map((f) => (
					<BuiltInFeatureRow
						key={f.id}
						feature={f}
					onPreview={() => {
						if (f.id === "pluginInstaller") {
							openPreview("pluginInstaller")
						} else {
							openPreview("premium")
						}
					}}
					/>
				))}
			</SettingsSection>

			{/* User-added features */}
			<SettingsSection title="User Added Features">
			{userFeatures.length === 0 ? (
				<div className="px-4 py-3 text-sm text-muted-foreground">
					No user features added. Add custom toggles below.
				</div>
			) : (
				userFeatures.map((f) => (
					<div key={f.id} className="flex items-center justify-between gap-4 px-4 py-3">
						<div className="flex items-center gap-3">
							<Switch
								checked={f.enabled}
								onCheckedChange={() => handleToggleUser(f.id, f.name, f.enabled)}
							/>
							<div className="text-sm">{f.name}</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleRemoveUser(f.id, f.name)}
							className="text-muted-foreground hover:text-destructive"
						>
							<TrashIcon aria-hidden="true" className="size-4" />
						</Button>
					</div>
				))
			)}

			<div className="flex gap-2 px-4 py-3">
				<Input
					value={newFeatureName}
					onChange={(e) => setNewFeatureName(e.target.value)}
					placeholder="New feature name"
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd()
					}}
				/>
				<Button onClick={handleAdd} size="sm">
					Add
				</Button>
			</div>
			</SettingsSection>

			{/* Recent telemetry */}
			<SettingsSection title="Recent Activity">
				{events.length === 0 ? (
					<div className="px-4 py-3 text-sm text-muted-foreground">No feature events yet.</div>
				) : (
					<div className="max-h-48 overflow-y-auto">
						{events.map((evt) => (
							<div key={evt.id} className="flex items-center justify-between px-4 py-2 text-xs">
								<span className="font-mono">{evt.featureId}</span>
								<span className={evt.action === "enabled" ? "text-green-500" : "text-muted-foreground"}>
									{evt.action}
								</span>
								<span className="text-muted-foreground">
									{new Date(evt.timestamp).toLocaleTimeString()}
								</span>
							</div>
						))}
					</div>
				)}
			</SettingsSection>

			{/* Preview Dialog */}
			<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
					<DialogTitle>
						{previewType === "pluginInstaller"
							? "Plugin Installer"
							: "Premium Sections Preview"}
					</DialogTitle>
					<DialogDescription>
						{previewType === "pluginInstaller"
							? "Install MCP servers, skills, and plugins from GitHub repos."
							: "Premium UI sections with animations (lazy-loaded)."}
					</DialogDescription>
					</DialogHeader>
					<Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading…</div>}>
						{previewType === "pluginInstaller" ? (
							<PluginInstallerView />
						) : (
							<PremiumPreview />
						)}
					</Suspense>
				</DialogContent>
			</Dialog>
		</div>
	)
}

// ============================================================
// Sub-component for built-in feature rows
// ============================================================

function BuiltInFeatureRow({
	feature,
	onPreview,
}: {
	feature: BuiltInFeature
	onPreview: () => void
}) {
	const [enabled, setEnabled] = useAtom(feature.atom)

	const handleToggle = useCallback(
		(checked: boolean) => {
			setEnabled(checked)
			logFeatureEvent(feature.telemetryId, checked ? "enabled" : "disabled")
		},
		[setEnabled, feature.telemetryId],
	)

	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3">
			<div className="flex min-w-0 flex-col gap-0.5">
				<span className="flex items-center gap-2 text-sm font-medium">
					{feature.icon && <feature.icon aria-hidden="true" className="size-4 text-muted-foreground" />}
					{feature.label}
				</span>
				<span className="truncate text-sm text-muted-foreground">{feature.description}</span>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<button
					type="button"
					onClick={onPreview}
					className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<EyeIcon aria-hidden="true" className="size-3" />
					Preview
				</button>
				<Switch checked={enabled} onCheckedChange={handleToggle} />
			</div>
		</div>
	)
}
