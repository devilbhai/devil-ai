/**
 * Terminal IPC handlers — spawns node-pty in the main process
 * and communicates with the renderer via IPC.
 */

import { ipcMain, BrowserWindow } from "electron"
import * as pty from "node-pty"
import os from "node:os"

interface TerminalInstance {
	pty: pty.IPty
	id: string
}

const terminals = new Map<string, TerminalInstance>()

function getShell(): string {
	const platform = os.platform()
	if (platform === "win32") {
		return process.env.COMSPEC || "powershell.exe"
	}
	return process.env.SHELL || "/bin/zsh"
}

function createTerminal(id: string, cols = 80, rows = 24): TerminalInstance {
	const shell = getShell()
	const platform = os.platform()
	const shellArgs = platform === "win32" ? [] : []

	const ptyProcess = pty.spawn(shell, shellArgs, {
		name: "xterm-256color",
		cols,
		rows,
		cwd: process.env.HOME || os.homedir(),
		env: process.env as Record<string, string>,
	})

	const instance: TerminalInstance = { pty: ptyProcess, id }
	terminals.set(id, instance)
	return instance
}

function getMainWindow(): BrowserWindow | null {
	return BrowserWindow.getAllWindows()[0] ?? null
}

export function registerTerminalIpc(): void {
	ipcMain.handle("terminal:create", async (_event, id: string, cols?: number, rows?: number) => {
		try {
			const instance = createTerminal(id, cols, rows)
			instance.pty.onData((data: string) => {
				const win = getMainWindow()
				if (win && !win.isDestroyed()) {
					win.webContents.send("terminal:data", id, data)
				}
			})
			instance.pty.onExit(({ exitCode }: { exitCode: number }) => {
				const win = getMainWindow()
				if (win && !win.isDestroyed()) {
					win.webContents.send("terminal:exit", id, exitCode)
				}
				terminals.delete(id)
			})
			return { success: true }
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : String(err) }
		}
	})

	ipcMain.handle("terminal:write", async (_event, id: string, data: string) => {
		const instance = terminals.get(id)
		if (instance) {
			instance.pty.write(data)
			return { success: true }
		}
		return { success: false, error: "Terminal not found" }
	})

	ipcMain.handle("terminal:resize", async (_event, id: string, cols: number, rows: number) => {
		const instance = terminals.get(id)
		if (instance) {
			instance.pty.resize(cols, rows)
			return { success: true }
		}
		return { success: false, error: "Terminal not found" }
	})

	ipcMain.handle("terminal:kill", async (_event, id: string) => {
		const instance = terminals.get(id)
		if (instance) {
			instance.pty.kill()
			terminals.delete(id)
			return { success: true }
		}
		return { success: false, error: "Terminal not found" }
	})

	ipcMain.handle("terminal:list", async () => {
		return Array.from(terminals.keys())
	})
}

export function cleanupTerminals(): void {
	for (const [, instance] of terminals) {
		try {
			instance.pty.kill()
		} catch {
			// Ignore errors during cleanup
		}
	}
	terminals.clear()
}
