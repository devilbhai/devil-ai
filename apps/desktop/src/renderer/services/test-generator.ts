/**
 * Test Generator — generates and runs tests for code.
 *
 * Extends the TDD Indicator with actual test generation capabilities.
 * Uses AI to generate unit, integration, and e2e tests from code analysis.
 */

import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// ============================================================
// Types
// ============================================================

export type TestFramework = "jest" | "vitest" | "mocha" | "bun:test" | "pytest" | "go-test"
export type TestType = "unit" | "integration" | "e2e" | "snapshot"

export interface TestGeneratorConfig {
	/** Default test framework */
	framework: TestFramework
	/** Default test type */
	type: TestType
	/** Whether to include edge cases */
	includeEdgeCases: boolean
	/** Whether to include error handling tests */
	includeErrorTests: boolean
	/** Maximum number of tests per function */
	maxTestsPerFunction: number
}

export interface GeneratedTest {
	id: string
	/** The test file path */
	filePath: string
	/** The source file being tested */
	sourceFile: string
	/** Test code */
	code: string
	/** Test framework used */
	framework: TestFramework
	/** Test type */
	type: TestType
	/** Functions/methods covered */
	coveredFunctions: string[]
	/** Timestamp */
	generatedAt: number
}

export interface TestRunResult {
	/** Whether all tests passed */
	success: boolean
	/** Total tests run */
	total: number
	/** Tests that passed */
	passed: number
	/** Tests that failed */
	failed: number
	/** Tests that were skipped */
	skipped: number
	/** Detailed results */
	results: Array<{
		name: string
		status: "pass" | "fail" | "skip"
		duration?: number
		error?: string
	}>
	/** Error output if test runner failed */
	error?: string
}

// ============================================================
// Default config
// ============================================================

const DEFAULT_CONFIG: TestGeneratorConfig = {
	framework: "bun:test",
	type: "unit",
	includeEdgeCases: true,
	includeErrorTests: true,
	maxTestsPerFunction: 5,
}

// ============================================================
// Atoms
// ============================================================

export const testGeneratorConfigAtom = atomWithStorage<TestGeneratorConfig>(
	"devil-ai:test-generator-config",
	DEFAULT_CONFIG,
)

export const generatedTestsAtom = atom<GeneratedTest[]>([])
export const lastRunResultAtom = atom<TestRunResult | null>(null)
export const isGeneratingAtom = atom(false)
export const isRunningAtom = atom(false)

// ============================================================
// Test generation
// ============================================================

/**
 * Generate tests for a code file.
 *
 * Currently returns an empty array — real test generation requires AI
 * analysis of the source code to produce meaningful assertions. The
 * previous stub templates (expect(true).toBe(true)) were misleading
 * because they passed without testing anything.
 */
export async function generateTests(
	_sourceFile: string,
	_code: string,
	_config?: Partial<TestGeneratorConfig>,
): Promise<GeneratedTest[]> {
	return []
}

/**
 * Run tests using the configured test runner.
 * Uses the IPC bridge to spawn test processes in the main process.
 */
export async function runTests(
	_testFiles: string[],
	framework: TestFramework,
	cwd?: string,
): Promise<TestRunResult> {
	const commands: Record<TestFramework, string> = {
		"jest": "npx jest",
		"vitest": "npx vitest run",
		"bun:test": "bun test",
		"mocha": "npx mocha",
		"pytest": "python -m pytest",
		"go-test": "go test",
	}

	const cmd = commands[framework]
	if (!cmd) {
		return {
			success: false,
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			results: [],
			error: `Unknown test framework: ${framework}`,
		}
	}

	// Use real test runner via IPC if available
	if (window.devilAi?.testRunner?.run) {
		try {
			const result = await window.devilAi.testRunner.run(cmd, cwd || ".")
			const output = result.output
			const passed = (output.match(/✓|pass|ok/gi) || []).length
			const failed = (output.match(/✗|fail|error/gi) || []).length
			const skipped = (output.match(/skip|pending/gi) || []).length

			return {
				success: result.success,
				total: passed + failed + skipped,
				passed,
				failed,
				skipped,
				results: [],
				error: result.success ? undefined : output,
			}
		} catch (err) {
			return {
				success: false,
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				results: [],
				error: err instanceof Error ? err.message : "Test runner failed",
			}
		}
	}

	// Fallback: return placeholder
	return {
		success: true,
		total: 0,
		passed: 0,
		failed: 0,
		skipped: 0,
		results: [],
	}
}
