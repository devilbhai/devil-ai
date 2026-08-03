/**
 * GitHub Actions Dashboard - Manage workflows and monitor runs.
 * Includes GitHub login, repo selection, auto-repo creation, and project-repo linking.
 */

import { useCallback, useEffect, useState } from "react"
import {
	PlayIcon,
	RefreshCwIcon,
	XCircleIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	AlertCircleIcon,
	ExternalLinkIcon,
	PlusIcon,
	GithubIcon,
	SearchIcon,
	LinkIcon,
	UnlinkIcon,
	KeyIcon,
	LogInIcon,
	UserIcon,
	FolderGit2Icon,
} from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@devil-ai/ui/components/card"
import { Badge } from "@devil-ai/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@devil-ai/ui/components/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@devil-ai/ui/components/select"
import { Tooltip, TooltipTrigger } from "@devil-ai/ui/components/tooltip"
import { Input } from "@devil-ai/ui/components/input"
import { ScrollArea } from "@devil-ai/ui/components/scroll-area"
import { useProjectList } from "../../hooks/use-agents"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@devil-ai/ui/components/dialog"
import { Separator } from "@devil-ai/ui/components/separator"

interface Workflow {
	id: number
	name: string
	path: string
	state: "active" | "disabled" | "deleted"
	createdAt: string
	updatedAt: string
	htmlUrl: string
}

interface WorkflowRun {
	id: number
	name: string
	headBranch: string
	headSha: string
	event: string
	status: "queued" | "in_progress" | "completed"
	conclusion: "success" | "failure" | "cancelled" | "skipped" | "timed_out" | null
	createdAt: string
	updatedAt: string
	runNumber: number
	htmlUrl: string
}

interface GitHubRepo {
	owner: string
	repo: string
}

interface GitHubRepository {
	id: number
	name: string
	fullName: string
	owner: {
		login: string
		avatarUrl: string
	}
	private: boolean
	htmlUrl: string
	description: string | null
	updatedAt: string
}

interface GitHubUser {
	login: string
	avatarUrl: string
}

interface ProjectRepoLink {
	owner: string
	repo: string
	createdAt: string
}

const STATUS_ICONS: Record<string, typeof Loader2Icon> = {
	queued: ClockIcon,
	in_progress: Loader2Icon,
	completed: CheckCircle2Icon,
}

const CONCLUSION_COLORS: Record<string, string> = {
	success: "text-green-500",
	failure: "text-red-500",
	cancelled: "text-muted-foreground",
	skipped: "text-muted-foreground",
	timed_out: "text-orange-500",
}

export function GitHubActionsDashboard() {
	const projects = useProjectList()
	const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
	const [workflows, setWorkflows] = useState<Workflow[]>([])
	const [runs, setRuns] = useState<WorkflowRun[]>([])
	const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState("workflows")
	const [showRepoDialog, setShowRepoDialog] = useState(false)
	const [repos, setRepos] = useState<GitHubRepository[]>([])
	const [reposLoading, setReposLoading] = useState(false)
	const [repoSearch, setRepoSearch] = useState("")
	const [showTokenDialog, setShowTokenDialog] = useState(false)
	const [tokenInput, setTokenInput] = useState("")
	const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
	const [showCreateRepoDialog, setShowCreateRepoDialog] = useState(false)
	const [newRepoName, setNewRepoName] = useState("")
	const [newRepoDescription, setNewRepoDescription] = useState("")
	const [newRepoPrivate, setNewRepoPrivate] = useState(true)
	const [creatingRepo, setCreatingRepo] = useState(false)

	// Auto-detect repo from project
	useEffect(() => {
		if (projects.length > 0 && !selectedRepo) {
			const project = projects[0]
			if (project?.directory) {
				window.devilAi?.githubActions?.parseRemoteUrl?.(project.directory).then((repo) => {
					if (repo) setSelectedRepo(repo)
				})
			}
		}
	}, [projects, selectedRepo])

	// Check for existing project-repo link
	useEffect(() => {
		if (projects.length > 0 && !selectedRepo) {
			const project = projects[0]
			if (project?.directory) {
				window.devilAi?.projectRepoMap?.get?.(project.directory).then((link: ProjectRepoLink | null) => {
					if (link) {
						setSelectedRepo({ owner: link.owner, repo: link.repo })
					}
				})
			}
		}
	}, [projects, selectedRepo])

	// Check auth status on mount
	useEffect(() => {
		checkAuthStatus()
	}, [])

	const checkAuthStatus = async () => {
		try {
			const hasToken = await window.devilAi?.githubActions?.hasToken?.()
			if (hasToken?.hasToken) {
				const user = await window.devilAi?.githubActions?.getUser?.()
				if (user) {
					setGithubUser({ login: user, avatarUrl: "" })
					loadRepos()
				}
			}
		} catch (err) {
			console.log("No token or auth failed")
		}
	}

	const loadWorkflows = useCallback(async () => {
		if (!selectedRepo) return
		setLoading(true)
		setError(null)
		try {
			const result = await window.devilAi?.githubActions?.listWorkflows?.(
				selectedRepo.owner,
				selectedRepo.repo,
			)
			setWorkflows((result?.workflows || []) as Workflow[])
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load workflows")
		} finally {
			setLoading(false)
		}
	}, [selectedRepo])

	const loadRuns = useCallback(async () => {
		if (!selectedRepo) return
		setLoading(true)
		setError(null)
		try {
			const result = await window.devilAi?.githubActions?.listRuns?.(
				selectedRepo.owner,
				selectedRepo.repo,
				selectedWorkflow || undefined,
			)
			setRuns((result?.runs || []) as WorkflowRun[])
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load runs")
		} finally {
			setLoading(false)
		}
	}, [selectedRepo, selectedWorkflow])

	const triggerWorkflow = useCallback(async (workflowId: number) => {
		if (!selectedRepo) return
		setLoading(true)
		setError(null)
		try {
			await window.devilAi?.githubActions?.trigger?.(
				selectedRepo.owner,
				selectedRepo.repo,
				workflowId,
			)
			await loadRuns()
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to trigger workflow")
		} finally {
			setLoading(false)
		}
	}, [selectedRepo, loadRuns])

	const cancelRun = useCallback(async (runId: number) => {
		if (!selectedRepo) return
		try {
			await window.devilAi?.githubActions?.cancelRun?.(selectedRepo.owner, selectedRepo.repo, runId)
			await loadRuns()
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel run")
		}
	}, [selectedRepo, loadRuns])

	const rerunRun = useCallback(async (runId: number) => {
		if (!selectedRepo) return
		try {
			await window.devilAi?.githubActions?.rerunRun?.(selectedRepo.owner, selectedRepo.repo, runId)
			await loadRuns()
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to rerun workflow")
		}
	}, [selectedRepo, loadRuns])

	const loadRepos = useCallback(async () => {
		setReposLoading(true)
		try {
			const result = await window.devilAi?.githubActions?.listRepos?.()
			setRepos((result?.repositories || []) as GitHubRepository[])
		} catch (err) {
			console.log("Need to set token first")
		} finally {
			setReposLoading(false)
		}
	}, [])

	const handleSaveToken = async () => {
		if (!tokenInput.trim()) return
		try {
			await window.devilAi?.githubActions?.saveToken?.(tokenInput.trim())
			setTokenInput("")
			setShowTokenDialog(false)
			const user = await window.devilAi?.githubActions?.getUser?.()
			if (user) setGithubUser({ login: user, avatarUrl: "" })
			await loadRepos()
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save token")
		}
	}

	const handleSelectRepo = (repo: GitHubRepository) => {
		setSelectedRepo({ owner: repo.owner.login, repo: repo.name })
		setShowRepoDialog(false)
		linkProjectToRepo(repo.owner.login, repo.name)
	}

	const handleCreateRepo = async () => {
		if (!newRepoName.trim() || !projects[0]?.directory) return
		setCreatingRepo(true)
		try {
			const result = await window.devilAi?.githubActions?.createRepo?.({
				name: newRepoName.trim(),
				description: newRepoDescription.trim() || undefined,
				private: newRepoPrivate,
				autoInit: true,
			})
			if (result) {
				setNewRepoName("")
				setNewRepoDescription("")
				setShowCreateRepoDialog(false)
				const owner = githubUser?.login || result.owner.login
				await linkProjectToRepo(owner, result.name)
				setSelectedRepo({ owner, repo: result.name })
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create repository")
		} finally {
			setCreatingRepo(false)
		}
	}

	const linkProjectToRepo = async (owner: string, repo: string) => {
		if (!projects[0]?.directory) return
		try {
			await window.devilAi?.projectRepoMap?.set?.(projects[0].directory, owner, repo)
		} catch (err) {
			console.error("Failed to link project to repo:", err)
		}
	}

	const openRepoDialog = async () => {
		const hasToken = await window.devilAi?.githubActions?.hasToken?.()
		if (!hasToken?.hasToken) {
			setShowTokenDialog(true)
			return
		}
		setShowRepoDialog(true)
		await loadRepos()
	}

	const logout = async () => {
		await window.devilAi?.githubActions?.deleteToken?.()
		setGithubUser(null)
		setSelectedRepo(null)
		setWorkflows([])
		setRuns([])
	}

	const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString()
	const truncateSha = (sha: string) => sha.slice(0, 7)

	const filteredRepos = repos.filter(
		(r) =>
			r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
			r.fullName.toLowerCase().includes(repoSearch.toLowerCase()),
	)

	const currentProject = projects[0]
	const projectName = currentProject?.name || "this project"
	const suggestedRepoName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")

	return (
		<div className="flex flex-col h-full">
			{(() => {
				// Not authenticated state
				if (!githubUser) {
					return (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<GithubIcon className="size-5" />
											GitHub Actions
										</CardTitle>
										<CardDescription>Connect to GitHub to manage workflows and monitor runs</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-center py-12">
									<GithubIcon className="mx-auto size-16 text-muted-foreground/50 mb-6" />
									<h3 className="text-xl font-medium mb-3">Connect to GitHub</h3>
									<p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
										Enter your Personal Access Token to access your repositories and create private repos for your projects
									</p>
									<Button variant="default" size="lg" onClick={() => setShowTokenDialog(true)} className="w-full max-w-xs mx-auto">
										<LogInIcon className="size-4 mr-2" />
										Connect GitHub Account
									</Button>
								</div>
							</CardContent>
						</Card>
					)
				}

				// Authenticated but no repo selected
				if (!selectedRepo) {
					return (
						<Card className="flex flex-col h-full">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<CardTitle className="flex items-center gap-2">
											<GithubIcon className="size-5" />
											GitHub Actions
										</CardTitle>
										<Badge variant="secondary" className="flex items-center gap-1">
											<UserIcon className="size-3" />
											{githubUser.login}
										</Badge>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={() => setShowCreateRepoDialog(true)}>
											<PlusIcon className="size-4 mr-1" />
											Create Repo
										</Button>
										<Button variant="ghost" size="sm" onClick={logout}>
											<KeyIcon className="size-4 mr-1" />
											Disconnect
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex-1 flex flex-col min-h-0">
								<div className="flex gap-2 mb-4">
									<SearchIcon className="size-4 mt-2.5 text-muted-foreground shrink-0" />
									<Input
										placeholder="Search repositories..."
										value={repoSearch}
										onChange={(e) => setRepoSearch(e.target.value)}
										className="flex-1"
									/>
								</div>
								<ScrollArea className="flex-1 min-h-0 border rounded-md">
									{reposLoading ? (
										<div className="flex items-center justify-center py-8">
											<Loader2Icon className="size-8 animate-spin" />
										</div>
									) : filteredRepos.length === 0 ? (
										<div className="text-center py-8 text-muted-foreground">
											<GithubIcon className="mx-auto size-12 mb-2" />
											<p>No repositories found</p>
										</div>
									) : (
										<div className="space-y-1 p-2">
											{filteredRepos.map((repo) => (
												<div
													key={repo.id}
													className="w-full flex items-center justify-between gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
												>
													<div className="flex items-center gap-3 min-w-0 flex-1">
														<GithubIcon className="size-5 text-muted-foreground shrink-0" />
														<div className="flex-1 min-w-0 text-left">
															<p className="font-medium truncate flex items-center gap-2">
																{repo.fullName}
																{repo.private && (
																	<Badge variant="secondary" className="text-[10px] h-4 px-1">
																		Private
																	</Badge>
																)}
															</p>
															<p className="text-xs text-muted-foreground truncate">
																{repo.description || "No description"}
															</p>
														</div>
													</div>
													<Button variant="secondary" size="sm" onClick={() => handleSelectRepo(repo)}>
														Select
													</Button>
												</div>
											))}
										</div>
									)}
								</ScrollArea>
							</CardContent>
						</Card>
					)
				}

				// Main dashboard with repo selected
				return (
					<Card>
						<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<GithubIcon className="size-5" />
								GitHub Actions
							</CardTitle>
							<CardDescription>
								{selectedRepo.owner}/{selectedRepo.repo}
								{currentProject && (
									<Badge variant="outline" className="ml-2 flex items-center gap-1">
										<LinkIcon className="size-3" />
										Linked to {projectName}
									</Badge>
								)}
							</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={loadWorkflows}
								disabled={loading}
							>
								<RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
							</Button>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												const url = `https://github.com/${selectedRepo.owner}/${selectedRepo.repo}/actions`
												window.open(url, "_blank")
											}}
										>
											<ExternalLinkIcon className="size-4" />
										</Button>
									}
								>
									Open in GitHub
								</TooltipTrigger>
							</Tooltip>
							<Button variant="outline" size="sm" onClick={openRepoDialog}>
								<PlusIcon className="size-4 mr-1" />
								Switch Repo
							</Button>
							<Button variant="ghost" size="sm" onClick={logout}>
								<UnlinkIcon className="size-4 mr-1" />
								Disconnect
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							<AlertCircleIcon className="size-4" />
							{error}
						</div>
					)}

					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList>
							<TabsTrigger value="workflows">Workflows</TabsTrigger>
							<TabsTrigger value="runs">Runs</TabsTrigger>
						</TabsList>

						<TabsContent value="workflows" className="mt-4">
							{workflows.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									{loading ? (
										<Loader2Icon className="mx-auto size-8 animate-spin" />
									) : (
										<>
											<p>No workflows found</p>
											<Button variant="link" onClick={loadWorkflows}>
												Load workflows
											</Button>
										</>
									)}
								</div>
							) : (
								<div className="space-y-2">
									{workflows.map((workflow) => (
										<div
											key={workflow.id}
											className="flex items-center justify-between rounded-md border p-3"
										>
											<div className="flex items-center gap-3">
												<div>
													<p className="font-medium">{workflow.name}</p>
													<p className="text-xs text-muted-foreground">{workflow.path}</p>
												</div>
												<Badge variant={workflow.state === "active" ? "default" : "secondary"}>
													{workflow.state}
												</Badge>
											</div>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => triggerWorkflow(workflow.id)}
													disabled={loading || workflow.state !== "active"}
												>
													<PlayIcon className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setSelectedWorkflow(workflow.id)
														setActiveTab("runs")
													}}
												>
													View Runs
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="runs" className="mt-4">
							<div className="mb-4 flex items-center gap-2">
								<Select
									value={selectedWorkflow?.toString() || "all"}
									onValueChange={(v) => setSelectedWorkflow(v === "all" ? null : Number(v))}
								>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="All workflows" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All workflows</SelectItem>
										{workflows.map((w) => (
											<SelectItem key={w.id} value={w.id.toString()}>
												{w.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button variant="outline" size="sm" onClick={loadRuns} disabled={loading}>
									<RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
								</Button>
							</div>

							{runs.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									{loading ? (
										<Loader2Icon className="mx-auto size-8 animate-spin" />
									) : (
										<p>No runs found</p>
									)}
								</div>
							) : (
								<div className="space-y-2">
									{runs.map((run) => {
										const StatusIcon = STATUS_ICONS[run.status] || ClockIcon
										return (
											<div key={run.id} className="flex items-center justify-between rounded-md border p-3">
												<div className="flex items-center gap-3">
													<StatusIcon
														className={`size-4 ${
															run.status === "in_progress"
																? "animate-spin text-blue-500"
																: run.conclusion
																	? CONCLUSION_COLORS[run.conclusion]
																	: ""
														}`}
													/>
													<div>
														<div className="flex items-center gap-2">
															<p className="font-medium">
																#{run.runNumber} {run.name}
															</p>
															<Badge variant="outline">
																{run.conclusion || run.status}
															</Badge>
														</div>
														<p className="text-xs text-muted-foreground">
															{run.headBranch} • {truncateSha(run.headSha)} •{" "}
															{run.event} • {formatDate(run.createdAt)}
														</p>
													</div>
												</div>
												<div className="flex gap-1">
													{run.status === "in_progress" && (
														<Tooltip>
															<TooltipTrigger
																render={
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => cancelRun(run.id)}
																	>
																		<XCircleIcon className="size-4" />
																	</Button>
																}
															>
																Cancel
															</TooltipTrigger>
														</Tooltip>
													)}
													{run.status === "completed" && run.conclusion === "failure" && (
														<Tooltip>
															<TooltipTrigger
																render={
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => rerunRun(run.id)}
																	>
																		<RefreshCwIcon className="size-4" />
																	</Button>
																}
															>
																Rerun
															</TooltipTrigger>
														</Tooltip>
													)}
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => window.open(run.htmlUrl, "_blank")}
																>
																	<ExternalLinkIcon className="size-4" />
																</Button>
															}
														>
															View on GitHub
														</TooltipTrigger>
													</Tooltip>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
			)
		})()}

			{/* Repository Selection Dialog */}
			<Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
				<DialogContent className="max-w-2xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle>Select Repository</DialogTitle>
						<DialogDescription>
							Choose a GitHub repository to manage workflows
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex gap-2">
							<SearchIcon className="size-4 mt-2.5 text-muted-foreground" />
							<Input
								placeholder="Search repositories..."
								value={repoSearch}
								onChange={(e) => setRepoSearch(e.target.value)}
								className="flex-1"
							/>
						</div>
						<Separator />
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<FolderGit2Icon className="size-4" />
							<span>Create a new private repo for "{projectName}"</span>
						</div>
						<Button variant="outline" onClick={() => { setShowCreateRepoDialog(true); setShowRepoDialog(false); }}>
							<PlusIcon className="size-4 mr-1" />
							Create New Repository
						</Button>
						<ScrollArea className="max-h-96">
							{reposLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2Icon className="size-8 animate-spin" />
								</div>
							) : filteredRepos.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<GithubIcon className="mx-auto size-12 mb-2" />
									<p>No repositories found</p>
								</div>
							) : (
								<div className="space-y-1">
									{filteredRepos.map((repo) => (
										<button
											key={repo.id}
											onClick={() => handleSelectRepo(repo)}
											className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left"
										>
											<GithubIcon className="size-5 text-muted-foreground" />
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{repo.fullName}</p>
												<p className="text-xs text-muted-foreground truncate">
													{repo.description || "No description"}
												</p>
											</div>
											{repo.private && (
												<Badge variant="secondary" className="text-xs">
													Private
												</Badge>
											)}
										</button>
									))}
								</div>
							)}
						</ScrollArea>
					</div>
				</DialogContent>
			</Dialog>

			{/* Create New Repository Dialog */}
			<Dialog open={showCreateRepoDialog} onOpenChange={setShowCreateRepoDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Private Repository</DialogTitle>
						<DialogDescription>
							A private repository will be created for "{projectName}"
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div>
							<label className="text-sm font-medium mb-1 block">Repository Name</label>
							<Input
								value={newRepoName || suggestedRepoName}
								onChange={(e) => setNewRepoName(e.target.value)}
								placeholder={suggestedRepoName}
								disabled={creatingRepo}
							/>
						</div>
						<div>
							<label className="text-sm font-medium mb-1 block">Description (optional)</label>
							<Input
								value={newRepoDescription}
								onChange={(e) => setNewRepoDescription(e.target.value)}
								placeholder="Repository description"
								disabled={creatingRepo}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Input
								type="checkbox"
								id="private-repo"
								checked={newRepoPrivate}
								onChange={(e) => setNewRepoPrivate(e.target.checked)}
								disabled={creatingRepo}
							/>
							<label htmlFor="private-repo" className="text-sm">
								Make repository private (recommended)
							</label>
						</div>
					</div>
					<div className="flex justify-end gap-2 mt-4">
						<Button variant="ghost" onClick={() => setShowCreateRepoDialog(false)} disabled={creatingRepo}>
							Cancel
						</Button>
						<Button onClick={handleCreateRepo} disabled={creatingRepo || !newRepoName.trim()}>
							{creatingRepo ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4 mr-1" />}
							Create Repository
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Token Setup Dialog */}
			<Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>GitHub Token Required</DialogTitle>
						<DialogDescription>
							Enter your GitHub Personal Access Token to access repositories
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="text-sm text-muted-foreground space-y-2">
							<p><strong>How to create a token:</strong></p>
							<ol className="list-decimal list-inside space-y-1">
								<li>Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens</li>
								<li>Click "Generate new token"</li>
								<li>Set permissions: <strong>Actions</strong> (Read & Write), <strong>Contents</strong> (Read), <strong>Metadata</strong> (Read)</li>
								<li>Copy the token and paste it below</li>
							</ol>
						</div>
						<Input
							type="password"
							placeholder="ghp_xxxxxxxxxxxx"
							value={tokenInput}
							onChange={(e) => setTokenInput(e.target.value)}
							className="font-mono text-sm"
						/>
						<div className="flex justify-end gap-2">
							<Button variant="ghost" onClick={() => setShowTokenDialog(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveToken} disabled={!tokenInput.trim()}>
								Save Token
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}