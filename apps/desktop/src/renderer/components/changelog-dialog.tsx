import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@devil-ai/ui/components/dialog"
import { Button } from "@devil-ai/ui/components/button"
import { ZapIcon, SparklesIcon, WrenchIcon, AlertCircleIcon } from "lucide-react"
import { CHANGELOG, type ChangelogEntry } from "../lib/changelog"

interface ChangelogDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	latestVersion: string
}

const TYPE_ICON = {
	feature: SparklesIcon,
	improvement: ZapIcon,
	fix: WrenchIcon,
} as const

const TYPE_COLOR = {
	feature: "text-green-500",
	improvement: "text-blue-500",
	fix: "text-orange-500",
} as const

const TYPE_LABEL = {
	feature: "New",
	improvement: "Improved",
	fix: "Fixed",
} as const

function ChangelogEntryCard({ entry }: { entry: ChangelogEntry }) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<h3 className="text-lg font-semibold text-foreground">v{entry.version}</h3>
				<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
					{entry.date}
				</span>
			</div>
			<ul className="space-y-2">
				{entry.changes.map((change, i) => {
					const Icon = TYPE_ICON[change.type]
					return (
						<li key={i} className="flex items-start gap-2 text-sm">
							<Icon className={`size-4 mt-0.5 shrink-0 ${TYPE_COLOR[change.type]}`} />
							<div>
								<span className="font-medium text-muted-foreground">{TYPE_LABEL[change.type]}: </span>
								<span className="text-foreground">{change.text}</span>
							</div>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export function ChangelogDialog({ open, onOpenChange, latestVersion }: ChangelogDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border">
				<DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
					<DialogTitle className="text-xl font-semibold flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700">
							<AlertCircleIcon className="h-4 w-4 text-white" />
						</div>
						What's New in v{latestVersion}
					</DialogTitle>
					<DialogDescription>
						Here's what changed since your last update.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
					{CHANGELOG.slice(0, 3).map((entry) => (
						<ChangelogEntryCard key={entry.version} entry={entry} />
					))}
				</div>

				<DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
					<Button onClick={() => onOpenChange(false)}>
						Got it
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
