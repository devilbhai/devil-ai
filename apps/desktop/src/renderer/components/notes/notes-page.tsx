/**
 * Notes page — User's coding memory and knowledge base.
 *
 * Features:
 * - Create, edit, delete notes
 * - Search/filter notes
 * - Tag-based categorization
 * - Toggle AI context inclusion
 * - Markdown content support
 */

import { useCallback, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { PlusIcon, SearchIcon, TrashIcon, EditIcon, BrainIcon, TagIcon } from "lucide-react"
import { filteredNotesAtom, noteSearchQueryAtom, selectedNoteIdAtom } from "../../atoms/notes"
import { useNotesData } from "../../hooks/use-notes-data"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"

export function NotesPage() {
	const { notes, create, update, remove } = useNotesData()
	const filteredNotes = useAtomValue(filteredNotesAtom)
	const searchQuery = useAtomValue(noteSearchQueryAtom)
	const setSearchQuery = useSetAtom(noteSearchQueryAtom)
	const selectedNoteId = useAtomValue(selectedNoteIdAtom)
	const setSelectedNoteId = useSetAtom(selectedNoteIdAtom)
	const [isCreating, setIsCreating] = useState(false)
	const [newTitle, setNewTitle] = useState("")
	const [editingNote, setEditingNote] = useState<string | null>(null)
	const [editContent, setEditContent] = useState("")

	// Removed handleCreate as it is now inlined in the save button

	const handleDelete = useCallback(
		async (id: string) => {
			await remove(id)
			if (selectedNoteId === id) setSelectedNoteId(null)
		},
		[remove, selectedNoteId, setSelectedNoteId],
	)

	const handleToggleContext = useCallback(
		async (id: string, current: boolean) => {
			await update({ id, includeInContext: !current })
		},
		[update],
	)

	const handleSaveEdit = useCallback(
		async (id: string) => {
			await update({ id, content: editContent })
			setEditingNote(null)
		},
		[update, editContent],
	)

	const selectedNote = notes.find((n) => n.id === selectedNoteId)

	return (
		<div className="flex h-full">
			{/* Sidebar — Note list */}
			<div className="flex w-80 flex-col border-r">
				<div className="flex items-center justify-between p-4">
					<h2 className="text-lg font-semibold">Notes</h2>
				<Button size="sm" onClick={() => setIsCreating(true)} aria-label="Create new note">
					<PlusIcon className="size-4" />
				</Button>
				</div>

				{/* Search */}
				<div className="px-4 pb-2">
					<div className="relative">
						<SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
						<Input
							placeholder="Search notes..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8"
						/>
					</div>
				</div>

				{/* Create new note */}
				{isCreating && (
					<div className="border-b p-4 space-y-2 bg-muted/20">
						<Input
							placeholder="Note title..."
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							autoFocus
							className="text-sm"
						/>
						<textarea
							placeholder="Note content (optional)..."
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
						<div className="flex justify-end gap-2">
							<Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
								Cancel
							</Button>
							<Button size="sm" onClick={() => {
								if (!newTitle.trim()) return;
								create({ title: newTitle.trim(), content: editContent.trim() });
								setNewTitle("");
								setEditContent("");
								setIsCreating(false);
							}}>
								Save Note
							</Button>
						</div>
					</div>
				)}

				{/* Note list */}
				<div className="flex-1 overflow-y-auto">
					{filteredNotes.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							{searchQuery ? "No notes found" : "No notes yet. Create one!"}
						</div>
					) : (
						filteredNotes.map((note) => (
							<div
								key={note.id}
								className={`cursor-pointer border-b p-3 transition-colors hover:bg-muted/50 ${
									selectedNoteId === note.id ? "bg-muted" : ""
								}`}
								onClick={() => setSelectedNoteId(note.id)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<h3 className="truncate text-sm font-medium">{note.title}</h3>
										<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
											{note.content || "Empty note"}
										</p>
										{note.tags && (
											<div className="mt-1 flex flex-wrap gap-1">
												{note.tags.split(",").map((tag) => (
													<Badge key={tag} variant="secondary" className="text-[10px]">
														{tag.trim()}
													</Badge>
												))}
											</div>
										)}
									</div>
									<div className="flex gap-1">
										<button
											className="rounded p-1 hover:bg-muted"
											onClick={(e) => {
												e.stopPropagation()
												handleToggleContext(note.id, note.includeInContext)
											}}
											title={note.includeInContext ? "AI context ON" : "AI context OFF"}
											aria-label={note.includeInContext ? "AI context ON" : "AI context OFF"}
										>
											<BrainIcon
												className={`size-3 ${note.includeInContext ? "text-green-500" : "text-muted-foreground"}`}
											/>
										</button>
										<button
											className="rounded p-1 hover:bg-destructive/20"
											onClick={(e) => {
												e.stopPropagation()
												handleDelete(note.id)
											}}
											aria-label="Delete note"
										>
											<TrashIcon className="size-3 text-destructive" />
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Main — Note content */}
			<div className="flex-1 overflow-y-auto">
				{selectedNote ? (
					<div className="p-6">
						<div className="mb-4 flex items-center justify-between">
							<h1 className="text-2xl font-bold">{selectedNote.title}</h1>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setEditingNote(selectedNote.id)
										setEditContent(selectedNote.content)
									}}
								>
									<EditIcon className="mr-1 size-3" />
									Edit
								</Button>
								<button
									className={`rounded-md px-2 py-1 text-xs ${
										selectedNote.includeInContext
											? "bg-green-500/10 text-green-500"
											: "bg-muted text-muted-foreground"
									}`}
									onClick={() => handleToggleContext(selectedNote.id, selectedNote.includeInContext)}
								>
									<BrainIcon className="mr-1 inline size-3" />
									{selectedNote.includeInContext ? "AI Context ON" : "AI Context OFF"}
								</button>
							</div>
						</div>

						{selectedNote.tags && (
							<div className="mb-4 flex flex-wrap gap-1">
								<TagIcon className="size-3 text-muted-foreground" />
								{selectedNote.tags.split(",").map((tag) => (
									<Badge key={tag} variant="secondary">
										{tag.trim()}
									</Badge>
								))}
							</div>
						)}

						{editingNote === selectedNote.id ? (
							<div>
								<textarea
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									className="min-h-[400px] w-full rounded-md border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
									autoFocus
								/>
								<div className="mt-2 flex gap-2">
									<Button size="sm" onClick={() => handleSaveEdit(selectedNote.id)}>
										Save
									</Button>
									<Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 font-mono text-sm">
								{selectedNote.content || "Empty note. Click Edit to add content."}
							</div>
						)}

						<div className="mt-4 text-xs text-muted-foreground">
							Created: {new Date(selectedNote.createdAt).toLocaleString()}
							{" | "}
							Updated: {new Date(selectedNote.updatedAt).toLocaleString()}
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<div className="text-center">
							<BrainIcon className="mx-auto mb-2 size-12 opacity-50" />
							<p>Select a note or create a new one</p>
							<p className="mt-1 text-xs">Notes are included in AI context when enabled</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
