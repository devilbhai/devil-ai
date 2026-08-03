/**
 * Root layout: shared providers, global hooks, keyboard navigation,
 * command palette, and onboarding.
 * Does NOT render any sidebar chrome -- that lives in SidebarLayout.
 */
import { TooltipProvider } from "@devil-ai/ui/components/tooltip"
import { Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Toaster } from "sonner"
import { discoveryPhaseAtom } from "../atoms/discovery"
import { DEVILROUTE_REQUIRED_VERSION, onboardingStateAtom } from "../atoms/onboarding"
import { NEW_CHAT_DRAFT_KEY, useDraftActions } from "../hooks/use-draft"
import { useAgents, useCommandPaletteOpen, useSetCommandPaletteOpen } from "../hooks/use-agents"
import { useChromeTier } from "../hooks/use-chrome-tier"
import { useDiscovery } from "../hooks/use-discovery"
import { useDevilRouteTokens } from "../hooks/use-devilroute-tokens"
import { useMockMode } from "../hooks/use-mock-mode"
import { useNotifications } from "../hooks/use-notifications"
import { useAgentActions, useServerConnection } from "../hooks/use-server"
import { useServerSettingsSync } from "../hooks/use-servers"
import { useSystemAccentColor } from "../hooks/use-system-accent-color"
import { useThemeEffect } from "../hooks/use-theme"
import { useWaitingIndicator } from "../hooks/use-waiting-indicator"
import { AppBarProvider } from "./app-bar-context"
import { CommandPalette } from "./command-palette"
import { OnboardingOverlay } from "./onboarding/onboarding-overlay"
import { SidebarSlotProvider } from "./sidebar-slot-context"
import { StartupOverlay } from "./startup-overlay"
import { useSubscriptionStatus } from "../hooks/use-subscription"
import { Button } from "@devil-ai/ui/components/button"
import { DevilAiWordmark } from "./devil-ai-wordmark"
import { PageAgentIntegration } from "./page-agent-integration"
import { ChangelogDialog } from "./changelog-dialog"
import { CHANGELOG } from "../lib/changelog"
import { ScreenShareDialog, ScreenShareRemoteDialog } from "./screen-share"

export function RootLayout() {
	const isMockMode = useMockMode()
	const onboardingState = useAtomValue(onboardingStateAtom)
	const setOnboardingState = useSetAtom(onboardingStateAtom)
	const { clearDraft } = useDraftActions(NEW_CHAT_DRAFT_KEY)

	// Only run discovery/connection after onboarding is complete (or in browser mode / mock mode)
	const isElectronEnv = typeof window !== "undefined" && "devilAi" in window

	// Auto-skip onboarding if OpenCode is already configured.
	// Check if the opencode config directory exists and has content.
	const [autoChecked, setAutoChecked] = useState(false)
	const [showOnboarding, setShowOnboarding] = useState(false)
    const pathname = useRouterState({ select: (s) => s.location.pathname })
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem("devil-ai-token");
        if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/signup") && !pathname.startsWith("/forgot-password")) {
            navigate({ to: "/login" });
            return;
        }

        // Server-side subscription validation (non-blocking)
        if (token && typeof window !== "undefined" && "devilAi" in window) {
            window.devilAi.validateSubscription(token).then((result: { valid: boolean; planId?: string; expiresAt?: string }) => {
                if (!result.valid && !pathname.startsWith("/settings/account") && !pathname.startsWith("/login") && !pathname.startsWith("/signup")) {
                    // Subscription invalid - allow access but mark as expired
                    localStorage.setItem("devil-ai-sub-expired", "true");
                    window.dispatchEvent(new Event('storage'));
                    
                    // Clear cached subscriptions
                    const cachedUser = localStorage.getItem("devil-ai-user");
                    if (cachedUser) {
                        try {
                            const user = JSON.parse(cachedUser);
                            user.subscriptions = [];
                            localStorage.setItem("devil-ai-user", JSON.stringify(user));
                        } catch {}
                    }
                } else if (result.valid) {
                    localStorage.removeItem("devil-ai-sub-expired");
                    window.dispatchEvent(new Event('storage'));
                    // Update cached user with fresh subscription data
                    const cachedUser = localStorage.getItem("devil-ai-user");
                    if (cachedUser) {
                        try {
                            const user = JSON.parse(cachedUser);
                            user.subscriptions = result.planId ? [{ planId: result.planId, status: "ACTIVE", currentPeriodEnd: result.expiresAt }] : [];
                            localStorage.setItem("devil-ai-user", JSON.stringify(user));
                        } catch {}
                    }
                }
            }).catch(() => {
                // Network error - allow offline grace period (sub-verify-token in credential store)
            });
        }
    }, [pathname, navigate]);

	useEffect(() => {
		if (autoChecked) return
		if (!isElectronEnv || isMockMode) {
			setAutoChecked(true)
			return
		}

		// If already completed, no need to check
		if (onboardingState.completed) {
			setAutoChecked(true)
			return
		}

		// Auto-check: try to ensure the server is running. If it works,
		// onboarding is not needed — the user already has OpenCode configured.
		const autoCheck = async () => {
			try {
				// Fast-path: If CLI isn't installed, skip trying to start it.
				// This prevents a 15-second freeze on fresh installations.
				if (typeof window !== "undefined" && "devilAi" in window && window.devilAi.cli) {
					const isInstalled = await window.devilAi.cli.isInstalled()
					if (!isInstalled) {
						console.log("CLI not installed. Auto-installing...")
						try {
							const installResult = await window.devilAi.cli.install()
							console.log("Auto-install result:", installResult)
						} catch (e) {
							console.error("Auto-install failed:", e)
							setShowOnboarding(true)
							setAutoChecked(true)
							return
						}
					}
				}

				// Try to ensure the server is running via IPC
				const result = await window.devilAi.ensureOpenCode()
				if (result?.url) {
					// Server started successfully — skip onboarding
					setOnboardingState({
						completed: true,
						completedAt: new Date().toISOString(),
						skippedSteps: ["auto-skip"],
						migrationPerformed: false,
						migratedFrom: [],
						opencodeVersion: null,
						providersConnected: 1,
						devilrouteV: 0,
					})
					setAutoChecked(true)
					return
				}
			} catch {
				// Server couldn't start — show onboarding
			}
			setShowOnboarding(true)
			setAutoChecked(true)
		}

		autoCheck()
	}, [isElectronEnv, isMockMode, onboardingState.completed, setOnboardingState, autoChecked])

	// Existing users who completed onboarding before DevilRoute existed (or whose
	// stored devilrouteV is behind the required version) get a focused re-onboarding
	// screen so the local gateway is installed on their machine.
	const needsDevilRouteSetup =
		onboardingState.completed &&
		!isMockMode &&
		(onboardingState.devilrouteV ?? 0) < DEVILROUTE_REQUIRED_VERSION

	// Final decision: show onboarding only if we checked and it's needed
	const shouldShowOnboarding = (showOnboarding && !onboardingState.completed && !isMockMode) || needsDevilRouteSetup

	// Track discovery phase to coordinate startup overlay / content crossfade
	const phase = useAtomValue(discoveryPhaseAtom)

	useServerSettingsSync()
	useDevilRouteTokens()
	useDiscovery()
	useServerConnection()
	useWaitingIndicator()
	useThemeEffect()
	useChromeTier()
	useSystemAccentColor()

	const isSubActive = useSubscriptionStatus()
	const isBlocked = !isSubActive && !pathname.startsWith("/settings/account") && !pathname.startsWith("/login") && !pathname.startsWith("/signup")

	// Changelog dialog state
	const [showChangelog, setShowChangelog] = useState(false)
	const [changelogVersion, setChangelogVersion] = useState("")

	useEffect(() => {
		if (CHANGELOG.length === 0) return
		const latestVersion = CHANGELOG[0].version
		const lastSeen = localStorage.getItem("devil-ai-changelog-version")
		if (lastSeen !== latestVersion) {
			setChangelogVersion(latestVersion)
			setShowChangelog(true)
		}
	}, [])

	const handleChangelogClose = useCallback(() => {
		setShowChangelog(false)
		localStorage.setItem("devil-ai-changelog-version", changelogVersion)
	}, [changelogVersion])

	// Screen share dialog state
	const [showScreenShareHost, setShowScreenShareHost] = useState(false)
	const [showScreenShareRemote, setShowScreenShareRemote] = useState(false)

	const agents = useAgents()
	const { forkSession } = useAgentActions()
	const commandPaletteOpen = useCommandPaletteOpen()
	const setCommandPaletteOpen = useSetCommandPaletteOpen()
	const params = useParams({ strict: false })
	const sessionId = (params as Record<string, string | undefined>).sessionId

	// Native OS notifications: badge sync, click-to-navigate, auto-dismiss
	useNotifications(navigate, sessionId)

	// ========== Command palette: fork session ==========

	const activeAgent = useMemo(
		() => (sessionId ? (agents.find((a) => a.id === sessionId) ?? null) : null),
		[agents, sessionId],
	)

	const handleForkSession = useCallback(async () => {
		if (!activeAgent) return
		const forked = await forkSession(activeAgent.directory, activeAgent.id)
		navigate({
			to: "/project/$projectSlug/session/$sessionId",
			params: { projectSlug: activeAgent.projectSlug, sessionId: forked.id },
		})
	}, [activeAgent, forkSession, navigate])

	// Sub-agents are filtered at the API level (roots: true), so all agents here are root agents
	const visibleAgents = agents

	// ========== Keyboard navigation ==========

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			const target = e.target as HTMLElement
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				return
			}

			if (e.key === "Escape") {
				e.preventDefault()
				navigate({ to: "/" })
				return
			}

			if ((e.key === "j" || e.key === "k") && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault()
				const currentIndex = visibleAgents.findIndex((a) => a.id === sessionId)
				let nextIndex: number
				if (e.key === "j") {
					nextIndex = currentIndex < visibleAgents.length - 1 ? currentIndex + 1 : 0
				} else {
					nextIndex = currentIndex > 0 ? currentIndex - 1 : visibleAgents.length - 1
				}
				const agent = visibleAgents[nextIndex]
				if (agent) {
					navigate({
						to: "/project/$projectSlug/session/$sessionId",
						params: {
							projectSlug: agent.projectSlug,
							sessionId: agent.id,
						},
					})
				}
				return
			}

			if ((e.metaKey || e.ctrlKey) && e.key === "n") {
				e.preventDefault()
				clearDraft()
				navigate({ to: "/" })
				return
			}

			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault()
				setCommandPaletteOpen(true)
				return
			}

			// Screen sharing shortcuts (Shift+Cmd/Cmd+S to share, Shift+Cmd/Cmd+G to join)
			if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
				if (e.key === "s" || e.key === "S") {
					e.preventDefault()
					setShowScreenShareHost(true)
					return
				}
				if (e.key === "g" || e.key === "G") {
					e.preventDefault()
					setShowScreenShareRemote(true)
					return
				}
			}
		},
		[sessionId, visibleAgents, navigate, setCommandPaletteOpen],
	)

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [handleKeyDown])

	// ========== Onboarding completion ==========

	const handleOnboardingComplete = useCallback(
		(state: {
			skippedSteps: string[]
			migrationPerformed: boolean
			migratedFrom: string[]
			opencodeVersion: string | null
			providersConnected: number
			devilrouteV: number
		}) => {
			setOnboardingState((prev) => ({
				...prev,
				completed: true,
				completedAt: new Date().toISOString(),
				skippedSteps: state.skippedSteps,
				migrationPerformed: state.migrationPerformed,
				migratedFrom: state.migratedFrom,
				opencodeVersion: state.opencodeVersion,
				providersConnected: state.providersConnected,
				devilrouteV: state.devilrouteV,
			}))
		},
		[setOnboardingState],
	)

	// ========== Splash cleanup during onboarding ==========
	// The HTML-level #splash (index.html) is normally removed by StartupOverlay's
	// mount effect. When onboarding is shown we return early and StartupOverlay
	// never mounts, so clean up the HTML splash here instead.
	useEffect(() => {
		if (!shouldShowOnboarding) return
		const splash = document.getElementById("splash")
		if (splash) {
			splash.classList.add("hiding")
			setTimeout(() => splash.remove(), 300)
		}
	}, [shouldShowOnboarding])

	// ========== Layout ==========

	if (shouldShowOnboarding) {
		// Existing users needing the DevilRoute gateway get the focused re-onboarding
		// screen (gateway step only); new users get the full wizard.
		if (needsDevilRouteSetup) {
			return (
				<OnboardingOverlay
					onComplete={handleOnboardingComplete}
					initialStep="gateway"
					minimal
				/>
			)
		}
		return <OnboardingOverlay onComplete={handleOnboardingComplete} />
	}

	// Hide app content while the startup overlay is covering the screen.
	// The overlay fades out at "ready"; showing content at "ready" creates a
	// smooth crossfade. Content is still rendered (just invisible) so React
	// can paint it before the overlay lifts.
	const contentReady = phase === "ready" || phase === "loading-sessions" || phase === "error"

	return (
		<TooltipProvider>
			<PageAgentIntegration />
			<AppBarProvider>
				<SidebarSlotProvider>
					<div
						className={`transition-opacity duration-300 ${contentReady ? "opacity-100" : "opacity-0"} relative h-full`}
					>
						{isBlocked ? (
							<div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-8">
								<DevilAiWordmark className="h-8 w-auto text-foreground mb-6" />
								<h2 className="text-2xl font-bold mb-2">Subscription Required</h2>
								<p className="text-muted-foreground text-center max-w-md mb-8">
									Your subscription is not active or has expired. Please purchase a subscription to continue using Devil AI.
								</p>
								<Button size="lg" onClick={() => navigate({ to: "/settings/account" })}>
									View Plans
								</Button>
							</div>
						) : null}
						<Outlet />
					<CommandPalette
						open={commandPaletteOpen}
						onOpenChange={setCommandPaletteOpen}
						agents={agents}
						onForkSession={activeAgent ? handleForkSession : undefined}
					/>
					<Toaster position="bottom-right" />
					<ChangelogDialog
						open={showChangelog}
						onOpenChange={handleChangelogClose}
						latestVersion={changelogVersion}
					/>
					{showScreenShareHost && (
						<ScreenShareDialog onClose={() => setShowScreenShareHost(false)} />
					)}
					{showScreenShareRemote && (
						<ScreenShareRemoteDialog onClose={() => setShowScreenShareRemote(false)} />
					)}
					</div>
					<StartupOverlay />
				</SidebarSlotProvider>
			</AppBarProvider>
		</TooltipProvider>
	)
}
