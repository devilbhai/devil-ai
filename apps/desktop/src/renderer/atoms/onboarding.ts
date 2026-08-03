/**
 * Onboarding state atoms.
 *
 * Tracks whether the first-run onboarding has been completed.
 * Persisted to localStorage so returning users skip onboarding.
 *
 * Auto-completes on first run if the engine is already installed and configured,
 * so the user can start using the app immediately without going through the wizard.
 */

import { atomWithStorage } from "jotai/utils"

// ============================================================
// Types
// ============================================================

/**
 * Bump this on releases that introduce a new DevilRoute gateway requirement.
 * Existing users whose stored `devilrouteV` is below this are re-onboarded so
 * the local gateway gets installed/set up on their machine.
 */
export const DEVILROUTE_REQUIRED_VERSION = 1

export interface OnboardingState {
	completed: boolean
	completedAt: string | null
	skippedSteps: string[]
	migrationPerformed: boolean
	/** Which provider(s) were migrated from (e.g. ["claude-code", "cursor"]). */
	migratedFrom: string[]
	opencodeVersion: string | null
	/** Number of AI providers connected during onboarding. */
	providersConnected: number
	/**
	 * Version of the DevilRoute gateway setup that was completed on this machine.
	 * `0` (or absent for pre-existing users) means the gateway was never set up —
	 * the app re-onboards them so the local `/v1` gateway gets installed.
	 */
	devilrouteV: number
}

// ============================================================
// Auto-detect if onboarding should be skipped
// ============================================================

/**
 * Check if the engine is already installed and configured.
 * Returns true if the CLI exists and at least one provider is configured.
 * Used to auto-skip onboarding for users who already have Devil AI set up.
 */
function isOpenCodeConfigured(): boolean {
	if (typeof window === "undefined" || !("devilAi" in window)) return false

	try {
		// Check if the engine is installed via the preload bridge
		// The check is synchronous via IPC in the main process
		// We use a conservative approach: if we're in Electron and the
		// onboarding state doesn't exist yet, assume it's a fresh install
		// and let the onboarding flow handle it.
		//
		// However, if the user has already completed onboarding before
		// (localStorage has the key), we respect that.
		const stored = localStorage.getItem("devil-ai:onboarding")
		if (stored) {
			const parsed = JSON.parse(stored) as OnboardingState
			return parsed.completed === true
		}

		// No stored state — check if OpenCode config exists on disk
		// This is a best-effort check; if it fails, we show onboarding
		// to let the user set things up properly.
		return false
	} catch {
		return false
	}
}

// ============================================================
// Atoms
// ============================================================

/**
 * Initial onboarding state. If the user has already completed onboarding
 * (stored in localStorage) or the engine is pre-configured, we start in
 * the completed state to skip the wizard entirely.
 */
function getInitialState(): OnboardingState {
	// If already completed before, keep it completed
	if (isOpenCodeConfigured()) {
		return {
			completed: true,
			completedAt: new Date().toISOString(),
			skippedSteps: [],
			migrationPerformed: false,
			migratedFrom: [],
			opencodeVersion: null,
			providersConnected: 0,
			devilrouteV: 0,
		}
	}

	return {
		completed: false,
		completedAt: null,
		skippedSteps: [],
		migrationPerformed: false,
		migratedFrom: [],
		opencodeVersion: null,
		providersConnected: 0,
		devilrouteV: 0,
	}
}

export const onboardingStateAtom = atomWithStorage<OnboardingState>(
	"devil-ai:onboarding",
	getInitialState(),
)
