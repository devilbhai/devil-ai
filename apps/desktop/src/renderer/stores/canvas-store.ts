/**
 * Canvas Store (Jotai Atoms)
 * 
 * Manages notebook/canvas state with undo/redo support.
 */

import { atom, getDefaultStore } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type { CanvasBlock, CanvasState, CanvasActions, BlockType, CanvasFile } from "../types/canvas"
import { createLogger } from "../lib/logger"

const log = createLogger("canvas-store")

// Generate unique block ID
function generateBlockId(): string {
	return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Initial state
const initialState: CanvasState = {
	blocks: [],
	selectedBlockId: undefined,
	version: 0,
}

// Persisted canvas files
export const canvasFilesAtom = atomWithStorage<CanvasFile[]>("devil-ai:canvas-files", [])

// Current canvas state (in-memory, not persisted per-session)
export const canvasStateAtom = atom<CanvasState>(initialState)

// History for undo/redo
const historyAtom = atom<{ past: CanvasState[]; future: CanvasState[] }>({
	past: [],
	future: [],
})

// Derived atoms
export const blocksAtom = atom(
	(get) => get(canvasStateAtom).blocks,
)

export const selectedBlockIdAtom = atom(
	(get) => get(canvasStateAtom).selectedBlockId,
)

export const selectedBlockAtom = atom(
	(get) => {
		const state = get(canvasStateAtom)
		const id = state.selectedBlockId
		return id ? state.blocks.find((b: CanvasBlock) => b.id === id) : undefined
	},
)

export const canUndoAtom = atom(
	(get) => get(historyAtom).past.length > 0,
)

export const canRedoAtom = atom(
	(get) => get(historyAtom).future.length > 0,
)

// Actions (initialized by initializeCanvasActions)
export const canvasActionsAtom = atom<CanvasActions | null>(null)

export function initializeCanvasActions() {
	const store = getDefaultStore()
	const actions: CanvasActions = {
		addBlock: (type: BlockType, index?: number, content = "") => {
			const state = store.get(canvasStateAtom)
			const newId = generateBlockId()
			
			let newBlock: CanvasBlock
			const now = Date.now()
			
			switch (type) {
				case "markdown":
					newBlock = { id: newId, type: "markdown", content, createdAt: now, updatedAt: now }
					break
				case "code":
					newBlock = { id: newId, type: "code", language: "typescript", content, createdAt: now, updatedAt: now }
					break
				case "output":
					newBlock = { id: newId, type: "output", content: "", createdAt: now, updatedAt: now }
					break
				case "thinking":
					newBlock = { id: newId, type: "thinking", content: "", createdAt: now, updatedAt: now }
					break
				case "tool":
					newBlock = { id: newId, type: "tool", toolName: "", input: {}, output: undefined, status: "pending", createdAt: now, updatedAt: now }
					break
			}
			
			const newBlocks = [...state.blocks]
			const insertIndex = index ?? newBlocks.length
			newBlocks.splice(insertIndex, 0, newBlock)
			
			// Push to history
			const history = store.get(historyAtom)
			store.set(historyAtom, {
				past: [...history.past, state],
				future: [],
			})
			
			store.set(canvasStateAtom, {
				...state,
				blocks: newBlocks,
				selectedBlockId: newId,
				version: state.version + 1,
			})
			
			return newId
		},
		
		removeBlock: (id: string) => {
			const state = store.get(canvasStateAtom)
			const newBlocks = state.blocks.filter((b: CanvasBlock) => b.id !== id)
			const history = store.get(historyAtom)
			store.set(historyAtom, { past: [...history.past, state], future: [] })
			store.set(canvasStateAtom, {
				...state,
				blocks: newBlocks,
				selectedBlockId: state.selectedBlockId === id ? undefined : state.selectedBlockId,
				version: state.version + 1,
			})
		},
		
		moveBlock: (id: string, newIndex: number) => {
			const state = store.get(canvasStateAtom)
			const blockIndex = state.blocks.findIndex((b: CanvasBlock) => b.id === id)
			if (blockIndex === -1) return
			
			const newBlocks = [...state.blocks]
			const [block] = newBlocks.splice(blockIndex, 1)
			newBlocks.splice(newIndex, 0, block)
			
			const history = store.get(historyAtom)
			store.set(historyAtom, { past: [...history.past, state], future: [] })
			store.set(canvasStateAtom, { ...state, blocks: newBlocks, version: state.version + 1 })
		},
		
		updateBlock: (id: string, updates: Partial<CanvasBlock>) => {
			const state = store.get(canvasStateAtom)
			const newBlocks = state.blocks.map((b: CanvasBlock) =>
				b.id === id ? ({ ...b, ...updates, updatedAt: Date.now() } as CanvasBlock) : b
			)
			const history = store.get(historyAtom)
			store.set(historyAtom, { past: [...history.past, state], future: [] })
			store.set(canvasStateAtom, { ...state, blocks: newBlocks, version: state.version + 1 })
		},
		
		duplicateBlock: (id: string) => {
			const state = store.get(canvasStateAtom)
			const blockIndex = state.blocks.findIndex((b: CanvasBlock) => b.id === id)
			if (blockIndex === -1) return ""
			
			const block = state.blocks[blockIndex]
			const newId = generateBlockId()
			const newBlock: CanvasBlock = {
				...block,
				id: newId,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			}
			
			const newBlocks = [...state.blocks]
			newBlocks.splice(blockIndex + 1, 0, newBlock)
			
			const history = store.get(historyAtom)
			store.set(historyAtom, { past: [...history.past, state], future: [] })
			store.set(canvasStateAtom, { ...state, blocks: newBlocks, selectedBlockId: newId, version: state.version + 1 })
			
			return newId
		},
		
		runCodeBlock: async (id: string) => {
			const state = store.get(canvasStateAtom)
			const block = state.blocks.find((b: CanvasBlock) => b.id === id)
			if (!block || block.type !== "code") return
			
			// Update the block to running state
			store.set(canvasStateAtom, (prevState: CanvasState) => ({
				...prevState,
				blocks: prevState.blocks.map((b: CanvasBlock) =>
					b.id === id ? { ...b, isRunning: true, updatedAt: Date.now() } : b
				),
				version: prevState.version + 1,
			}))
			
			// Execute via IPC
			try {
				const api = window.devilAi as unknown as { codeExecution?: { execute: (args: { code: string; language: string }) => Promise<{ output?: string; error?: string }> } }
				const result = await api?.codeExecution?.execute({
					code: block.content,
					language: block.language,
				})
				
				// Create output block
				const outputId = generateBlockId()
				const outputBlock: CanvasBlock = {
					id: outputId,
					type: "output",
					content: result?.output ?? result?.error ?? "",
					mimeType: "text/plain",
					parentCodeBlockId: id,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				}
				
				const currentState = store.get(canvasStateAtom)
				const codeIndex = currentState.blocks.findIndex((b: CanvasBlock) => b.id === id)
				const newBlocks = [...currentState.blocks]
				newBlocks.splice(codeIndex + 1, 0, outputBlock)
				
				store.set(canvasStateAtom, {
					...currentState,
					blocks: newBlocks.map((b: CanvasBlock) =>
						b.id === id ? { ...b, isRunning: false, outputId, updatedAt: Date.now() } : b
					),
					version: currentState.version + 1,
				})
			} catch (err) {
				log.error("Code execution failed", { blockId: id }, err)
				store.set(canvasStateAtom, (prevState: CanvasState) => ({
					...prevState,
				blocks: prevState.blocks.map((b: CanvasBlock) =>
					b.id === id ? { ...b, isRunning: false, updatedAt: Date.now() } : b
					),
					version: prevState.version + 1,
				}))
			}
		},
		
		setSelectedBlock: (id: string | undefined) => {
			store.set(canvasStateAtom, (prev: CanvasState) => ({
				...prev,
				selectedBlockId: id,
			}))
		},
		
		undo: () => {
			const history = store.get(historyAtom)
			if (history.past.length === 0) return
			
			const previous = history.past[history.past.length - 1]
			const current = store.get(canvasStateAtom)
			
			store.set(historyAtom, {
				past: history.past.slice(0, -1),
				future: [current, ...history.future],
			})
			store.set(canvasStateAtom, previous)
		},
		
		redo: () => {
			const history = store.get(historyAtom)
			if (history.future.length === 0) return
			
			const next = history.future[0]
			const current = store.get(canvasStateAtom)
			
			store.set(historyAtom, {
				past: [...history.past, current],
				future: history.future.slice(1),
			})
			store.set(canvasStateAtom, next)
		},
	}
	
	;(store as unknown as { set: (atom: typeof canvasActionsAtom, value: CanvasActions) => void }).set(canvasActionsAtom, actions)
	return actions
}