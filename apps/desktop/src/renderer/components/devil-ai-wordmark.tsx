/**
 * Inline wordmark for "Devil AI" -- renders at currentColor, no font dependency.
 */
export function DevilAiWordmark({ className }: { className?: string }) {
	return (
		<span
			className={className}
			style={{
				fontWeight: 700,
				letterSpacing: "-0.02em",
				fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
			}}
			aria-hidden="true"
		>
			Devil AI
		</span>
	)
}
