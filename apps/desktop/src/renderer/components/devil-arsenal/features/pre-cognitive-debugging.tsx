import { useAtom, useAtomValue } from "jotai"
import { HistoryIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react"
import { preCognitiveDebuggingAtom, codegraphEnabledAtom } from "../../../atoms/feature-flags"
import { useProjectList } from "../../../hooks/use-agents"
import { useState, useCallback } from "react"
import {
	analyzeCode,
	getAnalysisSummary,
	type AnalysisResult,
} from "../../../services/pre-cognitive-debugger"

export function PreCognitiveDebugging() {
	const [enabled, setEnabled] = useAtom(preCognitiveDebuggingAtom)
	const codegraphEnabled = useAtomValue(codegraphEnabledAtom)
	const projects = useProjectList()
	const [lastResult, setLastResult] = useState<AnalysisResult | null>(null)
	const [isAnalyzing, setIsAnalyzing] = useState(false)

	const activeProjects = projects.length

	const handleAnalyze = useCallback(async () => {
		if (!enabled) return
		setIsAnalyzing(true)

		const sampleCode = `
			const data = JSON.parse(input);
			const result = data.value.nested.property;
			try { await fetch(url); } catch {}
			const x = value as any;
		`

		await new Promise((resolve) => setTimeout(resolve, 500))
		const result = analyzeCode(sampleCode, "sample.tsx")
		setLastResult(result)
		setIsAnalyzing(false)
	}, [enabled])

	return (
		<div
			className={`group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 ${
				enabled
					? "border-blue-500/30 bg-blue-500/5"
					: "border-border bg-card hover:bg-accent"
			}`}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div
						className={`shrink-0 flex items-center justify-center size-9 rounded-lg transition-colors ${
							enabled ? "bg-blue-500/20 text-blue-500" : "bg-muted text-muted-foreground"
						}`}
					>
						<HistoryIcon className="size-4.5" />
					</div>
					<div>
						<h4 className="font-medium text-sm text-foreground">Pre-Cognitive AST</h4>
						<p className="text-xs text-muted-foreground">
							Simulate futures & detect errors before save.
						</p>
					</div>
				</div>
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						className="sr-only peer"
						checked={enabled}
						onChange={(e) => setEnabled(e.target.checked)}
					/>
					<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
				</label>
			</div>

			{enabled && (
				<div className="p-3 rounded-lg bg-muted border border-blue-500/20 text-xs font-mono text-blue-500 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center justify-between">
						<span className="opacity-70 text-muted-foreground">Status: {isAnalyzing ? "Analyzing..." : "Hologram Active"}</span>
						<span className="flex size-2 rounded-full bg-blue-500 animate-pulse" />
					</div>
					<div className="text-muted-foreground flex flex-col gap-1 mt-1">
						<div className="flex justify-between">
							<span>CodeGraph Engine:</span>
							<span className={codegraphEnabled ? "text-emerald-500" : "text-muted-foreground"}>
								{codegraphEnabled ? "Online" : "Offline"}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Active Projects:</span>
							<span className="text-blue-500">{activeProjects}</span>
						</div>
					</div>

					{lastResult && (
						<div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
							<div className="flex items-center gap-2 mb-1">
								{lastResult.score >= 80 ? (
									<CheckCircleIcon className="size-3.5 text-emerald-500" />
								) : (
									<AlertTriangleIcon className="size-3.5 text-amber-500" />
								)}
								<span className="text-foreground">{getAnalysisSummary(lastResult)}</span>
							</div>
							{lastResult.issues.length > 0 && (
								<div className="mt-1 text-muted-foreground max-h-20 overflow-y-auto">
									{lastResult.issues.slice(0, 5).map((issue) => (
										<div key={issue.id} className="flex items-start gap-1">
											<span className={issue.severity === "error" ? "text-red-500" : issue.severity === "warning" ? "text-amber-500" : "text-blue-500"}>
												{issue.severity === "error" ? "✗" : issue.severity === "warning" ? "⚠" : "ℹ"}
											</span>
											<span className="truncate">{issue.message}</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					<button
						type="button"
						onClick={handleAnalyze}
						disabled={isAnalyzing}
						className="mt-2 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
					>
						{isAnalyzing ? "Analyzing..." : "Run Analysis"}
					</button>
				</div>
			)}
		</div>
	)
}
