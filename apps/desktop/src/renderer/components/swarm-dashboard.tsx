import { useAtomValue } from "jotai"
import { FlameIcon, Loader2Icon, NetworkIcon, CheckCircle2Icon } from "lucide-react"
import { childrenMapAtom } from "../atoms/derived/session-requests"
import { agentFamily } from "../atoms/derived/agents"
import { sessionFamily } from "../atoms/sessions"

export interface SwarmDashboardProps {
	status: "idle" | "running" | "waiting" | "done"
	subagents?: {
		id: string
		role: string
		status: "running" | "waiting" | "done"
		lastMessage?: string
	}[]
}

export function SwarmDashboard({ status, subagents = [] }: SwarmDashboardProps) {
	if (status === "idle" && subagents.length === 0) return null

	return (
		<div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-4">
			<div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
				<div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FlameIcon className="size-4 text-red-500" />
						<span className="font-semibold text-red-500 text-sm">God Mode Swarm</span>
					</div>
					<div className="text-xs text-red-500/80 font-medium">
						{subagents.length} active agents
					</div>
				</div>
				
				<div className="p-4">
					{subagents.length === 0 ? (
						<div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
							<Loader2Icon className="size-4 animate-spin" />
							<span>Summoning agents...</span>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{subagents.map((sub) => (
								<div key={sub.id} className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background/50 p-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<NetworkIcon className="size-3.5 text-muted-foreground" />
											<span className="text-xs font-semibold">{sub.role}</span>
										</div>
										{sub.status === "running" && <Loader2Icon className="size-3.5 animate-spin text-blue-500" />}
										{sub.status === "waiting" && <div className="size-2 rounded-full bg-yellow-500" />}
										{sub.status === "done" && <CheckCircle2Icon className="size-3.5 text-green-500" />}
									</div>
									<div className="text-xs text-muted-foreground line-clamp-2">
										{sub.lastMessage || "Initializing..."}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export function SmartSwarmDashboard({ sessionId, isWorking }: { sessionId: string; isWorking: boolean }) {
	const childrenMap = useAtomValue(childrenMapAtom)
	const childrenIds = childrenMap.get(sessionId) || []
	
	const subagents = childrenIds.map((id) => {
		// Read each agent to get their role and status
		// Note: We need a small sub-component to subscribe to individual agent updates efficiently
		return <AgentCard key={id} id={id} />
	})

	if (!isWorking && subagents.length === 0) return null

	return (
		<div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-4">
			<div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
				<div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FlameIcon className="size-4 text-red-500" />
						<span className="font-semibold text-red-500 text-sm">God Mode Swarm</span>
					</div>
					<div className="text-xs text-red-500/80 font-medium">
						{subagents.length} active agents
					</div>
				</div>
				
				<div className="p-4">
					{subagents.length === 0 ? (
						<div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
							<Loader2Icon className="size-4 animate-spin" />
							<span>Summoning agents...</span>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{subagents}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function AgentCard({ id }: { id: string }) {
	const agent = useAtomValue(agentFamily(id))
	const session = useAtomValue(sessionFamily(id))
	
	const isWorking = session?.status?.type === "busy" || session?.status?.type === "retry"
	const isDone = session?.status?.type === "idle"
	
	// Try to get role from subagent prompt or default
	let role = agent?.name || "Subagent"
	
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background/50 p-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<NetworkIcon className="size-3.5 text-muted-foreground" />
					<span className="text-xs font-semibold">{role}</span>
				</div>
				{isWorking && <Loader2Icon className="size-3.5 animate-spin text-blue-500" />}
				{!isWorking && !isDone && <div className="size-2 rounded-full bg-yellow-500" />}
				{isDone && <CheckCircle2Icon className="size-3.5 text-green-500" />}
			</div>
			<div className="text-xs text-muted-foreground line-clamp-2">
				{agent?.currentActivity || "Processing..."}
			</div>
		</div>
	)
}
