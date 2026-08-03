/**
 * Session Report — structured export with actionable TODOs.
 */
import { useAtom } from "jotai"
import { useCallback, useState } from "react"
import { setReportFormatAtom, sessionReportAtom } from "../../atoms/session-report"
import type { SessionReport } from "../../atoms/session-report"
import { Button } from "@devil-ai/ui/components/button"

function formatReportMarkdown(report: SessionReport): string {
	const lines = [
		`# Session Report: ${report.title}`,
		"",
		`**Date:** ${new Date(report.createdAt).toLocaleDateString()}`,
		`**Duration:** ${Math.round(report.duration / 60)} minutes`,
		`**Model:** ${report.model}`,
		`**Agent:** ${report.agent}`,
		"",
		"## Accomplishments",
		...report.accomplishments.map((a) => `- ${a}`),
		"",
		"## Files Changed",
		...report.fileChanges.map(
			(f) => `- \`${f.path}\` (${f.action}, +${f.linesChanged} lines)`,
		),
		"",
		"## Follow-up TODOs",
		...report.todos.map((t) => `- [ ] [${t.priority}] ${t.text}`),
		"",
		"## Cost Breakdown",
		`- Total: $${report.cost.totalCost.toFixed(4)}`,
		`- Input tokens: ${report.cost.inputTokens.toLocaleString()}`,
		`- Output tokens: ${report.cost.outputTokens.toLocaleString()}`,
		`- Cache read: ${report.cost.cacheReadTokens.toLocaleString()}`,
		...Object.entries(report.cost.modelCosts).map(
			([model, cost]) => `  - ${model}: $${cost.toFixed(4)}`,
		),
	]

	return lines.join("\n")
}

export function SessionReportPanel({
	sessionId,
	report,
}: {
	sessionId: string
	report: SessionReport | null
}) {
	const [, setFormat] = useAtom(setReportFormatAtom)
	const [reportState] = useAtom(sessionReportAtom)
	const exportFormat = reportState.exportFormat
	const [copied, setCopied] = useState(false)

	const handleExport = useCallback(() => {
		if (!report) return

		if (exportFormat === "clipboard") {
			navigator.clipboard.writeText(formatReportMarkdown(report))
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
			return
		}

		const content =
			exportFormat === "markdown"
				? formatReportMarkdown(report)
				: JSON.stringify(report, null, 2)

		const blob = new Blob([content], {
			type: exportFormat === "markdown" ? "text/markdown" : "application/json",
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `session-report-${sessionId.slice(0, 8)}.${exportFormat === "markdown" ? "md" : "json"}`
		a.click()
		URL.revokeObjectURL(url)
	}, [report, exportFormat, sessionId])

	if (!report) return null

	return (
		<div className="rounded-lg border border-border bg-background p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="font-medium">Session Report</h3>
				<div className="flex gap-2">
					<select
						value={exportFormat}
 onChange={(e) =>
						setFormat(
							e.target.value as "markdown" | "json" | "clipboard",
						)
					}
						className="rounded border border-border bg-background px-2 py-1 text-xs"
					>
						<option value="markdown">Markdown</option>
						<option value="json">JSON</option>
						<option value="clipboard">Copy to Clipboard</option>
					</select>
					<Button variant="outline" size="sm" onClick={handleExport}>
						{copied ? "Copied!" : "Export"}
					</Button>
				</div>
			</div>

			{/* Summary */}
			<div className="mb-3 grid grid-cols-3 gap-3">
				<div className="rounded bg-muted/50 p-2 text-center">
					<p className="text-lg font-bold">{report.accomplishments.length}</p>
					<p className="text-xs text-muted-foreground">Tasks Done</p>
				</div>
				<div className="rounded bg-muted/50 p-2 text-center">
					<p className="text-lg font-bold">{report.fileChanges.length}</p>
					<p className="text-xs text-muted-foreground">Files Changed</p>
				</div>
				<div className="rounded bg-muted/50 p-2 text-center">
					<p className="text-lg font-bold">{report.todos.length}</p>
					<p className="text-xs text-muted-foreground">TODOs Found</p>
				</div>
			</div>

			{/* TODOs */}
			{report.todos.length > 0 && (
				<div>
					<h4 className="mb-2 text-sm font-medium">Follow-up TODOs</h4>
					<div className="space-y-1">
						{report.todos.map((todo, i) => (
							<div
								key={i}
								className="flex items-start gap-2 rounded bg-muted/30 px-2 py-1 text-sm"
							>
								<span
									className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
										todo.priority === "high"
											? "bg-red-500"
											: todo.priority === "medium"
												? "bg-yellow-500"
												: "bg-green-500"
									}`}
								/>
								<span>{todo.text}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
