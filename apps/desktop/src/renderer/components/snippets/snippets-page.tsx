/**
 * Snippets Manager page — Save, search, insert code snippets.
 */

import { useCallback, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { PlusIcon, SearchIcon, TrashIcon, EditIcon, StarIcon, CodeIcon, CopyIcon } from "lucide-react"
import { filteredSnippetsAtom, snippetSearchQueryAtom, selectedSnippetIdAtom } from "../../atoms/snippets"
import { useSnippetsData } from "../../hooks/use-snippets-data"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"

const LANGUAGES = ["javascript", "typescript", "python", "rust", "go", "java", "html", "css", "sql", "bash", "json", "yaml", "text"]

export function SnippetsPage() {
	const { snippets, create, update, remove } = useSnippetsData()
	const filteredSnippets = useAtomValue(filteredSnippetsAtom)
	const searchQuery = useAtomValue(snippetSearchQueryAtom)
	const setSearchQuery = useSetAtom(snippetSearchQueryAtom)
	const selectedSnippetId = useAtomValue(selectedSnippetIdAtom)
	const setSelectedSnippetId = useSetAtom(selectedSnippetIdAtom)
	const [isCreating, setIsCreating] = useState(false)
	const [newTitle, setNewTitle] = useState("")
	const [editingSnippet, setEditingSnippet] = useState<string | null>(null)
	const [editContent, setEditContent] = useState("")
	const [editTitle, setEditTitle] = useState("")
	const [editLanguage, setEditLanguage] = useState("text")
	const [editTags, setEditTags] = useState("")

	const handleCreate = useCallback(async () => {
		if (!newTitle.trim()) return
		await create({ title: newTitle.trim() })
		setNewTitle("")
		setIsCreating(false)
	}, [newTitle, create])

	const handleDelete = useCallback(
		async (id: string) => {
			await remove(id)
			if (selectedSnippetId === id) setSelectedSnippetId(null)
		},
		[remove, selectedSnippetId, setSelectedSnippetId],
	)

	const handleToggleFavorite = useCallback(
		async (id: string, current: boolean) => {
			await update({ id, isFavorite: !current })
		},
		[update],
	)

	const handleSaveEdit = useCallback(async () => {
		if (!editingSnippet) return
		await update({
			id: editingSnippet,
			title: editTitle,
			content: editContent,
			language: editLanguage,
			tags: editTags,
		})
		setEditingSnippet(null)
	}, [editingSnippet, editTitle, editContent, editLanguage, editTags, update])

	const handleCopy = useCallback((content: string) => {
		navigator.clipboard.writeText(content)
	}, [])

	const selectedSnippet = snippets.find((s) => s.id === selectedSnippetId)

	return (
		<div className="flex h-full">
			{/* Sidebar — Snippet list */}
			<div className="flex w-80 flex-col border-r">
				<div className="flex items-center justify-between p-4">
					<h2 className="text-lg font-semibold">Snippets</h2>
					<Button size="sm" onClick={() => setIsCreating(true)} aria-label="Create new snippet">
						<PlusIcon className="size-4" />
					</Button>
				</div>

				<div className="px-4 pb-2">
					<div className="relative">
						<SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
						<Input
							placeholder="Search snippets..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8"
						/>
					</div>
				</div>

				{isCreating && (
					<div className="border-b p-4">
						<Input
							placeholder="Snippet title..."
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate()
								if (e.key === "Escape") setIsCreating(false)
							}}
							autoFocus
						/>
					</div>
				)}

				<div className="flex-1 overflow-y-auto">
					{filteredSnippets.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							{searchQuery ? "No snippets found" : "No snippets yet. Create one!"}
						</div>
					) : (
						filteredSnippets.map((snippet) => (
							<div
								key={snippet.id}
								className={`cursor-pointer border-b p-3 transition-colors hover:bg-muted/50 ${
									selectedSnippetId === snippet.id ? "bg-muted" : ""
								}`}
								onClick={() => setSelectedSnippetId(snippet.id)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<h3 className="truncate text-sm font-medium">{snippet.title}</h3>
										<div className="mt-1 flex items-center gap-2">
											<Badge variant="outline" className="text-[10px]">{snippet.language}</Badge>
											{snippet.useCount > 0 && (
												<span className="text-[10px] text-muted-foreground">Used {snippet.useCount}x</span>
											)}
										</div>
									</div>
									<div className="flex gap-1">
										<button
											className="rounded p-1 hover:bg-muted"
											onClick={(e) => { e.stopPropagation(); handleToggleFavorite(snippet.id, snippet.isFavorite) }}
											aria-label={snippet.isFavorite ? "Unfavorite" : "Favorite"}
										>
											<StarIcon className={`size-3 ${snippet.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
										</button>
										<button
											className="rounded p-1 hover:bg-destructive/20"
											onClick={(e) => { e.stopPropagation(); handleDelete(snippet.id) }}
											aria-label="Delete snippet"
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

			{/* Main — Snippet content */}
			<div className="flex-1 overflow-y-auto">
				{selectedSnippet ? (
					<div className="p-6">
						<div className="mb-4 flex items-center justify-between">
							<h1 className="text-2xl font-bold">{selectedSnippet.title}</h1>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={() => handleCopy(selectedSnippet.content)}>
									<CopyIcon className="mr-1 size-3" />
									Copy
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setEditingSnippet(selectedSnippet.id)
										setEditTitle(selectedSnippet.title)
										setEditContent(selectedSnippet.content)
										setEditLanguage(selectedSnippet.language)
										setEditTags(selectedSnippet.tags)
									}}
								>
									<EditIcon className="mr-1 size-3" />
									Edit
								</Button>
							</div>
						</div>

						<div className="mb-4 flex flex-wrap gap-2">
							<Badge variant="outline">
								<CodeIcon className="mr-1 size-2" />
								{selectedSnippet.language}
							</Badge>
							{selectedSnippet.tags.split(",").filter(Boolean).map((tag) => (
								<Badge key={tag} variant="secondary">{tag.trim()}</Badge>
							))}
						</div>

						{editingSnippet === selectedSnippet.id ? (
							<div className="space-y-3">
								<Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Snippet title" />
								<select
									value={editLanguage}
									onChange={(e) => setEditLanguage(e.target.value)}
									className="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									{LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
								</select>
								<Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Tags (comma-separated)" />
								<textarea
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									className="min-h-[300px] w-full rounded-md border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
									autoFocus
								/>
								<div className="flex gap-2">
									<Button size="sm" onClick={handleSaveEdit}>Save</Button>
									<Button size="sm" variant="outline" onClick={() => setEditingSnippet(null)}>Cancel</Button>
								</div>
							</div>
						) : (
							<pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 font-mono text-sm">
								{selectedSnippet.content || "Empty snippet. Click Edit to add content."}
							</pre>
						)}

						<div className="mt-4 text-xs text-muted-foreground">
							Created: {new Date(selectedSnippet.createdAt).toLocaleString()}
							{" | "}Updated: {new Date(selectedSnippet.updatedAt).toLocaleString()}
							{" | "}Used: {selectedSnippet.useCount} times
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<div className="text-center">
							<CodeIcon className="mx-auto mb-2 size-12 opacity-50" />
							<p>Select a snippet or create a new one</p>
							<p className="mt-1 text-xs">Save code snippets for quick reuse</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
