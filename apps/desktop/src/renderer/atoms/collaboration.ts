/**
 * Collaboration atoms — share live session with team members.
 * Uses Cloudflare tunnels for temporary public URLs.
 */
import { atom } from "jotai"

export interface Collaborator {
	id: string
	name: string
	email: string
	avatarUrl: string | null
	role: "viewer" | "commenter" | "editor"
	joinedAt: number
}

export interface CollaborationSession {
	/** Share link */
	shareUrl: string | null
	/** One-time password for access */
	otp: string | null
	/** Whether sharing is active */
	shared: boolean
	/** Whether tunnel is starting */
	starting: boolean
	/** Error message if tunnel failed */
	error: string | null
	/** List of active collaborators */
	collaborators: Collaborator[]
	/** Whether to show cursors */
	showCursors: boolean
	/** Whether to allow comments */
	allowComments: boolean
}

export const collaborationAtom = atom<CollaborationSession>({
	shareUrl: null,
	otp: null,
	shared: false,
	starting: false,
	error: null,
	collaborators: [],
	showCursors: true,
	allowComments: true,
})

export const collaborationEnabledAtom = atom((get) => get(collaborationAtom).shared)
export const collaboratorCountAtom = atom((get) => get(collaborationAtom).collaborators.length)
export const collaborationStartingAtom = atom((get) => get(collaborationAtom).starting)
export const collaborationErrorAtom = atom((get) => get(collaborationAtom).error)

/**
 * Start sharing a session via Cloudflare tunnel.
 * Generates a temporary public URL that anyone can access.
 */
export const startSharingAtom = atom(null, async (_get, set, sessionId: string) => {
	// Check if cloudflared is installed
	const isInstalled = await window.devilAi.tunnel.check()
	if (!isInstalled) {
		set(collaborationAtom, (prev) => ({
			...prev,
			error: "cloudflared is not installed. Please install it from Settings > Setup.",
		}))
		return
	}

	// Set loading state
	set(collaborationAtom, (prev) => ({
		...prev,
		starting: true,
		error: null,
	}))

	try {
		// Start the tunnel
		const result = await window.devilAi.tunnel.start(sessionId)

		// Update state with the URL and OTP
		set(collaborationAtom, (prev) => ({
			...prev,
			shareUrl: result.url,
			otp: result.otp,
			shared: true,
			starting: false,
			error: null,
		}))
	} catch (err) {
		// Handle error
		const message = err instanceof Error ? err.message : "Failed to start sharing"
		set(collaborationAtom, (prev) => ({
			...prev,
			starting: false,
			error: message,
		}))
	}
})

/**
 * Stop sharing the current session.
 */
export const stopSharingAtom = atom(null, async (_get, set) => {
	try {
		await window.devilAi.tunnel.stop()
	} catch {
		// Ignore errors on stop
	}

	set(collaborationAtom, {
		shareUrl: null,
		otp: null,
		shared: false,
		starting: false,
		error: null,
		collaborators: [],
		showCursors: true,
		allowComments: true,
	})
})

export const addCollaboratorAtom = atom(
	null,
	(_get, set, collaborator: Collaborator) => {
		set(collaborationAtom, (prev) => ({
			...prev,
			collaborators: [...prev.collaborators, collaborator],
		}))
	},
)

export const removeCollaboratorAtom = atom(
	null,
	(_get, set, collaboratorId: string) => {
		set(collaborationAtom, (prev) => ({
			...prev,
			collaborators: prev.collaborators.filter((c) => c.id !== collaboratorId),
		}))
	},
)
