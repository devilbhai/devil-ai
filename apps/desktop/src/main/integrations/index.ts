import { getCredential } from "../credential-store"
import { createLogger } from "../logger"

const log = createLogger("integrations")

export interface TaskItem {
	id: string
	provider: "jira" | "linear"
	ticketId: string
	title: string
	status: string
}

/**
 * Fetch assigned, active Jira issues for the current user.
 */
async function fetchJiraIssues(): Promise<TaskItem[]> {
	const domain = getCredential("jira-url")
	const email = getCredential("jira-email")
	const token = getCredential("jira-token")

	if (!domain || !email || !token) {
		return []
	}

	try {
		// Ensure domain has no trailing slash and is https
		let baseUrl = domain.trim()
		if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`
		if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1)

		const url = `${baseUrl}/rest/api/3/search?jql=assignee=currentUser()%20AND%20statusCategory%20!%3D%20Done`
		const auth = Buffer.from(`${email}:${token}`).toString("base64")

		const res = await fetch(url, {
			headers: {
				Authorization: `Basic ${auth}`,
				Accept: "application/json",
			},
		})

		if (!res.ok) {
			log.error("Jira API error", { status: res.status, text: await res.text() })
			return []
		}

		const data = await res.json()
		const issues: any[] = data.issues || []

		return issues.map((issue) => ({
			id: issue.id,
			provider: "jira",
			ticketId: issue.key,
			title: issue.fields?.summary || "Untitled",
			status: issue.fields?.status?.name || "To Do",
		}))
	} catch (err) {
		log.error("Failed to fetch Jira issues", err)
		return []
	}
}

/**
 * Fetch assigned, active Linear issues for the current user.
 */
async function fetchLinearIssues(): Promise<TaskItem[]> {
	const token = getCredential("linear-token")

	if (!token) {
		return []
	}

	try {
		const query = `
			query {
				issues(filter: { assignee: { isMe: { eq: true } }, state: { type: { neq: "completed" } } }) {
					nodes {
						id
						identifier
						title
						state {
							name
						}
					}
				}
			}
		`

		const res = await fetch("https://api.linear.app/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify({ query }),
		})

		if (!res.ok) {
			log.error("Linear API error", { status: res.status, text: await res.text() })
			return []
		}

		const data = await res.json()
		const issues: any[] = data.data?.issues?.nodes || []

		return issues.map((issue) => ({
			id: issue.id,
			provider: "linear",
			ticketId: issue.identifier,
			title: issue.title || "Untitled",
			status: issue.state?.name || "To Do",
		}))
	} catch (err) {
		log.error("Failed to fetch Linear issues", err)
		return []
	}
}

/**
 * Fetch all active tasks from configured integrations.
 */
export async function fetchAllTasks(): Promise<TaskItem[]> {
	const [jiraTasks, linearTasks] = await Promise.all([
		fetchJiraIssues(),
		fetchLinearIssues(),
	])

	return [...jiraTasks, ...linearTasks]
}
