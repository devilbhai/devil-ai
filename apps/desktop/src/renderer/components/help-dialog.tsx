import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@devil-ai/ui/components/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@devil-ai/ui/components/tabs"
import { Kbd } from "@devil-ai/ui/components/kbd"
import { KeyboardIcon, LightbulbIcon, ZapIcon } from "lucide-react"

interface HelpDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border">
				<DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
					<DialogTitle className="text-xl font-semibold flex items-center gap-2">
						<LightbulbIcon className="size-5 text-red-500" />
						Devil AI Help & Documentation
					</DialogTitle>
					<DialogDescription>
						Quickly learn how to navigate and use the 61+ features in Devil AI.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="shortcuts" className="flex-1 flex flex-col min-h-0 overflow-hidden">
					<div className="px-6 pt-4 shrink-0">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="shortcuts" className="flex items-center gap-2">
								<KeyboardIcon className="size-4" />
								Shortcuts
							</TabsTrigger>
							<TabsTrigger value="commands" className="flex items-center gap-2">
								<ZapIcon className="size-4" />
								Commands
							</TabsTrigger>
							<TabsTrigger value="features" className="flex items-center gap-2">
								<LightbulbIcon className="size-4" />
								Core Features
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="flex-1 overflow-y-auto px-6 py-4">
						{/* Shortcuts Tab */}
						<TabsContent value="shortcuts" className="m-0 space-y-4">
							<div className="space-y-4">
								<div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 border-b border-border/50">
									<div>
										<h4 className="text-sm font-medium text-foreground">Command Palette</h4>
										<p className="text-xs text-muted-foreground">Open the global search and command runner</p>
									</div>
									<Kbd>Cmd + K</Kbd>
								</div>
								
								<div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 border-b border-border/50">
									<div>
										<h4 className="text-sm font-medium text-foreground">Undo / Revert Session</h4>
										<p className="text-xs text-muted-foreground">Revert the last AI-generated changes</p>
									</div>
									<Kbd>Cmd + Z</Kbd>
								</div>

								<div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 border-b border-border/50">
									<div>
										<h4 className="text-sm font-medium text-foreground">Send Prompt</h4>
										<p className="text-xs text-muted-foreground">Submit your message to the AI</p>
									</div>
									<Kbd>Enter</Kbd>
								</div>

								<div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 border-b border-border/50">
									<div>
										<h4 className="text-sm font-medium text-foreground">New Line</h4>
										<p className="text-xs text-muted-foreground">Insert a line break in the input box</p>
									</div>
									<Kbd>Shift + Enter</Kbd>
								</div>
							</div>
						</TabsContent>

						{/* Commands Tab */}
						<TabsContent value="commands" className="m-0 space-y-4">
							<div className="space-y-4">
								<div className="bg-muted p-4 rounded-lg border border-border/50">
									<h4 className="text-red-400 font-mono text-sm mb-1">/goal</h4>
									<p className="text-sm text-foreground/80">Run a long-running, autonomous task. The AI will not stop until the goal is achieved.</p>
								</div>

								<div className="bg-muted p-4 rounded-lg border border-border/50">
									<h4 className="text-red-400 font-mono text-sm mb-1">/schedule</h4>
									<p className="text-sm text-foreground/80">Schedule a recurring CRON task or one-off timer for background execution.</p>
								</div>

								<div className="bg-muted p-4 rounded-lg border border-border/50">
									<h4 className="text-red-400 font-mono text-sm mb-1">/browser</h4>
									<p className="text-sm text-foreground/80">Spawns a specialized sub-agent to navigate the web, scrape docs, or interact with UIs.</p>
								</div>

								<div className="bg-muted p-4 rounded-lg border border-border/50">
									<h4 className="text-red-400 font-mono text-sm mb-1">@ mention</h4>
									<p className="text-sm text-foreground/80">Type <code>@</code> in the chat to attach context like files, URLs, Git commits, or sub-agents.</p>
								</div>
							</div>
						</TabsContent>

						{/* Features Tab */}
						<TabsContent value="features" className="m-0 space-y-6">
							<div>
								<h3 className="text-lg font-semibold text-foreground mb-2">Git Worktree Isolation</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									When enabled in the sidebar, Devil AI creates a hidden git worktree. 
									This allows the AI to wildly experiment, install packages, and rewrite code without affecting your main branch. You can review the diff and merge it later.
								</p>
							</div>

							<div>
								<h3 className="text-lg font-semibold text-foreground mb-2">Cloudflare Session Sharing</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									Click the 'Share' button to spin up a secure, OTP-protected Cloudflare Tunnel. 
									You can send the generated link to a colleague to let them view your AI pair-programming session in real-time.
								</p>
							</div>

							<div>
								<h3 className="text-lg font-semibold text-foreground mb-2">Devil Arsenal (God-Tier)</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									Click the red 'Arsenal' button in the sidebar to activate extreme power-user modes like 
									<strong> Swarm Refactoring</strong> (orchestrates sub-agents to refactor huge codebases) and 
									<strong> Voice-to-Architecture</strong> (continuously listens to your voice and generates architectures).
								</p>
							</div>
						</TabsContent>
					</div>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
