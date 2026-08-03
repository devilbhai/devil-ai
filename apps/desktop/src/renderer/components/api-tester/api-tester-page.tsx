/**
 * API Tester page — Built-in REST API testing tool.
 */

import { useCallback, useState } from "react"
import { SendIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Button } from "@devil-ai/ui/components/button"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"

interface ApiRequest {
	id: string
	method: string
	url: string
	headers: Record<string, string>
	body: string
}

interface ApiResponse {
	status: number
	statusText: string
	headers: Record<string, string>
	body: string
	time: number
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
const METHOD_COLORS: Record<string, string> = {
	GET: "bg-green-500/10 text-green-500",
	POST: "bg-blue-500/10 text-blue-500",
	PUT: "bg-orange-500/10 text-orange-500",
	PATCH: "bg-yellow-500/10 text-yellow-500",
	DELETE: "bg-red-500/10 text-red-500",
	HEAD: "bg-purple-500/10 text-purple-500",
	OPTIONS: "bg-gray-500/10 text-gray-500",
}

export function ApiTesterPage() {
	const [requests, setRequests] = useState<ApiRequest[]>([
		{ id: "1", method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1", headers: {}, body: "" },
	])
	const [activeRequestId, setActiveRequestId] = useState("1")
	const [response, setResponse] = useState<ApiResponse | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [activeTab, setActiveTab] = useState<"body" | "headers" | "response">("body")

	const activeRequest = requests.find((r) => r.id === activeRequestId)

	const handleAddRequest = useCallback(() => {
		const id = String(Date.now())
		setRequests((prev) => [...prev, { id, method: "GET", url: "", headers: {}, body: "" }])
		setActiveRequestId(id)
	}, [])

	const handleDeleteRequest = useCallback(
		(id: string) => {
			setRequests((prev) => prev.filter((r) => r.id !== id))
			if (activeRequestId === id) {
				setActiveRequestId(requests[0]?.id ?? "")
			}
		},
		[activeRequestId, requests],
	)

	const handleUpdateRequest = useCallback(
		(id: string, updates: Partial<ApiRequest>) => {
			setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
		},
		[],
	)

	const handleSend = useCallback(async () => {
		if (!activeRequest) return
		setIsLoading(true)
		const startTime = Date.now()

		try {
			const headers: Record<string, string> = { ...activeRequest.headers }
			if (activeRequest.body && !headers["Content-Type"]) {
				headers["Content-Type"] = "application/json"
			}

			const res = await fetch(activeRequest.url, {
				method: activeRequest.method,
				headers,
				body: ["POST", "PUT", "PATCH"].includes(activeRequest.method) ? activeRequest.body : undefined,
			})

			const body = await res.text()
			const responseHeaders: Record<string, string> = {}
			res.headers.forEach((value, key) => {
				responseHeaders[key] = value
			})

			setResponse({
				status: res.status,
				statusText: res.statusText,
				headers: responseHeaders,
				body,
				time: Date.now() - startTime,
			})
		} catch (err) {
			setResponse({
				status: 0,
				statusText: "Error",
				headers: {},
				body: String(err),
				time: Date.now() - startTime,
			})
		} finally {
			setIsLoading(false)
		}
	}, [activeRequest])

	return (
		<div className="flex h-full">
			{/* Sidebar — Request list */}
			<div className="flex w-64 flex-col border-r">
				<div className="flex items-center justify-between p-4">
					<h2 className="text-lg font-semibold">API Tester</h2>
					<Button size="sm" onClick={handleAddRequest} aria-label="New request">
						<PlusIcon className="size-4" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{requests.map((req) => (
						<div
							key={req.id}
							className={`cursor-pointer border-b px-3 py-2 transition-colors hover:bg-muted/50 ${
								activeRequestId === req.id ? "bg-muted" : ""
							}`}
							onClick={() => setActiveRequestId(req.id)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Badge className={`text-[10px] ${METHOD_COLORS[req.method]}`}>{req.method}</Badge>
									<span className="truncate text-xs">{req.url || "No URL"}</span>
								</div>
								<button
									className="rounded p-0.5 hover:bg-destructive/20"
									onClick={(e) => { e.stopPropagation(); handleDeleteRequest(req.id) }}
								>
									<TrashIcon className="size-3 text-destructive" />
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Main — Request/Response */}
			<div className="flex flex-1 flex-col">
				{/* URL bar */}
				<div className="border-b p-4">
					<div className="flex gap-2">
						<select
							value={activeRequest?.method ?? "GET"}
							onChange={(e) => activeRequest && handleUpdateRequest(activeRequest.id, { method: e.target.value })}
							className="rounded-md border bg-background px-3 py-2 text-sm font-medium"
						>
							{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
						</select>
						<Input
							value={activeRequest?.url ?? ""}
							onChange={(e) => activeRequest && handleUpdateRequest(activeRequest.id, { url: e.target.value })}
							placeholder="https://api.example.com/endpoint"
							className="flex-1 font-mono text-sm"
							onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
						/>
						<Button onClick={handleSend} disabled={isLoading || !activeRequest}>
							<SendIcon className="mr-1 size-4" />
							Send
						</Button>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex border-b">
					{(["body", "headers", "response"] as const).map((tab) => (
						<button
							key={tab}
							className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
								activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab(tab)}
						>
							{tab}
						</button>
					))}
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4">
					{activeTab === "body" && (
						<textarea
							value={activeRequest?.body ?? ""}
							onChange={(e) => activeRequest && handleUpdateRequest(activeRequest.id, { body: e.target.value })}
							className="h-full min-h-[200px] w-full rounded-md border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							placeholder='{"key": "value"}'
						/>
					)}

					{activeTab === "headers" && (
						<div className="space-y-2">
							{Object.entries(activeRequest?.headers ?? {}).map(([key, value]) => (
								<div key={key} className="flex gap-2">
									<Input value={key} className="flex-1" placeholder="Header name" />
									<Input value={value} className="flex-1" placeholder="Value" />
								</div>
							))}
							<Button size="sm" variant="outline" onClick={() => {
								if (activeRequest) {
									handleUpdateRequest(activeRequest.id, {
										headers: { ...activeRequest.headers, "": "" },
									})
								}
							}}>
								<PlusIcon className="mr-1 size-3" />
								Add Header
							</Button>
						</div>
					)}

					{activeTab === "response" && response && (
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<Badge className={response.status >= 200 && response.status < 300 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
									{response.status} {response.statusText}
								</Badge>
								<span className="text-xs text-muted-foreground">{response.time}ms</span>
							</div>
							<div className="rounded-md border bg-muted/30 p-3 font-mono text-xs">
								<pre className="whitespace-pre-wrap">{response.body}</pre>
							</div>
						</div>
					)}

					{activeTab === "response" && !response && (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							<p>Send a request to see the response</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
