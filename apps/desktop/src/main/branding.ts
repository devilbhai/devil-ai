/**
 * Devil AI Branding Constants
 *
 * Centralized branding to hide OpenCode references from users.
 * All user-facing strings should use these constants.
 */

// ============================================================
// Engine branding (replaces "OpenCode" in user-facing text)
// ============================================================

/** Display name for the AI engine (shown to users) */
export const ENGINE_DISPLAY_NAME = "Devil AI Engine"

/** Short name for internal references */
export const ENGINE_SHORT_NAME = "Engine"

/** Fallback error message prefix */
export const ENGINE_ERROR_PREFIX = "Devil AI Engine"

// ============================================================
// Log message sanitization
// ============================================================

/**
 * Words/patterns to scrub from user-facing logs and error messages.
 * Internal developer logs can still use these for debugging.
 */
export const SCRUB_PATTERNS = [
	"opencode",
	"OpenCode",
	"open-code",
	"open_code",
] as const

/**
 * Scrub OpenCode references from a string.
 * Used for user-facing error messages and logs.
 */
export function scrubBranding(text: string): string {
	let result = text
	for (const pattern of SCRUB_PATTERNS) {
		result = result.replaceAll(pattern, "Devil AI Engine")
	}
	return result
}

/**
 * Create a user-facing error message that hides OpenCode references.
 */
export function engineError(message: string): string {
	return scrubBranding(message)
}
