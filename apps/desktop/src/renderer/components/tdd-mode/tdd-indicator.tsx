/**
 * TDD Mode Indicator — shows current TDD phase and test results.
 */
import { useAtomValue, useSetAtom } from "jotai"
import {
	disableTDDAtom,
	tddEnabledAtom,
	tddPhaseAtom,
	tddTestSummaryAtom,
} from "../../atoms/tdd-mode"


const PHASE_LABELS = {
	idle: "TDD Off",
	"writing-tests": "Writing Tests...",
	"tests-generated": "Tests Generated",
	implementing: "Implementing...",
	"running-tests": "Running Tests...",
	done: "All Tests Pass ✓",
}

const PHASE_COLORS = {
	idle: "text-muted-foreground",
	"writing-tests": "text-yellow-500",
	"tests-generated": "text-blue-500",
	implementing: "text-purple-500",
	"running-tests": "text-orange-500",
	done: "text-green-500",
}

export function TDDIndicator() {
	const enabled = useAtomValue(tddEnabledAtom)
	const phase = useAtomValue(tddPhaseAtom)
	const summary = useAtomValue(tddTestSummaryAtom)
	const disableTDD = useSetAtom(disableTDDAtom)

	if (!enabled) return null

	return (
		<div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
			{/* TDD badge */}
			<span className="text-xs font-bold text-primary">TDD</span>

			{/* Phase label */}
			<span className={`text-xs ${PHASE_COLORS[phase]}`}>
				{PHASE_LABELS[phase]}
			</span>

			{/* Test results */}
			{summary.totalTests > 0 && (
				<div className="flex items-center gap-1 text-xs">
					<span className="text-green-500">{summary.passCount}✓</span>
					{summary.failCount > 0 && (
						<span className="text-red-500">{summary.failCount}✗</span>
					)}
				</div>
			)}

			{/* Disable button */}
			<button
				type="button"
				onClick={disableTDD}
				className="ml-1 text-xs text-muted-foreground hover:text-foreground"
			>
				✕
			</button>
		</div>
	)
}
