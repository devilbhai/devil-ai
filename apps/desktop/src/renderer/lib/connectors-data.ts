// ============================================================
// Connector definitions with OAuth/API config for each service
// ============================================================

export interface ConnectorOAuthConfig {
	type: "oauth"
	authorizationUrl: string
	tokenUrl?: string
	scopes: string[]
	usePKCE: boolean
	redirectUri: string
	needsBackendProxy: boolean
	backendProxyUrl?: string
}

export interface ConnectorApiConfig {
	type: "api-key"
	fields: ApiKeyField[]
	testUrl?: string
	testHeaders?: Record<string, string>
}

export interface ConnectorTokenConfig {
	type: "token"
	fields: TokenField[]
}

export type ConnectorAuthConfig = ConnectorOAuthConfig | ConnectorApiConfig | ConnectorTokenConfig

export interface ApiKeyField {
	name: string
	label: string
	placeholder: string
	type?: "password" | "text"
	helpUrl?: string
	helpText?: string
	required: boolean
}

export interface TokenField {
	name: string
	label: string
	placeholder: string
	helpUrl?: string
	helpText?: string
	required: boolean
}

export interface ConnectorDef {
	id: string
	name: string
	description: string
	category: "messaging" | "email" | "calendar" | "dev" | "project" | "crm" | "storage" | "design" | "analytics" | "payments" | "automation" | "database" | "web" | "monitoring"
	auth: ConnectorAuthConfig
	iconBg: string
	iconText: string
	/** Whether this OAuth connector requires admin-provided credentials before users can connect */
	requiresAdminConfig?: boolean
}

// ============================================================
// Client IDs (public, safe to embed in desktop app)
// ============================================================



export const REDIRECT_URI = "devil-ai://callback"

// ============================================================
// All Connectors
// ============================================================

export const CONNECTORS: ConnectorDef[] = [
	// ─── Messaging ────────────────────────────────────────────
	{
		id: "telegram",
		name: "Telegram",
		description: "Two-way messaging with a Telegram bot.",
		category: "messaging",
		iconBg: "#0088cc",
		iconText: "T",
		auth: {
			type: "token",
			fields: [
				{
					name: "botToken",
					label: "Bot Token",
					placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
					helpUrl: "https://core.telegram.org/bots#how-do-i-create-a-bot",
					helpText: "Create a bot via @BotFather on Telegram, then copy the token.",
					required: true,
				},
			],
		},
	},
	{
		id: "slack",
		name: "Slack",
		description: "Two-way messaging — one-click via OpenWorker Cloud, or a manual Slack app (Socket Mode).",
		category: "messaging",
		iconBg: "#4A154B",
		iconText: "S",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/slack/auth`,
			scopes: ["chat:write", "channels:read", "channels:history", "im:read", "im:write"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/slack/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/slack/callback",
		},
	},
	{
		id: "discord",
		name: "Discord",
		description: "Read channels and send messages through a Discord bot.",
		category: "messaging",
		iconBg: "#5865F2",
		iconText: "D",
		auth: {
			type: "token",
			fields: [
				{
					name: "botToken",
					label: "Bot Token",
					placeholder: "MTExMTI1MjE0MTY0MjU3Mjc3.XXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXX",
					helpUrl: "https://discord.com/developers/applications",
					helpText: "Create an application at Discord Developer Portal, go to Bot section, and copy the token.",
					required: true,
				},
			],
		},
	},
	{
		id: "whatsapp",
		name: "WhatsApp",
		description: "Send WhatsApp messages through Meta's official Cloud API (outbound only).",
		category: "messaging",
		iconBg: "#25D366",
		iconText: "W",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "phoneNumberId",
					label: "Phone Number ID",
					placeholder: "1234567890",
					helpUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
					helpText: "Found in Meta Business Suite → WhatsApp → API Setup → Phone number ID.",
					required: true,
				},
				{
					name: "accessToken",
					label: "Access Token",
					placeholder: "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
					helpUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
					helpText: "Generate a permanent access token in Meta Business Suite.",
					type: "password",
					required: true,
				},
			],
		},
	},

	// ─── Email ────────────────────────────────────────────────
	{
		id: "email-imap",
		name: "Email (IMAP)",
		description: "Read, search, and send mail from any IMAP account — Gmail, iCloud, Fastmail, or custom.",
		category: "email",
		iconBg: "#6B7280",
		iconText: "✉",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "imapHost",
					label: "IMAP Host",
					placeholder: "imap.gmail.com",
					helpText: "IMAP server address. Common: imap.gmail.com, imap.icloud.com, mail.fastmail.com",
					required: true,
				},
				{
					name: "imapPort",
					label: "IMAP Port",
					placeholder: "993",
					helpText: "Usually 993 for SSL/TLS.",
					required: true,
				},
				{
					name: "email",
					label: "Email Address",
					placeholder: "you@gmail.com",
					type: "text",
					required: true,
				},
				{
					name: "password",
					label: "Password / App Password",
					placeholder: "••••••••",
					type: "password",
					helpUrl: "https://support.google.com/accounts/answer/185833",
					helpText: "For Gmail, use an App Password (not your regular password). Enable 2FA first, then generate at myaccount.google.com/apppasswords.",
					required: true,
				},
			],
		},
	},
	{
		id: "gmail",
		name: "Gmail",
		description: "Search, summarize, draft, and send email.",
		category: "email",
		iconBg: "#EA4335",
		iconText: "M",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/gmail/auth`,
			scopes: ["https://mail.google.com", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/gmail/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/gmail/callback",
		},
	},
	{
		id: "outlook",
		name: "Outlook",
		description: "Two-way messaging via Microsoft Outlook / Exchange.",
		category: "email",
		iconBg: "#0078D4",
		iconText: "O",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/outlook/auth`,
			scopes: ["Mail.Read", "Mail.Send", "Calendars.Read", "offline_access"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/outlook/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/outlook/callback",
		},
	},

	// ─── Calendar ─────────────────────────────────────────────
	{
		id: "google-calendar",
		name: "Google Calendar",
		description: "Read availability, summarize schedules, and create events.",
		category: "calendar",
		iconBg: "#4285F4",
		iconText: "31",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-calendar/auth`,
			scopes: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-calendar/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-calendar/callback",
		},
	},
	{
		id: "google-drive",
		name: "Google Drive",
		description: "Read, search, and manage files and folders in Google Drive.",
		category: "storage",
		iconBg: "#0F9D58",
		iconText: "D",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-drive/auth`,
			scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-drive/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-drive/callback",
		},
	},
	{
		id: "google-sheets",
		name: "Google Sheets",
		description: "Read, write, and format spreadsheets and cell data.",
		category: "project",
		iconBg: "#0F9D58",
		iconText: "S",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-sheets/auth`,
			scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-sheets/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-sheets/callback",
		},
	},
	{
		id: "google-docs",
		name: "Google Docs",
		description: "Read, create, and edit Google Documents.",
		category: "project",
		iconBg: "#4285F4",
		iconText: "Docs",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-docs/auth`,
			scopes: ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-docs/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-docs/callback",
		},
	},
	{
		id: "google-contacts",
		name: "Google Contacts",
		description: "Read and manage your Google Contacts.",
		category: "crm",
		iconBg: "#4285F4",
		iconText: "C",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-contacts/auth`,
			scopes: ["https://www.googleapis.com/auth/contacts.readonly", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-contacts/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-contacts/callback",
		},
	},
	{
		id: "google-tasks",
		name: "Google Tasks",
		description: "Read, create, and manage tasks and to-do lists.",
		category: "project",
		iconBg: "#4285F4",
		iconText: "T",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-tasks/auth`,
			scopes: ["https://www.googleapis.com/auth/tasks", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-tasks/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-tasks/callback",
		},
	},
	{
		id: "youtube",
		name: "YouTube",
		description: "Search videos, read comments, and manage your channel.",
		category: "web",
		iconBg: "#FF0000",
		iconText: "YT",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/youtube/auth`,
			scopes: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/youtube/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/youtube/callback",
		},
	},
	{
		id: "google-analytics",
		name: "Google Analytics",
		description: "Read analytics data, reports, and audience insights.",
		category: "analytics",
		iconBg: "#F9AB00",
		iconText: "A",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-analytics/auth`,
			scopes: ["https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-analytics/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-analytics/callback",
		},
	},
	{
		id: "google-search-console",
		name: "Google Search Console",
		description: "Monitor search performance, indexing, and SEO issues.",
		category: "analytics",
		iconBg: "#4285F4",
		iconText: "SC",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-search-console/auth`,
			scopes: ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-search-console/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-search-console/callback",
		},
	},
	{
		id: "google-photos",
		name: "Google Photos",
		description: "Browse and search your photo library.",
		category: "design",
		iconBg: "#EA4335",
		iconText: "P",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-photos/auth`,
			scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-photos/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-photos/callback",
		},
	},
	{
		id: "google-chat",
		name: "Google Chat",
		description: "Send and read messages in Google Chat spaces.",
		category: "messaging",
		iconBg: "#00AC47",
		iconText: "GC",
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/google-chat/auth`,
			scopes: ["https://www.googleapis.com/auth/chat.messages", "https://www.googleapis.com/auth/userinfo.email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/google-chat/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/google-chat/callback",
		},
	},

	// ─── Dev Tools ────────────────────────────────────────────
	{
		id: "github",
		name: "GitHub",
		description: "Read/write issues, PRs, code, workflows, and repos.",
		category: "dev",
		iconBg: "#333",
		iconText: "G",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/github/auth`,
			scopes: ["repo", "read:user", "user:email"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/github/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/github/callback",
		},
	},
	{
		id: "gitlab",
		name: "GitLab",
		description: "GitLab CI/CD, issues, merge requests, and repos.",
		category: "dev",
		iconBg: "#FC6D26",
		iconText: "GL",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/gitlab/auth`,
			scopes: ["api", "read_repository", "write_repository"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/gitlab/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/gitlab/callback",
		},
	},

	// ─── Project Management ───────────────────────────────────
	{
		id: "jira",
		name: "Jira",
		description: "Search, summarize, create, and update issues.",
		category: "project",
		iconBg: "#0052CC",
		iconText: "J",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "domain",
					label: "Jira Domain",
					placeholder: "yourcompany.atlassian.net",
					helpText: "Your Atlassian domain (without https://).",
					required: true,
				},
				{
					name: "email",
					label: "Email",
					placeholder: "you@company.com",
					type: "text",
					required: true,
				},
				{
					name: "apiToken",
					label: "API Token",
					placeholder: "ATATT3xFfGF0...",
					type: "password",
					helpUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
					helpText: "Generate an API token at id.atlassian.com/manage-profile/security/api-tokens.",
					required: true,
				},
			],
		},
	},
	{
		id: "monday",
		name: "monday.com",
		description: "Read boards and items, track work, create items and post updates.",
		category: "project",
		iconBg: "#FF3D57",
		iconText: "M",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiToken",
					label: "API Token",
					placeholder: "eyJhbGciOiJIUzI1NiJ9...",
					type: "password",
					helpUrl: "https://monday.com/blog/developers/api-tokens/",
					helpText: "Go to Profile picture → Developers → My access tokens → Generate.",
					required: true,
				},
			],
		},
	},
	{
		id: "linear",
		name: "Linear",
		description: "Linear project management — issues, projects, and cycles.",
		category: "project",
		iconBg: "#5E6AD2",
		iconText: "L",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/linear/auth`,
			scopes: ["write"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/linear/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/linear/callback",
		},
	},
	{
		id: "asana",
		name: "Asana",
		description: "Asana task and project management.",
		category: "project",
		iconBg: "#F06A6A",
		iconText: "A",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/asana/auth`,
			scopes: ["default"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/asana/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/asana/callback",
		},
	},
	{
		id: "clickup",
		name: "ClickUp",
		description: "Search tasks and docs; create and update items.",
		category: "project",
		iconBg: "#7B68EE",
		iconText: "C",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiToken",
					label: "Personal API Token",
					placeholder: "pk_12345678_ABCDEFGHIJKLMNOPQRSTUVWXYZ",
					type: "password",
					helpUrl: "https://clickup.com/api/docs/getting-started/access-tokens",
					helpText: "Go to Settings → Apps → Generate. Copy the personal API token.",
					required: true,
				},
			],
		},
	},
	{
		id: "confluence",
		name: "Confluence",
		description: "Search spaces, read pages, and draft documentation.",
		category: "project",
		iconBg: "#172B4D",
		iconText: "C",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "domain",
					label: "Confluence Domain",
					placeholder: "yourcompany.atlassian.net",
					helpText: "Your Atlassian domain.",
					required: true,
				},
				{
					name: "email",
					label: "Email",
					placeholder: "you@company.com",
					type: "text",
					required: true,
				},
				{
					name: "apiToken",
					label: "API Token",
					placeholder: "ATATT3xFfGF0...",
					type: "password",
					helpUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
					helpText: "Same API token as Jira (both are Atlassian).",
					required: true,
				},
			],
		},
	},
	{
		id: "notion",
		name: "Notion",
		description: "Notion pages, databases, and workspace data.",
		category: "project",
		iconBg: "#000",
		iconText: "N",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/notion/auth`,
			scopes: [],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/notion/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/notion/callback",
		},
	},

	// ─── CRM ──────────────────────────────────────────────────
	{
		id: "hubspot",
		name: "HubSpot",
		description: "HubSpot CRM — contacts, deals, tickets, and marketing.",
		category: "crm",
		iconBg: "#FF7A59",
		iconText: "H",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/hubspot/auth`,
			scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write", "timeline"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/hubspot/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/hubspot/callback",
		},
	},
	{
		id: "close",
		name: "Close",
		description: "Read and update leads, contacts, and opportunities in the CRM.",
		category: "crm",
		iconBg: "#2B6CB0",
		iconText: "C",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiToken",
					label: "API Key",
					placeholder: "api_1234567890abcdef...",
					type: "password",
					helpUrl: "https://developers.close.com/docs/rest_api",
					helpText: "Go to Settings → API Keys → Create new key.",
					required: true,
				},
			],
		},
	},
	{
		id: "attio",
		name: "Attio",
		description: "Read your Attio CRM: objects, records, notes.",
		category: "crm",
		iconBg: "#000000",
		iconText: "A",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiToken",
					label: "API Key",
					placeholder: "at_v1_...",
					type: "password",
					helpUrl: "https://docs.attio.com/authentication",
					helpText: "Go to Settings → Developer → API Keys → Create key.",
					required: true,
				},
			],
		},
	},
	{
		id: "apollo",
		name: "Apollo.io",
		description: "Enrich people and companies; search the B2B database.",
		category: "crm",
		iconBg: "#6C5CE7",
		iconText: "A",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiToken",
					label: "API Key",
					placeholder: "YOUR_API_KEY",
					type: "password",
					helpUrl: "https://apolloio.github.io/apollo-api-docs/",
					helpText: "Go to Settings → API Keys → Generate API Key.",
					required: true,
				},
			],
		},
	},
	{
		id: "zendesk",
		name: "Zendesk",
		description: "Search tickets, summarize customer context, and draft replies.",
		category: "crm",
		iconBg: "#03363D",
		iconText: "Z",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "subdomain",
					label: "Subdomain",
					placeholder: "yourcompany",
					helpText: "Your Zendesk subdomain (the part before .zendesk.com).",
					required: true,
				},
				{
					name: "email",
					label: "Email",
					placeholder: "you@company.com",
					type: "text",
					required: true,
				},
				{
					name: "apiToken",
					label: "API Token",
					placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://support.zendesk.com/hc/en-us/articles/4408889192858-Generating-a-new-API-token",
					helpText: "Go to Admin → Channels → API → Settings → Add API Token.",
					required: true,
				},
			],
		},
	},

	// ─── Storage ──────────────────────────────────────────────
	{
		id: "dropbox",
		name: "Dropbox",
		description: "Read/write files in Dropbox.",
		category: "storage",
		iconBg: "#0061FF",
		iconText: "D",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/dropbox/auth`,
			scopes: ["files.metadata.read", "files.content.read"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/dropbox/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/dropbox/callback",
		},
	},
	{
		id: "box",
		name: "Box",
		description: "Read/write files in Box.",
		category: "storage",
		iconBg: "#0061D5",
		iconText: "B",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/box/auth`,
			scopes: ["read_all"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/box/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/box/callback",
		},
	},

	// ─── Design ───────────────────────────────────────────────
	{
		id: "figma",
		name: "Figma",
		description: "Access Figma files, components, and design data.",
		category: "design",
		iconBg: "#F24E1E",
		iconText: "F",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/figma/auth`,
			scopes: ["file_read", "comment_read"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/figma/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/figma/callback",
		},
	},
	{
		id: "canva",
		name: "Canva",
		description: "Generate and manage Canva designs programmatically.",
		category: "design",
		iconBg: "#00C4CC",
		iconText: "C",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/canva/auth`,
			scopes: ["design:content:read", "design:content:write", "design:meta:read", "asset:read", "asset:write"],
			usePKCE: true,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/canva/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/canva/callback",
		},
	},

	// ─── Analytics ────────────────────────────────────────────
	{
		id: "posthog",
		name: "PostHog",
		description: "Query product analytics: events, funnels, saved insights.",
		category: "analytics",
		iconBg: "#1D4AFF",
		iconText: "P",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "host",
					label: "PostHog Host",
					placeholder: "https://app.posthog.com",
					helpText: "US: https://app.posthog.com, EU: https://eu.posthog.com, Self-hosted: your domain.",
					required: true,
				},
				{
					name: "apiKey",
					label: "Personal API Key",
					placeholder: "phx_...",
					type: "password",
					helpUrl: "https://posthog.com/docs/api",
					helpText: "Go to Settings → Project API Keys → Personal API Keys → Create.",
					required: true,
				},
			],
		},
	},
	{
		id: "mixpanel",
		name: "Mixpanel",
		description: "Query Mixpanel events and segmentation.",
		category: "analytics",
		iconBg: "#7856FF",
		iconText: "X",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiSecret",
					label: "API Secret",
					placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://docs.mixpanel.com/docs/development/api#authentication",
					helpText: "Go to Project Settings → API Secret.",
					required: true,
				},
				{
					name: "serviceAccountId",
					label: "Service Account ID (optional)",
					placeholder: "12345",
					type: "text",
					helpText: "For Server-Side API access. Found in Project Settings → Service Accounts.",
					required: false,
				},
			],
		},
	},
	{
		id: "amplitude",
		name: "Amplitude",
		description: "Query Amplitude charts data: active users, event totals.",
		category: "analytics",
		iconBg: "#1B71E7",
		iconText: "A",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiKey",
					label: "API Key",
					placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://www.docs.developers.amplitude.com/analytics/apis/keys/",
					helpText: "Go to Settings → Projects → API Keys.",
					required: true,
				},
				{
					name: "secretKey",
					label: "Secret Key",
					placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://www.docs.developers.amplitude.com/analytics/apis/keys/",
					helpText: "Go to Settings → Projects → Secret Key. Needed for some API endpoints.",
					required: false,
				},
			],
		},
	},

	// ─── Payments ─────────────────────────────────────────────
	{
		id: "stripe",
		name: "Stripe",
		description: "Read-only access to customers, charges, and invoices.",
		category: "payments",
		iconBg: "#635BFF",
		iconText: "S",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "secretKey",
					label: "Secret Key",
					placeholder: "sk_live_xxxxx",
					type: "password",
					helpUrl: "https://dashboard.stripe.com/apikeys",
					helpText: "Go to Developers → API Keys → Secret key. Use test mode key (sk_test_) for safety.",
					required: true,
				},
			],
		},
	},
	{
		id: "quickbooks",
		name: "QuickBooks",
		description: "QuickBooks accounting — invoices, expenses, reports.",
		category: "payments",
		iconBg: "#2CA01C",
		iconText: "qb",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/quickbooks/auth`,
			scopes: ["com.intuit.quickbooks.accounting"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/quickbooks/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/quickbooks/callback",
		},
	},

	// ─── Automation ───────────────────────────────────────────
	{
		id: "docusign",
		name: "Docusign",
		description: "Docusign e-signature workflows.",
		category: "automation",
		iconBg: "#FFB800",
		iconText: "D",
		requiresAdminConfig: true,
		auth: {
			type: "oauth",
			authorizationUrl: `https://devil-ai.agribee.in/api/connectors/docusign/auth`,
			scopes: ["signature", "impersonation"],
			usePKCE: false,
			redirectUri: `https://devil-ai.agribee.in/api/connectors/docusign/callback`,
			needsBackendProxy: true,
			backendProxyUrl: "https://devil-ai.agribee.in/api/connectors/docusign/callback",
		},
	},
	{
		id: "hunter",
		name: "Hunter",
		description: "Find and verify professional email addresses by domain.",
		category: "automation",
		iconBg: "#FF6B35",
		iconText: "H",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "api_key",
					label: "API Key",
					placeholder: "xxxxxxx.xxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://hunter.io/api-keys",
					helpText: "Go to Settings → API Keys → Create API Key.",
					required: true,
				},
			],
		},
	},
	// ─── Database ─────────────────────────────────────────────
	{
		id: "postgres",
		name: "PostgreSQL",
		description: "Read schema, run SQL queries, and analyze data securely.",
		category: "database",
		iconBg: "#336791",
		iconText: "DB",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "databaseUrl",
					label: "Database URL",
					placeholder: "postgresql://user:password@host:5432/dbname",
					type: "password",
					helpText: "Connection string for PostgreSQL database.",
					required: true,
				},
			],
		},
	},

	// ─── Web ──────────────────────────────────────────────────
	{
		id: "brave-search",
		name: "Brave Search",
		description: "Allow the agent to search the live web for recent information.",
		category: "web",
		iconBg: "#FB542B",
		iconText: "B",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "apiKey",
					label: "Brave API Key",
					placeholder: "BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://brave.com/search/api/",
					helpText: "Get a free API key from Brave Search API.",
					required: true,
				},
			],
		},
	},

	// ─── Monitoring ───────────────────────────────────────────
	{
		id: "sentry",
		name: "Sentry",
		description: "Check recent errors, traces, and performance issues.",
		category: "monitoring",
		iconBg: "#362D59",
		iconText: "S",
		auth: {
			type: "api-key",
			fields: [
				{
					name: "authToken",
					label: "Auth Token",
					placeholder: "xxxxxxxxxxxxxxxx",
					type: "password",
					helpUrl: "https://docs.sentry.io/api/auth/",
					helpText: "Go to User Settings -> API -> Auth Tokens in Sentry.",
					required: true,
				},
			],
		},
	},
]

export const CATEGORIES = [
	{ id: "all", label: "All" },
	{ id: "messaging", label: "Messaging" },
	{ id: "email", label: "Email" },
	{ id: "calendar", label: "Calendar" },
	{ id: "dev", label: "Dev Tools" },
	{ id: "project", label: "Project Management" },
	{ id: "crm", label: "CRM" },
	{ id: "storage", label: "Storage" },
	{ id: "design", label: "Design" },
	{ id: "analytics", label: "Analytics" },
	{ id: "payments", label: "Payments" },
	{ id: "automation", label: "Automation" },
	{ id: "database", label: "Databases" },
	{ id: "web", label: "Web Search" },
	{ id: "monitoring", label: "Monitoring" },
] as const
