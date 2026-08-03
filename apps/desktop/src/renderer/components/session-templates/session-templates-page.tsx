/**
 * Session Templates page — Pre-configured session setups.
 */

import { useCallback, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { PlusIcon, SearchIcon, TrashIcon, EditIcon, StarIcon, CopyIcon } from "lucide-react"
import { filteredTemplatesAtom, templateSearchQueryAtom, selectedTemplateIdAtom } from "../../atoms/templates"
import { useTemplatesData } from "../../hooks/use-templates-data"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"

const CATEGORIES = ["general", "debugging", "review", "refactor", "audit", "testing", "documentation"]

export function SessionTemplatesPage() {
	const { templates, create, update, remove } = useTemplatesData()
	const filteredTemplates = useAtomValue(filteredTemplatesAtom)
	const searchQuery = useAtomValue(templateSearchQueryAtom)
	const setSearchQuery = useSetAtom(templateSearchQueryAtom)
	const selectedTemplateId = useAtomValue(selectedTemplateIdAtom)
	const setSelectedTemplateId = useSetAtom(selectedTemplateIdAtom)
	const [isCreating, setIsCreating] = useState(false)
	const [newName, setNewName] = useState("")
	const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
	const [editName, setEditName] = useState("")
	const [editDescription, setEditDescription] = useState("")
	const [editConfig, setEditConfig] = useState("")
	const [editCategory, setEditCategory] = useState("general")

	const handleCreate = useCallback(async () => {
		if (!newName.trim()) return
		await create({ name: newName.trim() })
		setNewName("")
		setIsCreating(false)
	}, [newName, create])

	const handleDelete = useCallback(
		async (id: string) => {
			await remove(id)
			if (selectedTemplateId === id) setSelectedTemplateId(null)
		},
		[remove, selectedTemplateId, setSelectedTemplateId],
	)

	const handleToggleFavorite = useCallback(
		async (id: string, current: boolean) => {
			await update({ id, isFavorite: !current })
		},
		[update],
	)

	const handleSaveEdit = useCallback(async () => {
		if (!editingTemplate) return
		await update({
			id: editingTemplate,
			name: editName,
			description: editDescription,
			config: editConfig,
			category: editCategory,
		})
		setEditingTemplate(null)
	}, [editingTemplate, editName, editDescription, editConfig, editCategory, update])

	const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

	return (
		<div className="flex h-full">
			{/* Sidebar — Template list */}
			<div className="flex w-80 flex-col border-r">
				<div className="flex items-center justify-between p-4">
					<h2 className="text-lg font-semibold">Session Templates</h2>
					<Button size="sm" onClick={() => setIsCreating(true)} aria-label="Create new template">
						<PlusIcon className="size-4" />
					</Button>
				</div>

				<div className="px-4 pb-2">
					<div className="relative">
						<SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
						<Input
							placeholder="Search templates..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8"
						/>
					</div>
				</div>

				{isCreating && (
					<div className="border-b p-4">
						<Input
							placeholder="Template name..."
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate()
								if (e.key === "Escape") setIsCreating(false)
							}}
							autoFocus
						/>
					</div>
				)}

				<div className="flex-1 overflow-y-auto">
					{filteredTemplates.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							{searchQuery ? "No templates found" : "No templates yet. Create one!"}
						</div>
					) : (
						filteredTemplates.map((template) => (
							<div
								key={template.id}
								className={`cursor-pointer border-b p-3 transition-colors hover:bg-muted/50 ${
									selectedTemplateId === template.id ? "bg-muted" : ""
								}`}
								onClick={() => setSelectedTemplateId(template.id)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<h3 className="truncate text-sm font-medium">{template.name}</h3>
										<p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
											{template.description || "No description"}
										</p>
										<div className="mt-1 flex items-center gap-2">
											<Badge variant="outline" className="text-[10px]">{template.category}</Badge>
											{template.useCount > 0 && (
												<span className="text-[10px] text-muted-foreground">Used {template.useCount}x</span>
											)}
										</div>
									</div>
									<div className="flex gap-1">
										<button
											className="rounded p-1 hover:bg-muted"
											onClick={(e) => { e.stopPropagation(); handleToggleFavorite(template.id, template.isFavorite) }}
											aria-label={template.isFavorite ? "Unfavorite" : "Favorite"}
										>
											<StarIcon className={`size-3 ${template.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
										</button>
										<button
											className="rounded p-1 hover:bg-destructive/20"
											onClick={(e) => { e.stopPropagation(); handleDelete(template.id) }}
											aria-label="Delete template"
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

			{/* Main — Template content */}
			<div className="flex-1 overflow-y-auto">
				{selectedTemplate ? (
					<div className="p-6">
						<div className="mb-4 flex items-center justify-between">
							<h1 className="text-2xl font-bold">{selectedTemplate.name}</h1>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={() => {
									setEditingTemplate(selectedTemplate.id)
									setEditName(selectedTemplate.name)
									setEditDescription(selectedTemplate.description)
									setEditConfig(selectedTemplate.config)
									setEditCategory(selectedTemplate.category)
								}}>
									<EditIcon className="mr-1 size-3" />
									Edit
								</Button>
							</div>
						</div>

						<p className="mb-4 text-sm text-muted-foreground">{selectedTemplate.description}</p>

						<div className="mb-4 flex flex-wrap gap-2">
							<Badge variant="outline">{selectedTemplate.category}</Badge>
						</div>

						{editingTemplate === selectedTemplate.id ? (
							<div className="space-y-3">
								<Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Template name" />
								<Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
								<select
									value={editCategory}
									onChange={(e) => setEditCategory(e.target.value)}
									className="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
								</select>
								<div>
									<label className="mb-1 block text-sm font-medium">Config (JSON)</label>
									<textarea
										value={editConfig}
										onChange={(e) => setEditConfig(e.target.value)}
										className="min-h-[200px] w-full rounded-md border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
										placeholder='{"model": "anthropic/claude-sonnet-4-20250514", "systemPrompt": "...", "skills": ["code-reviewer"]}'
									/>
								</div>
								<div className="flex gap-2">
									<Button size="sm" onClick={handleSaveEdit}>Save</Button>
									<Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
								</div>
							</div>
						) : (
							<div className="rounded-md border bg-muted/30 p-4 font-mono text-sm">
								{selectedTemplate.config || "No configuration set. Click Edit to add config."}
							</div>
						)}

						<div className="mt-4 text-xs text-muted-foreground">
							Created: {new Date(selectedTemplate.createdAt).toLocaleString()}
							{" | "}Updated: {new Date(selectedTemplate.updatedAt).toLocaleString()}
							{" | "}Used: {selectedTemplate.useCount} times
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<div className="text-center">
							<CopyIcon className="mx-auto mb-2 size-12 opacity-50" />
							<p>Select a template or create a new one</p>
							<p className="mt-1 text-xs">Pre-configure session settings for quick setup</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
