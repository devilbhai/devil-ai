/**
 * Knowledge Graph atoms — cross-session connections and related sessions.
 */
import { atom } from "jotai"

export interface KnowledgeNode {
	id: string
	type: "session" | "file" | "concept" | "project"
	label: string
	metadata: Record<string, unknown>
}

export interface KnowledgeEdge {
	source: string
	target: string
	weight: number
	label: string
}

export interface KnowledgeGraph {
	nodes: KnowledgeNode[]
	edges: KnowledgeEdge[]
}

export interface KnowledgeGraphState {
	loading: boolean
	graph: KnowledgeGraph
	relatedSessions: RelatedSession[]
}

export interface RelatedSession {
	sessionId: string
	title: string
	projectSlug: string
	similarity: number
	reason: string
}

export const knowledgeGraphAtom = atom<KnowledgeGraphState>({
	loading: false,
	graph: { nodes: [], edges: [] },
	relatedSessions: [],
})

export const knowledgeGraphLoadingAtom = atom((get) => get(knowledgeGraphAtom).loading)
export const relatedSessionsAtom = atom((get) => get(knowledgeGraphAtom).relatedSessions)
