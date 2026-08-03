import { UsersIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { useAtomValue } from "jotai"
import { childrenMapAtom } from "../../../atoms/derived/session-requests"
import { agentFamily } from "../../../atoms/derived/agents"
import { sessionFamily } from "../../../atoms/sessions"

export function SwarmRefactoring() {
	const childrenMap = useAtomValue(childrenMapAtom)

	const allSubagents = Array.from(childrenMap.values()).flat()

	return (
		<div className="group flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-all duration-200">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="shrink-0 flex items-center justify-center size-9 rounded-lg bg-emerald-500/10 text-emerald-500">
						<UsersIcon className="size-4.5" />
					</div>
					<div>
						<h4 className="font-medium text-sm text-foreground">Swarm Intelligence</h4>
						<p className="text-xs text-muted-foreground">Global multi-agent execution monitor.</p>
					</div>
				</div>
				<div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/20">
					{allSubagents.length} Active
				</div>
			</div>

			{allSubagents.length > 0 ? (
				<div className="mt-2 p-3 rounded-lg bg-muted border border-emerald-500/20 text-xs text-muted-foreground space-y-2 animate-in fade-in max-h-32 overflow-y-auto">
					{allSubagents.map((id) => (
						<SwarmAgentRow key={id} id={id} />
					))}
				</div>
			) : (
				<div className="mt-2 p-3 rounded-lg bg-muted border border-border text-xs text-muted-foreground flex justify-center">
					No sub-agents currently running. Trigger God Mode in a chat.
				</div>
			)}
		</div>
	)
}

function SwarmAgentRow({ id }: { id: string }) {
	const agent = useAtomValue(agentFamily(id))
	const session = useAtomValue(sessionFamily(id))

	const isWorking = session?.status?.type === "busy" || session?.status?.type === "retry"
	const isDone = session?.status?.type === "idle"

	let role = agent?.name || "Subagent"

	return (
		<div className="flex items-center justify-between">
			<span className="truncate pr-2 text-foreground">{role}</span>
			{isWorking ? (
				<Loader2Icon className="size-3.5 text-emerald-500 animate-spin shrink-0" />
			) : isDone ? (
				<CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
			) : (
				<span className="flex size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
			)}
		</div>
	)
}
