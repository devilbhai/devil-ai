/**
 * Automation Templates Gallery — pre-built automation templates.
 */
import { useAtomValue } from "jotai"
import { useState } from "react"
import {
	templatesGalleryAtom,
	type AutomationTemplate,
} from "../../atoms/automation-templates"
import { Button } from "@devil-ai/ui/components/button"

const CATEGORY_LABELS: Record<string, string> = {
	security: "🛡️ Security",
	quality: "✨ Quality",
	testing: "🧪 Testing",
	documentation: "📚 Docs",
	deployment: "🚀 Deploy",
	maintenance: "🔧 Maintenance",
}

const CATEGORY_COLORS: Record<string, string> = {
	security: "bg-red-500/10 text-red-500",
	quality: "bg-purple-500/10 text-purple-500",
	testing: "bg-green-500/10 text-green-500",
	documentation: "bg-blue-500/10 text-blue-500",
	deployment: "bg-orange-500/10 text-orange-500",
	maintenance: "bg-yellow-500/10 text-yellow-500",
}

export function TemplateGallery() {
	const templates = useAtomValue(templatesGalleryAtom)
	const [selected, setSelected] = useState<AutomationTemplate | null>(null)
	const [filter, setFilter] = useState<string | null>(null)

	const categories = [...new Set(templates.map((t) => t.category))]
	const filtered = filter
		? templates.filter((t) => t.category === filter)
		: templates

	return (
		<div className="space-y-4">
			{/* Header */}
			<div>
				<h3 className="text-lg font-semibold">Automation Templates</h3>
				<p className="text-sm text-muted-foreground">
					One-click automations for common tasks
				</p>
			</div>

			{/* Category filters */}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setFilter(null)}
					className={`rounded-full px-3 py-1 text-xs transition-colors ${
						!filter
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:text-foreground"
					}`}
				>
					All
				</button>
				{categories.map((cat) => (
					<button
						key={cat}
						type="button"
						onClick={() => setFilter(filter === cat ? null : cat)}
						className={`rounded-full px-3 py-1 text-xs transition-colors ${
							filter === cat
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:text-foreground"
						}`}
					>
						{CATEGORY_LABELS[cat] ?? cat}
					</button>
				))}
			</div>

			{/* Templates grid */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{filtered.map((template) => (
					<TemplateCard
						key={template.id}
						template={template}
						selected={selected?.id === template.id}
						onSelect={() =>
							setSelected(selected?.id === template.id ? null : template)
						}
					/>
				))}
			</div>
		</div>
	)
}

function TemplateCard({
	template,
	selected,
	onSelect,
}: {
	template: AutomationTemplate
	selected: boolean
	onSelect: () => void
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
				selected
					? "border-primary bg-primary/5"
					: "border-border hover:border-muted-foreground/30"
			}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<span
						className={`inline-block rounded px-1.5 py-0.5 text-xs ${CATEGORY_COLORS[template.category] ?? ""}`}
					>
						{CATEGORY_LABELS[template.category] ?? template.category}
					</span>
				</div>
				<span className="text-xs text-muted-foreground">
					{template.installCount} installs
				</span>
			</div>

			<div>
				<h4 className="font-medium">{template.name}</h4>
				<p className="mt-1 text-xs text-muted-foreground">
					{template.description}
				</p>
			</div>

			<div className="flex flex-wrap gap-1">
				{template.tags.slice(0, 3).map((tag) => (
					<span
						key={tag}
						className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
					>
						{tag}
					</span>
				))}
			</div>

			{selected && (
				<div className="mt-2 flex gap-2">
					<Button size="sm" className="flex-1">
						Install
					</Button>
					<Button size="sm" variant="outline">
						Preview
					</Button>
				</div>
			)}
		</button>
	)
}
