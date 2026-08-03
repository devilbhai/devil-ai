/**
 * Prompt Library page — Reusable prompt templates with {{variable}} support.
 */

import { useCallback, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { PlusIcon, SearchIcon, TrashIcon, EditIcon, StarIcon, TagIcon, WandIcon } from "lucide-react"
import { filteredPromptsAtom, promptSearchQueryAtom, selectedPromptIdAtom } from "../../atoms/prompts"
import { usePromptsData } from "../../hooks/use-prompts-data"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"

const CATEGORIES = ["general", "code-review", "debugging", "refactor", "testing", "documentation", "custom"]

export function PromptLibraryPage() {
	const { prompts, create, update, remove } = usePromptsData()
	const filteredPrompts = useAtomValue(filteredPromptsAtom)
	const searchQuery = useAtomValue(promptSearchQueryAtom)
	const setSearchQuery = useSetAtom(promptSearchQueryAtom)
	const selectedPromptId = useAtomValue(selectedPromptIdAtom)
	const setSelectedPromptId = useSetAtom(selectedPromptIdAtom)
	const [isCreating, setIsCreating] = useState(false)
	const [newTitle, setNewTitle] = useState("")
	const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
	const [editContent, setEditContent] = useState("")
	const [editTitle, setEditTitle] = useState("")
	const [editCategory, setEditCategory] = useState("general")
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
			if (selectedPromptId === id) setSelectedPromptId(null)
		},
		[remove, selectedPromptId, setSelectedPromptId],
	)

	const handleToggleFavorite = useCallback(
		async (id: string, current: boolean) => {
			await update({ id, isFavorite: !current })
		},
		[update],
	)

	const handleSaveEdit = useCallback(async () => {
		if (!editingPrompt) return
		await update({
			id: editingPrompt,
			title: editTitle,
			content: editContent,
			category: editCategory,
			tags: editTags,
		})
		setEditingPrompt(null)
	}, [editingPrompt, editTitle, editContent, editCategory, editTags, update])

	const selectedPrompt = prompts.find((p) => p.id === selectedPromptId)
	const variables = selectedPrompt ? (selectedPrompt.content.match(/\{\{(\w+)\}\}/g) ?? []) : []

	return (
		<div className="flex h-full">
			{/* Sidebar — Prompt list */}
			<div className="flex w-80 flex-col border-r">
				<div className="flex items-center justify-between p-4">
					<h2 className="text-lg font-semibold">Prompt Library</h2>
					<Button size="sm" onClick={() => setIsCreating(true)} aria-label="Create new prompt">
						<PlusIcon className="size-4" />
					</Button>
				</div>

				<div className="px-4 pb-2">
					<div className="relative">
						<SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
						<Input
							placeholder="Search prompts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8"
						/>
					</div>
				</div>

				{isCreating && (
					<div className="border-b p-4">
						<div className="flex gap-2">
							<Input
								placeholder="Prompt title..."
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleCreate()
									if (e.key === "Escape") setIsCreating(false)
								}}
								autoFocus
							/>
							<Button size="sm" onClick={handleCreate} className="h-9">
								Add
							</Button>
						</div>
					</div>
				)}

				<div className="flex-1 overflow-y-auto">
					{filteredPrompts.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							{searchQuery ? "No prompts found" : "No prompts yet. Create one!"}
						</div>
					) : (
						filteredPrompts.map((prompt) => (
							<div
								key={prompt.id}
								className={`cursor-pointer border-b p-3 transition-colors hover:bg-muted/50 ${
									selectedPromptId === prompt.id ? "bg-muted" : ""
								}`}
								onClick={() => setSelectedPromptId(prompt.id)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<h3 className="truncate text-sm font-medium">{prompt.title}</h3>
										<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
											{prompt.content || "Empty prompt"}
										</p>
										<div className="mt-1 flex items-center gap-2">
											<Badge variant="outline" className="text-[10px]">{prompt.category}</Badge>
											{prompt.useCount > 0 && (
												<span className="text-[10px] text-muted-foreground">Used {prompt.useCount}x</span>
											)}
										</div>
									</div>
									<div className="flex gap-1">
										<button
											className="rounded p-1 hover:bg-muted"
											onClick={(e) => { e.stopPropagation(); handleToggleFavorite(prompt.id, prompt.isFavorite) }}
											aria-label={prompt.isFavorite ? "Unfavorite" : "Favorite"}
										>
											<StarIcon className={`size-3 ${prompt.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
										</button>
										<button
											className="rounded p-1 hover:bg-destructive/20"
											onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id) }}
											aria-label="Delete prompt"
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

			{/* Main — Prompt content */}
			<div className="flex-1 overflow-y-auto">
				{selectedPrompt ? (
					<div className="p-6">
						<div className="mb-4 flex items-center justify-between">
							<h1 className="text-2xl font-bold">{selectedPrompt.title}</h1>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setEditingPrompt(selectedPrompt.id)
										setEditTitle(selectedPrompt.title)
										setEditContent(selectedPrompt.content)
										setEditCategory(selectedPrompt.category)
										setEditTags(selectedPrompt.tags)
									}}
								>
									<EditIcon className="mr-1 size-3" />
									Edit
								</Button>
								<button
									className={`rounded-md px-2 py-1 text-xs ${
										selectedPrompt.isFavorite ? "bg-yellow-500/10 text-yellow-500" : "bg-muted text-muted-foreground"
									}`}
									onClick={() => handleToggleFavorite(selectedPrompt.id, selectedPrompt.isFavorite)}
								>
									<StarIcon className="mr-1 inline size-3" />
									{selectedPrompt.isFavorite ? "Favorited" : "Favorite"}
								</button>
							</div>
						</div>

						<div className="mb-4 flex flex-wrap gap-2">
							<Badge variant="outline">{selectedPrompt.category}</Badge>
							{selectedPrompt.tags.split(",").filter(Boolean).map((tag) => (
								<Badge key={tag} variant="secondary">
									<TagIcon className="mr-1 size-2" />
									{tag.trim()}
								</Badge>
							))}
						</div>

						{variables.length > 0 && (
							<div className="mb-4 rounded-md border bg-muted/30 p-3">
								<div className="flex items-center gap-2 text-sm font-medium">
									<WandIcon className="size-4" />
									Variables: {variables.map((v) => v).join(", ")}
								</div>
							</div>
						)}

						{editingPrompt === selectedPrompt.id ? (
							<div className="space-y-3">
								<Input
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									placeholder="Prompt title"
								/>
								<select
									value={editCategory}
									onChange={(e) => setEditCategory(e.target.value)}
									className="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
								</select>
								<Input
									value={editTags}
									onChange={(e) => setEditTags(e.target.value)}
									placeholder="Tags (comma-separated)"
								/>
								<textarea
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									className="min-h-[300px] w-full rounded-md border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
									autoFocus
								/>
								<div className="flex gap-2">
									<Button size="sm" onClick={handleSaveEdit}>Save</Button>
									<Button size="sm" variant="outline" onClick={() => setEditingPrompt(null)}>Cancel</Button>
								</div>
							</div>
						) : (
							<div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 font-mono text-sm">
								{selectedPrompt.content || "Empty prompt. Click Edit to add content."}
							</div>
						)}

						<div className="mt-4 text-xs text-muted-foreground">
							Created: {new Date(selectedPrompt.createdAt).toLocaleString()}
							{" | "}Updated: {new Date(selectedPrompt.updatedAt).toLocaleString()}
							{" | "}Used: {selectedPrompt.useCount} times
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<div className="text-center">
							<WandIcon className="mx-auto mb-2 size-12 opacity-50" />
							<p>Select a prompt or create a new one</p>
							<p className="mt-1 text-xs">Use {"{{variable}}"} syntax for dynamic placeholders</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
