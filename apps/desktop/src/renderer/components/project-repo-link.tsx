import { useEffect, useState } from "react"
import { GithubIcon, LinkIcon, UnlinkIcon, SearchIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@devil-ai/ui/components/popover"
import { Input } from "@devil-ai/ui/components/input"
import { ScrollArea } from "@devil-ai/ui/components/scroll-area"

export function ProjectRepoLink({ directory }: { directory: string }) {
	const [githubUser, setGithubUser] = useState<any>(null)
	const [linkedRepo, setLinkedRepo] = useState<any>(null)
	const [repos, setRepos] = useState<any[]>([])
	const [search, setSearch] = useState("")
	const [loading, setLoading] = useState(false)
	const [creating, setCreating] = useState(false)
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (!directory) return
		window.devilAi.githubActions.getUser().then((u) => setGithubUser(u)).catch(() => {})
		loadLinkedRepo()
	}, [directory])

	const loadLinkedRepo = async () => {
		try {
			const repo = await window.devilAi.projectRepoMap.get(directory)
			setLinkedRepo(repo)
		} catch (e) {
			setLinkedRepo(null)
		}
	}

	const handleOpenChange = async (newOpen: boolean) => {
		setOpen(newOpen)
		if (newOpen && githubUser && repos.length === 0) {
			setLoading(true)
			try {
				const list = await window.devilAi.githubActions.listRepos()
				setRepos(list?.repositories || [])
			} catch (e) {
				console.error(e)
			} finally {
				setLoading(false)
			}
		}
	}

	const handleLink = async (repo: any) => {
		try {
			await window.devilAi.projectRepoMap.set(directory, repo.owner.login, repo.name)
			await loadLinkedRepo()
			setOpen(false)
		} catch (e) {
			console.error(e)
		}
	}

	const handleUnlink = async () => {
		try {
			await window.devilAi.projectRepoMap.delete(directory)
			setLinkedRepo(null)
		} catch (e) {
			console.error(e)
		}
	}

	const handleCreate = async () => {
		const repoName = search.trim().length > 0 ? search.trim() : (window.devilAi.platform === "win32" ? directory.split("\\").pop() : directory.split("/").pop()) || "new-repo"
		setCreating(true)
		try {
			const newRepo = await window.devilAi.githubActions.createRepo({ name: repoName, private: true })
			await handleLink(newRepo)
		} catch (e) {
			console.error("Failed to create repo", e)
		} finally {
			setCreating(false)
		}
	}

	if (!githubUser) return null // Only show if GitHub is logged in

	if (linkedRepo) {
		return (
			<div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
				<GithubIcon className="size-4" />
				<span>{linkedRepo.owner}/{linkedRepo.repo}</span>
				<Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={handleUnlink} title="Unlink Repository">
					<UnlinkIcon className="size-3" />
				</Button>
			</div>
		)
	}

	const filteredRepos = repos.filter(r => 
		r?.fullName?.toLowerCase().includes(search.toLowerCase()) || 
		r?.name?.toLowerCase().includes(search.toLowerCase())
	)
	
	const suggestedRepoName = window.devilAi.platform === "win32" ? directory.split("\\").pop() : directory.split("/").pop()
	const createRepoName = search.trim().length > 0 ? search.trim() : suggestedRepoName || "new-repo"
	const isExistingExactMatch = search.trim().length > 0 && repos.some(r => r.name.toLowerCase() === search.trim().toLowerCase())

	return (
		<div className="mt-2 flex justify-center">
			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger render={
					<Button variant="outline" size="sm" className="h-7 text-xs text-muted-foreground">
						<LinkIcon className="size-3 mr-1.5" />
						Attach GitHub Repo
					</Button>
				} />
				<PopoverContent className="w-80 p-2" align="center">
					<div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-2 px-1">
						<SearchIcon className="size-4 text-muted-foreground shrink-0" />
						<Input
							autoFocus
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search repositories..."
							className="h-7 border-0 p-0 text-sm focus-visible:ring-0 shadow-none bg-transparent"
						/>
					</div>
					
					{loading ? (
						<div className="flex items-center justify-center py-6 text-muted-foreground">
							<Loader2Icon className="size-4 animate-spin mr-2" />
							<span className="text-sm">Loading repos...</span>
						</div>
					) : (
						<ScrollArea className="h-64">
							<div className="flex flex-col gap-1 pr-3">
								{!isExistingExactMatch && (
									<button
										onClick={handleCreate}
										disabled={creating}
										className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted group text-primary mb-1 border border-primary/20 bg-primary/5"
									>
										{creating ? (
											<Loader2Icon className="size-4 animate-spin" />
										) : (
											<PlusIcon className="size-4" />
										)}
										<span className="font-medium">Create repository "{createRepoName}"</span>
									</button>
								)}
								{filteredRepos.length > 0 ? (
									filteredRepos.map(repo => (
										<button
											key={repo.id}
											onClick={() => handleLink(repo)}
											className="flex flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted group"
										>
											<span className="font-medium text-foreground">{repo.name}</span>
											<span className="text-xs text-muted-foreground group-hover:text-foreground/80">{repo.fullName}</span>
										</button>
									))
								) : (
									<div className="py-4 text-center text-sm text-muted-foreground">
										No repositories found
									</div>
								)}
							</div>
						</ScrollArea>
					)}
				</PopoverContent>
			</Popover>
		</div>
	)
}
