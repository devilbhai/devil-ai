/**
 * Ponytail review findings indicator.
 *
 * Shows a badge when code review findings are available.
 * Clicking opens a popover with detailed findings.
 */

import { Badge } from "@devil-ai/ui/components/badge"
import { Button } from "@devil-ai/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@devil-ai/ui/components/popover"
import { WrenchIcon } from "lucide-react"
import type { ReviewResult } from "../../hooks/use-ponytail-auto-review"

interface PonytailReviewIndicatorProps {
	reviews: ReviewResult[]
	isReviewing: boolean
	onClear: () => void
}

export function PonytailReviewIndicator({ reviews, isReviewing, onClear }: PonytailReviewIndicatorProps) {
	if (reviews.length === 0 && !isReviewing) return null

	const totalFindings = reviews.reduce((acc, r) => acc + r.findings.length, 0)

	const getTagColor = (tag: string) => {
		switch (tag) {
			case "delete": return "bg-red-500/10 text-red-500"
			case "stdlib": return "bg-blue-500/10 text-blue-500"
			case "native": return "bg-green-500/10 text-green-500"
			case "yagni": return "bg-yellow-500/10 text-yellow-500"
			case "shrink": return "bg-purple-500/10 text-purple-500"
			default: return "bg-muted text-muted-foreground"
		}
	}

	return (
		<Popover>
			<PopoverTrigger>
				<Button variant="ghost" size="sm" className="h-6 gap-1.5 px-2">
					<WrenchIcon className="size-3" />
					{isReviewing ? (
						<span className="text-xs text-muted-foreground">Reviewing...</span>
					) : (
						<Badge variant="secondary" className="h-4 px-1 text-xs">
							{totalFindings}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] max-h-[300px] overflow-y-auto" align="end">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium">Code Quality Findings</h4>
						<Button variant="ghost" size="sm" onClick={onClear} className="h-6 text-xs">
							Clear
						</Button>
					</div>

					{reviews.map((review) => (
						<div key={review.messageId} className="space-y-2">
							{review.findings.map((finding, i) => (
								<div
									key={`${finding.file}-${finding.line}-${i}`}
									className="rounded-md border border-border p-2 text-xs"
								>
									<div className="flex items-center gap-2">
										<span className="font-mono text-muted-foreground">
											{finding.file}:{finding.line}
										</span>
										<span className={`rounded px-1 py-0.5 text-xs font-medium ${getTagColor(finding.tag)}`}>
											{finding.tag}
										</span>
									</div>
									<p className="mt-1 text-sm">{finding.description}</p>
									{finding.replacement && (
										<p className="mt-1 text-xs text-muted-foreground">
											→ {finding.replacement}
										</p>
									)}
								</div>
							))}
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}
