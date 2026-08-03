/**
 * Lightweight feature telemetry logger.
 * Tracks toggle events and feature usage. Persisted in localStorage.
 * No external network calls — purely local for debugging and analytics.
 */

import { createLogger } from "./logger"

const log = createLogger("feature-telemetry")

export type FeatureEvent = {
	id: string
	featureId: string
	action: "enabled" | "disabled" | "added" | "removed"
	timestamp: number
}

const STORAGE_KEY = "devil-ai:feature-telemetry"

function getAll(): FeatureEvent[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? JSON.parse(raw) : []
	} catch {
		return []
	}
}

function saveAll(events: FeatureEvent[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-200)))
	} catch {
		// storage full or unavailable
	}
}

export function logFeatureEvent(featureId: string, action: FeatureEvent["action"]) {
	const events = getAll()
	const event: FeatureEvent = {
		id: `evt-${Date.now().toString(36)}`,
		featureId,
		action,
		timestamp: Date.now(),
	}
	saveAll([...events, event])
	log.info(`[FeatureTelemetry] ${featureId}: ${action}`)
}

export function getFeatureEvents(limit = 50): FeatureEvent[] {
	return getAll()
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, limit)
}

export function clearFeatureEvents() {
	localStorage.removeItem(STORAGE_KEY)
}
