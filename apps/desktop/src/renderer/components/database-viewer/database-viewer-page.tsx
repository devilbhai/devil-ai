/**
 * Database Viewer page — Browse SQLite database tables and data.
 */

import { useState, useCallback } from "react"
import { DatabaseIcon, TableIcon, PlayIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"

interface TableInfo {
	name: string
	columns: { name: string; type: string }[]
	rowCount: number
}

interface QueryResult {
	columns: string[]
	rows: unknown[][]
	error?: string
}

const SAMPLE_TABLES: TableInfo[] = [
	{ name: "notes", columns: [{ name: "id", type: "text" }, { name: "title", type: "text" }, { name: "content", type: "text" }], rowCount: 0 },
	{ name: "prompts", columns: [{ name: "id", type: "text" }, { name: "title", type: "text" }, { name: "content", type: "text" }], rowCount: 0 },
	{ name: "snippets", columns: [{ name: "id", type: "text" }, { name: "title", type: "text" }, { name: "language", type: "text" }], rowCount: 0 },
	{ name: "session_templates", columns: [{ name: "id", type: "text" }, { name: "name", type: "text" }, { name: "config", type: "text" }], rowCount: 0 },
	{ name: "keyboard_shortcuts", columns: [{ name: "id", type: "text" }, { name: "action", type: "text" }, { name: "shortcut", type: "text" }], rowCount: 0 },
	{ name: "automations", columns: [{ name: "id", type: "text" }, { name: "run_count", type: "integer" }], rowCount: 0 },
	{ name: "user_preferences", columns: [{ name: "id", type: "text" }, { name: "key", type: "text" }, { name: "value", type: "text" }], rowCount: 0 },
	{ name: "agent_memories", columns: [{ name: "id", type: "text" }, { name: "summary", type: "text" }, { name: "content", type: "text" }], rowCount: 0 },
]

export function DatabaseViewerPage() {
	const [tables] = useState<TableInfo[]>(SAMPLE_TABLES)
	const [selectedTable, setSelectedTable] = useState<string | null>(null)
	const [query, setQuery] = useState("SELECT * FROM notes LIMIT 50")
	const [result, setResult] = useState<QueryResult | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const handleExecuteQuery = useCallback(async () => {
		if (!query.trim()) return
		setIsLoading(true)
		try {
			// In production this would call the backend to execute the query
			// For now we show a placeholder
			setResult({
				columns: ["info"],
				rows: [["Database viewer requires backend integration. Use the SQLite CLI for direct queries."]],
			})
		} catch (err) {
			setResult({ columns: ["error"], rows: [[String(err)]], error: String(err) })
		} finally {
			setIsLoading(false)
		}
	}, [query])

	const handleTableSelect = useCallback((tableName: string) => {
		setSelectedTable(tableName)
		setQuery(`SELECT * FROM ${tableName} LIMIT 50`)
	}, [])

	return (
		<div className="flex h-full">
			{/* Sidebar — Table list */}
			<div className="flex w-64 flex-col border-r">
				<div className="p-4">
					<h2 className="text-lg font-semibold">Database Viewer</h2>
					<p className="mt-1 text-xs text-muted-devil-ai">devil-ai.db</p>
				</div>

				<div className="flex-1 overflow-y-auto">
					{tables.map((table) => (
						<div
							key={table.name}
							className={`cursor-pointer border-b px-4 py-2 transition-colors hover:bg-muted/50 ${
								selectedTable === table.name ? "bg-muted" : ""
							}`}
							onClick={() => handleTableSelect(table.name)}
						>
							<div className="flex items-center gap-2">
								<TableIcon className="size-4 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">{table.name}</p>
									<p className="text-[10px] text-muted-foreground">{table.columns.length} columns</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Main — Query editor + results */}
			<div className="flex flex-1 flex-col">
				<div className="border-b p-4">
					<div className="flex gap-2">
						<textarea
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="flex-1 rounded-md border bg-background p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							rows={3}
							placeholder="Enter SQL query..."
						/>
						<div className="flex flex-col gap-2">
							<Button size="sm" onClick={handleExecuteQuery} disabled={isLoading}>
								<PlayIcon className="mr-1 size-3" />
								Run
							</Button>
							<Button size="sm" variant="outline" onClick={() => setResult(null)}>
								<RefreshCwIcon className="size-3" />
							</Button>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-4">
					{result ? (
						result.error ? (
							<div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
								{result.error}
							</div>
						) : (
							<table className="w-full border-collapse text-sm">
								<thead>
									<tr className="border-b">
										{result.columns.map((col) => (
											<th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">
												{col}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{result.rows.map((row, i) => (
										<tr key={i} className="border-b">
											{row.map((cell, j) => (
												<td key={j} className="px-3 py-2 font-mono text-xs">
													{cell === null ? <span className="text-muted-foreground">NULL</span> : String(cell)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						)
					) : (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							<div className="text-center">
								<DatabaseIcon className="mx-auto mb-2 size-12 opacity-50" />
								<p>Run a query to see results</p>
								<p className="mt-1 text-xs">Select a table or write custom SQL</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
