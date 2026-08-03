/**
 * Keyboard Shortcuts Settings page — View and customize keyboard shortcuts.
 */

import { useCallback, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { SearchIcon, KeyboardIcon, CheckIcon, XIcon } from "lucide-react"
import { shortcutsByCategoryAtom, shortcutSearchQueryAtom } from "../../atoms/shortcuts"
import { useShortcutsData } from "../../hooks/use-shortcuts-data"
import { Input } from "@devil-ai/ui/components/input"
import { Button } from "@devil-ai/ui/components/button"
import { Switch } from "@devil-ai/ui/components/switch"

export function KeyboardShortcutsPage() {
	const { update } = useShortcutsData()
	const shortcutsByCategory = useAtomValue(shortcutsByCategoryAtom)
	const searchQuery = useAtomValue(shortcutSearchQueryAtom)
	const setSearchQuery = useSetAtom(shortcutSearchQueryAtom)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [newShortcut, setNewShortcut] = useState("")

	const handleToggle = useCallback(
		async (id: string, enabled: boolean) => {
			await update({ id, isEnabled: enabled })
		},
		[update],
	)

	const handleSaveShortcut = useCallback(
		async (id: string) => {
			if (!newShortcut.trim()) return
			await update({ id, shortcut: newShortcut.trim() })
			setEditingId(null)
			setNewShortcut("")
		},
		[newShortcut, update],
	)

	const formatShortcut = (shortcut: string) => {
		return shortcut
			.replace("Cmd", "\u2318")
			.replace("Ctrl", "Ctrl")
			.replace("Shift", "Shift")
			.replace("Alt", "Alt")
			.replace("+", " + ")
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6 pb-10">
			<div>
				<h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Customize keyboard shortcuts for all actions. Click a shortcut to change it.
				</p>
			</div>

			<div className="relative">
				<SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
				<Input
					placeholder="Search shortcuts..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-8"
				/>
			</div>

			{Object.entries(shortcutsByCategory).map(([category, items]) => (
				<div key={category} className="rounded-lg border">
					<div className="border-b bg-muted/50 px-4 py-2">
						<h3 className="text-sm font-medium">{category}</h3>
					</div>
					<div className="divide-y">
						{items.map((shortcut) => (
							<div key={shortcut.id} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<KeyboardIcon className="size-4 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">{shortcut.label}</p>
										<p className="text-xs text-muted-foreground">{shortcut.action}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									{editingId === shortcut.id ? (
										<div className="flex items-center gap-2">
											<Input
												value={newShortcut}
												onChange={(e) => setNewShortcut(e.target.value)}
												placeholder="Press keys..."
												className="w-40 font-mono text-sm"
												autoFocus
												onKeyDown={(e) => {
													e.preventDefault()
													const keys: string[] = []
													if (e.metaKey || e.ctrlKey) keys.push("Cmd")
													if (e.shiftKey) keys.push("Shift")
													if (e.altKey) keys.push("Alt")
													if (!["Meta", "Control", "Shift", "Alt"].includes(e.key)) {
														keys.push(e.key.toUpperCase())
													}
													setNewShortcut(keys.join("+"))
												}}
											/>
											<Button size="sm" variant="ghost" onClick={() => handleSaveShortcut(shortcut.id)}>
												<CheckIcon className="size-4" />
											</Button>
											<Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setNewShortcut("") }}>
												<XIcon className="size-4" />
											</Button>
										</div>
									) : (
										<button
											className="rounded-md border bg-muted px-3 py-1 font-mono text-sm hover:bg-muted/80"
											onClick={() => {
												setEditingId(shortcut.id)
												setNewShortcut(shortcut.shortcut)
											}}
										>
											{formatShortcut(shortcut.shortcut)}
										</button>
									)}
									<Switch
										checked={shortcut.isEnabled}
										onCheckedChange={(checked) => handleToggle(shortcut.id, checked)}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			))}

			{Object.keys(shortcutsByCategory).length === 0 && (
				<div className="py-12 text-center text-muted-foreground">
					<KeyboardIcon className="mx-auto mb-2 size-12 opacity-50" />
					<p>No shortcuts found</p>
				</div>
			)}
		</div>
	)
}
