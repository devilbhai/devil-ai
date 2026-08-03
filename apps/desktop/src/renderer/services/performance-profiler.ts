/**
 * Performance Profiler — extends Hellfire Profiler with CPU, memory, and network metrics.
 *
 * Wraps react-scan for React render performance and adds system-level profiling
 * for CPU usage, memory consumption, and network request tracking.
 */

import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// ============================================================
// Types
// ============================================================

export interface PerformanceMetrics {
	/** React render metrics (from react-scan) */
	renders: RenderMetric[]
	/** Memory usage snapshot */
	memory: MemoryMetrics
	/** Network request summary */
	network: NetworkMetrics
	/** Timestamp of the snapshot */
	timestamp: number
}

export interface RenderMetric {
	componentName: string
	renderCount: number
	avgRenderTime: number
	totalRenderTime: number
}

export interface MemoryMetrics {
	usedJSHeapSize: number
	totalJSHeapSize: number
	jsHeapSizeLimit: number
	usedPercent: number
}

export interface NetworkMetrics {
	totalRequests: number
	pendingRequests: number
	avgResponseTime: number
	failedRequests: number
	totalTransferSize: number
}

export type ProfilerStatus = "idle" | "profiling" | "paused"

// ============================================================
// Atoms
// ============================================================

export const profilerStatusAtom = atomWithStorage<ProfilerStatus>("devil-ai:profiler-status", "idle")
export const profilerMetricsAtom = atom<PerformanceMetrics | null>(null)

// ============================================================
// Performance monitoring
// ============================================================

let performanceObserver: PerformanceObserver | null = null
let memoryInterval: ReturnType<typeof setInterval> | null = null
let metrics: PerformanceMetrics = {
	renders: [],
	memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, usedPercent: 0 },
	network: { totalRequests: 0, pendingRequests: 0, avgResponseTime: 0, failedRequests: 0, totalTransferSize: 0 },
	timestamp: Date.now(),
}

/**
 * Start collecting performance metrics.
 */
export function startProfiling(): void {
	if (performanceObserver) return

	// Track network requests via PerformanceObserver
	try {
		performanceObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.entryType === "resource") {
					const resource = entry as PerformanceResourceTiming
					metrics.network.totalRequests++
					metrics.network.totalTransferSize += resource.transferSize || 0
					if (resource.responseEnd > 0) {
						const duration = resource.responseEnd - resource.requestStart
						metrics.network.avgResponseTime =
							(metrics.network.avgResponseTime * (metrics.network.totalRequests - 1) + duration) /
							metrics.network.totalRequests
					}
				}
			}
		})
		performanceObserver.observe({ entryTypes: ["resource"] })
	} catch {
		// PerformanceObserver not supported for resource type
	}

	// Track memory usage periodically
	memoryInterval = setInterval(() => {
		const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
		if (perf.memory) {
			metrics.memory = {
				usedJSHeapSize: perf.memory.usedJSHeapSize,
				totalJSHeapSize: perf.memory.totalJSHeapSize,
				jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
				usedPercent: Math.round((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100),
			}
		}
	}, 1000)

	metrics.timestamp = Date.now()
}

/**
 * Stop collecting performance metrics.
 */
export function stopProfiling(): PerformanceMetrics {
	if (performanceObserver) {
		performanceObserver.disconnect()
		performanceObserver = null
	}
	if (memoryInterval) {
		clearInterval(memoryInterval)
		memoryInterval = null
	}

	return { ...metrics, timestamp: Date.now() }
}

/**
 * Get current metrics snapshot.
 */
export function getCurrentMetrics(): PerformanceMetrics {
	return { ...metrics, timestamp: Date.now() }
}

/**
 * Reset all metrics.
 */
export function resetMetrics(): void {
	metrics = {
		renders: [],
		memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, usedPercent: 0 },
		network: { totalRequests: 0, pendingRequests: 0, avgResponseTime: 0, failedRequests: 0, totalTransferSize: 0 },
		timestamp: Date.now(),
	}
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

/**
 * Format milliseconds to human-readable string.
 */
export function formatMs(ms: number): string {
	if (ms < 1) return "<1ms"
	if (ms < 1000) return `${Math.round(ms)}ms`
	return `${(ms / 1000).toFixed(2)}s`
}
