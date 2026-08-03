import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { ActivityIcon, PlayIcon, SquareIcon, CpuIcon, HardDriveIcon, WifiIcon } from "lucide-react"
import { reactScanStorageAtom, toggleReactScanAtom } from "../../../atoms/react-scan"
import { useState, useEffect, useCallback } from "react"
import {
	profilerStatusAtom,
	startProfiling,
	stopProfiling,
	getCurrentMetrics,
	formatBytes,
	formatMs,
} from "../../../services/performance-profiler"
import type { PerformanceMetrics } from "../../../services/performance-profiler"

export function HellfireProfiler() {
	const enabled = useAtomValue(reactScanStorageAtom)
	const toggleReactScan = useSetAtom(toggleReactScanAtom)
	const [profilerStatus, setProfilerStatus] = useAtom(profilerStatusAtom)
	const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

	const handleToggleProfiler = useCallback(() => {
		if (profilerStatus === "profiling") {
			const finalMetrics = stopProfiling()
			setMetrics(finalMetrics)
			setProfilerStatus("idle")
		} else {
			startProfiling()
			setProfilerStatus("profiling")
			setMetrics(null)
		}
	}, [profilerStatus, setProfilerStatus])

	useEffect(() => {
		if (profilerStatus !== "profiling") return

		const interval = setInterval(() => {
			setMetrics(getCurrentMetrics())
		}, 2000)

		return () => clearInterval(interval)
	}, [profilerStatus])

	return (
		<div
			className={`group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 ${
				enabled
					? "border-blue-500/30 bg-blue-500/5"
					: "border-border bg-card hover:bg-accent"
			}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<div
						className={`shrink-0 flex items-center justify-center size-9 rounded-lg transition-colors ${
							enabled ? "bg-blue-500/20 text-blue-500" : "bg-muted text-muted-foreground group-hover:text-foreground"
						}`}
					>
						<ActivityIcon className="size-4.5" />
					</div>
					<div>
						<h4
							className={`font-medium text-sm transition-colors ${enabled ? "text-blue-500" : "text-foreground"}`}
						>
							Performance Profiler
						</h4>
						<p className="text-xs text-muted-foreground mt-0.5">
							React renders + CPU, memory, and network metrics.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleToggleProfiler}
						className={`shrink-0 flex items-center justify-center size-8 rounded-full transition-all ${
							profilerStatus === "profiling"
								? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]"
								: "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
						}`}
						title={profilerStatus === "profiling" ? "Stop profiling" : "Start profiling"}
					>
						{profilerStatus === "profiling" ? (
							<SquareIcon className="size-3.5 fill-current" />
						) : (
							<PlayIcon className="size-4 fill-current ml-0.5" />
						)}
					</button>
					<button
						type="button"
						onClick={() => toggleReactScan()}
						className={`shrink-0 flex items-center justify-center size-8 rounded-full transition-all ${
							enabled
								? "bg-blue-500 text-white shadow-[0_0_10px_rgba(5,189,245,0.3)]"
								: "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
						}`}
						title={enabled ? "Disable React Scan" : "Enable React Scan"}
					>
						{enabled ? (
							<SquareIcon className="size-3.5 fill-current" />
						) : (
							<PlayIcon className="size-4 fill-current ml-0.5" />
						)}
					</button>
				</div>
			</div>

			{profilerStatus === "profiling" && (
				<div className="mt-2 p-3 rounded-lg bg-muted border border-amber-500/20 flex flex-col gap-2">
					<div className="flex items-center gap-2 text-xs text-amber-500">
						<span className="relative flex size-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
							<span className="relative inline-flex rounded-full size-2 bg-amber-500" />
						</span>
						Profiling active... collecting metrics.
					</div>

					{metrics && (
						<div className="grid grid-cols-3 gap-2 mt-2">
							<div className="flex flex-col items-center p-2 rounded-md bg-background">
								<CpuIcon className="size-3.5 text-blue-500 mb-1" />
								<span className="text-[10px] text-muted-foreground">Memory</span>
								<span className="text-xs font-mono text-foreground">
									{formatBytes(metrics.memory.usedJSHeapSize)}
								</span>
								<span className="text-[10px] text-muted-foreground">
									{metrics.memory.usedPercent}%
								</span>
							</div>
							<div className="flex flex-col items-center p-2 rounded-md bg-background">
								<HardDriveIcon className="size-3.5 text-emerald-500 mb-1" />
								<span className="text-[10px] text-muted-foreground">Requests</span>
								<span className="text-xs font-mono text-foreground">
									{metrics.network.totalRequests}
								</span>
								<span className="text-[10px] text-muted-foreground">
									{formatBytes(metrics.network.totalTransferSize)}
								</span>
							</div>
							<div className="flex flex-col items-center p-2 rounded-md bg-background">
								<WifiIcon className="size-3.5 text-purple-500 mb-1" />
								<span className="text-[10px] text-muted-foreground">Avg Response</span>
								<span className="text-xs font-mono text-foreground">
									{formatMs(metrics.network.avgResponseTime)}
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{enabled && profilerStatus !== "profiling" && (
				<div className="mt-2 p-3 rounded-lg bg-muted border border-blue-500/20 flex flex-col gap-2">
					<div className="flex items-center gap-2 text-xs text-blue-500">
						<span className="relative flex size-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
							<span className="relative inline-flex rounded-full size-2 bg-blue-500" />
						</span>
						React Scan active... watching for re-renders.
					</div>
					<div className="text-[11px] text-muted-foreground">
						Open Chrome DevTools Console to see live render metrics and component highlights on the screen.
					</div>
				</div>
			)}

			{metrics && profilerStatus === "idle" && (
				<div className="mt-2 p-3 rounded-lg bg-muted border border-border">
					<div className="text-[11px] text-muted-foreground font-medium mb-2">Last Profile Results</div>
					<div className="grid grid-cols-3 gap-2">
						<div className="flex flex-col items-center p-2 rounded-md bg-background">
							<CpuIcon className="size-3.5 text-blue-500 mb-1" />
							<span className="text-xs font-mono text-foreground">
								{formatBytes(metrics.memory.usedJSHeapSize)}
							</span>
							<span className="text-[10px] text-muted-foreground">Peak Memory</span>
						</div>
						<div className="flex flex-col items-center p-2 rounded-md bg-background">
							<HardDriveIcon className="size-3.5 text-emerald-500 mb-1" />
							<span className="text-xs font-mono text-foreground">
								{metrics.network.totalRequests}
							</span>
							<span className="text-[10px] text-muted-foreground">Total Requests</span>
						</div>
						<div className="flex flex-col items-center p-2 rounded-md bg-background">
							<WifiIcon className="size-3.5 text-purple-500 mb-1" />
							<span className="text-xs font-mono text-foreground">
								{formatMs(metrics.network.avgResponseTime)}
							</span>
							<span className="text-[10px] text-muted-foreground">Avg Latency</span>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
