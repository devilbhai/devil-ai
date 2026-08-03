import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@devil-ai/ui/components/dialog"
import {
	FlameIcon,
	ShieldIcon,
	ActivityIcon,
	CpuIcon,
	MicIcon,
	HistoryIcon,
} from "lucide-react"

export function ArsenalModal() {
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const hasSeen = localStorage.getItem("devil-arsenal-v3")
		if (!hasSeen) {
			setOpen(true)
		}
	}, [])

	const handleClose = () => {
		localStorage.setItem("devil-arsenal-v3", "true")
		setOpen(false)
	}

	const features = [
		{ icon: FlameIcon, title: "God Mode (Swarms)", desc: "Command a team of 4 AI sub-agents to build complex features autonomously." },
		{ icon: ShieldIcon, title: "Devil's Playground", desc: "A Zero-Trust Sandbox that intercepts file writes before they damage your system." },
		{ icon: ActivityIcon, title: "Hellfire Profiler", desc: "Deeply analyze React render performance and identify massive bottlenecks instantly." },
		{ icon: CpuIcon, title: "Dark Web Reverse Engineer", desc: "De-obfuscate minified React bundles or compiled binaries." },
		{ icon: MicIcon, title: "Voice Pair Programming", desc: "Speak your requirements and let Devil AI write the code hands-free." },
		{ icon: HistoryIcon, title: "Time-Travel Debugging", desc: "Rewind your codebase state to easily track down the exact line that broke the app." },
	]

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl rounded-2xl border border-border bg-background p-0 shadow-2xl overflow-hidden sm:max-w-4xl">
				<div className="p-8">
					<DialogHeader className="mb-8">
						<DialogTitle className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
							Welcome to <span className="text-blue-500">Devil's Arsenal</span>
						</DialogTitle>
						<DialogDescription className="text-muted-foreground mt-2 text-base max-w-2xl">
							We've unlocked 7 powerful new capabilities to help you dominate your codebase. Discover what's new in the latest update.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
						{features.map((f, i) => (
							<div
								key={i}
								className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-blue-500/20 transition-all duration-200"
							>
								<div className="shrink-0 flex items-center justify-center size-9 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
									<f.icon className="size-4.5" />
								</div>
								<div>
									<h4 className="font-medium text-foreground text-sm">{f.title}</h4>
									<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
								</div>
							</div>
						))}
					</div>

					<div className="flex justify-end pt-6 mt-4 border-t border-border">
						<button
							onClick={handleClose}
							className="px-5 py-2 bg-blue-500 text-white hover:bg-blue-600 font-medium text-sm rounded-lg transition-colors"
						>
							Start building
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
