import { PrismaClient } from "@prisma/client"
import fs from "fs"
import { Hono } from "hono"
import path from "path"
import { decryptToken, encryptToken } from "../utils/encryption"

const prisma = new PrismaClient()
const connectors = new Hono()

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
}

function isValidProviderName(provider: string): boolean {
	return /^[a-zA-Z0-9_-]{1,50}$/.test(provider)
}

// ============================================================
// Dynamic Configurations
// ============================================================
const CONFIG_FILE = path.join(process.cwd(), "connectors-config.json")

function loadConfigs(): Record<string, any> {
	try {
		if (fs.existsSync(CONFIG_FILE)) {
			return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
		}
	} catch (e) {
		console.error("Failed to load configs", e)
	}
	return {}
}

function saveConfigs(configs: Record<string, any>) {
	fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2))
}

function getConfig(provider: string, key: string, envKey: string): string | undefined {
	const configs = loadConfigs()
	if (configs[provider] && configs[provider][key]) {
		return configs[provider][key]
	}
	return process.env[envKey]
}

// ============================================================
// Provider Configurations
// ============================================================

type TokenExchangeMethod = "body" | "basic" // basic = credentials in Authorization header

const OAUTH_PROVIDERS: Record<
	string,
	{
		authUrl: string
		tokenUrl: string
		clientId: string | undefined
		clientSecret: string | undefined
		scopes: string
		tokenMethod?: TokenExchangeMethod
		extraAuthParams?: Record<string, string>
		extraTokenParams?: Record<string, string>
		getRedirectUri: (reqUrl: URL) => string
	}
> = {
	// ---  Google ---
	gmail: {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
		},
		scopes: "https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/gmail/callback`
		},
	},
	"google-calendar": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-calendar", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-calendar", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-calendar/callback`
		},
	},
	"google-drive": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-drive", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-drive", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-drive/callback`
		},
	},
	"google-sheets": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-sheets", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-sheets", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-sheets/callback`
		},
	},
	"google-docs": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-docs", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-docs", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-docs/callback`
		},
	},
	"google-contacts": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-contacts", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-contacts", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-contacts/callback`
		},
	},
	"google-tasks": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-tasks", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-tasks", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-tasks/callback`
		},
	},
	youtube: {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("youtube", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("youtube", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/youtube/callback`
		},
	},
	"google-analytics": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-analytics", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-analytics", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-analytics/callback`
		},
	},
	"google-search-console": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-search-console", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-search-console", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-search-console/callback`
		},
	},
	"google-photos": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-photos", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-photos", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-photos/callback`
		},
	},
	"google-chat": {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		get clientId() {
			return (
				getConfig("google-chat", "clientId", "GOOGLE_CLIENT_ID") ||
				getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
			)
		},
		get clientSecret() {
			return (
				getConfig("google-chat", "clientSecret", "GOOGLE_CLIENT_SECRET") ||
				getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
			)
		},
		scopes:
			"https://www.googleapis.com/auth/chat.spaces.readonly https://www.googleapis.com/auth/chat.messages.readonly https://www.googleapis.com/auth/userinfo.email",
		extraAuthParams: { access_type: "offline", prompt: "consent" },
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/google-chat/callback`
		},
	},
	// --- GitHub ---
	github: {
		authUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		get clientId() {
			return getConfig("github", "clientId", "GITHUB_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("github", "clientSecret", "GITHUB_CLIENT_SECRET")
		},
		scopes: "repo read:user user:email",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/github/callback`
		},
	},
	// --- GitLab ---
	gitlab: {
		authUrl: "https://gitlab.com/oauth/authorize",
		tokenUrl: "https://gitlab.com/oauth/token",
		get clientId() {
			return getConfig("gitlab", "clientId", "GITLAB_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("gitlab", "clientSecret", "GITLAB_CLIENT_SECRET")
		},
		scopes: "api read_repository write_repository",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/gitlab/callback`
		},
	},
	// --- Slack ---
	slack: {
		authUrl: "https://slack.com/oauth/v2/authorize",
		tokenUrl: "https://slack.com/api/oauth.v2.access",
		get clientId() {
			return getConfig("slack", "clientId", "SLACK_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("slack", "clientSecret", "SLACK_CLIENT_SECRET")
		},
		scopes: "channels:read channels:history chat:write users:read",
		tokenMethod: "basic",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/slack/callback`
		},
	},
	// --- Outlook / Microsoft ---
	outlook: {
		authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
		tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
		get clientId() {
			return getConfig("outlook", "clientId", "MICROSOFT_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("outlook", "clientSecret", "MICROSOFT_CLIENT_SECRET")
		},
		scopes: "Mail.Read Mail.Send Calendars.Read offline_access",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/outlook/callback`
		},
	},
	// --- Linear ---
	linear: {
		authUrl: "https://linear.app/oauth/authorize",
		tokenUrl: "https://api.linear.app/oauth/token",
		get clientId() {
			return getConfig("linear", "clientId", "LINEAR_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("linear", "clientSecret", "LINEAR_CLIENT_SECRET")
		},
		scopes: "read write",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/linear/callback`
		},
	},
	// --- Asana ---
	asana: {
		authUrl: "https://app.asana.com/-/oauth_authorize",
		tokenUrl: "https://app.asana.com/-/oauth_token",
		get clientId() {
			return getConfig("asana", "clientId", "ASANA_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("asana", "clientSecret", "ASANA_CLIENT_SECRET")
		},
		scopes: "default",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/asana/callback`
		},
	},
	// --- Notion ---
	notion: {
		authUrl: "https://api.notion.com/v1/oauth/authorize",
		tokenUrl: "https://api.notion.com/v1/oauth/token",
		get clientId() {
			return getConfig("notion", "clientId", "NOTION_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("notion", "clientSecret", "NOTION_CLIENT_SECRET")
		},
		scopes: "",
		tokenMethod: "basic",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/notion/callback`
		},
	},
	// --- HubSpot ---
	hubspot: {
		authUrl: "https://app.hubspot.com/oauth/authorize",
		tokenUrl: "https://api.hubapi.com/oauth/v1/token",
		get clientId() {
			return getConfig("hubspot", "clientId", "HUBSPOT_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("hubspot", "clientSecret", "HUBSPOT_CLIENT_SECRET")
		},
		scopes: "crm.objects.contacts.read crm.objects.contacts.write timeline",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/hubspot/callback`
		},
	},
	// --- Dropbox ---
	dropbox: {
		authUrl: "https://www.dropbox.com/oauth2/authorize",
		tokenUrl: "https://api.dropboxapi.com/oauth2/token",
		get clientId() {
			return getConfig("dropbox", "clientId", "DROPBOX_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("dropbox", "clientSecret", "DROPBOX_CLIENT_SECRET")
		},
		scopes: "",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/dropbox/callback`
		},
	},
	// --- Box ---
	box: {
		authUrl: "https://account.box.com/api/oauth2/authorize",
		tokenUrl: "https://api.box.com/oauth2/token",
		get clientId() {
			return getConfig("box", "clientId", "BOX_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("box", "clientSecret", "BOX_CLIENT_SECRET")
		},
		scopes: "root_readwrite",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/box/callback`
		},
	},
	// --- Figma ---
	figma: {
		authUrl: "https://www.figma.com/oauth",
		tokenUrl: "https://www.figma.com/api/oauth/token",
		get clientId() {
			return getConfig("figma", "clientId", "FIGMA_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("figma", "clientSecret", "FIGMA_CLIENT_SECRET")
		},
		scopes: "file_read",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/figma/callback`
		},
	},
	// --- Canva ---
	canva: {
		authUrl: "https://www.canva.com/api/oauth/authorize",
		tokenUrl: "https://www.canva.com/api/oauth/token",
		get clientId() {
			return getConfig("canva", "clientId", "CANVA_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("canva", "clientSecret", "CANVA_CLIENT_SECRET")
		},
		scopes: "design:content:read design:meta:read",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/canva/callback`
		},
	},
	// --- QuickBooks ---
	quickbooks: {
		authUrl: "https://appcenter.intuit.com/connect/oauth2",
		tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
		get clientId() {
			return getConfig("quickbooks", "clientId", "QUICKBOOKS_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("quickbooks", "clientSecret", "QUICKBOOKS_CLIENT_SECRET")
		},
		scopes: "com.intuit.quickbooks.accounting",
		tokenMethod: "basic",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/quickbooks/callback`
		},
	},
	// --- Docusign ---
	docusign: {
		authUrl: "https://account.docusign.com/oauth/auth",
		tokenUrl: "https://account.docusign.com/oauth/token",
		get clientId() {
			return getConfig("docusign", "clientId", "DOCUSIGN_CLIENT_ID")
		},
		get clientSecret() {
			return getConfig("docusign", "clientSecret", "DOCUSIGN_CLIENT_SECRET")
		},
		scopes: "signature impersonation",
		tokenMethod: "basic",
		getRedirectUri: (url) => {
			const protocol =
				url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https"
			return `${protocol}://${url.host}/api/connectors/docusign/callback`
		},
	},
}

// Providers that don't use grant_type in token exchange
const NO_GRANT_TYPE_PROVIDERS = new Set(["github", "slack"])

// Deep link prefix for the Electron app
const APP_DEEP_LINK = "devil-ai://callback"

// ============================================================
// Routes
// ============================================================

// GET /api/connectors/status
// Returns which OAuth providers have admin-configured credentials
connectors.get("/all-configs", (c) => {
	const configured: Record<string, any> = {}

	// Check which providers have a clientId configured
	for (const [providerId, config] of Object.entries(OAUTH_PROVIDERS)) {
		if (config.clientId) {
			configured[providerId] = {
				configured: true,
				clientId: config.clientId,
				clientSecret: config.clientSecret ? "********" : undefined,
			}
		}
	}

	// Special check for Google services that share the same GOOGLE_CLIENT_ID
	const googleClientId = getConfig("gmail", "clientId", "GOOGLE_CLIENT_ID")
	const googleClientSecret = getConfig("gmail", "clientSecret", "GOOGLE_CLIENT_SECRET")
	if (googleClientId) {
		const googleConfig = {
			configured: true,
			clientId: googleClientId,
			clientSecret: googleClientSecret ? "********" : undefined,
		}
		configured["google-drive"] = googleConfig
		configured["google-calendar"] = googleConfig
		configured["google-sheets"] = googleConfig
		configured["google-docs"] = googleConfig
		configured["google-contacts"] = googleConfig
		configured["google-tasks"] = googleConfig
		configured["youtube"] = googleConfig
		configured["google-analytics"] = googleConfig
		configured["google-search-console"] = googleConfig
		configured["google-photos"] = googleConfig
		configured["google-chat"] = googleConfig
	}

	return c.json({ configs: configured })
})

connectors.get("/config/definitions", (c) => {
	// Provide standard definitions for our supported providers
	const definitions: Record<string, any[]> = {}

	for (const providerId of Object.keys(OAUTH_PROVIDERS)) {
		// All supported OAuth providers take a clientId and clientSecret
		definitions[providerId] = [
			{
				configKey: "clientId",
				displayName: "Client ID",
				required: true,
				isSecret: false,
				description: "OAuth Client ID",
			},
			{
				configKey: "clientSecret",
				displayName: "Client Secret",
				required: true,
				isSecret: true,
				description: "OAuth Client Secret",
			},
		]
	}

	// Special aliases for Google services
	const googleDefs = [
		{
			configKey: "clientId",
			displayName: "Google Client ID",
			required: true,
			isSecret: false,
			description: "Google OAuth Client ID",
		},
		{
			configKey: "clientSecret",
			displayName: "Google Client Secret",
			required: true,
			isSecret: true,
			description: "Google OAuth Client Secret",
		},
	]

	const googleServices = [
		"google-sheets",
		"google-docs",
		"google-contacts",
		"google-tasks",
		"youtube",
		"google-analytics",
		"google-search-console",
		"google-photos",
		"google-chat",
	]

	for (const svc of googleServices) {
		definitions[svc] = googleDefs
	}

	return c.json({ definitions })
})

connectors.post("/:provider/config", async (c) => {
	const provider = c.req.param("provider")
	const body = await c.req.json()
	const { configs } = body as {
		configs: Array<{ configKey: string; configValue: string; isSecret: boolean }>
	}

	if (!configs || !Array.isArray(configs)) {
		return c.json({ success: false, error: "Invalid configs format" }, 400)
	}

	const allConfigs = loadConfigs()
	if (!allConfigs[provider]) {
		allConfigs[provider] = {}
	}

	for (const cfg of configs) {
		allConfigs[provider][cfg.configKey] = cfg.configValue
	}

	// Special case: if configuring any Google service, apply it to Gmail (the parent)
	if (provider.startsWith("google-") || provider === "youtube") {
		if (!allConfigs["gmail"]) allConfigs["gmail"] = {}
		for (const cfg of configs) {
			allConfigs["gmail"][cfg.configKey] = cfg.configValue
		}
	}

	saveConfigs(allConfigs)
	return c.json({ success: true })
})

// GET /api/connectors/my-tokens
// Returns decrypted tokens for the authenticated user only
connectors.get("/my-tokens", async (c) => {
	const jwtPayload = c.get("jwtPayload")
	if (!jwtPayload?.id) {
		return c.json({ error: "Unauthorized" }, 401)
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: jwtPayload.id },
			include: { connectorTokens: true },
		})

		if (!user) {
			return c.json({ error: "User not found" }, 404)
		}

		const tokens: Record<string, any> = {}
		for (const ct of user.connectorTokens) {
			tokens[ct.provider] = {
				apiToken: decryptToken(ct.accessToken),
				refreshToken: ct.refreshToken ? decryptToken(ct.refreshToken) : undefined,
				expiry: ct.expiresAt ? ct.expiresAt.getTime().toString() : undefined,
				connectedAt: ct.createdAt.getTime(),
			}
		}

		return c.json(tokens)
	} catch (err) {
		console.error("Error fetching tokens:", err)
		return c.json({ error: "Internal server error" }, 500)
	}
})

// GET /api/connectors/:provider/auth
// Redirects the user to the provider's OAuth consent screen
connectors.get("/:provider/auth", async (c) => {
	const provider = c.req.param("provider")
	const config = OAUTH_PROVIDERS[provider]

	if (!config) {
		return c.text("Provider not supported", 400)
	}

	if (!config.clientId) {
		return c.text("Provider not configured. Please contact the admin.", 500)
	}

	const reqUrl = new URL(c.req.url)
	const redirectUri = config.getRedirectUri(reqUrl)

	const userEmail = c.req.query("user_email")
	const stateObj: Record<string, string> = { ts: Date.now().toString() }
	if (userEmail && typeof userEmail === "string" && userEmail.length <= 254) {
		stateObj.user_email = userEmail
	}
	const state = Buffer.from(JSON.stringify(stateObj)).toString("base64")

	const authParams = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		state,
		...(config.scopes ? { scope: config.scopes } : {}),
		...(config.extraAuthParams ?? {}),
	})

	return c.redirect(`${config.authUrl}?${authParams.toString()}`)
})

// GET /api/connectors/:provider/callback
// Handles the redirect back from the provider, exchanges the code, and deep links to the app
connectors.get("/:provider/callback", async (c) => {
	const provider = c.req.param("provider")
	if (!isValidProviderName(provider)) {
		return c.text("Invalid provider name", 400)
	}

	const code = c.req.query("code")
	const error = c.req.query("error")
	const state = c.req.query("state")

	if (error) {
		return c.text("OAuth error occurred during authentication", 400)
	}

	if (!code) {
		return c.text("Missing authorization code", 400)
	}

	const config = OAUTH_PROVIDERS[provider]
	if (!config || !config.clientId || !config.clientSecret) {
		return c.text("Provider is not configured on the server", 500)
	}

	const reqUrl = new URL(c.req.url)
	const redirectUri = config.getRedirectUri(reqUrl)

	try {
		const useBasicAuth = config.tokenMethod === "basic"
		const includeGrantType = !NO_GRANT_TYPE_PROVIDERS.has(provider)

		const headers: Record<string, string> = {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		}

		if (useBasicAuth) {
			const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")
			headers["Authorization"] = `Basic ${basicAuth}`
		}

		const bodyParams: Record<string, string> = {
			code,
			redirect_uri: redirectUri,
			...(includeGrantType ? { grant_type: "authorization_code" } : {}),
			...(config.extraTokenParams ?? {}),
		}

		if (!useBasicAuth) {
			bodyParams.client_id = config.clientId
			bodyParams.client_secret = config.clientSecret
		}

		const tokenResponse = await fetch(config.tokenUrl, {
			method: "POST",
			headers,
			body: new URLSearchParams(bodyParams).toString(),
		})

		const data = (await tokenResponse.json()) as Record<string, unknown>

		if (!tokenResponse.ok || data.error) {
			console.error(`Token exchange failed for ${provider}`)
			return c.text("Token exchange failed. Please try again.", 400)
		}

		const accessToken =
			(data.authed_user as Record<string, string> | undefined)?.access_token ??
			(data.access_token as string | undefined)

		const refreshToken = data.refresh_token as string | undefined
		const expiresIn = data.expires_in ? Number(data.expires_in) : undefined
		const expiryTime = expiresIn ? Date.now() + expiresIn * 1000 : undefined

		// Decode state to get user email and save to DB
		if (state && accessToken) {
			try {
				const stateObj = JSON.parse(Buffer.from(state, "base64").toString("utf8"))

				// Validate state age (reject if older than 10 minutes)
				if (stateObj.ts && Date.now() - Number(stateObj.ts) > 10 * 60 * 1000) {
					return c.text("OAuth state expired. Please try again.", 400)
				}

				if (stateObj.user_email && typeof stateObj.user_email === "string") {
					const user = await prisma.user.findUnique({
						where: { email: stateObj.user_email },
					})

					if (user) {
						await prisma.connectorToken.upsert({
							where: {
								userId_provider: {
									userId: user.id,
									provider: provider,
								},
							},
							create: {
								userId: user.id,
								provider: provider,
								accessToken: encryptToken(accessToken),
								refreshToken: refreshToken ? encryptToken(refreshToken) : null,
								expiresAt: expiryTime ? new Date(expiryTime) : null,
							},
							update: {
								accessToken: encryptToken(accessToken),
								refreshToken: refreshToken ? encryptToken(refreshToken) : null,
								expiresAt: expiryTime ? new Date(expiryTime) : null,
								updatedAt: new Date(),
							},
						})
					}
				}
			} catch (err) {
				console.error("Failed to parse state or save token:", err)
			}
		}

		// Store tokens on the server, use deep link with only a success flag (no tokens in URL)
		const deepLinkParams = new URLSearchParams()
		deepLinkParams.set("provider", provider)
		deepLinkParams.set("connected", "true")
		if (expiryTime) {
			deepLinkParams.set("expiry", expiryTime.toString())
		}

		const deepLink = `${APP_DEEP_LINK}/callback?${deepLinkParams.toString()}`
		const safeProvider = escapeHtml(provider)

		return c.html(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>Devil AI — Connected!</title>
				<style>
					* { box-sizing: border-box; margin: 0; padding: 0; }
					body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f0f; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
					.card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
					.icon { font-size: 3rem; margin-bottom: 1rem; }
					h1 { font-size: 1.5rem; font-weight: 700; color: #4ade80; margin-bottom: 0.5rem; }
					p { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
					.btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; transition: opacity 0.2s; }
					.btn:hover { opacity: 0.85; }
					.provider { text-transform: capitalize; color: #a78bfa; }
				</style>
			</head>
			<body>
				<div class="card">
					<div class="icon">✅</div>
					<h1>Successfully Connected!</h1>
					<p><span class="provider">${safeProvider}</span> has been connected to Devil AI.<br>You can now close this tab.</p>
					<a class="btn" href="${deepLink}">Open Devil AI</a>
				</div>
				<script>
					setTimeout(() => { window.location.href = "${deepLink.replace(/"/g, '\\"')}"; }, 600);
				</script>
			</body>
			</html>
		`)
	} catch (err) {
		console.error(`Error during OAuth for ${provider}:`, err)
		return c.text("Internal server error during token exchange", 500)
	}
})

export default connectors
