/**
 * Related Sessions Panel — cross-session knowledge graph connections.
 */
import { useAtomValue } from "jotai"
import { relatedSessionsAtom } from "../../atoms/knowledge-graph"


export function RelatedSessions({ currentSessionId }: { currentSessionId: string }) {
	const related = useAtomValue(relatedSessionsAtom)

	if (!related.length) return null

	return (
		<div className="space-y-2">
			<h4 className="text-sm font-medium text-muted-foreground">Related Sessions</h4>
			<div className="space-y-1">
				{related
					.filter((r) => r.sessionId !== currentSessionId)
					.slice(0, 5)
					.map((session) => (
						<button
							key={session.sessionId}
							type="button"
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
							onClick={() => {
								/* Navigate to related session */
							}}
						>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{session.title}</p>
								<p className="truncate text-xs text-muted-foreground">
									{session.reason}
								</p>
							</div>
							<span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
								{Math.round(session.similarity * 100)}%
							</span>
						</button>
					))}
			</div>
		</div>
	)
}
