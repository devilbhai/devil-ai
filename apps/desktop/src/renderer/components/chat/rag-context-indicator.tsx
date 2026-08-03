import { useCallback, useEffect, useState } from "react"
import { useAtomValue } from "jotai"
import { BrainIcon } from "lucide-react"
import { ragEnabledAtom } from "../../atoms/feature-flags"
import { searchDocuments, type RagSearchResult } from "../../services/rag-service"

interface RagContextIndicatorProps {
	query: string
	sessionId?: string
	onContextFound?: (context: string) => void
}

export function RagContextIndicator({ query, sessionId, onContextFound }: RagContextIndicatorProps) {
	const enabled = useAtomValue(ragEnabledAtom)
	const [results, setResults] = useState<RagSearchResult[]>([])
	const [showDropdown, setShowDropdown] = useState(false)

	useEffect(() => {
		if (!enabled || !query || query.length < 10) {
			setResults([])
			return
		}

		const timer = setTimeout(() => {
			const found = searchDocuments(query, { limit: 3, sessionId })
			setResults(found)
		}, 500)

		return () => clearTimeout(timer)
	}, [query, enabled, sessionId])

	const handleInsert = useCallback(
		(text: string) => {
			onContextFound?.(text)
			setShowDropdown(false)
		},
		[onContextFound],
	)

	if (!enabled || results.length === 0) return null

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setShowDropdown(!showDropdown)}
				className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
			>
				<BrainIcon className="size-3" />
				{results.length} relevant context{results.length !== 1 ? "s" : ""}
			</button>

			{showDropdown && (
				<div className="absolute bottom-full left-0 mb-1 w-80 rounded-lg border border-border bg-popover p-2 shadow-lg z-50">
					<div className="text-xs font-medium mb-1 text-muted-foreground">Related context from history:</div>
					{results.map((r) => (
						<button
							key={r.document.id}
							type="button"
							onClick={() => handleInsert(r.document.content)}
							className="w-full text-left rounded-md p-2 text-xs hover:bg-accent transition-colors"
						>
							<div className="truncate">{r.document.content.slice(0, 120)}...</div>
							<div className="text-muted-foreground mt-0.5">
								Score: {(r.score * 100).toFixed(0)}%
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
