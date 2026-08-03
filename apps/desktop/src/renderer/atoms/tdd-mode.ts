/**
 * TDD Mode atoms — test-driven development workflow for agent sessions.
 */
import { atom } from "jotai"

export type TDDPhase = "idle" | "writing-tests" | "tests-generated" | "implementing" | "running-tests" | "done"

export interface TDDState {
	enabled: boolean
	phase: TDDPhase
	generatedTests: string[]
	testResults: TestResult[]
	passCount: number
	failCount: number
	totalTests: number
}

export interface TestResult {
	name: string
	status: "pass" | "fail" | "skip"
	duration?: number
	error?: string
}

export const tddStateAtom = atom<TDDState>({
	enabled: false,
	phase: "idle",
	generatedTests: [],
	testResults: [],
	passCount: 0,
	failCount: 0,
	totalTests: 0,
})

export const tddEnabledAtom = atom((get) => get(tddStateAtom).enabled)
export const tddPhaseAtom = atom((get) => get(tddStateAtom).phase)
export const tddTestSummaryAtom = atom((get) => {
	const { passCount, failCount, totalTests } = get(tddStateAtom)
	return { passCount, failCount, totalTests }
})

export const enableTDDAtom = atom(null, (_get, set) => {
	set(tddStateAtom, (prev) => ({
		...prev,
		enabled: true,
		phase: "writing-tests",
	}))
})

export const disableTDDAtom = atom(null, (_get, set) => {
	set(tddStateAtom, {
		enabled: false,
		phase: "idle",
		generatedTests: [],
		testResults: [],
		passCount: 0,
		failCount: 0,
		totalTests: 0,
	})
})

export const setTDDPhaseAtom = atom(
	null,
	(_get, set, phase: TDDPhase) => {
		set(tddStateAtom, (prev) => ({ ...prev, phase }))
	},
)

export const updateTDDResultsAtom = atom(
	null,
	(_get, set, results: TestResult[]) => {
		const passCount = results.filter((r) => r.status === "pass").length
		const failCount = results.filter((r) => r.status === "fail").length
		set(tddStateAtom, (prev) => ({
			...prev,
			testResults: results,
			passCount,
			failCount,
			totalTests: results.length,
		}))
	},
)

/**
 * Generate tests using the test-generator service and update TDD state.
 * This bridges test-generator.ts with TDD mode atoms.
 */
export const generateTDDTestsAtom = atom(
	null,
	async (get, set, { sourceFile, code }: { sourceFile: string; code: string }) => {
		const { generateTests } = await import("../services/test-generator")
		const config = get(
			(await import("../services/test-generator")).testGeneratorConfigAtom,
		)
		set(tddStateAtom, (prev) => ({ ...prev, phase: "writing-tests" }))

		try {
			const generated = await generateTests(sourceFile, code, config)
			set(tddStateAtom, (prev) => ({
				...prev,
				phase: "tests-generated",
				generatedTests: generated.map((t) => t.code),
			}))
		} catch {
			set(tddStateAtom, (prev) => ({ ...prev, phase: "idle" }))
		}
	},
)
