import {
	createHashHistory,
	createRootRoute,
	createRoute,
	createRouter,
	redirect,
} from "@tanstack/react-router"
import React, { Suspense } from "react"

const lazyRoute = <T extends React.ComponentType<any>>(factory: () => Promise<any>, name: string) => {
	const LazyComponent = React.lazy(() => factory().then((m: any) => ({ default: m[name] as T })))
	return (props: React.ComponentProps<T>) => (
		<Suspense fallback={null}>
			<LazyComponent {...props} />
		</Suspense>
	)
}

const AutomationDetail = lazyRoute(() => import("./components/automations/automation-detail"), "AutomationDetail")
const AutomationRunDetail = lazyRoute(() => import("./components/automations/automation-run-detail"), "AutomationRunDetail")
const AutomationsPage = lazyRoute(() => import("./components/automations/automations-page"), "AutomationsPage")
const InboxEmptyState = lazyRoute(() => import("./components/automations/inbox-empty-state"), "InboxEmptyState")
const ErrorPage = lazyRoute(() => import("./components/error-page"), "ErrorPage")
const NewChat = lazyRoute(() => import("./components/new-chat"), "NewChat")
const NotFoundPage = lazyRoute(() => import("./components/not-found-page"), "NotFoundPage")
const NotesPage = lazyRoute(() => import("./components/notes/notes-page"), "NotesPage")
const CanvasPage = lazyRoute(() => import("./components/canvas/canvas-page"), "CanvasPage")
const PromptLibraryPage = lazyRoute(() => import("./components/prompts/prompt-library-page"), "PromptLibraryPage")
const SnippetsPage = lazyRoute(() => import("./components/snippets/snippets-page"), "SnippetsPage")
const SessionTemplatesPage = lazyRoute(() => import("./components/session-templates/session-templates-page"), "SessionTemplatesPage")
const KeyboardShortcutsPage = lazyRoute(() => import("./components/keyboard-shortcuts/keyboard-shortcuts-page"), "KeyboardShortcutsPage")
const DatabaseViewerPage = lazyRoute(() => import("./components/database-viewer/database-viewer-page"), "DatabaseViewerPage")
const ApiTesterPage = lazyRoute(() => import("./components/api-tester/api-tester-page"), "ApiTesterPage")
const AnalyticsDashboardPage = lazyRoute(() => import("./components/analytics/analytics-dashboard-page"), "AnalyticsDashboardPage")
const TerminalPage = lazyRoute(() => import("./components/terminal/terminal-page"), "TerminalPage")
const BrowserPanelPage = lazyRoute(() => import("./components/browser/browser-panel-page"), "BrowserPanelPage")
const CodeSandboxPage = lazyRoute(() => import("./components/code-sandbox/code-sandbox-page"), "CodeSandboxPage")
const IntegrationsPage = lazyRoute(() => import("./components/integrations/integrations-page"), "IntegrationsPage")
const BotIntegrationPage = lazyRoute(() => import("./components/integrations/bot-integration-page"), "BotIntegrationPage")
const RootLayout = lazyRoute(() => import("./components/root-layout"), "RootLayout")
const SessionRoute = lazyRoute(() => import("./components/session-route"), "SessionRoute")
const AboutSettings = lazyRoute(() => import("./components/settings/about-settings"), "AboutSettings")
const GeneralSettings = lazyRoute(() => import("./components/settings/general-settings"), "GeneralSettings")
const NotificationSettings = lazyRoute(() => import("./components/settings/notification-settings"), "NotificationSettings")
const ProviderSettings = lazyRoute(() => import("./components/settings/provider-settings"), "ProviderSettings")
const ServerSettings = lazyRoute(() => import("./components/settings/server-settings"), "ServerSettings")
const SettingsPage = lazyRoute(() => import("./components/settings/settings-page"), "SettingsPage")
const SetupSettings = lazyRoute(() => import("./components/settings/setup-settings"), "SetupSettings")
const WorktreeSettings = lazyRoute(() => import("./components/settings/worktree-settings"), "WorktreeSettings")
const ExperimentalFeaturesSettings = lazyRoute(() => import("./components/settings/experimental-features"), "ExperimentalFeaturesSettings")
const DeveloperToolsSettings = lazyRoute(() => import("./components/settings/developer-tools-settings"), "DeveloperToolsSettings")
const RestApiSettings = lazyRoute(() => import("./components/settings/rest-api-settings"), "RestApiSettings")
const SkillsMcpSettings = lazyRoute(() => import("./components/settings/skills-mcp-settings"), "SkillsMcpSettings")
const ConnectorsPage = lazyRoute(() => import("./components/settings/connectors-settings"), "ConnectorsPage")
const GitHubActionsDashboard = lazyRoute(() => import("./components/github-actions/github-actions-dashboard"), "GitHubActionsDashboard")
const AccountSettings = lazyRoute(() => import("./components/settings/account-settings"), "AccountSettings")
const SidebarLayout = lazyRoute(() => import("./components/sidebar-layout"), "SidebarLayout")
const Login = lazyRoute(() => import("./components/auth/login"), "Login")
const Signup = lazyRoute(() => import("./components/auth/signup"), "Signup")
const BannedPage = lazyRoute(() => import("./components/auth/banned"), "BannedPage")
const ForgotPassword = lazyRoute(() => import("./components/auth/forgot-password"), "ForgotPassword")
import { ErrorBoundary } from "./components/error-boundary"

// ============================================================
// Route tree
// ============================================================

const rootRoute = createRootRoute({
	component: () => (
		<ErrorBoundary>
			<RootLayout />
		</ErrorBoundary>
	),
	errorComponent: ErrorPage,
	notFoundComponent: NotFoundPage,
})

const sidebarLayout = createRoute({
	getParentRoute: () => rootRoute,
	id: "sidebar",
	component: SidebarLayout,
})

const indexRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "/",
	component: NewChat,
})

const projectRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "project/$projectSlug",
})

const projectIndexRoute = createRoute({
	getParentRoute: () => projectRoute,
	path: "/",
	component: NewChat,
})

const sessionRoute = createRoute({
	getParentRoute: () => projectRoute,
	path: "session/$sessionId",
	component: SessionRoute,
})

const settingsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "settings",
	component: SettingsPage,
})

const settingsIndexRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "/",
	beforeLoad: () => {
		throw redirect({ to: "/settings/general" })
	},
})

const settingsAccountRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "account",
	component: AccountSettings,
})

const settingsGeneralRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "general",
	component: GeneralSettings,
})

const settingsServersRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "servers",
	component: ServerSettings,
})

const settingsNotificationsRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "notifications",
	component: NotificationSettings,
})

const settingsSetupRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "setup",
	component: SetupSettings,
})

const settingsProvidersRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "providers",
	component: ProviderSettings,
})

const settingsWorktreesRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "worktrees",
	component: WorktreeSettings,
})


const settingsRestApiRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "rest-api",
	component: RestApiSettings,
})

const settingsAboutRoute = createRoute({
	getParentRoute: () => settingsRoute,
	path: "about",
	component: AboutSettings,
})

const automationsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "automations",
	component: AutomationsPage,
})

const automationsIndexRoute = createRoute({
	getParentRoute: () => automationsRoute,
	path: "/",
	component: InboxEmptyState,
})

const automationDetailRoute = createRoute({
	getParentRoute: () => automationsRoute,
	path: "$automationId",
})

const automationDetailIndexRoute = createRoute({
	getParentRoute: () => automationDetailRoute,
	path: "/",
	component: AutomationDetail,
})

const automationRunRoute = createRoute({
	getParentRoute: () => automationDetailRoute,
	path: "runs/$runId",
	component: AutomationRunDetail,
})

const notesRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "notes",
	component: NotesPage,
})

const canvasRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "canvas",
	component: CanvasPage,
})

const githubActionsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "github-actions",
	component: GitHubActionsDashboard,
})

const promptLibraryRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "prompts",
	component: PromptLibraryPage,
})

const snippetsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "snippets",
	component: SnippetsPage,
})

const sessionTemplatesRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "templates",
	component: SessionTemplatesPage,
})

const keyboardShortcutsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "shortcuts",
	component: KeyboardShortcutsPage,
})

const databaseViewerRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "database",
	component: DatabaseViewerPage,
})

const apiTesterRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "api-tester",
	component: ApiTesterPage,
})

const analyticsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "analytics",
	component: AnalyticsDashboardPage,
})

const terminalRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "terminal",
	component: TerminalPage,
})

const browserRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "browser",
	component: BrowserPanelPage,
})

const codeSandboxRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "sandbox",
	component: CodeSandboxPage,
})

const integrationsRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "integrations",
	component: IntegrationsPage,
})

const botIntegrationRoute = createRoute({
	getParentRoute: () => sidebarLayout,
	path: "bot-integration",
	component: BotIntegrationPage,
})

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	component: Login,
})

const signupRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/signup",
	component: Signup,
})

const bannedRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/banned",
	component: BannedPage,
})

const forgotPasswordRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/forgot-password",
	component: ForgotPassword,
})

const routeTree = rootRoute.addChildren([
	loginRoute,
	signupRoute,
	bannedRoute,
	forgotPasswordRoute,
	sidebarLayout.addChildren([
		indexRoute,
		projectRoute.addChildren([projectIndexRoute, sessionRoute]),
		automationsRoute.addChildren([
			automationsIndexRoute,
			automationDetailRoute.addChildren([automationDetailIndexRoute, automationRunRoute]),
		]),
		notesRoute,
		canvasRoute,
		githubActionsRoute,
		promptLibraryRoute,
		snippetsRoute,
		sessionTemplatesRoute,
		keyboardShortcutsRoute,
		databaseViewerRoute,
		apiTesterRoute,
		analyticsRoute,
		terminalRoute,
		browserRoute,
		codeSandboxRoute,
		integrationsRoute,
		botIntegrationRoute,
			settingsRoute.addChildren([
				settingsIndexRoute,
				settingsAccountRoute,
				settingsGeneralRoute,
				settingsServersRoute,
				settingsNotificationsRoute,
				settingsProvidersRoute,
				settingsWorktreesRoute,
				createRoute({
					getParentRoute: () => settingsRoute,
					path: "experimental",
					component: ExperimentalFeaturesSettings,
				}),
				createRoute({
					getParentRoute: () => settingsRoute,
					path: "developer",
					component: DeveloperToolsSettings,
				}),
			settingsRestApiRoute,
			settingsSetupRoute,
			settingsAboutRoute,
			createRoute({
				getParentRoute: () => settingsRoute,
				path: "skills-mcp",
				component: SkillsMcpSettings,
			}),
			createRoute({
				getParentRoute: () => settingsRoute,
				path: "connectors",
				component: ConnectorsPage,
			}),
			]),
	]),
])

// ============================================================
// Router instance
// ============================================================

const hashHistory = createHashHistory()

export const router = createRouter({
	routeTree,
	history: hashHistory,
	defaultErrorComponent: ErrorPage,
	defaultNotFoundComponent: NotFoundPage,
})

export type AppRouter = typeof router

// ============================================================
// Type-safe module augmentation
// ============================================================

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
