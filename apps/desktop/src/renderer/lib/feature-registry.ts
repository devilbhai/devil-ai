/**
 * Feature registry: central place to register optional features, their
 * metadata and lazy import functions. UI can consume this registry to
 * show toggles and lazy-load implementations only when enabled.
 */
export type FeatureEntry = {
	id: string
	name: string
	description?: string
	atomKey: string
	lazyImport?: () => Promise<unknown>
}

const registry = new Map<string, FeatureEntry>()

export function registerFeature(entry: FeatureEntry) {
	if (registry.has(entry.id)) return
	registry.set(entry.id, entry)
}

export function getFeature(id: string) {
	return registry.get(id)
}

export function listFeatures(): FeatureEntry[] {
	return Array.from(registry.values())
}

// Register built-in features
registerFeature({
	id: "premiumSections",
	name: "Premium UI Sections",
	description: "Hero, testimonials and other premium UI sections",
	atomKey: "premiumSections",
	lazyImport: () => import("../components/premium/premium-preview"),
})

export default {
	registerFeature,
	getFeature,
	listFeatures,
}
