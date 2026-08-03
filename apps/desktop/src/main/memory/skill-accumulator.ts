/**
 * Skill Accumulator — extracts reusable patterns from completed tasks.
 *
 * Analyzes AI responses for code patterns, solutions, and best practices.
 * Stores them as learned_skills for future reference.
 */

import { createLogger } from "../logger"
import { addLearnedSkill } from "./memory-store"

const log = createLogger("skill-accumulator")

// ============================================================
// Pattern detection
// ============================================================

interface DetectedPattern {
	category: string
	name: string
	description: string
	pattern: string
	example?: string
}

/**
 * Detect code patterns in AI responses.
 * Returns an array of detected skills/patterns.
 */
function detectPatterns(response: string): DetectedPattern[] {
	const patterns: DetectedPattern[] = []

	// React patterns
	if (/\b(useState|useEffect|useCallback|useMemo|useRef|useContext)\b/.test(response)) {
		patterns.push({
			category: "react",
			name: "React Hooks",
			description: "React hooks usage pattern",
			pattern: extractCodeBlock(response, "react") ?? "React hooks pattern",
		})
	}

	// API/Server patterns
	if (/\b(fetch|axios|express|fastify|hono|bun)\b/i.test(response)) {
		patterns.push({
			category: "api",
			name: "API Integration",
			description: "API call or server pattern",
			pattern: extractCodeBlock(response, "api") ?? "API pattern",
		})
	}

	// Database patterns
	if (/\b(prisma|drizzle|sqlite|postgres|mysql|mongo|sql)\b/i.test(response)) {
		patterns.push({
			category: "database",
			name: "Database Operation",
			description: "Database query or schema pattern",
			pattern: extractCodeBlock(response, "database") ?? "Database pattern",
		})
	}

	// TypeScript patterns
	if (/\b(interface|type|enum|generic|extends|implements)\b/.test(response)) {
		patterns.push({
			category: "typescript",
			name: "TypeScript Pattern",
			description: "TypeScript type definition or pattern",
			pattern: extractCodeBlock(response, "typescript") ?? "TypeScript pattern",
		})
	}

	// Error handling patterns
	if (/\b(try\s*\{|catch\s*\(|\.catch\(|Error\(|throw)\b/.test(response)) {
		patterns.push({
			category: "error-handling",
			name: "Error Handling",
			description: "Error handling pattern",
			pattern: extractCodeBlock(response, "error") ?? "Error handling pattern",
		})
	}

	// CSS patterns
	if (/\b(tailwind|flexbox|grid|media query|@apply|className)\b/i.test(response)) {
		patterns.push({
			category: "css",
			name: "CSS Pattern",
			description: "CSS styling pattern",
			pattern: extractCodeBlock(response, "css") ?? "CSS pattern",
		})
	}

	// Git patterns
	if (/\b(git\s+(commit|push|pull|merge|rebase|branch|checkout|stash))\b/.test(response)) {
		patterns.push({
			category: "git",
			name: "Git Operation",
			description: "Git command or workflow pattern",
			pattern: extractCodeBlock(response, "git") ?? "Git pattern",
		})
	}

	// Testing patterns
	if (/\b(describe|it\(|test\(|expect|assert|jest|vitest|mocha|bun\.test)\b/.test(response)) {
		patterns.push({
			category: "testing",
			name: "Testing Pattern",
			description: "Test writing pattern",
			pattern: extractCodeBlock(response, "test") ?? "Testing pattern",
		})
	}

	// Security patterns
	if (/\b(sanitize|escape|encrypt|hash|bcrypt|jwt|oauth|csrf|xss|helmet)\b/i.test(response)) {
		patterns.push({
			category: "security",
			name: "Security Pattern",
			description: "Security implementation pattern",
			pattern: extractCodeBlock(response, "security") ?? "Security pattern",
		})
	}

	return patterns
}

/**
 * Extract the most relevant code block from a response.
 */
function extractCodeBlock(response: string, _hint: string): string | undefined {
	const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
	let match
	let bestMatch = ""

	while ((match = codeBlockRegex.exec(response)) !== null) {
		const code = match[1].trim()
		if (code.length > bestMatch.length && code.length < 2000) {
			bestMatch = code
		}
	}

	return bestMatch || undefined
}

// ============================================================
// Public API
// ============================================================

export interface AccumulateSkillsOptions {
	sessionId?: string
	projectPath?: string
	aiResponse: string
	userPrompt?: string
}

/**
 * Analyze an AI response and accumulate any detected skills/patterns.
 * Returns the number of new skills detected.
 */
export async function accumulateSkills(options: AccumulateSkillsOptions): Promise<number> {
	const patterns = detectPatterns(options.aiResponse)

	if (patterns.length === 0) return 0

	let newSkillCount = 0
	for (const pattern of patterns) {
		try {
			await addLearnedSkill({
				category: pattern.category,
				name: pattern.name,
				description: pattern.description,
				pattern: pattern.pattern,
				example: pattern.example,
				sessionId: options.sessionId,
			})
			newSkillCount++
		} catch (err) {
			log.error("Failed to add learned skill", err)
		}
	}

	if (newSkillCount > 0) {
		log.info("Accumulated new skills", {
			count: newSkillCount,
			sessionId: options.sessionId,
			categories: patterns.map((p) => p.category).join(", "),
		})
	}

	return newSkillCount
}

/**
 * Quick check if a response contains notable patterns worth capturing.
 */
export function hasNotablePatterns(response: string): boolean {
	return detectPatterns(response).length > 0
}
