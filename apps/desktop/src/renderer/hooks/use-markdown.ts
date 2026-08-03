/**
 * useMarkdown hook
 *
 * Returns markdown content as-is for rendering via Streamdown component.
 * The caller must sanitize HTML before using dangerouslySetInnerHTML.
 */

import { useMemo } from "react"

function sanitizeHtml(html: string): string {
	return html
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
}

export function useMarkdown(markdown: string) {
	const html = useMemo(() => {
		if (!markdown.trim()) return ""
		return sanitizeHtml(markdown)
	}, [markdown])

	return { html }
}
