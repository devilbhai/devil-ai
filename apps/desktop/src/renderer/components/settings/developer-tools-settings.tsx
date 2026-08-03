/**
 * Developer Tools settings page.
 *
 * Toggle-based controls for fzf, CodeGraph, and Ponytail.
 * Tools are auto-installed on first enable, can be toggled off anytime.
 */

import { Switch } from "@devil-ai/ui/components/switch"
import { useAtom } from "jotai"
import { SettingsSection } from "./settings-section"
import { SettingsRow } from "./settings-row"
import { SearchIcon, CodeIcon, WrenchIcon } from "lucide-react"
import { fzfEnabledAtom, codegraphEnabledAtom, ponytailEnabledAtom } from "../../atoms/feature-flags"

// ============================================================
// Component
// ============================================================

export function DeveloperToolsSettings() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold">Developer Tools</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Toggle developer tools. Disable if you don't use them to reduce resource usage.
				</p>
			</div>

			<FzfSection />
			<CodeGraphSection />
			<PonytailSection />
		</div>
	)
}

// ============================================================
// fzf Section
// ============================================================

function FzfSection() {
	const [enabled, setEnabled] = useAtom(fzfEnabledAtom)

	return (
		<SettingsSection
			title="fzf (Fuzzy Finder)"
			description="Fast file search and filtering for command palette and file picker"
		>
			<SettingsRow
				label="Enable fzf"
				description="Quick fuzzy file search across your project"
			>
				<div className="flex items-center gap-2">
					<SearchIcon className="size-4 text-muted-foreground" />
					<Switch checked={enabled} onCheckedChange={setEnabled} />
				</div>
			</SettingsRow>
		</SettingsSection>
	)
}

// ============================================================
// CodeGraph Section
// ============================================================

function CodeGraphSection() {
	const [enabled, setEnabled] = useAtom(codegraphEnabledAtom)

	return (
		<SettingsSection
			title="CodeGraph (Code Knowledge Graph)"
			description="AI-powered code understanding via knowledge graphs"
		>
			<SettingsRow
				label="Enable CodeGraph"
				description="Build knowledge graphs for smarter AI context"
			>
				<div className="flex items-center gap-2">
					<CodeIcon className="size-4 text-muted-foreground" />
					<Switch checked={enabled} onCheckedChange={setEnabled} />
				</div>
			</SettingsRow>
		</SettingsSection>
	)
}

// ============================================================
// Ponytail Section
// ============================================================

function PonytailSection() {
	const [enabled, setEnabled] = useAtom(ponytailEnabledAtom)

	return (
		<SettingsSection
			title="Ponytail (Code Quality)"
			description="Detect over-engineering in generated code"
		>
			<SettingsRow
				label="Enable Ponytail"
				description="Reviews code for unnecessary complexity and bloat"
			>
				<div className="flex items-center gap-2">
					<WrenchIcon className="size-4 text-muted-foreground" />
					<Switch checked={enabled} onCheckedChange={setEnabled} />
				</div>
			</SettingsRow>
		</SettingsSection>
	)
}
