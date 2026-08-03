/**
 * Canvas Store - Canvas/Notebook actions using Jotai atoms
 */

import { atom, useAtom } from "jotai"
import { createLogger } from "../lib/logger"
import {
	canvasStateAtom,
	canvasHistoryAtom,
	blocksAtom,
	selectedBlockIdAtom,
	canvasActionsAtom,
	canvasFilesAtom,
	blocksAtom as blocksAtomExport,
	selectedBlockIdAtom as selectedBlockIdAtomExport,
	canUndoAtom,
	canRedoAtom,
} from "../atoms/canvas"
import type { CanvasBlock, CanvasState, CanvasAction, CanvasFile, BlockType } from "../types/canvas"
import { createLogger } from "../lib/logger"

const log = createLogger("canvas-store")

// Action helper to update canvas state with history
function updateCanvasState(
	set: any,
	get: any,
	updater: (prev: CanvasState) => CanvasState
) {
	const state = get(canvasStateAtom)
	const newState = updater(state)
	
	// Add to history
	const history = get(canvasHistoryAtom)
	if (history.past.length > 0 || history.future.length > 0 || newState.version !== state.version) {
		set(canvasHistoryAtom, {
			past: [...history.past, state],
			future: [],
		})
	}
	
	set(canvasStateAtom, { ...newState, version: state.version + 1 })
}

// Initialize actions
export function initializeCanvasActions() {
	// This is called from the component to wire up actions
}

export const canvasActions = {
	addBlock: (blockType: BlockType, initialContent?: Partial<any>) => (get: any, set: any) => {
		const state = get(canvasStateAtom)
		const newBlock: any = {
			id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			type: blockType,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			...initialContent,
		}
		
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: [...prev.blocks, newBlock],
			selectedBlockId: newBlock.id,
		}))
		
		return newBlock.id
	},
	
	removeBlock: (id: string) => (get: any, set: any) => {
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: prev.blocks.filter((b) => b.id !== id),
			selectedBlockId: prev.selectedBlockId === id ? undefined : prev.selectedBlockId,
		}))
	},
	
	updateBlock: (id: string, updates: Partial<any>) => (get: any, set: any) => {
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: prev.blocks.map((b) =>
				b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
			),
		}))
	},
	
	moveBlock: (id: string, toIndex: number) => (get: any, set: any) => {
		updateCanvasState(set, get, (prev) => {
			const newBlocks = [...prev.blocks]
			const fromIndex = newBlocks.findIndex((b) => b.id === id)
			if (fromIndex === -1) return prev
			
			const [block] = newBlocks.splice(fromIndex, 1)
			newBlocks.splice(toIndex, 0, block)
			
			return { ...prev, blocks: newBlocks }
		})
	},
	
	duplicateBlock: (id: string) => (get: any, set: any) => {
		const state = get(canvasStateAtom)
		const block = state.blocks.find((b) => b.id === id)
		if (!block) return
		
		const newBlock = {
			...block,
			id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}
		
		const fromIndex = state.blocks.findIndex((b) => b.id === id)
		const newBlocks = [...state.blocks]
		newBlocks.splice(fromIndex + 1, 0, newBlock)
		
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: newBlocks,
			selectedBlockId: newBlock.id,
		}))
	},
	
	runCodeBlock: (id: string) => (get: any, set: any) => {
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: prev.blocks.map((b) =>
				b.id === id ? { ...b, isRunning: true, updatedAt: Date.now() } : b
			),
		}))
	},
	
	duplicateBlock: (id: string) => (get: any, set: any) => {
		const state = get(canvasStateAtom)
		const block = state.blocks.find((b) => b.id === id)
		if (!block) return
		
		const newBlock = {
			...block,
			id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}
		
		const fromIndex = state.blocks.findIndex((b) => b.id === id)
		const newBlocks = [...state.blocks]
		newBlocks.splice(fromIndex + 1, 0, newBlock)
		
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: newBlocks,
			selectedBlockId: newBlock.id,
		}))
	},
	
	runCodeBlock: (id: string) => (get: any, set: any) => {
		updateCanvasState(set, get, (prev) => ({
			...prev,
			blocks: prev.blocks.map((b) =>
				b.id === id ? { ...b, isRunning: true, updatedAt: Date.now() } : b
			),
		}))
	},
	
	undo: () => (get: any, set: any) => {
		const history = get(canvasHistoryAtom)
		if (history.past.length === 0) return
		
		const newIndex = history.past.length - 1
		const newState = history.past[newIndex]
		
		set(canvasHistoryAtom, {
			past: history.past.slice(0, -1),
			future: [get(canvasStateAtom), ...history.future],
		})
		
		// Don't add to history when undoing
		set(canvasStateAtom, { ...newState, historyIndex: newIndex })
	},
	
	redo: () => (get: any, set: any) => {
		const history = get(canvasHistoryAtom)
		if (history.future.length === 0) return
		
		const newState = history.future[0]
		
		set(canvasHistoryAtom, {
			past: [...history.past, get(canvasStateAtom)],
			future: history.future.slice(1),
		})
		
		set(canvasStateAtom, newState)
	},
	
	setSelectedBlock: (id: string | undefined) => (get: any, set: any) => {
		set(selectedBlockIdAtom, id)
	},
	
	saveCanvas: (name: string, projectPath?: string) => (get: any, set: any) => {
		const state = get(canvasStateAtom)
		const newFile: any = {
			id: `canvas-${Date.now()}`,
			name,
			state,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			projectPath,
		}
		
		set(canvasFilesAtom, (prev: any) => [...prev, newFile])
	},
	
	loadCanvas: (fileId: string) => (get: any, set: any) => {
		const files = get(canvasFilesAtom)
		const file = files.find((f: any) => f.id === fileId)
		if (!file) return
		
		// Load with empty history
		set(canvasStateAtom, { ...file.state, history: [], historyIndex: -1 })
	},
	
	deleteCanvas: (fileId: string) => (get: any, set: any) => {
		set(canvasFilesAtom, (prev: any) => prev.filter((f: any) => f.id !== fileId))
	},
}

export type CanvasAction = ReturnType<typeof canvasActions.addBlock> | ReturnType<typeof canvasActions.removeBlock> | ReturnType<typeof canvasActions.updateBlock> | ReturnType<typeof canvasActions.moveBlock> | ReturnType<typeof canvasActions.duplicateBlock> | ReturnType<typeof canvasActions.runCodeBlock> | ReturnType<typeof canvasActions.undo> | ReturnType<typeof canvasActions.redo> | ReturnType<typeof canvasActions.setSelectedBlock> | ReturnType<typeof canvasActions.saveCanvas> | ReturnType<typeof canvasActions.loadCanvas> | ReturnType<typeof canvasActions.deleteCanvas>