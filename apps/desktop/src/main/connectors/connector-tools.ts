/**
 * Native Connector Tools
 *
 * Tools that can be called by the AI to interact with connected services.
 * Uses cached tokens from local SQLite DB instead of requiring MCP servers.
 *
 * Supported connectors:
 * - Gmail: list emails, read email, send email, search emails
 * - Google Drive: list files, search files, read file
 * - Google Sheets: list spreadsheets, read cells, write cells
 * - Google Calendar: list events, create event
 * - Canva: list designs, get design
 */

import {
	getConnectorToken,
	refreshTokenIfNeeded,
} from "./token-sync"

// ============================================================
// Types
// ============================================================

export interface ConnectorToolResult {
	success: boolean
	data?: unknown
	error?: string
}

export interface GmailEmail {
	id: string
	subject: string
	from: string
	to: string
	date: string
	snippet: string
	body?: string
}

export interface GoogleDriveFile {
	id: string
	name: string
	mimeType: string
	createdTime: string
	modifiedTime: string
 webViewLink?: string
}

export interface GoogleSheet {
	spreadsheetId: string
	title: string
	createdTime: string
	modifiedTime: string
}

export interface GoogleCalendarEvent {
	id: string
	summary: string
	description?: string
	start: string
	end: string
	htmlLink?: string
}

// ============================================================
// Helper: Make authenticated API call
// ============================================================

async function makeApiCall(
	userEmail: string,
	connectorId: string,
	url: string,
	options: RequestInit = {},
): Promise<ConnectorToolResult> {
	// Try to refresh token if needed
	const isValid = await refreshTokenIfNeeded(userEmail, connectorId)
	if (!isValid) {
		return {
			success: false,
			error: `Connector ${connectorId} is not connected or token is invalid`,
		}
	}

	const token = await getConnectorToken(userEmail, connectorId)
	if (!token?.accessToken) {
		return {
			success: false,
			error: `No access token for ${connectorId}`,
		}
	}

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${token.accessToken}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			return {
				success: false,
				error: `API error ${response.status}: ${errorText}`,
			}
		}

		const data = await response.json()
		return { success: true, data }
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
}

// ============================================================
// Gmail Tools
// ============================================================

/**
 * List recent emails from Gmail
 */
export async function gmailListEmails(
	userEmail: string,
	maxResults: number = 10,
	query?: string,
): Promise<ConnectorToolResult> {
	const q = query ? `&q=${encodeURIComponent(query)}` : ""
	const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${q}`

	const result = await makeApiCall(userEmail, "gmail", url)
	if (!result.success) return result

	// Fetch each message's details
	const messages = (result.data as { messages?: Array<{ id: string }> })?.messages ?? []
	const emails: GmailEmail[] = []

	for (const msg of messages.slice(0, maxResults)) {
		const msgResult = await makeApiCall(
			userEmail,
			"gmail",
			`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`,
		)
		if (msgResult.success && msgResult.data) {
			const msgData = msgResult.data as Record<string, unknown>
			const headers = (msgData.payload as { headers?: Array<{ name: string; value: string }> })?.headers ?? []
			const getHeader = (name: string) =>
				headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""

			emails.push({
				id: msg.id,
				subject: getHeader("Subject"),
				from: getHeader("From"),
				to: getHeader("To"),
				date: getHeader("Date"),
				snippet: (msgData.snippet as string) ?? "",
			})
		}
	}

	return { success: true, data: emails }
}

/**
 * Read a specific email
 */
export async function gmailReadEmail(
	userEmail: string,
	messageId: string,
): Promise<ConnectorToolResult> {
	const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
	return makeApiCall(userEmail, "gmail", url)
}

/**
 * Send an email via Gmail
 */
export async function gmailSendEmail(
	userEmail: string,
	to: string,
	subject: string,
	body: string,
): Promise<ConnectorToolResult> {
	const email = [
		`To: ${to}`,
		`Subject: ${subject}`,
		"Content-Type: text/plain; charset=utf-8",
		"",
		body,
	].join("\r\n")

	const encodedEmail = Buffer.from(email).toString("base64url")

	const url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
	return makeApiCall(userEmail, "gmail", url, {
		method: "POST",
		body: JSON.stringify({ raw: encodedEmail }),
	})
}

/**
 * Search emails
 */
export async function gmailSearchEmails(
	userEmail: string,
	query: string,
	maxResults: number = 10,
): Promise<ConnectorToolResult> {
	return gmailListEmails(userEmail, maxResults, query)
}

// ============================================================
// Google Drive Tools
// ============================================================

/**
 * List files in Google Drive
 */
export async function driveListFiles(
	userEmail: string,
	pageSize: number = 10,
	query?: string,
): Promise<ConnectorToolResult> {
	const q = query ? `&q=${encodeURIComponent(query)}` : ""
	const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}${q}&fields=files(id,name,mimeType,createdTime,modifiedTime,webViewLink)`

	return makeApiCall(userEmail, "google-drive", url)
}

/**
 * Search files in Google Drive
 */
export async function driveSearchFiles(
	userEmail: string,
	query: string,
	pageSize: number = 10,
): Promise<ConnectorToolResult> {
	return driveListFiles(userEmail, pageSize, `name contains '${query}'`)
}

/**
 * Get file metadata
 */
export async function driveGetFile(
	userEmail: string,
	fileId: string,
): Promise<ConnectorToolResult> {
	const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,createdTime,modifiedTime,webViewLink,size`
	return makeApiCall(userEmail, "google-drive", url)
}

// ============================================================
// Google Sheets Tools
// ============================================================

/**
 * List all spreadsheets
 */
export async function sheetsListSpreadsheets(
	userEmail: string,
	pageSize: number = 10,
): Promise<ConnectorToolResult> {
	const url = `https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheetId,properties.title,createdTime,createdBy&pageSize=${pageSize}`
	return makeApiCall(userEmail, "google-sheets", url)
}

/**
 * Read cells from a spreadsheet
 */
export async function sheetsReadCells(
	userEmail: string,
	spreadsheetId: string,
	range: string,
): Promise<ConnectorToolResult> {
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
	return makeApiCall(userEmail, "google-sheets", url)
}

/**
 * Write cells to a spreadsheet
 */
export async function sheetsWriteCells(
	userEmail: string,
	spreadsheetId: string,
	range: string,
	values: unknown[][],
): Promise<ConnectorToolResult> {
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
	return makeApiCall(userEmail, "google-sheets", url, {
		method: "PUT",
		body: JSON.stringify({ values }),
	})
}

/**
 * Create a new spreadsheet
 */
export async function sheetsCreateSpreadsheet(
	userEmail: string,
	title: string,
): Promise<ConnectorToolResult> {
	const url = "https://sheets.googleapis.com/v4/spreadsheets"
	return makeApiCall(userEmail, "google-sheets", url, {
		method: "POST",
		body: JSON.stringify({
			properties: { title },
		}),
	})
}

// ============================================================
// Google Calendar Tools
// ============================================================

/**
 * List calendar events
 */
export async function calendarListEvents(
	userEmail: string,
	timeMin?: string,
	timeMax?: string,
	maxResults: number = 10,
): Promise<ConnectorToolResult> {
	const params = new URLSearchParams({
		maxResults: maxResults.toString(),
		orderBy: "startTime",
		singleEvents: "true",
		timeMin: timeMin ?? new Date().toISOString(),
	})
	if (timeMax) params.set("timeMax", timeMax)

	const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
	return makeApiCall(userEmail, "google-calendar", url)
}

/**
 * Create a calendar event
 */
export async function calendarCreateEvent(
	userEmail: string,
	summary: string,
	start: string,
	end: string,
	description?: string,
): Promise<ConnectorToolResult> {
	const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
	return makeApiCall(userEmail, "google-calendar", url, {
		method: "POST",
		body: JSON.stringify({
			summary,
			description,
			start: { dateTime: start },
			end: { dateTime: end },
		}),
	})
}

// ============================================================
// Tool Registry
// ============================================================

export interface ConnectorTool {
	name: string
	description: string
	parameters: Record<string, { type: string; description: string; required?: boolean }>
	handler: (userEmail: string, params: Record<string, unknown>) => Promise<ConnectorToolResult>
	requiredConnector: string
}

/**
 * All available connector tools
 */
export const CONNECTOR_TOOLS: ConnectorTool[] = [
	// Gmail
	{
		name: "gmail_list_emails",
		description: "List recent emails from Gmail inbox",
		parameters: {
			maxResults: { type: "number", description: "Max emails to return (default 10)" },
			query: { type: "string", description: "Gmail search query" },
		},
		handler: (email, params) =>
			gmailListEmails(email, (params.maxResults as number) ?? 10, params.query as string),
		requiredConnector: "gmail",
	},
	{
		name: "gmail_read_email",
		description: "Read a specific email by ID",
		parameters: {
			messageId: { type: "string", description: "Gmail message ID", required: true },
		},
		handler: (email, params) => gmailReadEmail(email, params.messageId as string),
		requiredConnector: "gmail",
	},
	{
		name: "gmail_send_email",
		description: "Send an email via Gmail",
		parameters: {
			to: { type: "string", description: "Recipient email address", required: true },
			subject: { type: "string", description: "Email subject", required: true },
			body: { type: "string", description: "Email body text", required: true },
		},
		handler: (email, params) =>
			gmailSendEmail(
				email,
				params.to as string,
				params.subject as string,
				params.body as string,
			),
		requiredConnector: "gmail",
	},
	{
		name: "gmail_search_emails",
		description: "Search emails in Gmail",
		parameters: {
			query: { type: "string", description: "Gmail search query", required: true },
			maxResults: { type: "number", description: "Max results (default 10)" },
		},
		handler: (email, params) =>
			gmailSearchEmails(
				email,
				params.query as string,
				(params.maxResults as number) ?? 10,
			),
		requiredConnector: "gmail",
	},
	// Google Drive
	{
		name: "drive_list_files",
		description: "List files in Google Drive",
		parameters: {
			pageSize: { type: "number", description: "Max files to return (default 10)" },
			query: { type: "string", description: "Drive search query" },
		},
		handler: (email, params) =>
			driveListFiles(
				email,
				(params.pageSize as number) ?? 10,
				params.query as string,
			),
		requiredConnector: "google-drive",
	},
	{
		name: "drive_search_files",
		description: "Search files by name in Google Drive",
		parameters: {
			query: { type: "string", description: "File name to search", required: true },
			pageSize: { type: "number", description: "Max results (default 10)" },
		},
		handler: (email, params) =>
			driveSearchFiles(
				email,
				params.query as string,
				(params.pageSize as number) ?? 10,
			),
		requiredConnector: "google-drive",
	},
	{
		name: "drive_get_file",
		description: "Get file metadata from Google Drive",
		parameters: {
			fileId: { type: "string", description: "Google Drive file ID", required: true },
		},
		handler: (email, params) => driveGetFile(email, params.fileId as string),
		requiredConnector: "google-drive",
	},
	// Google Sheets
	{
		name: "sheets_list_spreadsheets",
		description: "List all spreadsheets in Google Sheets",
		parameters: {
			pageSize: { type: "number", description: "Max spreadsheets (default 10)" },
		},
		handler: (email, params) =>
			sheetsListSpreadsheets(email, (params.pageSize as number) ?? 10),
		requiredConnector: "google-sheets",
	},
	{
		name: "sheets_read_cells",
		description: "Read cells from a Google Spreadsheet",
		parameters: {
			spreadsheetId: { type: "string", description: "Spreadsheet ID", required: true },
			range: { type: "string", description: "Cell range (e.g., 'A1:C10')", required: true },
		},
		handler: (email, params) =>
			sheetsReadCells(
				email,
				params.spreadsheetId as string,
				params.range as string,
			),
		requiredConnector: "google-sheets",
	},
	{
		name: "sheets_write_cells",
		description: "Write data to Google Spreadsheet cells",
		parameters: {
			spreadsheetId: { type: "string", description: "Spreadsheet ID", required: true },
			range: { type: "string", description: "Cell range (e.g., 'A1:B2')", required: true },
			values: { type: "array", description: "2D array of values to write", required: true },
		},
		handler: (email, params) =>
			sheetsWriteCells(
				email,
				params.spreadsheetId as string,
				params.range as string,
				params.values as unknown[][],
			),
		requiredConnector: "google-sheets",
	},
	{
		name: "sheets_create_spreadsheet",
		description: "Create a new Google Spreadsheet",
		parameters: {
			title: { type: "string", description: "Spreadsheet title", required: true },
		},
		handler: (email, params) =>
			sheetsCreateSpreadsheet(email, params.title as string),
		requiredConnector: "google-sheets",
	},
	// Google Calendar
	{
		name: "calendar_list_events",
		description: "List upcoming calendar events",
		parameters: {
			timeMin: { type: "string", description: "Start time (ISO format)" },
			timeMax: { type: "string", description: "End time (ISO format)" },
			maxResults: { type: "number", description: "Max events (default 10)" },
		},
		handler: (email, params) =>
			calendarListEvents(
				email,
				params.timeMin as string,
				params.timeMax as string,
				(params.maxResults as number) ?? 10,
			),
		requiredConnector: "google-calendar",
	},
	{
		name: "calendar_create_event",
		description: "Create a new calendar event",
		parameters: {
			summary: { type: "string", description: "Event title", required: true },
			start: { type: "string", description: "Start time (ISO format)", required: true },
			end: { type: "string", description: "End time (ISO format)", required: true },
			description: { type: "string", description: "Event description" },
		},
		handler: (email, params) =>
			calendarCreateEvent(
				email,
				params.summary as string,
				params.start as string,
				params.end as string,
				params.description as string,
			),
		requiredConnector: "google-calendar",
	},
]

/**
 * Get tool by name
 */
export function getConnectorTool(toolName: string): ConnectorTool | undefined {
	return CONNECTOR_TOOLS.find((t) => t.name === toolName)
}

/**
 * Get all tools for a specific connector
 */
export function getConnectorTools(connectorId: string): ConnectorTool[] {
	return CONNECTOR_TOOLS.filter((t) => t.requiredConnector === connectorId)
}

/**
 * Get all available tool names
 */
export function getAvailableToolNames(_userEmail: string): string[] {
	return CONNECTOR_TOOLS.map((t) => t.name)
}

/**
 * Execute a connector tool
 */
export async function executeConnectorTool(
	userEmail: string,
	toolName: string,
	params: Record<string, unknown>,
): Promise<ConnectorToolResult> {
	const tool = getConnectorTool(toolName)
	if (!tool) {
		return { success: false, error: `Unknown tool: ${toolName}` }
	}

	// Check if connector is available
	const { isConnectorConnected } = await import("./token-sync")
	const connected = await isConnectorConnected(userEmail, tool.requiredConnector)
	if (!connected) {
		return {
			success: false,
			error: `Connector ${tool.requiredConnector} is not connected. Please connect it in Settings → Connectors.`,
		}
	}

	return tool.handler(userEmail, params)
}
