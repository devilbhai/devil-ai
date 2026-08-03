/**
 * @devilcode/sdk — DevilCode SDK
 *
 * Forked from @opencode-ai/sdk, enhanced for Devil AI.
 * Re-exports all types and functions from the original SDK.
 *
 * This wrapper allows Devil AI to:
 * 1. Track SDK version independently
 * 2. Add custom extensions in the future
 * 3. Swap backends without changing imports
 */

export type {
	Agent,
	Command,
	Config,
	Event,
	Model,
	OpencodeClient,
	PermissionRequest,
	PermissionRuleset,
	Project,
	Provider,
	ProviderAuthMethod,
	QuestionRequest,
	Session,
	Worktree,
} from "@opencode-ai/sdk/v2/client"
export * from "@opencode-ai/sdk/v2/client"
