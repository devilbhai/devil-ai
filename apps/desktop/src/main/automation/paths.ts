/**
 * XDG Base Directory paths for Devil AI automation storage.
 *
 * Follows the XDG Base Directory Specification, matching the convention
 * used by OpenCode (see packages/opencode/src/global/index.ts):
 *
 *   Config:  $XDG_CONFIG_HOME/devil-ai  (default ~/.config/devil-ai)
 *   Data:    $XDG_DATA_HOME/devil-ai    (default ~/.local/share/devil-ai)
 *
 * Automation configs live under config (human-editable JSON + prompt.md).
 * The SQLite database lives under data (machine-managed state).
 */

import os from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"

const APP_NAME = "devilAi"

/**
 * Returns the XDG config directory for Devil AI.
 * Automations configs are stored at `<config>/automations/<id>/`.
 */
export function getConfigDir(): string {
	const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
	return path.join(xdgConfig, APP_NAME)
}

/**
 * Returns the XDG data directory for Devil AI.
 * The SQLite database is stored at `<data>/devil-ai.db`.
 */
export function getDataDir(): string {
	const xdgData = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share")
	return path.join(xdgData, APP_NAME)
}

/**
 * Returns the project-specific state directory for semantic search, etc.
 */
export function getProjectStatePath(projectPath: string): string {
	const projectHash = createHash("sha256").update(projectPath).digest("hex").slice(0, 16)
	return path.join(getDataDir(), "projects", projectHash)
}
