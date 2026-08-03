import { XIcon } from "lucide-react"
import type { DiffComment } from "../review/review-comments"

export function DiffCommentChips({
	comments,
	onRemove,
}: {
	comments: DiffComment[]
	onRemove: (id: string) => void
}) {
	if (comments.length === 0) return null

	return (
		<div className="flex flex-wrap gap-1 px-1 pt-1">
			{comments.map((comment) => {
				const fileName = comment.filePath.split("/").pop() ?? comment.filePath
				return (
					<span
						key={comment.id}
						className="inline-flex max-w-full items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] leading-tight"
					>
						<span className="shrink-0 font-mono text-muted-foreground">
							{fileName}:{comment.lineNumber}
						</span>
						<span className="truncate text-foreground">
							{comment.content.length > 40 ? `${comment.content.slice(0, 40)}...` : comment.content}
						</span>
						<button
							type="button"
							onClick={() => onRemove(comment.id)}
							className="shrink-0 text-muted-foreground/60 hover:text-foreground"
							aria-label="Remove comment"
						>
							<XIcon className="size-2.5" />
						</button>
					</span>
				)
			})}
		</div>
	)
}
