import { getCredential, storeCredential, deleteCredential } from "../credential-store"
import { createLogger } from "../logger"
import { net } from "electron"

const log = createLogger("connector-manager")

// List of all connected connector IDs by checking what's in the credential store
// Note: We suffix credentials with "_connector" to separate them from other credentials
const CONNECTOR_SUFFIX = "_connector"

export interface ConnectorStatus {
	connected: boolean
	connectedAt?: number
	credentials?: Record<string, string>
}

export function getConnectorStatuses(): Record<string, ConnectorStatus> {
	// For now, we will store a JSON string containing the status under "connectors_state"
	// and the actual secrets separately.
	const rawState = getCredential("connectors_state")
	try {
		return rawState ? JSON.parse(rawState) : {}
	} catch {
		return {}
	}
}

export function saveConnectorStatus(id: string, status: ConnectorStatus | null): void {
	const statuses = getConnectorStatuses()
	if (status === null) {
		delete statuses[id]
	} else {
		statuses[id] = status
	}
	storeCredential("connectors_state", JSON.stringify(statuses))
}

export function setConnectorCredential(id: string, credentials: Record<string, string>): void {
	// Store secrets securely in the credential store
	storeCredential(`${id}${CONNECTOR_SUFFIX}`, JSON.stringify(credentials))
	
	saveConnectorStatus(id, {
		connected: true,
		connectedAt: Date.now(),
		// We don't send the full credentials back to UI, just a mask or empty object 
		// but the UI currently expects them to show some state, we'll keep non-sensitive info if needed
		credentials: { masked: "true" }
	})
	log.info(`Saved credentials for connector ${id}`)
}

export function deleteConnectorCredential(id: string): void {
	deleteCredential(`${id}${CONNECTOR_SUFFIX}`)
	saveConnectorStatus(id, null)
	log.info(`Deleted credentials for connector ${id}`)
}

export function getConnectorCredential(id: string): Record<string, string> | null {
	const raw = getCredential(`${id}${CONNECTOR_SUFFIX}`)
	if (!raw) return null
	try {
		return JSON.parse(raw)
	} catch {
		return null
	}
}

// ----------------------------------------------------------------------
// Specific API Tests
// ----------------------------------------------------------------------

export async function testConnectorConnection(id: string, credentials: Record<string, string>): Promise<{ success: boolean; message: string }> {
	log.info(`Testing connection for ${id}`)
	
	try {
		switch (id) {
			case "github": {
				const res = await net.fetch("https://api.github.com/user", {
					headers: { "Authorization": `Bearer ${credentials.apiToken || credentials.accessToken}`, "User-Agent": "Devil-AI" }
				})
				if (res.ok) {
					const data = await res.json() as any
					return { success: true, message: `Connected as ${data.login}` }
				}
				return { success: false, message: `GitHub API returned ${res.status}` }
			}
			case "slack": {
				const res = await net.fetch("https://slack.com/api/auth.test", {
					headers: { "Authorization": `Bearer ${credentials.apiToken || credentials.accessToken}` }
				})
				const data = await res.json() as any
				if (data.ok) return { success: true, message: `Connected to Slack workspace: ${data.team}` }
				return { success: false, message: data.error || "Slack auth failed" }
			}
			case "telegram": {
				const res = await net.fetch(`https://api.telegram.org/bot${credentials.botToken}/getMe`)
				const data = await res.json() as any
				if (data.ok) return { success: true, message: `Connected as ${data.result.first_name}` }
				return { success: false, message: data.description || "Telegram auth failed" }
			}
			case "discord": {
				const res = await net.fetch("https://discord.com/api/v10/users/@me", {
					headers: { "Authorization": `Bot ${credentials.botToken}` }
				})
				if (res.ok) {
					const data = await res.json() as any
					return { success: true, message: `Connected as ${data.username}` }
				}
				return { success: false, message: `Discord API returned ${res.status}` }
			}
			case "whatsapp": {
				const res = await net.fetch(`https://graph.facebook.com/v17.0/${credentials.phoneNumberId}`, {
					headers: { "Authorization": `Bearer ${credentials.accessToken}` }
				})
				if (res.ok) return { success: true, message: `WhatsApp connection successful` }
				return { success: false, message: `WhatsApp API returned ${res.status}` }
			}
			case "jira": {
				const domain = credentials.domain.replace(/^https?:\/\//, "")
				const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString("base64")
				const res = await net.fetch(`https://${domain}/rest/api/3/myself`, {
					headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" }
				})
				if (res.ok) {
					const data = await res.json() as any
					return { success: true, message: `Connected to Jira as ${data.displayName}` }
				}
				return { success: false, message: `Jira API returned ${res.status}` }
			}
			case "confluence": {
				const domain = credentials.domain.replace(/^https?:\/\//, "")
				const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString("base64")
				const res = await net.fetch(`https://${domain}/wiki/rest/api/user/current`, {
					headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" }
				})
				if (res.ok) {
					const data = await res.json() as any
					return { success: true, message: `Connected to Confluence as ${data.displayName}` }
				}
				return { success: false, message: `Confluence API returned ${res.status}` }
			}
			case "monday": {
				const res = await net.fetch("https://api.monday.com/v2", {
					method: "POST",
					headers: { "Authorization": credentials.apiToken, "Content-Type": "application/json" },
					body: JSON.stringify({ query: "{ me { name } }" })
				})
				const data = await res.json() as any
				if (data.data?.me) return { success: true, message: `Connected to Monday.com as ${data.data.me.name}` }
				return { success: false, message: "Monday.com auth failed" }
			}
			case "clickup": {
				const res = await net.fetch("https://api.clickup.com/api/v2/user", {
					headers: { "Authorization": credentials.apiToken }
				})
				if (res.ok) {
					const data = await res.json() as any
					return { success: true, message: `Connected to ClickUp as ${data.user.username}` }
				}
				return { success: false, message: `ClickUp API returned ${res.status}` }
			}
			case "close": {
				const auth = Buffer.from(`${credentials.apiToken}:`).toString("base64")
				const res = await net.fetch("https://api.close.com/api/v1/me/", {
					headers: { "Authorization": `Basic ${auth}` }
				})
				if (res.ok) return { success: true, message: `Connected to Close CRM` }
				return { success: false, message: `Close API returned ${res.status}` }
			}
			case "attio": {
				const res = await net.fetch("https://api.attio.com/v2/workspaces", {
					headers: { "Authorization": `Bearer ${credentials.apiToken}`, "Accept": "application/json" }
				})
				if (res.ok) return { success: true, message: `Connected to Attio` }
				return { success: false, message: `Attio API returned ${res.status}` }
			}
			case "apollo": {
				const res = await net.fetch("https://api.apollo.io/v1/auth/health", {
					headers: { "Cache-Control": "no-cache", "Content-Type": "application/json", "api_key": credentials.apiToken }
				})
				if (res.ok) {
					const data = await res.json() as any
					if (data.is_logged_in) return { success: true, message: `Connected to Apollo.io` }
				}
				return { success: false, message: `Apollo.io API returned ${res.status}` }
			}
			case "zendesk": {
				const auth = Buffer.from(`${credentials.email}/token:${credentials.apiToken}`).toString("base64")
				const res = await net.fetch(`https://${credentials.subdomain}.zendesk.com/api/v2/users/me.json`, {
					headers: { "Authorization": `Basic ${auth}` }
				})
				if (res.ok) return { success: true, message: `Connected to Zendesk` }
				return { success: false, message: `Zendesk API returned ${res.status}` }
			}
			case "posthog": {
				const host = credentials.host.replace(/\/$/, "")
				const res = await net.fetch(`${host}/api/users/@me/`, {
					headers: { "Authorization": `Bearer ${credentials.apiKey}` }
				})
				if (res.ok) return { success: true, message: `Connected to PostHog` }
				return { success: false, message: `PostHog API returned ${res.status}` }
			}
			case "stripe": {
				const res = await net.fetch("https://api.stripe.com/v1/account", {
					headers: { "Authorization": `Bearer ${credentials.secretKey}` }
				})
				if (res.ok) return { success: true, message: `Connected to Stripe` }
				return { success: false, message: `Stripe API returned ${res.status}` }
			}
			case "email-imap": {
				// We can't realistically test IMAP over fetch, so we fallback
				await new Promise(r => setTimeout(r, 800))
				return { success: true, message: `IMAP configuration saved (Test simulated)` }
			}
			default: {
				// Fallback for not-yet-implemented real tests (like Mixpanel, Amplitude, or OAuth ones that only save token)
				await new Promise(r => setTimeout(r, 800))
				return { success: true, message: `Connection simulated successfully for ${id}` }
			}
		}
	} catch (error: any) {
		log.error(`Test failed for ${id}`, error)
		return { success: false, message: error.message || "Network error" }
	}
}
