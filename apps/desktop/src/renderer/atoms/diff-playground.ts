/**
 * Diff Playground atoms — interactive inline diff editing.
 * Allows users to modify generated diffs before applying them.
 */
import { atom } from "jotai"

export interface DiffHunk {
	id: string
	filePath: string
	originalLines: string[]
	modifiedLines: string[]
	rejected: boolean
	editedContent: string | null
}

export interface DiffPlaygroundState {
	sessionId: string
	hunks: DiffHunk[]
	isEditing: boolean
}

export const diffPlaygroundAtom = atom<DiffPlaygroundState | null>(null)
export const diffPlaygroundOpenAtom = atom<boolean>(false)

export const toggleHunkRejectAtom = atom(
	null,
	(get, set, hunkId: string) => {
		const state = get(diffPlaygroundAtom)
		if (!state) return
		set(
			diffPlaygroundAtom,
			(state) =>
				state && {
					...state,
					hunks: state.hunks.map((h) =>
						h.id === hunkId ? { ...h, rejected: !h.rejected } : h,
					),
				},
		)
	},
)

export const updateHunkContentAtom = atom(
	null,
	(get, set, { hunkId, content }: { hunkId: string; content: string }) => {
		const state = get(diffPlaygroundAtom)
		if (!state) return
		set(
			diffPlaygroundAtom,
			(state) =>
				state && {
					...state,
					hunks: state.hunks.map((h) =>
						h.id === hunkId ? { ...h, editedContent: content } : h,
					),
				},
		)
	},
)
