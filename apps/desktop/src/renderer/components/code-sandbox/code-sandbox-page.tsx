/**
 * Code Execution Sandbox page — Safely run AI-generated code.
 * 
 * Uses child_process to execute code in a sandboxed environment.
 */

import { useCallback, useState } from "react"
import { PlayIcon, SquareIcon, CopyIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Badge } from "@devil-ai/ui/components/badge"

interface ExecutionResult {
	stdout: string
	stderr: string
	exitCode: number
	duration: number
}

const LANGUAGES = [
	{ id: "javascript", label: "JavaScript", ext: ".js" },
	{ id: "python", label: "Python", ext: ".py" },
	{ id: "bash", label: "Bash", ext: ".sh" },
	{ id: "typescript", label: "TypeScript", ext: ".ts" },
]

export function CodeSandboxPage() {
	const [language, setLanguage] = useState("javascript")
	const [code, setCode] = useState('console.log("Hello, Devil AI!")')
	const [result, setResult] = useState<ExecutionResult | null>(null)
	const [isRunning, setIsRunning] = useState(false)

	const handleRun = useCallback(async () => {
		setIsRunning(true)
		const startTime = Date.now()

		try {
			const executionResult = await window.devilAi.sandbox.execute(code, language)
			setResult(executionResult)
		} catch (err) {
			setResult({
				stdout: "",
				stderr: String(err),
				exitCode: 1,
				duration: Date.now() - startTime,
			})
		} finally {
			setIsRunning(false)
		}
	}, [code, language])

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(code)
	}, [code])

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center justify-between border-b p-3">
				<div className="flex items-center gap-3">
					<select
						value={language}
						onChange={(e) => setLanguage(e.target.value)}
						className="rounded-md border bg-background px-3 py-1.5 text-sm"
					>
						{LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
					</select>
					<Badge variant="outline">Sandbox</Badge>
				</div>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" onClick={handleCopy}>
						<CopyIcon className="mr-1 size-3" />
						Copy
					</Button>
					<Button size="sm" onClick={handleRun} disabled={isRunning}>
						{isRunning ? <SquareIcon className="mr-1 size-3" /> : <PlayIcon className="mr-1 size-3" />}
						{isRunning ? "Running..." : "Run"}
					</Button>
				</div>
			</div>

			{/* Code editor + Output */}
			<div className="flex flex-1 overflow-hidden">
				{/* Code editor */}
				<div className="flex-1 border-r">
					<textarea
						value={code}
						onChange={(e) => setCode(e.target.value)}
						className="h-full w-full resize-none bg-background p-4 font-mono text-sm focus:outline-none"
						spellCheck={false}
					/>
				</div>

				{/* Output */}
				<div className="flex w-1/2 flex-col">
					<div className="border-b px-4 py-2 text-sm font-medium text-muted-foreground">Output</div>
					<div className="flex-1 overflow-auto bg-black p-4 font-mono text-sm text-green-400">
						{result ? (
							<>
								{result.stdout && <pre className="whitespace-pre-wrap">{result.stdout}</pre>}
								{result.stderr && <pre className="whitespace-pre-wrap text-red-400">{result.stderr}</pre>}
								<div className="mt-2 text-xs text-muted-foreground">
									Exit code: {result.exitCode} | Duration: {result.duration}ms
								</div>
							</>
						) : (
							<span className="text-muted-foreground">Click Run to execute code</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
