/**
 * Interactive Diff Playground — edit generated diffs before applying.
 */
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import {
	diffPlaygroundAtom,
	diffPlaygroundOpenAtom,
	toggleHunkRejectAtom,
	updateHunkContentAtom,
	type DiffHunk,
} from "../../atoms/diff-playground"
import { Button } from "@devil-ai/ui/components/button"

export function DiffPlayground() {
	const [state] = useAtom(diffPlaygroundAtom)
	const isOpen = useAtomValue(diffPlaygroundOpenAtom)
	const setOpen = useSetAtom(diffPlaygroundOpenAtom)
	const toggleReject = useSetAtom(toggleHunkRejectAtom)
	const updateContent = useSetAtom(updateHunkContentAtom)

	if (!isOpen || !state) return null

	const acceptedCount = state.hunks.filter((h) => !h.rejected).length
	const rejectedCount = state.hunks.filter((h) => h.rejected).length

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="mx-4 flex max-h-[80vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-background shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-6 py-4">
					<div>
						<h2 className="text-lg font-semibold">Diff Playground</h2>
						<p className="text-sm text-muted-foreground">
							Edit diffs before applying • {acceptedCount} accepted, {rejectedCount}{" "}
							rejected
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								/* Send modified diff back to chat */
							}}
						>
							Send to AI
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								/* Apply accepted hunks */
							}}
						>
							Apply ({acceptedCount})
						</Button>
						<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
							Close
						</Button>
					</div>
				</div>

				{/* Hunks */}
				<div className="flex-1 overflow-y-auto p-4">
					<div className="space-y-4">
						{state.hunks.map((hunk) => (
							<DiffHunkCard
								key={hunk.id}
								hunk={hunk}
								onToggleReject={() => toggleReject(hunk.id)}
								onEdit={(content) =>
									updateContent({ hunkId: hunk.id, content })
								}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

function DiffHunkCard({
	hunk,
	onToggleReject,
	onEdit,
}: {
	hunk: DiffHunk
	onToggleReject: () => void
	onEdit: (content: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const [editContent, setEditContent] = useState(
		hunk.editedContent ?? hunk.modifiedLines.join("\n"),
	)

	return (
		<div
			className={`rounded-lg border ${
				hunk.rejected
					? "border-red-500/30 bg-red-500/5"
					: "border-border bg-card"
			}`}
		>
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm text-muted-foreground">
						{hunk.filePath}
					</span>
					{hunk.rejected && (
						<span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-500">
							Rejected
						</span>
					)}
				</div>
				<div className="flex gap-2">
					<Button
						variant={editing ? "default" : "ghost"}
						size="sm"
						onClick={() => setEditing(!editing)}
					>
						{editing ? "Done" : "Edit"}
					</Button>
					<Button
						variant={hunk.rejected ? "destructive" : "outline"}
						size="sm"
						onClick={onToggleReject}
					>
						{hunk.rejected ? "Accept" : "Reject"}
					</Button>
				</div>
			</div>

			<div className="font-mono text-sm">
				{/* Original lines (removed) */}
				{hunk.originalLines.map((line, i) => (
					<div key={`orig-${i}`} className="bg-red-500/10 px-4 py-0.5 text-red-500">
						- {line}
					</div>
				))}
				{/* Modified lines (added) */}
				{editing ? (
					<textarea
						value={editContent}
						onChange={(e) => {
							setEditContent(e.target.value)
							onEdit(e.target.value)
						}}
						className="w-full bg-green-500/10 px-4 py-0.5 font-mono text-sm text-green-500 outline-none"
						rows={editContent.split("\n").length}
					/>
				) : (
					(hunk.editedContent
						? hunk.editedContent.split("\n")
						: hunk.modifiedLines
					).map((line, i) => (
						<div
							key={`mod-${i}`}
							className="bg-green-500/10 px-4 py-0.5 text-green-500"
						>
							+ {line}
						</div>
					))
				)}
			</div>
		</div>
	)
}
