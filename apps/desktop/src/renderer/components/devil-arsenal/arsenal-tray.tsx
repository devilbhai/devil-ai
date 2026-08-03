import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@devil-ai/ui/components/sheet"
import { FlameIcon } from "lucide-react"
import { HellfireProfiler } from "./features/hellfire-profiler"
import { PreCognitiveDebugging } from "./features/pre-cognitive-debugging"
import { SwarmRefactoring } from "./features/swarm-refactoring"
import { useState } from "react"

export function ArsenalTray() {
	const [open, setOpen] = useState(false)

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger render={
				<button
					type="button"
					className="flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-all border border-blue-500/20 bg-blue-500/5"
					title="Devil's Arsenal"
				>
					<FlameIcon className="size-3.5" />
				</button>
			} />
			<SheetContent className="w-[400px] sm:w-[540px] border-l border-border bg-background p-0 overflow-hidden flex flex-col">
				<SheetHeader className="p-6 pb-4 border-b border-border">
					<SheetTitle className="text-xl font-semibold flex items-center gap-2.5">
						<div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10">
							<FlameIcon className="size-4.5 text-blue-500" />
						</div>
						<span>Devil's Arsenal</span>
					</SheetTitle>
					<SheetDescription className="text-muted-foreground">
						Advanced tools and God Mode features.
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					<div className="space-y-3">
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Core Arsenal
						</h3>
						<HellfireProfiler />
					</div>

					<div className="space-y-3 pt-4 border-t border-border">
						<h3 className="text-xs font-medium text-blue-500 uppercase tracking-wider flex items-center gap-2">
							<FlameIcon className="size-3.5" />
							God-Tier Modules
						</h3>
						<PreCognitiveDebugging />
						<SwarmRefactoring />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	)
}
