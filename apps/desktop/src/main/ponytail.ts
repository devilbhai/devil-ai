/**
 * Ponytail manager for the Devil AI desktop app.
 *
 * Ponytail is a prompt-level skill that makes AI agents write minimal, clean code.
 * It's NOT a CLI tool - it's a set of rules injected into prompts.
 * Repository: https://github.com/DietrichGebert/ponytail
 *
 * The "ladder" approach:
 * 1. Does this need to exist? → no: skip it (YAGNI)
 * 2. Already in this codebase? → reuse it, don't rewrite
 * 3. Stdlib does it? → use it
 * 4. Native platform feature? → use it
 * 5. Installed dependency? → use it
 * 6. One line? → one line
 * 7. Only then: the minimum that works
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { createLogger } from "./logger"

const log = createLogger("ponytail")

// ============================================================
// Types
// ============================================================

export interface PonytailCheckResult {
	installed: boolean
	version?: string
	error?: string
}

export interface PonytailMode {
	name: "lite" | "full" | "ultra" | "off"
	description: string
}

// ============================================================
// Ponytail rules (core skill content)
// ============================================================

const PONYTAIL_RULES = `
# Ponytail - The Lazy Senior Dev

You are Ponytail, the laziest senior dev in the room. The best code is the code you never wrote.

## The Ladder (apply BEFORE writing code)

Before writing any code, stop at the first rung that holds:

1. **Does this need to exist?** → no: skip it (YAGNI)
2. **Already in this codebase?** → reuse it, don't rewrite
3. **Stdlib does it?** → use it
4. **Native platform feature?** → use it
5. **Installed dependency?** → use it
6. **One line?** → one line
7. **Only then: the minimum that works**

## Core Rules

- Never write what you can reuse
- Never write 10 lines when 1 will do
- Never add a dependency when stdlib does it
- Never build what the platform gives you for free
- Never over-engineer. The code you never wrote has zero bugs
- Trust-boundary validation, data-loss handling, security, and accessibility are NEVER on the chopping block

## What NOT to cut

- Validation
- Error handling
- Security checks
- Accessibility
- Type safety

## Examples

### Bad (over-engineered)
\`\`\`typescript
class DatePickerService {
  private dateValidator: DateValidator;
  private timezoneHandler: TimezoneHandler;
  
  constructor(config: DatePickerConfig) {
    this.dateValidator = new DateValidator(config.validation);
    this.timezoneHandler = new TimezoneHandler(config.timezone);
  }
  
  async formatDate(date: Date): Promise<string> {
    const validated = await this.dateValidator.validate(date);
    const localized = await this.timezoneHandler.convert(validated);
    return localized.toISOString();
  }
}
\`\`\`

### Good (ponytail)
\`\`\`typescript
<input type="date">
\`\`\`

### Bad (over-engineered)
\`\`\`typescript
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
\`\`\`

### Good (ponytail)
\`\`\`typescript
// Use AbortController for cleanup, not debounce
const controller = new AbortController();
element.addEventListener('input', handler, { signal: controller.signal });
\`\`\`

## Mode Levels

- **lite**: Basic YAGNI checks, minimal rules
- **full**: Full ladder application, review on every change (DEFAULT)
- **ultra**: Maximum scrutiny, question every line
- **off**: Disable ponytail
`.trim()

// ============================================================
// Ponytail storage
// ============================================================

const PONYTAIL_DIR = join(homedir(), ".config", "devil-ai", "ponytail")
const RULES_FILE = join(PONYTAIL_DIR, "rules.md")
const CONFIG_FILE = join(PONYTAIL_DIR, "config.json")

interface PonytailConfig {
	defaultMode: "lite" | "full" | "ultra" | "off"
	enabled: boolean
}

const DEFAULT_CONFIG: PonytailConfig = {
	defaultMode: "full",
	enabled: true,
}

// ============================================================
// Ponytail detection & setup
// ============================================================

export async function checkPonytail(): Promise<PonytailCheckResult> {
	try {
		// Ponytail is always "installed" since it's built-in rules
		// But we check if config exists
		if (!existsSync(CONFIG_FILE)) {
			await setupPonytail()
		}
		return { installed: true, version: "1.0.0-devil-ai" }
	} catch (err) {
		return { installed: false, error: err instanceof Error ? err.message : "Unknown error" }
	}
}

export async function setupPonytail(): Promise<{ success: boolean; error?: string }> {
	try {
		if (!existsSync(PONYTAIL_DIR)) {
			mkdirSync(PONYTAIL_DIR, { recursive: true })
		}

		// Write rules file
		writeFileSync(RULES_FILE, PONYTAIL_RULES, "utf-8")

		// Write default config
		writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8")

		log.info("Ponytail setup completed")
		return { success: true }
	} catch (err) {
		log.error("Ponytail setup failed", err)
		return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
	}
}

// ============================================================
// Ponytail mode management
// ============================================================

export async function getPonytailMode(): Promise<"lite" | "full" | "ultra" | "off"> {
	try {
		if (!existsSync(CONFIG_FILE)) {
			return "full"
		}
		const config: PonytailConfig = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"))
		return config.defaultMode
	} catch {
		return "full"
	}
}

export async function setPonytailMode(
	mode: "lite" | "full" | "ultra" | "off",
): Promise<{ success: boolean; error?: string }> {
	try {
		const config: PonytailConfig = existsSync(CONFIG_FILE)
			? JSON.parse(readFileSync(CONFIG_FILE, "utf-8"))
			: { ...DEFAULT_CONFIG }

		config.defaultMode = mode
		writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")

		log.info(`Ponytail mode set to ${mode}`)
		return { success: true }
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
	}
}

// ============================================================
// Get rules for prompt injection
// ============================================================

export async function getPonytailRules(): Promise<string> {
	const mode = await getPonytailMode()

	if (mode === "off") {
		return ""
	}

	let rules = PONYTAIL_RULES

	// Add mode-specific instructions
	switch (mode) {
		case "lite":
			rules += "\n\n## Mode: LITE\nApply basic YAGNI. Don't overthink it."
			break
		case "full":
			rules += "\n\n## Mode: FULL\nApply the complete ladder. Review every change."
			break
		case "ultra":
			rules += "\n\n## Mode: ULTRA\nMaximum scrutiny. Question every single line. The bar is impossibly high."
			break
	}

	return rules
}

// ============================================================
// Check if ponytail is enabled
// ============================================================

export async function isPonytailEnabled(): Promise<boolean> {
	try {
		if (!existsSync(CONFIG_FILE)) {
			return true // Default enabled
		}
		const config: PonytailConfig = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"))
		return config.enabled
	} catch {
		return true
	}
}

// ============================================================
// Toggle ponytail
// ============================================================

export async function togglePonytail(): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
	try {
		const config: PonytailConfig = existsSync(CONFIG_FILE)
			? JSON.parse(readFileSync(CONFIG_FILE, "utf-8"))
			: { ...DEFAULT_CONFIG }

		config.enabled = !config.enabled
		writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")

		log.info(`Ponytail ${config.enabled ? "enabled" : "disabled"}`)
		return { success: true, enabled: config.enabled }
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
	}
}

// ============================================================
// Cleanup
// ============================================================

export function shutdownPonytail(): void {
	// No cleanup needed - ponytail is just rules
}
